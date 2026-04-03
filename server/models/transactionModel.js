const pool = require("../config/pool");

// ================= CREATE TRANSACTION =================
const createTransaction = async (
  userId,
  categoryId,
  amount,
  type,
  transactionDate,
  notes
) => {
  try {
    const query = `
      INSERT INTO financial_records 
      (user_id, category_id, amount, type, transaction_date, notes, is_deleted, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) 
      RETURNING 
        id, 
        user_id, 
        category_id, 
        amount, 
        type, 
        transaction_date, 
        notes, 
        is_deleted, 
        created_at, 
        updated_at;
    `;

    const result = await pool.query(query, [
      userId,
      categoryId,
      amount,
      type,
      transactionDate || new Date(),
      notes || null,
      false,
    ]);

    return result.rows[0];
  } catch (err) {
    console.error("Error creating transaction:", err);
    throw err;
  }
};

// ================= GET TRANSACTION BY ID =================
const getTransactionById = async (transactionId) => {
  try {
    const query = `
      SELECT 
        fr.id,
        fr.user_id,
        fr.category_id,
        fr.amount,
        fr.type,
        fr.transaction_date,
        fr.notes,
        fr.is_deleted,
        fr.created_at,
        fr.updated_at,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon
      FROM financial_records fr
      LEFT JOIN categories c ON fr.category_id = c.id
      WHERE fr.id = $1 AND fr.is_deleted = false;
    `;

    const result = await pool.query(query, [transactionId]);
    return result.rows[0] || null;
  } catch (err) {
    console.error("Error getting transaction:", err);
    throw err;
  }
};

