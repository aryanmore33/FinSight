const pool = require("../config/pool");

// ================= CREATE BUDGET =================
const createBudget = async (
  userId,
  categoryId,
  limitAmount,
  period = "monthly",
  startDate
) => {
  try {
    const query = `
      INSERT INTO budgets 
      (user_id, category_id, limit_amount, period, start_date, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
      RETURNING 
        id, 
        user_id, 
        category_id, 
        limit_amount, 
        period, 
        start_date, 
        created_at, 
        updated_at;
    `;

    const result = await pool.query(query, [
      userId,
      categoryId,
      limitAmount,
      period,
      startDate || new Date().toISOString().split("T")[0],
    ]);

    return result.rows[0];
  } catch (err) {
    console.error("Error creating budget:", err);
    throw err;
  }
};

// ================= GET BUDGET BY ID =================
const getBudgetById = async (budgetId) => {
  try {
    const query = `
      SELECT 
        b.id,
        b.user_id,
        b.category_id,
        b.limit_amount,
        b.period,
        b.start_date,
        b.created_at,
        b.updated_at,
        c.name as category_name,
        c.type as category_type,
        c.color as category_color,
        c.icon as category_icon
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.id = $1;
    `;

    const result = await pool.query(query, [budgetId]);
    return result.rows[0] || null;
  } catch (err) {
    console.error("Error getting budget:", err);
    throw err;
  }
};

// ================= GET ALL BUDGETS BY USER ID =================
const getBudgetsByUserId = async (userId, period = null) => {
  try {
    let query = `
      SELECT 
        b.id,
        b.user_id,
        b.category_id,
        b.limit_amount,
        b.period,
        b.start_date,
        b.created_at,
        b.updated_at,
        c.name as category_name,
        c.type as category_type,
        c.color as category_color,
        c.icon as category_icon
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = $1
    `;

    const params = [userId];
    let paramIndex = 2;

    if (period) {
      query += ` AND b.period = $${paramIndex}`;
      params.push(period);
    }

    query += ` ORDER BY b.created_at DESC;`;

    const result = await pool.query(query, params);
    return result.rows;
  } catch (err) {
    console.error("Error getting budgets:", err);
    throw err;
  }
};

// ================= GET BUDGET BY USER, CATEGORY AND PERIOD =================
const getBudgetByUserCategoryPeriod = async (userId, categoryId, period) => {
  try {
    const query = `
      SELECT 
        b.id,
        b.user_id,
        b.category_id,
        b.limit_amount,
        b.period,
        b.start_date,
        b.created_at,
        b.updated_at,
        c.name as category_name,
        c.type as category_type
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = $1 AND b.category_id = $2 AND b.period = $3;
    `;

    const result = await pool.query(query, [userId, categoryId, period]);
    return result.rows[0] || null;
  } catch (err) {
    console.error("Error getting budget:", err);
    throw err;
  }
};

