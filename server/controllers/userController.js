require("dotenv").config();

const userModel = require("../models/userModel");
const otpGenerator = require("../utils/otpGenerator");
const twilioService = require("../services/twilioService");
const sendEmail = require("../services/emailService");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");


// ================= REGISTER =================
const registerUser = async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  if (!name || !password || !phone || !role) {
    return res.status(400).json({
      error: "name, phone, password and role required",
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

    const newUser = await userModel.createUser(
      name,
      email || null,
      passwordHash,
      role,
      phone
    );

    const { password_hash, ...userResponse } = newUser;

    res.status(201).json({
      message: "User registered",
      user: userResponse,
    });
  } catch (error) {
    console.error(error);
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

    const token = jwt.sign(
      {
        userId: user.id,
        phone: user.phone,
        role: user.role,
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
  const { phone, phoneSuffix, email, purpose } = req.body;

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
    if (!phone || !phoneSuffix) {
      return res.status(400).json({
        error: "phone required",
      });
    }

    const fullPhone = `${phoneSuffix}${phone}`;

    await userModel.storeOtp({
      email: null,
      phone: fullPhone,
      otp: hashedOtp,
      purpose: purpose || "login",
      expiresAt,
    });

    await twilioService.sendOtpPhoneNo(fullPhone, otp);

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
  const { phone, phoneSuffix, email, otp } = req.body;

  try {
    let record;

    if (email) {
      record = await userModel.findOtpByEmail(email);
    } else {
      const fullPhone = `${phoneSuffix}${phone}`;
      record = await userModel.findOtpByPhone(fullPhone);
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

    // mark used
    await userModel.markOtpUsed(record.id);

    let user;

    if (email) {
      user = await userModel.verifyUserEmail(email);
    } else {
      user = await userModel.verifyUserPhone(record.phone);
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

const updateProfile = async (req, res) => {
  const { name, email, phone } = req.body;

  try {
    const updatedUser = await userModel.updateUserProfile(req.user.userId, {
      name,
      email,
      phone,
    });
  }
    catch (error) {
      console.error(error);
      return res.status(500).json({
        error: "Profile update failed",
      });
    }
}



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