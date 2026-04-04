const pool = require("../config/pool");
const TransactionModel = require("../models/transactionModel");
const BudgetModel = require("../models/budgetModel");
const AlertModel = require("../models/alertModel");
const CategoryModel = require("../models/categoryModel");

// ================= GET DASHBOARD DATA (Role-Based) =================
/**
 * GET /dashboard
 * Returns different data based on user role
 * Viewer: Only summary data (no transactions)
 * Analyst: Summary + transactions + insights
 * Admin: All data including user management
 */
const getDashboardData = async (req, res, next) => {
  try {
    const { user_id, role } = req.user;

    // Common data for all roles
    const userInfo = await getUserInfo(user_id);
    const dashboardSummary = await getDashboardSummary(user_id);

    // Role-based data
    let dashboardData = {
      user: userInfo,
      summary: dashboardSummary,
    };

    // Viewer: Only summary
    if (role === "viewer") {
      dashboardData.message =
        "Viewer role: Limited access to dashboard summary only";
      return res.status(200).json({
        success: true,
        role: "viewer",
        data: dashboardData,
      });
    }

    // Analyst: Add transactions, insights, alerts
    if (role === "analyst" || role === "admin") {
      dashboardData.recentTransactions = await getRecentTransactionsData(
        user_id,
        5
      );
      dashboardData.topCategories = await getTopCategoriesData(user_id);
      dashboardData.budgetAlerts = await getBudgetAlertsData(user_id);
      dashboardData.monthlyTrend = await getMonthlyTrendData(user_id);
      dashboardData.alerts = await getRecentAlertsData(user_id, 5);
      dashboardData.unreadAlertCount = await AlertModel.getUnreadAlertsCount(
        user_id
      );
    }

    // Admin: Add all data
    if (role === "admin") {
      dashboardData.allBudgets = await BudgetModel.getAllBudgetsSpending(
        user_id
      );
      dashboardData.allCategories = await CategoryModel.getCategoriesByUserId(
        user_id
      );
    }

    return res.status(200).json({
      success: true,
      role: role,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    next(error);
  }
};

// ================= GET DASHBOARD SUMMARY =================
/**
 * Dashboard summary: Income, Expense, Balance, Categories count
 */
const getDashboardSummary = async (user_id) => {
  try {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    // Get current month date range
    const monthStart = new Date(currentYear, today.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const monthEnd = new Date(currentYear, today.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    // Get statistics for current month
    const stats = await TransactionModel.getTransactionStatistics(
      user_id,
      monthStart,
      monthEnd
    );

    // Get total balance (all time)
    const balanceResult = await pool.query(
      `
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense
      FROM financial_records
      WHERE user_id = $1 AND is_deleted = false
      `,
      [user_id]
    );

    const balance = balanceResult.rows[0];

    // Get categories count
    const categoriesCount = await pool.query(
      `SELECT COUNT(*) as count FROM categories WHERE user_id = $1`,
      [user_id]
    );

    // Get budgets count
    const budgetsCount = await pool.query(
      `SELECT COUNT(*) as count FROM budgets WHERE user_id = $1`,
      [user_id]
    );

    return {
      currentMonth: {
        year: currentYear,
        month: currentMonth,
        income: parseFloat(stats.total_income),
        expense: parseFloat(stats.total_expense),
        netBalance: parseFloat(stats.net_balance),
        transactionCount: stats.transaction_count,
      },
      allTime: {
        totalIncome: parseFloat(balance.total_income),
        totalExpense: parseFloat(balance.total_expense),
        totalBalance:
          parseFloat(balance.total_income) - parseFloat(balance.total_expense),
      },
      counts: {
        totalCategories: parseInt(categoriesCount.rows[0].count),
        totalBudgets: parseInt(budgetsCount.rows[0].count),
      },
    };
  } catch (err) {
    console.error("Error getting dashboard summary:", err);
    throw err;
  }
};

// ================= GET USER INFO =================
const getUserInfo = async (user_id) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1`,
      [user_id]
    );
    return result.rows[0] || null;
  } catch (err) {
    console.error("Error getting user info:", err);
    throw err;
  }
};

// ================= GET RECENT TRANSACTIONS DATA =================
const getRecentTransactionsData = async (user_id, limit = 5) => {
  try {
    return await TransactionModel.getRecentTransactions(user_id, limit);
  } catch (err) {
    console.error("Error getting recent transactions:", err);
    throw err;
  }
};

// ================= GET TOP CATEGORIES DATA =================
const getTopCategoriesData = async (user_id, limit = 5) => {
  try {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    return await TransactionModel.getTopCategories(
      user_id,
      monthStart,
      monthEnd,
      limit
    );
  } catch (err) {
    console.error("Error getting top categories:", err);
    throw err;
  }
};

// ================= GET BUDGET ALERTS DATA =================
const getBudgetAlertsData = async (user_id) => {
  try {
    return await BudgetModel.getBudgetsWithAlerts(user_id);
  } catch (err) {
    console.error("Error getting budget alerts:", err);
    throw err;
  }
};

// ================= GET MONTHLY TREND DATA =================
const getMonthlyTrendData = async (user_id) => {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    return await TransactionModel.getMonthlyTransactions(user_id, year, month);
  } catch (err) {
    console.error("Error getting monthly trend:", err);
    throw err;
  }
};

// ================= GET RECENT ALERTS DATA =================
const getRecentAlertsData = async (user_id, limit = 5) => {
  try {
    return await AlertModel.getRecentAlerts(user_id, limit);
  } catch (err) {
    console.error("Error getting recent alerts:", err);
    throw err;
  }
};

// ================= GET SPENDING BY CATEGORY =================
/**
 * GET /dashboard/category-breakdown
 * Shows spending breakdown by category for current month
 */
const getCategoryBreakdown = async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const { startDate, endDate } = req.query;

    const today = new Date();
    const monthStart = startDate || new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const monthEnd = endDate || new Date(today.getFullYear(), today.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    const breakdown = await TransactionModel.getCategoryBreakdown(
      user_id,
      monthStart,
      monthEnd
    );

    return res.status(200).json({
      success: true,
      data: breakdown,
      dateRange: {
        start: monthStart,
        end: monthEnd,
      },
    });
  } catch (error) {
    console.error("Error getting category breakdown:", error);
    next(error);
  }
};

// ================= GET MONTHLY STATISTICS =================
/**
 * GET /dashboard/monthly-stats
 * Month-by-month statistics
 */
const getMonthlyStatistics = async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const { year, month } = req.query;

    const today = new Date();
    const selectedYear = year || today.getFullYear();
    const selectedMonth = month || today.getMonth() + 1;

    const stats = await TransactionModel.getMonthlyTransactions(
      user_id,
      selectedYear,
      selectedMonth
    );

    // Calculate summary
    let totalIncome = 0,
      totalExpense = 0;
    stats.forEach((day) => {
      totalIncome += parseFloat(day.daily_income) || 0;
      totalExpense += parseFloat(day.daily_expense) || 0;
    });

    return res.status(200).json({
      success: true,
      year: selectedYear,
      month: selectedMonth,
      summary: {
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense,
        transactionDays: stats.length,
      },
      dailyBreakdown: stats,
    });
  } catch (error) {
    console.error("Error getting monthly statistics:", error);
    next(error);
  }
};

// ================= GET SPENDING INSIGHTS =================
/**
 * GET /dashboard/insights
 * Advanced insights: trends, patterns, recommendations
 */
const getSpendingInsights = async (req, res, next) => {
  try {
    const { user_id } = req.user;

    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    // Current month stats
    const currentStats = await TransactionModel.getTransactionStatistics(
      user_id,
      monthStart,
      monthEnd
    );

    // Previous month stats for comparison
    const lastMonthStart = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1
    )
      .toISOString()
      .split("T")[0];
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
      .toISOString()
      .split("T")[0];
    const lastMonthStats = await TransactionModel.getTransactionStatistics(
      user_id,
      lastMonthStart,
      lastMonthEnd
    );

    // Calculate insights
    const expenseGrowth =
      ((currentStats.total_expense - lastMonthStats.total_expense) /
        lastMonthStats.total_expense) *
      100;
    const incomeGrowth =
      ((currentStats.total_income - lastMonthStats.total_income) /
        lastMonthStats.total_income) *
      100;

    // Get top spending categories
    const topCategories = await TransactionModel.getTopCategories(
      user_id,
      monthStart,
      monthEnd,
      5
    );

    // Get budget alerts
    const budgetAlerts = await BudgetModel.getBudgetsWithAlerts(user_id);

    return res.status(200).json({
      success: true,
      insights: {
        currentMonth: {
          income: parseFloat(currentStats.total_income),
          expense: parseFloat(currentStats.total_expense),
          balance: parseFloat(currentStats.net_balance),
        },
        previousMonth: {
          income: parseFloat(lastMonthStats.total_income),
          expense: parseFloat(lastMonthStats.total_expense),
          balance: parseFloat(lastMonthStats.net_balance),
        },
        monthOverMonth: {
          expenseGrowth: expenseGrowth.toFixed(2),
          incomeGrowth: incomeGrowth.toFixed(2),
          trendingUp: expenseGrowth > 0,
        },
        topSpendingCategories: topCategories,
        budgetStatus: {
          totalBudgets: budgetAlerts.length,
          budgetsExceeded: budgetAlerts.filter((b) => b.status === "exceeded")
            .length,
          budgetsWarning: budgetAlerts.filter((b) => b.status === "warning")
            .length,
          budgetsOk: budgetAlerts.filter((b) => b.status === "ok").length,
        },
      },
    });
  } catch (error) {
    console.error("Error getting spending insights:", error);
    next(error);
  }
};

// ================= GET BUDGET OVERVIEW =================
/**
 * GET /dashboard/budget-overview
 * All budgets with spending status
 */
const getBudgetOverview = async (req, res, next) => {
  try {
    const { user_id } = req.user;

    const budgets = await BudgetModel.getAllBudgetsSpending(user_id);

    // Categorize budgets
    const summary = {
      total: budgets.length,
      ok: budgets.filter((b) => b.status === "ok").length,
      warning: budgets.filter((b) => b.status === "warning").length,
      exceeded: budgets.filter((b) => b.status === "exceeded").length,
      totalBudgetLimit: budgets.reduce((sum, b) => sum + parseFloat(b.limit_amount), 0),
      totalSpent: budgets.reduce((sum, b) => sum + parseFloat(b.spent_amount), 0),
    };

    return res.status(200).json({
      success: true,
      summary,
      budgets,
    });
  } catch (error) {
    console.error("Error getting budget overview:", error);
    next(error);
  }
};

// ================= GET ALERTS OVERVIEW =================
/**
 * GET /dashboard/alerts-overview
 * All alerts with summary
 */
const getAlertsOverview = async (req, res, next) => {
  try {
    const { user_id } = req.user;

    const alertSummary = await AlertModel.getAlertSummary(user_id);
    const recentAlerts = await AlertModel.getDashboardAlerts(user_id, 5);
    const unreadCount = await AlertModel.getUnreadAlertsCount(user_id);

    return res.status(200).json({
      success: true,
      unreadCount,
      summary: alertSummary,
      recentAlerts,
    });
  } catch (error) {
    console.error("Error getting alerts overview:", error);
    next(error);
  }
};

// ================= GET QUICK STATS =================
/**
 * GET /dashboard/quick-stats
 * Lightning-fast endpoint for quick dashboard update
 */
const getQuickStats = async (req, res, next) => {
  try {
    const { user_id } = req.user;

    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    const stats = await TransactionModel.getTransactionStatistics(
      user_id,
      monthStart,
      monthEnd
    );
    const unreadAlerts = await AlertModel.getUnreadAlertsCount(user_id);
    const budgetAlerts = await BudgetModel.getBudgetsWithAlerts(user_id);

    return res.status(200).json({
      success: true,
      data: {
        monthlyIncome: parseFloat(stats.total_income),
        monthlyExpense: parseFloat(stats.total_expense),
        monthlyBalance: parseFloat(stats.net_balance),
        unreadAlerts,
        budgetsNeedingAttention: budgetAlerts.length,
      },
    });
  } catch (error) {
    console.error("Error getting quick stats:", error);
    next(error);
  }
};

module.exports = {
  getDashboardData,
  getCategoryBreakdown,
  getMonthlyStatistics,
  getSpendingInsights,
  getBudgetOverview,
  getAlertsOverview,
  getQuickStats,
};