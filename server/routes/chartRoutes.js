const express = require("express");
const {
  getSpendingByCategory,
  getMonthlyTrend,
  getBudgetVsSpending,
  getDailyTrend,
  getCategoryComparison,
  getIncomeVsExpense,
  getAlertTrends,
  getSpendingHeatmap,
} = require("../controllers/chartControllers");
const {
  jwtAuthMiddleware,
  analystOnly,
} = require("../middlewares/jwtAuthMiddleware");

const router = express.Router();

// All routes require authentication
router.use(jwtAuthMiddleware);

/**
 * GET /charts/spending-by-category
 * Pie Chart - Spending breakdown by category
 * Query params: startDate?, endDate?, type? (income/expense)
 * Role: Analyst & Admin
 * 
 * Response includes:
 * - chartData: Formatted for Chart.js, ApexCharts, Recharts
 * - detailedData: Detailed breakdown with percentages
 * - summary: Total and count
 * 
 * Example: GET /charts/spending-by-category?type=expense&startDate=2024-01-01&endDate=2024-01-31
 */
router.get(
  "/spending-by-category",
  analystOnly,
  getSpendingByCategory
);

/**
 * GET /charts/monthly-trend
 * Line Chart - Multi-month income, expense, and balance trends
 * Query params: year?, month?, months? (default 6)
 * Role: Analyst & Admin
 * 
 * Response includes:
 * - chartData: 3 lines (income, expense, balance)
 * - monthlyData: Detailed month-by-month data
 * - summary: Totals and averages
 * 
 * Example: GET /charts/monthly-trend?year=2024&month=1&months=6
 */
router.get(
  "/monthly-trend",
  analystOnly,
  getMonthlyTrend
);

/**
 * GET /charts/budget-vs-spending
 * Bar Chart - Budget limit vs actual spending
 * Query params: none
 * Role: Analyst & Admin
 * 
 * Response includes:
 * - chartData: Grouped bar chart (budget vs spent)
 * - detailedData: Each budget with status
 * - summary: Counts by status (ok/warning/exceeded)
 * 
 * Example: GET /charts/budget-vs-spending
 */
router.get(
  "/budget-vs-spending",
  analystOnly,
  getBudgetVsSpending
);

/**
 * GET /charts/daily-trend
 * Area Chart - Daily income and expense for a month
 * Query params: year?, month?
 * Role: Analyst & Admin
 * 
 * Response includes:
 * - chartData: 2 areas (daily income, daily expense)
 * - dailyData: Day-by-day breakdown
 * - summary: Monthly totals and averages
 * 
 * Example: GET /charts/daily-trend?year=2024&month=1
 */
router.get(
  "/daily-trend",
  analystOnly,
  getDailyTrend
);

/**
 * GET /charts/category-comparison
 * Radar Chart - Compare top categories
 * Query params: startDate?, endDate?, topN? (default 8)
 * Role: Analyst & Admin
 * 
 * Response includes:
 * - chartData: Multi-series radar (total & average)
 * - detailedData: Each category with stats
 * - summary: Top category info
 * 
 * Example: GET /charts/category-comparison?topN=8
 */
router.get(
  "/category-comparison",
  analystOnly,
  getCategoryComparison
);

/**
 * GET /charts/income-vs-expense
 * Doughnut Chart - Income vs Expense distribution
 * Query params: startDate?, endDate?
 * Role: Analyst & Admin
 * 
 * Response includes:
 * - chartData: Doughnut with income & expense
 * - detailedData: Income, expense, balance with percentages
 * - summary: Savings rate and ratios
 * 
 * Example: GET /charts/income-vs-expense
 */
router.get(
  "/income-vs-expense",
  analystOnly,
  getIncomeVsExpense
);

/**
 * GET /charts/alert-trends
 * Bar Chart - Alert frequency by type
 * Query params: none
 * Role: Analyst & Admin
 * 
 * Response includes:
 * - chartData: Bar chart (total & unread alerts)
 * - alertData: Breakdown by alert type
 * - summary: Total and unread counts
 * 
 * Example: GET /charts/alert-trends
 */
router.get(
  "/alert-trends",
  analystOnly,
  getAlertTrends
);

/**
 * GET /charts/spending-heatmap
 * Heatmap Data - Monthly spending visualization
 * Query params: months? (default 6)
 * Role: Analyst & Admin
 * 
 * Response includes:
 * - heatmapData: Data for each month
 * - summary: Period info and min/max months
 * 
 * Example: GET /charts/spending-heatmap?months=6
 */
router.get(
  "/spending-heatmap",
  analystOnly,
  getSpendingHeatmap
);

module.exports = router;