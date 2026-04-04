const userModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const { parseCSVInWorker } = require("../services/csvService");

// ================= ADD SINGLE USER =================
const addSingleUser = async (req, res) => {
  const { name, email, phone, role } = req.body;

  if (!name || (!email && !phone) || !role) {
    return res.status(400).json({
      error: "name, role, and either email or phone are required",
    });
  }

  try {
    const roleRecord = await userModel.findRoleByName(role);
    if (!roleRecord) {
      return res.status(400).json({ error: "Invalid role specified" });
    }

    // Check if user already exists
    if (email) {
      const existingEmail = await userModel.findUserByEmail(email);
      if (existingEmail) return res.status(409).json({ error: "Email already exists" });
    }
    if (phone) {
      const existingPhone = await userModel.findUserByPhone(phone);
      if (existingPhone) return res.status(409).json({ error: "Phone number already exists" });
    }

    // Generate a secure random password for users added by admin
    // They will login via OTP anyway
    const tempPassword = Math.random().toString(36).slice(-10);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const newUser = await userModel.createUser(
      name,
      email || null,
      passwordHash,
      roleRecord.id,
      phone,
      true // is_approved = true by default when admin adds them
    );

    res.status(201).json({
      message: "User added successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: role,
        is_approved: newUser.is_approved
      }
    });

  } catch (error) {
    console.error("Error adding single user:", error);
    res.status(500).json({ error: "Failed to add user" });
  }
};

// ================= UPLOAD BULK USERS (CSV) =================
const uploadBulkUsers = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No CSV file uploaded" });
  }

  const filePath = req.file.path;
  const errors = [];
  const processedUsers = [];

  try {
    // Use worker thread for CSV parsing
    const results = await parseCSVInWorker(filePath, "userCsvWorker.js");

    for (const row of results) {
      const { name, email, phone, role } = row;

      if (!name || (!email && !phone) || !role) {
        errors.push({ row, error: "Missing required fields (name, role, and either email or phone)" });
        continue;
      }

      const roleRecord = await userModel.findRoleByName(role);
      if (!roleRecord) {
        errors.push({ row, error: `Invalid role: ${role}` });
        continue;
      }

      // Generate hash for temp password
      const tempPassword = Math.random().toString(36).slice(-10);
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      try {
        const newUser = await userModel.createUser(
          name,
          email || null,
          passwordHash,
          roleRecord.id,
          phone,
          true
        );
        processedUsers.push({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: role
        });
      } catch (err) {
        errors.push({ row, error: err.message });
      }
    }

    // Cleanup file
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.status(200).json({
      message: `Bulk upload complete. ${processedUsers.length} users added.`,
      addedCount: processedUsers.length,
      users: processedUsers,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("Error processing CSV via worker:", error);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ error: "Failed to process CSV file (Worker Error)" });
  }
};

// ================= APPROVE ADMIN =================
const approveAdmin = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId is required for approval" });
  }

  try {
    const updatedUser = await userModel.approveUser(userId);

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "Admin account approved successfully",
      userId: updatedUser.id,
      is_approved: updatedUser.is_approved
    });

  } catch (error) {
    console.error("Error approving admin:", error);
    res.status(500).json({ error: "Failed to approve admin" });
  }
};

module.exports = {
  addSingleUser,
  uploadBulkUsers,
  approveAdmin,
};
