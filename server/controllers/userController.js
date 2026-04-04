require("dotenv").config();

const userModel = require("../models/userModel");
const otpGenerator = require("../utils/otpGenerator");
const twilioService = require("../services/twilioService");
const { sendEmail, sendAdminApprovalNotification } = require("../services/emailService");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");


// ================= REGISTER =================
const registerUser = async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  if (!name || !password || !phone) {
    return res.status(400).json({
      error: "name, phone, password required",
    });
  }

  try {
    const existingUser = await userModel.findUserByPhone(phone);

    if (existingUser) {
      return res.status(409).json({
        error: "User already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // get role_id from roles table
    let roleId = 1; // default viewer

    if (role) {
      const roleRecord = await userModel.findRoleByName(role);
      if (roleRecord) {
        roleId = roleRecord.id;
      }
    }

    // Approval logic
    let isApproved = true;
    if (role === "admin") {
      isApproved = false;
    }

    const newUser = await userModel.createUser(
      name,
      email || null,
      passwordHash,
      roleId,
      phone,
      isApproved
    );

    // If admin registration, notify existing admins
    if (role === "admin") {
      try {
        const admins = await userModel.findAdmins();
        for (const admin of admins) {
          if (admin.email) {
            await sendAdminApprovalNotification(admin.email, {
              name,
              email,
              phone
            });
          }
        }
      } catch (notifyError) {
        console.error("Failed to notify existing admins:", notifyError);
      }

      return res.status(201).json({
        message: "Registration request submitted. An existing admin must approve your account.",
        user: { id: newUser.id, name: newUser.name, email: newUser.email, role: 'admin', is_approved: false }
      });
    }

    const { password_hash, ...userResponse } = newUser;

    res.status(201).json({
      message: "User registered",
      user: userResponse,
    });

  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({
      error: "Registration failed",
    });
  }
};



// ================= LOGIN PASSWORD =================
const loginUser = async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({
      error: "phone and password required",
    });
  }

  try {
    const user = await userModel.findUserByPhone(phone);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    if (!user.is_approved) {
      return res.status(403).json({
        error: "Your account is pending approval by an administrator.",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        phone: user.phone,
        role: user.role, // comes from JOIN roles table
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("jwttoken", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Login failed",
    });
  }
};



// ================= SEND OTP =================
const sendOtp = async (req, res) => {
  const { phone, email, purpose } = req.body;

  try {
    const otp = otpGenerator();
    const hashedOtp = await bcrypt.hash(otp.toString(), 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // EMAIL OTP
    if (email) {
      await userModel.storeOtp({
        email,
        phone: null,
        otp: hashedOtp,
        purpose: purpose || "login",
        expiresAt,
      });

      await sendEmail(email, otp);

      return res.status(200).json({
        message: "OTP sent to email",
      });
    }

    // PHONE OTP
    if (!phone) {
      return res.status(400).json({
        error: "phone required",
      });
    }

    await userModel.storeOtp({
      email: null,
      phone,
      otp: hashedOtp,
      purpose: purpose || "login",
      expiresAt,
    });

    await twilioService.sendOtpPhoneNo(phone, otp);

    return res.status(200).json({
      message: "OTP sent to phone",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to send OTP",
    });
  }
};



// ================= VERIFY OTP =================
const verifyOtp = async (req, res) => {
  const { phone, email, otp } = req.body;

  try {
    let record;

    if (email) {
      record = await userModel.findOtpByEmail(email);
    } else {
      record = await userModel.findOtpByPhone(phone);
    }

    if (!record) {
      return res.status(400).json({
        error: "OTP not found",
      });
    }

    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({
        error: "OTP expired",
      });
    }

    const match = await bcrypt.compare(
      otp.toString(),
      record.otp_code
    );

    if (!match) {
      return res.status(400).json({
        error: "Invalid OTP",
      });
    }

    await userModel.markOtpUsed(record.id);

    let user;

    if (email) {
      user = await userModel.verifyUserEmail(email);
    } else {
      user = await userModel.verifyUserPhone(phone);
    }

    if (!user.is_approved) {
      return res.status(403).json({
        error: "Your account is pending approval by an administrator.",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        phone: user.phone,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("jwttoken", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "OTP verified",
      token,
      user,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "OTP verification failed",
    });
  }
};



// ================= CHECK AUTH =================
const checkAuthenticated = async (req, res) => {
  try {
    const user = await userModel.findUserById(req.user.userId);

    res.status(200).json({
      authenticated: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      error: "Auth check failed",
    });
  }
};



// ================= UPDATE PROFILE =================
const updateProfile = async (req, res) => {
  const { name, email, phone } = req.body;

  try {
    const updatedUser = await userModel.updateUserProfile(
      req.user.userId,
      { name, email, phone }
    );

    res.status(200).json({
      message: "Profile updated",
      user: updatedUser,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Profile update failed",
    });
  }
};



// ================= LOGOUT =================
const logout = (req, res) => {
  res.clearCookie("jwttoken");

  res.status(200).json({
    message: "Logged out successfully",
  });
};



module.exports = {
  registerUser,
  loginUser,
  sendOtp,
  verifyOtp,
  checkAuthenticated,
  logout,
  updateProfile,
};