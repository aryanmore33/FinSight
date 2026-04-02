const express = require("express");

const {
  registerUser,
  loginUser,
  sendOtp,
  verifyOtp,
  checkAuthenticated,
  logout
} = require("../controllers/userController");

const { jwtAuthMiddleware } = require("../middlewares/jwtAuthMiddleware");

const router = express.Router();
// console.log({
//   registerUser,
//   loginUser,
//   sendOtp,
//   verifyOtp,
//   checkAuthenticated,
//   logout,
//   jwtAuthMiddleware
// });

router.get("/", (req, res) => {
  res.json({ success: true, message: "User routes working ✅" });
});

router.post("/register", registerUser);
router.post("/login", loginUser);

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

router.get("/me", jwtAuthMiddleware, checkAuthenticated);

router.post("/logout", jwtAuthMiddleware, logout);

module.exports = router;