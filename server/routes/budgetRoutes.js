const express = require("express");
const {
  addBudget,
  getBudgets,
  getBudget,
  editBudget,
  removeBudget,
  getBudgetSpendingData,
  getAllBudgetsSpendingData,
  getBudgetsWithAlertsData,
  getDailyBudgetProgressData,
} = require("../controllers/budgetController");
const {
  jwtAuthMiddleware,
  analystOnly,
  adminOnly,
  viewerOnly,
} = require("../middlewares/jwtAuthMiddleware");

const router = express.Router();

router.use(jwtAuthMiddleware);

router.get("/", analystOnly, viewerOnly, getBudgets);
router.post("/", adminOnly, addBudget);
router.get("/:budgetId", analystOnly, viewerOnly, getBudget);
router.put("/:budgetId", adminOnly, editBudget);
router.delete("/:budgetId", adminOnly, removeBudget);

// Analytics routes
router.get("/:budgetId/spending", analystOnly, viewerOnly, getBudgetSpendingData);
router.get("/analytics/spending", analystOnly, viewerOnly, getAllBudgetsSpendingData);
router.get("/analytics/alerts", analystOnly, viewerOnly, getBudgetsWithAlertsData);
router.get("/:budgetId/progress", analystOnly, viewerOnly, getDailyBudgetProgressData);

module.exports = router;
