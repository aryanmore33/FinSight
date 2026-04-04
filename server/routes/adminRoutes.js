const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { jwtAuthMiddleware, adminOnly } = require("../middlewares/jwtAuthMiddleware");
const uploadCsv = require("../middlewares/uploadCsv");

// All routes here require admin access
router.use(jwtAuthMiddleware, adminOnly);

// Add single user
router.post("/add-user", adminController.addSingleUser);

// Upload bulk users (CSV)
router.post("/upload-users", uploadCsv.single("file"), adminController.uploadBulkUsers);

// Approve a pending admin registration
router.post("/approve-admin", adminController.approveAdmin);

module.exports = router;
