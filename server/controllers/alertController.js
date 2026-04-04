const {
  createAlert,
  getAlertById,
  getAlertsByUserId,
  countAlertsByUserId,
  getUnreadAlertsCount,
  getAlertsByType,
  markAlertAsRead,
  markAllAlertsAsRead,
  deleteAlert,
  deleteAllAlertsByUser,
  getRecentAlerts,
  getAlertSummary,
  getDashboardAlerts,
} = require("../models/alertModel");

// ================= GET ALL ALERTS =================
const getAlerts = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { isRead, type, limit = 50, offset = 0 } = req.query;

    const alerts = await getAlertsByUserId(
      userId,
      isRead === "true" ? true : isRead === "false" ? false : null,
      type,
      parseInt(limit),
      parseInt(offset)
    );

    const total = await countAlertsByUserId(
      userId,
      isRead === "true" ? true : isRead === "false" ? false : null,
      type
    );

    res.status(200).json({
      success: true,
      data: {
        alerts,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET ALERT BY ID =================
const getAlert = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { alertId } = req.params;

    if (!alertId) {
      return res.status(400).json({
        success: false,
        message: "alertId is required",
      });
    }

    const alert = await getAlertById(alertId);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    // Verify ownership
    if (alert.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to this alert",
      });
    }

    res.status(200).json({
      success: true,
      data: alert,
    });
  } catch (error) {
    next(error);
  }
};

// ================= MARK ALERT AS READ =================
const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { alertId } = req.params;

    if (!alertId) {
      return res.status(400).json({
        success: false,
        message: "alertId is required",
      });
    }

    const result = await markAlertAsRead(alertId, userId);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Alert not found or already read",
      });
    }

    res.status(200).json({
      success: true,
      message: "Alert marked as read",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ================= MARK ALL ALERTS AS READ =================
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const results = await markAllAlertsAsRead(userId);

    res.status(200).json({
      success: true,
      message: `${results.length} alerts marked as read`,
      data: {
        count: results.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ================= DELETE ALERT =================
const removeAlert = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { alertId } = req.params;

    if (!alertId) {
      return res.status(400).json({
        success: false,
        message: "alertId is required",
      });
    }

    const deleted = await deleteAlert(alertId, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Alert not found or already deleted",
      });
    }

    res.status(200).json({
      success: true,
      message: "Alert deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ================= DELETE ALL ALERTS =================
const removeAllAlerts = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const results = await deleteAllAlertsByUser(userId);

    res.status(200).json({
      success: true,
      message: `${results.length} alerts deleted successfully`,
      data: {
        count: results.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET UNREAD ALERTS COUNT =================
const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const count = await getUnreadAlertsCount(userId);

    res.status(200).json({
      success: true,
      data: {
        unreadCount: count,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET ALERTS BY TYPE =================
const getAlertsByTypeData = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { type } = req.params;
    const { limit = 10 } = req.query;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "type is required",
      });
    }

    const alerts = await getAlertsByType(userId, type, parseInt(limit));

    res.status(200).json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET RECENT ALERTS =================
const getRecent = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { limit = 5 } = req.query;

    const alerts = await getRecentAlerts(userId, parseInt(limit));

    res.status(200).json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET ALERT SUMMARY =================
const getSummary = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const summary = await getAlertSummary(userId);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET DASHBOARD ALERTS =================
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { limit = 5 } = req.query;

    const alerts = await getDashboardAlerts(userId, parseInt(limit));

    res.status(200).json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