// ================= GET ALL TRANSACTIONS BY USER ID =================
const getTransactionsByUserId = async (
  userId,
  type = null,
  categoryId = null,
  startDate = null,
  endDate = null,
  limit = 50,
  offset = 0
) => {
  try {
    let query = `
      SELECT 
        fr.id,
        fr.user_id,
        fr.category_id,
        fr.amount,
        fr.type,
        fr.transaction_date,
        fr.notes,
        fr.created_at,
        fr.updated_at,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon
      FROM financial_records fr
      LEFT JOIN categories c ON fr.category_id = c.id
      WHERE fr.user_id = $1 AND fr.is_deleted = false
    `;

    const params = [userId];
    let paramIndex = 2;

    // Add filters
    if (type) {
      query += ` AND fr.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (categoryId) {
      query += ` AND fr.category_id = $${paramIndex}`;
      params.push(categoryId);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND DATE(fr.transaction_date) >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND DATE(fr.transaction_date) <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY fr.transaction_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  } catch (err) {
    console.error("Error getting transactions:", err);
    throw err;
  }
};

// ================= COUNT TRANSACTIONS FOR PAGINATION =================
const countTransactionsByUserId = async (
  userId,
  type = null,
  categoryId = null,
  startDate = null,
  endDate = null
) => {
  try {
    let query = `
      SELECT COUNT(*) as count
      FROM financial_records fr
      WHERE fr.user_id = $1 AND fr.is_deleted = false
    `;

    const params = [userId];
    let paramIndex = 2;

    if (type) {
      query += ` AND fr.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (categoryId) {
      query += ` AND fr.category_id = $${paramIndex}`;
      params.push(categoryId);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND DATE(fr.transaction_date) >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND DATE(fr.transaction_date) <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count) || 0;
  } catch (err) {
    console.error("Error counting transactions:", err);
    throw err;
  }
};

// ================= UPDATE TRANSACTION =================
const updateTransaction = async (
  transactionId,
  userId,
  { categoryId, amount, type, transactionDate, notes }
) => {
  try {
    // Verify ownership
    const ownershipCheck = await pool.query(
      `SELECT id FROM financial_records WHERE id = $1 AND user_id = $2`,
      [transactionId, userId]
    );

    if (ownershipCheck.rows.length === 0) {
      throw new Error("Transaction not found or unauthorized");
    }

    // Build dynamic update query
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (categoryId !== undefined) {
      updates.push(`category_id = $${paramIndex}`);
      params.push(categoryId);
      paramIndex++;
    }

    if (amount !== undefined) {
      updates.push(`amount = $${paramIndex}`);
      params.push(amount);
      paramIndex++;
    }

    if (type !== undefined) {
      updates.push(`type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    if (transactionDate !== undefined) {
      updates.push(`transaction_date = $${paramIndex}`);
      params.push(transactionDate);
      paramIndex++;
    }

    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      params.push(notes);
      paramIndex++;
    }

    if (updates.length === 0) {
      throw new Error("No fields to update");
    }

    updates.push(`updated_at = NOW()`);

    const query = `
      UPDATE financial_records 
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex + 1}
      RETURNING 
        id, 
        user_id, 
        category_id, 
        amount, 
        type, 
        transaction_date, 
        notes, 
        created_at, 
        updated_at;
    `;

    params.push(transactionId);

    const result = await pool.query(query, params);
    return result.rows[0];
  } catch (err) {
    console.error("Error updating transaction:", err);
    throw err;
  }
};

// ================= DELETE TRANSACTION (SOFT DELETE) =================
const deleteTransaction = async (transactionId, userId) => {
  try {
    // Verify ownership
    const ownershipCheck = await pool.query(
      `SELECT id FROM financial_records WHERE id = $1 AND user_id = $2`,
      [transactionId, userId]
    );

    if (ownershipCheck.rows.length === 0) {
      throw new Error("Transaction not found or unauthorized");
    }

    const query = `
      UPDATE financial_records 
      SET is_deleted = true, updated_at = NOW()
      WHERE id = $1
      RETURNING id;
    `;

    const result = await pool.query(query, [transactionId]);
    return result.rows[0];
  } catch (err) {
    console.error("Error deleting transaction:", err);
    throw err;
  }
};

// ================= BULK CREATE TRANSACTIONS =================
const bulkCreateTransactions = async (userId, transactions) => {
  try {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      throw new Error("Transactions must be a non-empty array");
    }

    if (transactions.length > 1000) {
      throw new Error("Cannot bulk create more than 1000 transactions at once");
    }

    // Build multi-row insert query
    const values = [];
    const params = [userId];
    let paramIndex = 2;

    transactions.forEach((tx) => {
      values.push(
        `($1, $${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, false, NOW(), NOW())`
      );
      params.push(
        tx.category_id,
        tx.amount,
        tx.type,
        tx.transaction_date || new Date(),
        tx.notes || null
      );
      paramIndex += 5;
    });

    const query = `
      INSERT INTO financial_records 
      (user_id, category_id, amount, type, transaction_date, notes, is_deleted, created_at, updated_at) 
      VALUES ${values.join(", ")}
      RETURNING 
        id, 
        user_id, 
        category_id, 
        amount, 
        type, 
        transaction_date, 
        notes, 
        created_at, 
        updated_at;
    `;

    const result = await pool.query(query, params);
    return result.rows;
  } catch (err) {
    console.error("Error bulk creating transactions:", err);
    throw err;
  }
};

// ================= GET TRANSACTION STATISTICS =================
const getTransactionStatistics = async (userId, startDate, endDate) => {
  try {
    const query = `
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
        COUNT(*) as transaction_count,
        COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count,
        COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_count
      FROM financial_records
      WHERE user_id = $1 
        AND is_deleted = false 
        AND DATE(transaction_date) >= $2 
        AND DATE(transaction_date) <= $3;
    `;

    const result = await pool.query(query, [userId, startDate, endDate]);
    const row = result.rows[0];

    return {
      total_income: parseFloat(row.total_income) || 0,
      total_expense: parseFloat(row.total_expense) || 0,
      net_balance: parseFloat(row.total_income) - parseFloat(row.total_expense),
      transaction_count: parseInt(row.transaction_count) || 0,
      income_count: parseInt(row.income_count) || 0,
      expense_count: parseInt(row.expense_count) || 0,
    };
  } catch (err) {
    console.error("Error getting transaction statistics:", err);
    throw err;
  }
};

// ================= GET CATEGORY BREAKDOWN =================
const getCategoryBreakdown = async (userId, startDate, endDate) => {
  try {
    const query = `
      SELECT 
        c.id,
        c.name,
        c.color,
        c.icon,
        fr.type,
        SUM(fr.amount) as total_amount,
        COUNT(*) as transaction_count
      FROM financial_records fr
      JOIN categories c ON fr.category_id = c.id
      WHERE fr.user_id = $1 
        AND fr.is_deleted = false 
        AND DATE(fr.transaction_date) >= $2 
        AND DATE(fr.transaction_date) <= $3
      GROUP BY c.id, c.name, c.color, c.icon, fr.type
      ORDER BY total_amount DESC;
    `;

    const result = await pool.query(query, [userId, startDate, endDate]);
    return result.rows;
  } catch (err) {
    console.error("Error getting category breakdown:", err);
    throw err;
  }
};

// ================= GET MONTHLY TRANSACTIONS =================
const getMonthlyTransactions = async (userId, year, month) => {
  try {
    const query = `
      SELECT 
        DATE(transaction_date) as date,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as daily_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as daily_expense,
        COUNT(*) as transaction_count
      FROM financial_records
      WHERE user_id = $1 
        AND is_deleted = false 
        AND EXTRACT(YEAR FROM transaction_date) = $2
        AND EXTRACT(MONTH FROM transaction_date) = $3
      GROUP BY DATE(transaction_date)
      ORDER BY date DESC;
    `;

    const result = await pool.query(query, [userId, year, month]);
    return result.rows;
  } catch (err) {
    console.error("Error getting monthly transactions:", err);
    throw err;
  }
};

// ================= GET TOP CATEGORIES =================
const getTopCategories = async (userId, startDate, endDate, limit = 5) => {
  try {
    const query = `
      SELECT 
        c.id,
        c.name,
        c.color,
        c.icon,
        SUM(fr.amount) as total_amount,
        COUNT(*) as transaction_count
      FROM financial_records fr
      JOIN categories c ON fr.category_id = c.id
      WHERE fr.user_id = $1 
        AND fr.is_deleted = false 
        AND fr.type = 'expense'
        AND DATE(fr.transaction_date) >= $2 
        AND DATE(fr.transaction_date) <= $3
      GROUP BY c.id, c.name, c.color, c.icon
      ORDER BY total_amount DESC
      LIMIT $4;
    `;

    const result = await pool.query(query, [userId, startDate, endDate, limit]);
    return result.rows;
  } catch (err) {
    console.error("Error getting top categories:", err);
    throw err;
  }
};

// ================= GET RECENT TRANSACTIONS =================
const getRecentTransactions = async (userId, limit = 5) => {
  try {
    const query = `
      SELECT 
        fr.id,
        fr.user_id,
        fr.category_id,
        fr.amount,
        fr.type,
        fr.transaction_date,
        fr.notes,
        fr.created_at,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon
      FROM financial_records fr
      LEFT JOIN categories c ON fr.category_id = c.id
      WHERE fr.user_id = $1 AND fr.is_deleted = false
      ORDER BY fr.transaction_date DESC
      LIMIT $2;
    `;

    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  } catch (err) {
    console.error("Error getting recent transactions:", err);
    throw err;
  }
};

module.exports = {
  createTransaction,
  getTransactionById,
  getTransactionsByUserId,
  countTransactionsByUserId,
  updateTransaction,
  deleteTransaction,
  bulkCreateTransactions,
  getTransactionStatistics,
  getCategoryBreakdown,
  getMonthlyTransactions,
  getTopCategories,
  getRecentTransactions,
};