const express = require("express");
const {
  getAlerts,
  getAlert,
  markAsRead,
  markAllAsRead,
  removeAlert,
  removeAllAlerts,
  getUnreadCount,
  getAlertsByTypeData,
  getRecent,
  getSummary,
  getDashboard,
} = require("../controllers/alertController");
const {
  jwtAuthMiddleware,
  analystOnly,
  adminOnly,
} = require("../middlewares/jwtAuthMiddleware");

const router = express.Router();

router.use(jwtAuthMiddleware);

router.get("/", analystOnly, getAlerts);
router.get("/:alertId", analystOnly, getAlert);
router.put("/:alertId/read", analystOnly, markAsRead);
router.put("/read-all", analystOnly, markAllAsRead);
router.delete("/:alertId", adminOnly, removeAlert);
router.delete("/", adminOnly, removeAllAlerts);

// Analytics routes
router.get("/analytics/unread-count", analystOnly, getUnreadCount);
router.get("/type/:type", analystOnly, getAlertsByTypeData);
router.get("/analytics/recent", analystOnly, getRecent);
router.get("/analytics/summary", analystOnly, getSummary);
router.get("/analytics/dashboard", analystOnly, getDashboard);

module.exports = router;
