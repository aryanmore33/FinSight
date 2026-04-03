const express = require("express");

const {
  getDashboard,

} = require("../controllers/dashboardController");

const { jwtAuthMiddleware } = require("../middlewares/jwtAuthMiddleware");

const router = express.Router();

router.get("/dashboard", jwtAuthMiddleware, getDashboard);


module.exports = router;