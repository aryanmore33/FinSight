const {
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
} = require("../models/transactionModel");
const { bulkUploadTransactions } = require("../services/transactionService");
const fs = require("fs");

// ================= CREATE SINGLE TRANSACTION =================
const addTransaction = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { categoryId, amount, type, transactionDate, notes } = req.body;

    // Validation
    if (!categoryId || !amount || !type) {
      return res.status(400).json({
        success: false,
        message: "categoryId, amount, and type are required",
      });
    }

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "type must be 'income' or 'expense'",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "amount must be greater than 0",
      });
    }

    const transaction = await createTransaction(
      userId,
      categoryId,
      amount,
      type,
      transactionDate,
      notes
    );

    res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET TRANSACTION BY ID =================
const getTransaction = async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.userId;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: "transactionId is required",
      });
    }

    const transaction = await getTransactionById(transactionId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // Verify ownership
    if (transaction.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to this transaction",
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET ALL TRANSACTIONS WITH FILTERS & PAGINATION =================
const getAllTransactions = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const {
      type,
      categoryId,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = req.query;

    // Validation
    if (limit > 100) {
      return res.status(400).json({
        success: false,
        message: "limit cannot exceed 100",
      });
    }

    const transactions = await getTransactionsByUserId(
      userId,
      type || null,
      categoryId || null,
      startDate || null,
      endDate || null,
      parseInt(limit),
      parseInt(offset)
    );

    const totalCount = await countTransactionsByUserId(
      userId,
      type || null,
      categoryId || null,
      startDate || null,
      endDate || null
    );

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(totalCount / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ================= UPDATE TRANSACTION =================
const editTransaction = async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.userId;rId;
    const { categoryId, amount, type, transactionDate, notes } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: "transactionId is required",
      });
    }

    // Validation
    if (type && !["income", "expense"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "type must be 'income' or 'expense'",
      });
    }

    if (amount && amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "amount must be greater than 0",
      });
    }

    const updatedTransaction = await updateTransaction(transactionId, userId, {
      categoryId,
      amount,
      type,
      transactionDate,
      notes,
    });

    res.status(200).json({
      success: true,
      message: "Transaction updated successfully",
      data: updatedTransaction,
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

// ================= DELETE TRANSACTION (SOFT DELETE) =================
const removeTransaction = async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.id;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: "transactionId is required",
      });
    }

    await deleteTransaction(transactionId, userId);

    res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

// ================= BULK UPLOAD TRANSACTIONS FROM CSV =================
const uploadTransactionsCSV = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Validate file type
    if (!req.file.originalname.endsWith(".csv")) {
      // Delete file if invalid
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: "Only CSV files are allowed",
      });
    }

    const result = await bulkUploadTransactions(userId, req.file.path);

    // Delete file after processing
    fs.unlinkSync(req.file.path);

    res.status(201).json({
      success: true,
      message: `${result.length} transactions uploaded successfully`,
      data: {
        count: result.length,
        transactions: result,
      },
    });
  } catch (error) {
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    if (error.message.includes("No transactions found")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
};


// ================= GET TRANSACTION STATISTICS =================
const getStatistics = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required",
      });
    }

    const statistics = await getTransactionStatistics(userId, startDate, endDate);

    res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET CATEGORY BREAKDOWN =================
const getCategoryStats = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required",
      });
    }

    const breakdown = await getCategoryBreakdown(userId, startDate, endDate);

    res.status(200).json({
      success: true,
      data: breakdown,
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET MONTHLY TRANSACTIONS =================
const getMonthlyStats = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: "year and month are required",
      });
    }

    // Validate year and month
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (yearNum < 2000 || yearNum > new Date().getFullYear()) {
      return res.status(400).json({
        success: false,
        message: "Invalid year",
      });
    }

    if (monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        message: "month must be between 1 and 12",
      });
    }

    const monthlyData = await getMonthlyTransactions(userId, yearNum, monthNum);

    res.status(200).json({
      success: true,
      data: monthlyData,
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET TOP CATEGORIES BY SPENDING =================
const getTopSpendingCategories = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate, limit = 5 } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required",
      });
    }

    if (limit > 20) {
      return res.status(400).json({
        success: false,
        message: "limit cannot exceed 20",
      });
    }

    const topCategories = await getTopCategories(
      userId,
      startDate,
      endDate,
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: topCategories,
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET RECENT TRANSACTIONS =================
const getRecentActivity = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { limit = 10 } = req.query;

    if (limit > 50) {
      return res.status(400).json({
        success: false,
        message: "limit cannot exceed 50",
      });
    }

    const recentTransactions = await getRecentTransactions(userId, parseInt(limit));

    res.status(200).json({
      success: true,
      data: recentTransactions,
    });
  } catch (error) {
    next(error);
  }
};

// ================= BULK CREATE TRANSACTIONS (Direct JSON) =================
const bulkCreateTransactionsJson = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { transactions } = req.body;

    // Validation
    if (!Array.isArray(transactions)) {
      return res.status(400).json({
        success: false,
        message: "transactions must be an array",
      });
    }

    if (transactions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "transactions array cannot be empty",
      });
    }

    if (transactions.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Cannot create more than 1000 transactions at once",
      });
    }

    // Validate each transaction
    for (let tx of transactions) {
      if (!tx.categoryId || !tx.amount || !tx.type) {
        return res.status(400).json({
          success: false,
          message: "Each transaction must have categoryId, amount, and type",
        });
      }

      if (!["income", "expense"].includes(tx.type)) {
        return res.status(400).json({
          success: false,
          message: "Transaction type must be 'income' or 'expense'",
        });
      }

      if (tx.amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Transaction amount must be greater than 0",
        });
      }
    }

    // Format transactions for bulk insert
    const formattedTransactions = transactions.map((tx) => ({
      category_id: tx.categoryId,
      amount: tx.amount,
      type: tx.type,
      transaction_date: tx.transactionDate || new Date(),
      notes: tx.notes || null,
    }));

    const result = await bulkCreateTransactions(userId, formattedTransactions);

    res.status(201).json({
      success: true,
      message: `${result.length} transactions created successfully`,
      data: {
        count: result.length,
        transactions: result,
      },
    });
  } catch (error) {
    if (error.message.includes("more than 1000")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

module.exports = {
  addTransaction,
  getTransaction,
  getAllTransactions,
  editTransaction,
  removeTransaction,
  uploadTransactionsCSV,
  bulkCreateTransactionsJson,
  getStatistics,
  getCategoryStats,
  getMonthlyStats,
  getTopSpendingCategories,
  getRecentActivity,
};
