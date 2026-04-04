const pool = require("../config/pool");

// ================= CREATE ALERT =================
const createAlert = async (
  userId,
  type,
  title,
  message,
  budgetId = null,
  alertData = {}
) => {
  try {
    const query = `
      INSERT INTO alerts 
      (user_id, budget_id, type, title, message, alert_data, is_read, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) 
      RETURNING 
        id, 
        user_id, 
        budget_id, 
        type, 
        title,
        message, 
        alert_data, 
        is_read, 
        created_at, 
        updated_at;
    `;

    const result = await pool.query(query, [
      userId,
      budgetId || null,
      type, // 'exceeded' | 'warning' | 'reset' | 'unusual_spending' | 'high_transaction' | 'monthly_summary' | 'suspicious_activity'
      title,
      message,
      JSON.stringify(alertData),
      false, // is_read default false
    ]);

    return result.rows[0];
  } catch (err) {
    console.error("Error creating alert:", err);
    throw err;
  }
};

// ================= GET ALERT BY ID =================
const getAlertById = async (alertId) => {
  try {
    const query = `
      SELECT 
        a.id,
        a.user_id,
        a.budget_id,
        a.type,
        a.title,
        a.message,
        a.alert_data,
        a.is_read,
        a.created_at,
        a.updated_at,
        b.category_id,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon
      FROM alerts a
      LEFT JOIN budgets b ON a.budget_id = b.id
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE a.id = $1;
    `;

    const result = await pool.query(query, [alertId]);
    return result.rows[0] || null;
  } catch (err) {
    console.error("Error getting alert:", err);
    throw err;
  }
};