// ================= UPDATE BUDGET =================
const updateBudget = async (
  budgetId,
  userId,
  { limitAmount, period, startDate }
) => {
  try {
    // Verify ownership
    const ownershipCheck = await pool.query(
      `SELECT id FROM budgets WHERE id = $1 AND user_id = $2`,
      [budgetId, userId]
    );

    if (ownershipCheck.rows.length === 0) {
      throw new Error("Budget not found or unauthorized");
    }

    // Build dynamic update query
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (limitAmount !== undefined) {
      updates.push(`limit_amount = $${paramIndex}`);
      params.push(limitAmount);
      paramIndex++;
    }

    if (period !== undefined) {
      updates.push(`period = $${paramIndex}`);
      params.push(period);
      paramIndex++;
    }

    if (startDate !== undefined) {
      updates.push(`start_date = $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (updates.length === 0) {
      throw new Error("No fields to update");
    }

    updates.push(`updated_at = NOW()`);

    const query = `
      UPDATE budgets 
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex + 1} AND user_id = $${paramIndex + 2}
      RETURNING 
        id, 
        user_id, 
        category_id, 
        limit_amount, 
        period, 
        start_date, 
        created_at, 
        updated_at;
    `;

    params.push(budgetId, userId);

    const result = await pool.query(query, params);
    return result.rows[0];
  } catch (err) {
    console.error("Error updating budget:", err);
    throw err;
  }
};

// ================= DELETE BUDGET =================
const deleteBudget = async (budgetId, userId) => {
  try {
    // Verify ownership
    const ownershipCheck = await pool.query(
      `SELECT id FROM budgets WHERE id = $1 AND user_id = $2`,
      [budgetId, userId]
    );

    if (ownershipCheck.rows.length === 0) {
      throw new Error("Budget not found or unauthorized");
    }

    const query = `
      DELETE FROM budgets 
      WHERE id = $1 AND user_id = $2
      RETURNING id;
    `;

    const result = await pool.query(query, [budgetId, userId]);
    return result.rows[0] || null;
  } catch (err) {
    console.error("Error deleting budget:", err);
    throw err;
  }
};

// ================= GET BUDGET SPENDING (Single Budget) =================
const getBudgetSpending = async (budgetId) => {
  try {
    const query = `
      SELECT 
        b.id,
        b.user_id,
        b.category_id,
        b.limit_amount,
        b.period,
        b.start_date,
        c.name as category_name,
        COALESCE(SUM(fr.amount), 0)::decimal as spent_amount,
        COALESCE(SUM(fr.amount), 0)::decimal / b.limit_amount * 100 as spent_percentage,
        b.limit_amount - COALESCE(SUM(fr.amount), 0)::decimal as remaining_amount,
        CASE 
          WHEN COALESCE(SUM(fr.amount), 0)::decimal >= b.limit_amount THEN 'exceeded'
          WHEN COALESCE(SUM(fr.amount), 0)::decimal >= (b.limit_amount * 0.8) THEN 'warning'
          ELSE 'ok'
        END as status
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN financial_records fr ON b.category_id = fr.category_id 
        AND b.user_id = fr.user_id
        AND fr.is_deleted = false
        AND fr.type = 'expense'
        AND CASE 
          WHEN b.period = 'monthly' 
            THEN DATE_TRUNC('month', fr.transaction_date)::date = DATE_TRUNC('month', b.start_date::timestamp)::date
          WHEN b.period = 'weekly' 
            THEN DATE_TRUNC('week', fr.transaction_date)::date = DATE_TRUNC('week', b.start_date::timestamp)::date
        END
      WHERE b.id = $1
      GROUP BY b.id, b.user_id, b.category_id, b.limit_amount, b.period, b.start_date, c.name;
    `;

    const result = await pool.query(query, [budgetId]);
    return result.rows[0] || null;
  } catch (err) {
    console.error("Error getting budget spending:", err);
    throw err;
  }
};

// ================= GET ALL BUDGETS SPENDING FOR USER =================
const getAllBudgetsSpending = async (userId) => {
  try {
    const query = `
      SELECT 
        b.id,
        b.user_id,
        b.category_id,
        b.limit_amount,
        b.period,
        b.start_date,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        COALESCE(SUM(fr.amount), 0)::decimal as spent_amount,
        COALESCE(SUM(fr.amount), 0)::decimal / b.limit_amount * 100 as spent_percentage,
        b.limit_amount - COALESCE(SUM(fr.amount), 0)::decimal as remaining_amount,
        CASE 
          WHEN COALESCE(SUM(fr.amount), 0)::decimal >= b.limit_amount THEN 'exceeded'
          WHEN COALESCE(SUM(fr.amount), 0)::decimal >= (b.limit_amount * 0.8) THEN 'warning'
          ELSE 'ok'
        END as status
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN financial_records fr ON b.category_id = fr.category_id 
        AND b.user_id = fr.user_id
        AND fr.is_deleted = false
        AND fr.type = 'expense'
        AND CASE 
          WHEN b.period = 'monthly' 
            THEN DATE_TRUNC('month', fr.transaction_date)::date = DATE_TRUNC('month', b.start_date::timestamp)::date
          WHEN b.period = 'weekly' 
            THEN DATE_TRUNC('week', fr.transaction_date)::date = DATE_TRUNC('week', b.start_date::timestamp)::date
        END
      WHERE b.user_id = $1
      GROUP BY b.id, b.user_id, b.category_id, b.limit_amount, b.period, b.start_date, c.name, c.color, c.icon
      ORDER BY b.created_at DESC;
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (err) {
    console.error("Error getting budgets spending:", err);
    throw err;
  }
};

// ================= GET BUDGETS WITH ALERTS (EXCEEDED/WARNING) =================
const getBudgetsWithAlerts = async (userId) => {
  try {
    const query = `
      SELECT 
        b.id,
        b.user_id,
        b.category_id,
        b.limit_amount,
        b.period,
        b.start_date,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        COALESCE(SUM(fr.amount), 0)::decimal as spent_amount,
        COALESCE(SUM(fr.amount), 0)::decimal / b.limit_amount * 100 as spent_percentage,
        b.limit_amount - COALESCE(SUM(fr.amount), 0)::decimal as remaining_amount,
        CASE 
          WHEN COALESCE(SUM(fr.amount), 0)::decimal >= b.limit_amount THEN 'exceeded'
          WHEN COALESCE(SUM(fr.amount), 0)::decimal >= (b.limit_amount * 0.8) THEN 'warning'
          ELSE 'ok'
        END as status
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN financial_records fr ON b.category_id = fr.category_id 
        AND b.user_id = fr.user_id
        AND fr.is_deleted = false
        AND fr.type = 'expense'
        AND CASE 
          WHEN b.period = 'monthly' 
            THEN DATE_TRUNC('month', fr.transaction_date)::date = DATE_TRUNC('month', b.start_date::timestamp)::date
          WHEN b.period = 'weekly' 
            THEN DATE_TRUNC('week', fr.transaction_date)::date = DATE_TRUNC('week', b.start_date::timestamp)::date
        END
      WHERE b.user_id = $1
      GROUP BY b.id, b.user_id, b.category_id, b.limit_amount, b.period, b.start_date, c.name, c.color, c.icon
      HAVING COALESCE(SUM(fr.amount), 0)::decimal >= (b.limit_amount * 0.8)
      ORDER BY spent_percentage DESC;
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (err) {
    console.error("Error getting budgets with alerts:", err);
    throw err;
  }
};

// ================= GET DAILY BUDGET PROGRESS =================
const getDailyBudgetProgress = async (userId, budgetId) => {
  try {
    const query = `
      SELECT 
        DATE(fr.transaction_date) as date,
        SUM(fr.amount) as daily_spent,
        COALESCE((
          SELECT SUM(amount)
          FROM financial_records
          WHERE category_id = b.category_id 
            AND user_id = $1
            AND is_deleted = false
            AND type = 'expense'
            AND DATE(transaction_date) <= DATE(fr.transaction_date)
            AND CASE 
              WHEN b.period = 'monthly' 
                THEN DATE_TRUNC('month', transaction_date)::date = DATE_TRUNC('month', b.start_date::timestamp)::date
              WHEN b.period = 'weekly' 
                THEN DATE_TRUNC('week', transaction_date)::date = DATE_TRUNC('week', b.start_date::timestamp)::date
            END
        ), 0) as cumulative_spent
      FROM financial_records fr
      JOIN budgets b ON b.id = $2
      WHERE b.category_id = fr.category_id 
        AND fr.user_id = $1
        AND fr.is_deleted = false
        AND fr.type = 'expense'
        AND CASE 
          WHEN b.period = 'monthly' 
            THEN DATE_TRUNC('month', fr.transaction_date)::date = DATE_TRUNC('month', b.start_date::timestamp)::date
          WHEN b.period = 'weekly' 
            THEN DATE_TRUNC('week', fr.transaction_date)::date = DATE_TRUNC('week', b.start_date::timestamp)::date
        END
      GROUP BY DATE(fr.transaction_date), b.id, b.category_id, b.period, b.start_date
      ORDER BY date ASC;
    `;

    const result = await pool.query(query, [userId, budgetId]);
    return result.rows;
  } catch (err) {
    console.error("Error getting daily budget progress:", err);
    throw err;
  }
};

// ================= CHECK BUDGET STATUS CHANGE =================
const checkBudgetStatusChange = async (budgetId) => {
  try {
    const currentSpending = await getBudgetSpending(budgetId);
    return currentSpending;
  } catch (err) {
    console.error("Error checking budget status:", err);
    throw err;
  }
};

module.exports = {
  createBudget,
  getBudgetById,
  getBudgetsByUserId,
  getBudgetByUserCategoryPeriod,
  updateBudget,
  deleteBudget,
  getBudgetSpending,
  getAllBudgetsSpending,
  getBudgetsWithAlerts,
  getDailyBudgetProgress,
  checkBudgetStatusChange,
};