const {
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
} = require("../models/budgetModel");

// ================= CREATE BUDGET =================
const addBudget = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { categoryId, limitAmount, period, startDate } = req.body;

    if (!categoryId || !limitAmount) {
      return res.status(400).json({
        success: false,
        message: "categoryId and limitAmount are required",
      });
    }

    if (limitAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "limitAmount must be greater than 0",
      });
    }

    if (period && !["monthly", "weekly"].includes(period)) {
      return res.status(400).json({
        success: false,
        message: "period must be 'monthly' or 'weekly'",
      });
    }

    // Check if budget already exists for this category and period
    const existing = await getBudgetByUserCategoryPeriod(userId, categoryId, period || "monthly");
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Budget already exists for this category and period",
      });
    }

    const budget = await createBudget(userId, categoryId, limitAmount, period, startDate);

    res.status(201).json({
      success: true,
      message: "Budget created successfully",
      data: budget,
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET ALL BUDGETS =================
const getBudgets = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { period } = req.query;

    const budgets = await getBudgetsByUserId(userId, period);

    res.status(200).json({
      success: true,
      data: budgets,
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET BUDGET BY ID =================
const getBudget = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { budgetId } = req.params;

    if (!budgetId) {
      return res.status(400).json({
        success: false,
        message: "budgetId is required",
      });
    }

    const budget = await getBudgetById(budgetId);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    // Verify ownership
    if (budget.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to this budget",
      });
    }

    res.status(200).json({
      success: true,
      data: budget,
    });
  } catch (error) {
    next(error);
  }
};

// ================= UPDATE BUDGET =================
const editBudget = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { budgetId } = req.params;
    const { limitAmount, period, startDate } = req.body;

    if (!budgetId) {
      return res.status(400).json({
        success: false,
        message: "budgetId is required",
      });
    }

    const updates = {};
    if (limitAmount !== undefined) {
      if (limitAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "limitAmount must be greater than 0",
        });
      }
      updates.limitAmount = limitAmount;
    }

    if (period !== undefined) {
      if (!["monthly", "weekly"].includes(period)) {
        return res.status(400).json({
          success: false,
          message: "period must be 'monthly' or 'weekly'",
        });
      }
      updates.period = period;
    }

    if (startDate !== undefined) updates.startDate = startDate;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No budget fields provided to update",
      });
    }

    const updatedBudget = await updateBudget(budgetId, userId, updates);

    if (!updatedBudget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found or already deleted",
      });
    }

    res.status(200).json({
      success: true,
      message: "Budget updated successfully",
      data: updatedBudget,
    });
  } catch (error) {
    next(error);
  }
};

// ================= DELETE BUDGET =================
const removeBudget = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { budgetId } = req.params;

    if (!budgetId) {
      return res.status(400).json({
        success: false,
        message: "budgetId is required",
      });
    }

    const deleted = await deleteBudget(budgetId, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Budget not found or already deleted",
      });
    }

    res.status(200).json({
      success: true,
      message: "Budget deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET BUDGET SPENDING =================
const getBudgetSpendingData = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { budgetId } = req.params;

    if (!budgetId) {
      return res.status(400).json({
        success: false,
        message: "budgetId is required",
      });
    }

    const spending = await getBudgetSpending(budgetId);

    if (!spending) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    // Verify ownership
    if (spending.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to this budget",
      });
    }

    res.status(200).json({
      success: true,
      data: spending,
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET ALL BUDGETS SPENDING =================
const getAllBudgetsSpendingData = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const budgets = await getAllBudgetsSpending(userId);

    res.status(200).json({
      success: true,
      data: budgets,
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET BUDGETS WITH ALERTS =================
const getBudgetsWithAlertsData = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const budgets = await getBudgetsWithAlerts(userId);

    res.status(200).json({
      success: true,
      data: budgets,
    });
  } catch (error) {
    next(error);
  }
};

// ================= GET DAILY BUDGET PROGRESS =================
const getDailyBudgetProgressData = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { budgetId } = req.params;

    if (!budgetId) {
      return res.status(400).json({
        success: false,
        message: "budgetId is required",
      });
    }

    const progress = await getDailyBudgetProgress(userId, budgetId);

    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addBudget,
  getBudgets,
  getBudget,
  editBudget,
  removeBudget,
  getBudgetSpendingData,
  getAllBudgetsSpendingData,
  getBudgetsWithAlertsData,
  getDailyBudgetProgressData,
};