// ================= GET ALL ALERTS BY USER ID =================
const getAlertsByUserId = async (
  userId,
  isRead = null,
  type = null,
  limit = 50,
  offset = 0
) => {
  try {
    let query = `
      SELECT 
        a.id,
        a.user_id,
        a.budget_id,
        a.type,
        a.title,
        a.message,
        a.alert_data,
        a.is_read,
        a.created_at,
        a.updated_at,
        b.category_id,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon
      FROM alerts a
      LEFT JOIN budgets b ON a.budget_id = b.id
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE a.user_id = $1
    `;

    const params = [userId];
    let paramIndex = 2;

    if (isRead !== null && isRead !== undefined) {
      query += ` AND a.is_read = $${paramIndex}`;
      params.push(isRead);
      paramIndex++;
    }

    if (type) {
      query += ` AND a.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    query += ` ORDER BY a.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  } catch (err) {
    console.error("Error getting alerts:", err);
    throw err;
  }
};

// ================= COUNT ALERTS BY USER ID =================
const countAlertsByUserId = async (userId, isRead = null, type = null) => {
  try {
    let query = `
      SELECT COUNT(*) as count
      FROM alerts a
      WHERE a.user_id = $1
    `;

    const params = [userId];
    let paramIndex = 2;

    if (isRead !== null && isRead !== undefined) {
      query += ` AND a.is_read = $${paramIndex}`;
      params.push(isRead);
      paramIndex++;
    }

    if (type) {
      query += ` AND a.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count) || 0;
  } catch (err) {
    console.error("Error counting alerts:", err);
    throw err;
  }
};

// ================= GET UNREAD ALERTS COUNT =================
const getUnreadAlertsCount = async (userId) => {
  try {
    const query = `
      SELECT COUNT(*) as count
      FROM alerts
      WHERE user_id = $1 AND is_read = false;
    `;

    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count) || 0;
  } catch (err) {
    console.error("Error getting unread alerts count:", err);
    throw err;
  }
};

// ================= GET ALERTS BY TYPE =================
const getAlertsByType = async (userId, type, limit = 10) => {
  try {
    const query = `
      SELECT 
        a.id,
        a.user_id,
        a.budget_id,
        a.type,
        a.title,
        a.message,
        a.alert_data,
        a.is_read,
        a.created_at,
        a.updated_at,
        c.name as category_name
      FROM alerts a
      LEFT JOIN budgets b ON a.budget_id = b.id
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE a.user_id = $1 AND a.type = $2
      ORDER BY a.created_at DESC
      LIMIT $3;
    `;

    const result = await pool.query(query, [userId, type, limit]);
    return result.rows;
  } catch (err) {
    console.error("Error getting alerts by type:", err);
    throw err;
  }
};

// ================= MARK ALERT AS READ =================
const markAlertAsRead = async (alertId, userId) => {
  try {
    // Verify ownership
    const ownershipCheck = await pool.query(
      `SELECT id FROM alerts WHERE id = $1 AND user_id = $2`,
      [alertId, userId]
    );

    if (ownershipCheck.rows.length === 0) {
      throw new Error("Alert not found or unauthorized");
    }

    const query = `
      UPDATE alerts 
      SET is_read = true, updated_at = NOW()
      WHERE id = $1
      RETURNING id, is_read;
    `;

    const result = await pool.query(query, [alertId]);
    return result.rows[0];
  } catch (err) {
    console.error("Error marking alert as read:", err);
    throw err;
  }
};

// ================= MARK ALL ALERTS AS READ =================
const markAllAlertsAsRead = async (userId) => {
  try {
    const query = `
      UPDATE alerts 
      SET is_read = true, updated_at = NOW()
      WHERE user_id = $1 AND is_read = false
      RETURNING id;
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (err) {
    console.error("Error marking all alerts as read:", err);
    throw err;
  }
};

// ================= DELETE ALERT =================
const deleteAlert = async (alertId, userId) => {
  try {
    // Verify ownership
    const ownershipCheck = await pool.query(
      `SELECT id FROM alerts WHERE id = $1 AND user_id = $2`,
      [alertId, userId]
    );

    if (ownershipCheck.rows.length === 0) {
      throw new Error("Alert not found or unauthorized");
    }

    const query = `
      DELETE FROM alerts 
      WHERE id = $1 AND user_id = $2
      RETURNING id;
    `;

    const result = await pool.query(query, [alertId, userId]);
    return result.rows[0] || null;
  } catch (err) {
    console.error("Error deleting alert:", err);
    throw err;
  }
};

// ================= DELETE ALL ALERTS BY USER =================
const deleteAllAlertsByUser = async (userId) => {
  try {
    const query = `
      DELETE FROM alerts 
      WHERE user_id = $1
      RETURNING id;
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (err) {
    console.error("Error deleting all alerts:", err);
    throw err;
  }
};

// ================= CHECK IF ALERT ALREADY EXISTS FOR BUDGET =================
const checkExistingBudgetAlert = async (userId, budgetId, type) => {
  try {
    const query = `
      SELECT id
      FROM alerts
      WHERE user_id = $1 
        AND budget_id = $2 
        AND type = $3 
        AND is_read = false
      LIMIT 1;
    `;

    const result = await pool.query(query, [userId, budgetId, type]);
    return result.rows[0] || null;
  } catch (err) {
    console.error("Error checking existing alert:", err);
    throw err;
  }
};

// ================= GET RECENT ALERTS =================
const getRecentAlerts = async (userId, limit = 5) => {
  try {
    const query = `
      SELECT 
        a.id,
        a.user_id,
        a.budget_id,
        a.type,
        a.title,
        a.message,
        a.alert_data,
        a.is_read,
        a.created_at,
        b.category_id,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon
      FROM alerts a
      LEFT JOIN budgets b ON a.budget_id = b.id
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE a.user_id = $1
      ORDER BY a.created_at DESC
      LIMIT $2;
    `;

    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  } catch (err) {
    console.error("Error getting recent alerts:", err);
    throw err;
  }
};

// ================= GET ALERT SUMMARY BY TYPE =================
const getAlertSummary = async (userId) => {
  try {
    const query = `
      SELECT 
        type,
        COUNT(*) as count,
        SUM(CASE WHEN is_read = false THEN 1 ELSE 0 END) as unread_count
      FROM alerts
      WHERE user_id = $1
      GROUP BY type
      ORDER BY count DESC;
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (err) {
    console.error("Error getting alert summary:", err);
    throw err;
  }
};

// ================= GET DASHBOARD ALERTS (Unread + Recent) =================
const getDashboardAlerts = async (userId, limit = 5) => {
  try {
    const query = `
      SELECT 
        a.id,
        a.user_id,
        a.budget_id,
        a.type,
        a.title,
        a.message,
        a.alert_data,
        a.is_read,
        a.created_at,
        b.category_id,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon
      FROM alerts a
      LEFT JOIN budgets b ON a.budget_id = b.id
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE a.user_id = $1
      ORDER BY 
        CASE WHEN a.is_read = false THEN 0 ELSE 1 END ASC,
        a.created_at DESC
      LIMIT $2;
    `;

    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  } catch (err) {
    console.error("Error getting dashboard alerts:", err);
    throw err;
  }
};

module.exports = {
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
  checkExistingBudgetAlert,
  getRecentAlerts,
  getAlertSummary,
  getDashboardAlerts,
};