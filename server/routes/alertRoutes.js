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
  viewerOnly
} = require("../middlewares/jwtAuthMiddleware");

const router = express.Router();

router.use(jwtAuthMiddleware);

router.get("/", analystOnly,viewerOnly, getAlerts);
router.get("/:alertId", analystOnly, viewerOnly, getAlert);
router.put("/:alertId/read", analystOnly, viewerOnly, markAsRead);
router.put("/read-all", analystOnly, viewerOnly, markAllAsRead);
router.delete("/:alertId", adminOnly, removeAlert);
router.delete("/", adminOnly, removeAllAlerts);

// Analytics routes
router.get("/analytics/unread-count", analystOnly, getUnreadCount);
router.get("/type/:type", analystOnly, getAlertsByTypeData);
router.get("/analytics/recent", analystOnly, getRecent);
router.get("/analytics/summary", analystOnly, getSummary);
router.get("/analytics/dashboard", analystOnly, getDashboard);

module.exports = router;
