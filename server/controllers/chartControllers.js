const pool = require("../config/pool");
const TransactionModel = require("../models/transactionModel");
const BudgetModel = require("../models/budgetModel");
const AlertModel = require("../models/alertModel");

// ================= SPENDING BY CATEGORY (PIE CHART) =================
/**
 * GET /charts/spending-by-category
 * Returns data formatted for pie chart
 * Perfect for: Chart.js, ApexCharts, Recharts
 */
const getSpendingByCategory = async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const { startDate, endDate, type = "expense" } = req.query;

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

    // Filter by type if specified
    let filteredData = breakdown;
    if (type) {
      filteredData = breakdown.filter((item) => item.type === type);
    }

    // Format for pie chart
    const chartData = {
      labels: filteredData.map((item) => item.name),
      datasets: [
        {
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} by Category`,
          data: filteredData.map((item) => parseFloat(item.total_amount)),
          backgroundColor: filteredData.map((item) => item.color || generateRandomColor()),
          borderColor: "#fff",
          borderWidth: 2,
        },
      ],
    };

    // Also provide detailed data
    const detailedData = filteredData.map((item) => ({
      name: item.name,
      value: parseFloat(item.total_amount),
      count: item.transaction_count,
      color: item.color,
      icon: item.icon,
      percentage: (
        (parseFloat(item.total_amount) /
          filteredData.reduce((sum, i) => sum + parseFloat(i.total_amount), 0)) *
        100
      ).toFixed(2),
    }));

    return res.status(200).json({
      success: true,
      type: "pie",
      chartData,
      detailedData,
      dateRange: {
        start: monthStart,
        end: monthEnd,
      },
      summary: {
        total: filteredData.reduce((sum, item) => sum + parseFloat(item.total_amount), 0),
        categories: filteredData.length,
      },
    });
  } catch (error) {
    console.error("Error getting spending by category:", error);
    next(error);
  }
};

// ================= MONTHLY TREND (LINE CHART) =================
/**
 * GET /charts/monthly-trend
 * Returns monthly data formatted for line chart
 * Perfect for: Chart.js, ApexCharts, Recharts
 */
const getMonthlyTrend = async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const { year, month, months = 6 } = req.query;

    const today = new Date();
    const selectedYear = year || today.getFullYear();
    const selectedMonth = month || today.getMonth() + 1;
    const numMonths = parseInt(months) || 6;

    const monthlyData = [];
    const labels = [];

    // Fetch data for multiple months
    for (let i = numMonths - 1; i >= 0; i--) {
      const date = new Date(selectedYear, selectedMonth - 1 - i, 1);
      const fetchYear = date.getFullYear();
      const fetchMonth = date.getMonth() + 1;

      const monthData = await TransactionModel.getMonthlyTransactions(
        user_id,
        fetchYear,
        fetchMonth
      );

      // Calculate daily totals
      let monthlyIncome = 0,
        monthlyExpense = 0;
      monthData.forEach((day) => {
        monthlyIncome += parseFloat(day.daily_income) || 0;
        monthlyExpense += parseFloat(day.daily_expense) || 0;
      });

      const monthName = new Date(fetchYear, fetchMonth - 1, 1).toLocaleString(
        "default",
        { month: "short", year: "numeric" }
      );
      labels.push(monthName);
      monthlyData.push({
        month: monthName,
        income: monthlyIncome,
        expense: monthlyExpense,
        balance: monthlyIncome - monthlyExpense,
      });
    }

    // Format for line chart
    const chartData = {
      labels: labels,
      datasets: [
        {
          label: "Income",
          data: monthlyData.map((d) => d.income),
          borderColor: "#4CAF50",
          backgroundColor: "rgba(76, 175, 80, 0.1)",
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: "#4CAF50",
        },
        {
          label: "Expense",
          data: monthlyData.map((d) => d.expense),
          borderColor: "#f44336",
          backgroundColor: "rgba(244, 67, 54, 0.1)",
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: "#f44336",
        },
        {
          label: "Balance",
          data: monthlyData.map((d) => d.balance),
          borderColor: "#2196F3",
          backgroundColor: "rgba(33, 150, 243, 0.1)",
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: "#2196F3",
        },
      ],
    };

    return res.status(200).json({
      success: true,
      type: "line",
      chartData,
      monthlyData,
      summary: {
        totalIncome: monthlyData.reduce((sum, d) => sum + d.income, 0),
        totalExpense: monthlyData.reduce((sum, d) => sum + d.expense, 0),
        averageMonthlyBalance:
          monthlyData.reduce((sum, d) => sum + d.balance, 0) / monthlyData.length,
      },
    });
  } catch (error) {
    console.error("Error getting monthly trend:", error);
    next(error);
  }
};

// ================= BUDGET VS SPENDING (BAR CHART) =================
/**
 * GET /charts/budget-vs-spending
 * Returns budget vs actual spending formatted for bar chart
 * Perfect for: Chart.js, ApexCharts, Recharts
 */
const getBudgetVsSpending = async (req, res, next) => {
  try {
    const { user_id } = req.user;

    const budgets = await BudgetModel.getAllBudgetsSpending(user_id);

    if (budgets.length === 0) {
      return res.status(200).json({
        success: true,
        type: "bar",
        message: "No budgets found",
        chartData: { labels: [], datasets: [] },
      });
    }

    // Format for bar chart
    const chartData = {
      labels: budgets.map((b) => b.category_name),
      datasets: [
        {
          label: "Budget Limit",
          data: budgets.map((b) => parseFloat(b.limit_amount)),
          backgroundColor: "#2196F3",
          borderColor: "#1976D2",
          borderWidth: 1,
        },
        {
          label: "Amount Spent",
          data: budgets.map((b) => parseFloat(b.spent_amount)),
          backgroundColor: budgets.map((b) => {
            if (b.status === "exceeded") return "#f44336";
            if (b.status === "warning") return "#ff9800";
            return "#4CAF50";
          }),
          borderColor: "#333",
          borderWidth: 1,
        },
      ],
    };

    // Detailed data with status
    const detailedData = budgets.map((b) => ({
      category: b.category_name,
      icon: b.category_icon,
      color: b.category_color,
      limit: parseFloat(b.limit_amount),
      spent: parseFloat(b.spent_amount),
      remaining: parseFloat(b.remaining_amount),
      percentage: parseFloat(b.spent_percentage),
      status: b.status,
      period: b.period,
    }));

    // Summary statistics
    const summary = {
      totalBudgetLimit: budgets.reduce(
        (sum, b) => sum + parseFloat(b.limit_amount),
        0
      ),
      totalSpent: budgets.reduce((sum, b) => sum + parseFloat(b.spent_amount), 0),
      totalRemaining: budgets.reduce(
        (sum, b) => sum + parseFloat(b.remaining_amount),
        0
      ),
      budgetsCounts: {
        ok: budgets.filter((b) => b.status === "ok").length,
        warning: budgets.filter((b) => b.status === "warning").length,
        exceeded: budgets.filter((b) => b.status === "exceeded").length,
      },
    };

    return res.status(200).json({
      success: true,
      type: "bar",
      chartData,
      detailedData,
      summary,
    });
  } catch (error) {
    console.error("Error getting budget vs spending:", error);
    next(error);
  }
};

// ================= DAILY SPENDING TREND (AREA CHART) =================
/**
 * GET /charts/daily-trend
 * Returns daily spending data formatted for area chart
 * Perfect for: Chart.js, ApexCharts, Recharts
 */
const getDailyTrend = async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const { year, month } = req.query;

    const today = new Date();
    const selectedYear = year || today.getFullYear();
    const selectedMonth = month || today.getMonth() + 1;

    const monthData = await TransactionModel.getMonthlyTransactions(
      user_id,
      selectedYear,
      selectedMonth
    );

    // Format for area chart
    const chartData = {
      labels: monthData.map((d) => d.date),
      datasets: [
        {
          label: "Daily Income",
          data: monthData.map((d) => parseFloat(d.daily_income) || 0),
          borderColor: "#4CAF50",
          backgroundColor: "rgba(76, 175, 80, 0.1)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "Daily Expense",
          data: monthData.map((d) => parseFloat(d.daily_expense) || 0),
          borderColor: "#f44336",
          backgroundColor: "rgba(244, 67, 54, 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    };

    // Summary
    const summary = {
      monthName: new Date(selectedYear, selectedMonth - 1, 1).toLocaleString(
        "default",
        { month: "long", year: "numeric" }
      ),
      totalIncome: monthData.reduce(
        (sum, d) => sum + (parseFloat(d.daily_income) || 0),
        0
      ),
      totalExpense: monthData.reduce(
        (sum, d) => sum + (parseFloat(d.daily_expense) || 0),
        0
      ),
      averageDailyIncome:
        monthData.reduce((sum, d) => sum + (parseFloat(d.daily_income) || 0), 0) /
        monthData.length,
      averageDailyExpense:
        monthData.reduce((sum, d) => sum + (parseFloat(d.daily_expense) || 0), 0) /
        monthData.length,
      activeDays: monthData.filter((d) => d.transaction_count > 0).length,
    };

    return res.status(200).json({
      success: true,
      type: "area",
      chartData,
      dailyData: monthData,
      summary,
    });
  } catch (error) {
    console.error("Error getting daily trend:", error);
    next(error);
  }
};

// ================= CATEGORY COMPARISON (RADAR CHART) =================
/**
 * GET /charts/category-comparison
 * Returns category comparison formatted for radar chart
 * Perfect for: Chart.js, ApexCharts
 */
const getCategoryComparison = async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const { startDate, endDate, topN = 8 } = req.query;

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

    // Get only expense categories and limit to topN
    const expenseCategories = breakdown
      .filter((item) => item.type === "expense")
      .sort((a, b) => parseFloat(b.total_amount) - parseFloat(a.total_amount))
      .slice(0, parseInt(topN));

    // Find max value for normalization
    const maxValue = Math.max(
      ...expenseCategories.map((item) => parseFloat(item.total_amount))
    );

    // Format for radar chart
    const chartData = {
      labels: expenseCategories.map((item) => item.name),
      datasets: [
        {
          label: "Spending Amount",
          data: expenseCategories.map((item) => parseFloat(item.total_amount)),
          borderColor: "#2196F3",
          backgroundColor: "rgba(33, 150, 243, 0.1)",
          pointBackgroundColor: "#2196F3",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "#2196F3",
          pointRadius: 5,
          pointHoverRadius: 7,
        },
        {
          label: "Average per Transaction",
          data: expenseCategories.map(
            (item) => parseFloat(item.total_amount) / item.transaction_count
          ),
          borderColor: "#FF9800",
          backgroundColor: "rgba(255, 152, 0, 0.1)",
          pointBackgroundColor: "#FF9800",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "#FF9800",
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    };

    const detailedData = expenseCategories.map((item) => ({
      name: item.name,
      icon: item.icon,
      color: item.color,
      total: parseFloat(item.total_amount),
      count: item.transaction_count,
      average: (parseFloat(item.total_amount) / item.transaction_count).toFixed(2),
      percentage: (
        (parseFloat(item.total_amount) /
          expenseCategories.reduce((sum, i) => sum + parseFloat(i.total_amount), 0)) *
        100
      ).toFixed(2),
    }));

    return res.status(200).json({
      success: true,
      type: "radar",
      chartData,
      detailedData,
      summary: {
        topCategories: expenseCategories.length,
        totalSpending: expenseCategories.reduce(
          (sum, item) => sum + parseFloat(item.total_amount),
          0
        ),
      },
    });
  } catch (error) {
    console.error("Error getting category comparison:", error);
    next(error);
  }
};

// ================= INCOME VS EXPENSE (DOUGHNUT CHART) =================
/**
 * GET /charts/income-vs-expense
 * Returns income vs expense formatted for doughnut chart
 * Perfect for: Chart.js, ApexCharts, Recharts
 */
const getIncomeVsExpense = async (req, res, next) => {
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

    const stats = await TransactionModel.getTransactionStatistics(
      user_id,
      monthStart,
      monthEnd
    );

    const income = parseFloat(stats.total_income);
    const expense = parseFloat(stats.total_expense);
    const balance = income - expense;

    // Format for doughnut chart
    const chartData = {
      labels: ["Income", "Expense"],
      datasets: [
        {
          data: [income, expense],
          backgroundColor: ["#4CAF50", "#f44336"],
          borderColor: "#fff",
          borderWidth: 2,
        },
      ],
    };

    const detailedData = {
      income: {
        value: income,
        percentage: income > 0 ? 100 : 0,
        color: "#4CAF50",
        icon: "💰",
        label: "Total Income",
      },
      expense: {
        value: expense,
        percentage: expense > 0 ? (expense / income * 100).toFixed(2) : 0,
        color: "#f44336",
        icon: "💸",
        label: "Total Expense",
      },
      balance: {
        value: balance,
        percentage: balance > 0 ? "Positive" : "Negative",
        color: balance > 0 ? "#4CAF50" : "#f44336",
        icon: balance > 0 ? "📈" : "📉",
        label: "Net Balance",
      },
    };

    return res.status(200).json({
      success: true,
      type: "doughnut",
      chartData,
      detailedData,
      summary: {
        totalIncome: income,
        totalExpense: expense,
        netBalance: balance,
        savingsRate:
          income > 0 ? ((balance / income) * 100).toFixed(2) : 0,
        expenseRatio: income > 0 ? ((expense / income) * 100).toFixed(2) : 0,
      },
      dateRange: {
        start: monthStart,
        end: monthEnd,
      },
    });
  } catch (error) {
    console.error("Error getting income vs expense:", error);
    next(error);
  }
};

// ================= ALERT TRENDS (TIMELINE CHART) =================
/**
 * GET /charts/alert-trends
 * Returns alert frequency over time
 * Perfect for: Chart.js, ApexCharts
 */
const getAlertTrends = async (req, res, next) => {
  try {
    const { user_id } = req.user;

    const alertData = await AlertModel.getAlertSummary(user_id);

    const chartData = {
      labels: alertData.map((a) => a.type),
      datasets: [
        {
          label: "Total Alerts",
          data: alertData.map((a) => a.count),
          backgroundColor: getAlertColors(alertData.map((a) => a.type)),
          borderColor: "#333",
          borderWidth: 1,
        },
        {
          label: "Unread Alerts",
          data: alertData.map((a) => a.unread_count),
          backgroundColor: getAlertColorsUnread(alertData.map((a) => a.type)),
          borderColor: "#333",
          borderWidth: 1,
        },
      ],
    };

    return res.status(200).json({
      success: true,
      type: "bar",
      chartData,
      alertData,
      summary: {
        totalAlerts: alertData.reduce((sum, a) => sum + a.count, 0),
        unreadAlerts: alertData.reduce((sum, a) => sum + a.unread_count, 0),
        alertTypes: alertData.length,
      },
    });
  } catch (error) {
    console.error("Error getting alert trends:", error);
    next(error);
  }
};

// ================= SPENDING HEATMAP DATA =================
/**
 * GET /charts/spending-heatmap
 * Returns heatmap data for category x time visualization
 * Perfect for: Custom heatmap, D3.js
 */
const getSpendingHeatmap = async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const { months = 6 } = req.query;

    const today = new Date();
    const numMonths = parseInt(months) || 6;
    const heatmapData = [];

    // Fetch top categories for past months
    const topCategories = [];

    for (let i = 0; i < numMonths; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const monthData = await TransactionModel.getMonthlyTransactions(
        user_id,
        year,
        month
      );

      if (monthData.length > 0) {
        // Add to heatmap
        const monthLabel = new Date(year, month - 1, 1).toLocaleString("default", {
          month: "short",
          year: "numeric",
        });

        heatmapData.push({
          month: monthLabel,
          date: new Date(year, month - 1, 1),
          totalExpense: monthData.reduce(
            (sum, d) => sum + (parseFloat(d.daily_expense) || 0),
            0
          ),
          days: monthData.length,
        });
      }
    }

    // Reverse to show chronological order
    heatmapData.reverse();

    return res.status(200).json({
      success: true,
      type: "heatmap",
      heatmapData,
      summary: {
        period: `Last ${numMonths} months`,
        averageMonthlyExpense:
          heatmapData.reduce((sum, d) => sum + d.totalExpense, 0) /
          heatmapData.length,
        highestMonth: heatmapData.reduce((max, d) =>
          d.totalExpense > max.totalExpense ? d : max
        ),
        lowestMonth: heatmapData.reduce((min, d) =>
          d.totalExpense < min.totalExpense ? d : min
        ),
      },
    });
  } catch (error) {
    console.error("Error getting spending heatmap:", error);
    next(error);
  }
};

// ================= HELPER FUNCTIONS =================
const generateRandomColor = () => {
  const colors = [
    "#FF6384",
    "#36A2EB",
    "#FFCE56",
    "#4BC0C0",
    "#9966FF",
    "#FF9F40",
    "#FF6384",
    "#C9CBCF",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const getAlertColors = (types) => {
  const colorMap = {
    exceeded: "#f44336",
    warning: "#ff9800",
    reset: "#4CAF50",
    unusual_spending: "#9C27B0",
    high_transaction: "#2196F3",
    monthly_summary: "#00BCD4",
    suspicious_activity: "#FF5722",
  };
  return types.map((t) => colorMap[t] || "#999");
};

const getAlertColorsUnread = (types) => {
  const colorMap = {
    exceeded: "#ef9a9a",
    warning: "#ffcc80",
    reset: "#a5d6a7",
    unusual_spending: "#ce93d8",
    high_transaction: "#90caf9",
    monthly_summary: "#80deea",
    suspicious_activity: "#ffab91",
  };
  return types.map((t) => colorMap[t] || "#ccc");
};

module.exports = {
  getSpendingByCategory,
  getMonthlyTrend,
  getBudgetVsSpending,
  getDailyTrend,
  getCategoryComparison,
  getIncomeVsExpense,
  getAlertTrends,
  getSpendingHeatmap,
};