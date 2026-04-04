const express = require("express");
const {
  getDashboardData,
  getCategoryBreakdown,
  getMonthlyStatistics,
  getSpendingInsights,
  getBudgetOverview,
  getAlertsOverview,
  getQuickStats,
} = require("../controllers/dashboardController");
const {
  jwtAuthMiddleware,
  viewerOnly,
  analystOnly,
  adminOnly,
} = require("../middlewares/jwtAuthMiddleware");

const router = express.Router();

// All routes require authentication
router.use(jwtAuthMiddleware);

/**
 * GET /dashboard
 * Main dashboard endpoint - Returns role-based data
 * Viewer: Summary only (no transactions)
 * Analyst: Summary + transactions + insights + alerts
 * Admin: All data including user management
 */
router.get("/",viewerOnly, getDashboardData);

/**
 * GET /dashboard/quick-stats
 * Lightning-fast endpoint for quick updates
 * Returns: Monthly income/expense, unread alerts count, budgets needing attention
 * Role: All (Viewer, Analyst, Admin)
 */
router.get("/quick-stats",viewerOnly, getQuickStats);

/**
 * GET /dashboard/category-breakdown
 * Spending breakdown by category
 * Query params: startDate?, endDate?
 * Role: Analyst & Admin
 */
router.get("/category-breakdown", analystOnly, getCategoryBreakdown);

/**
 * GET /dashboard/monthly-stats
 * Month-by-month statistics and daily breakdown
 * Query params: year?, month?
 * Role: Analyst & Admin
 */
router.get("/monthly-stats", analystOnly, getMonthlyStatistics);

/**
 * GET /dashboard/insights
 * Advanced insights with trends and comparisons
 * Shows: Current vs Previous month, Top categories, Budget status
 * Role: Analyst & Admin
 */
router.get("/insights", analystOnly, getSpendingInsights);

/**
 * GET /dashboard/budget-overview
 * All budgets with spending status and summary
 * Shows: Total budgets, budgets ok/warning/exceeded
 * Role: Analyst & Admin
 */
router.get("/budget-overview", analystOnly, getBudgetOverview);

/**
 * GET /dashboard/alerts-overview
 * All alerts with summary and recent alerts
 * Shows: Unread count, alert types summary, recent 5 alerts
 * Role: Analyst & Admin
 */
router.get("/alerts-overview", analystOnly, getAlertsOverview);

module.exports = router;