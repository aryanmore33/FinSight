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
} = require("../middlewares/jwtAuthMiddleware");

const router = express.Router();

router.use(jwtAuthMiddleware);

router.get("/", analystOnly, getBudgets);
router.post("/", adminOnly, addBudget);
router.get("/:budgetId", analystOnly, getBudget);
router.put("/:budgetId", adminOnly, editBudget);
router.delete("/:budgetId", adminOnly, removeBudget);

// Analytics routes
router.get("/:budgetId/spending", analystOnly, getBudgetSpendingData);
router.get("/analytics/spending", analystOnly, getAllBudgetsSpendingData);
router.get("/analytics/alerts", analystOnly, getBudgetsWithAlertsData);
router.get("/:budgetId/progress", analystOnly, getDailyBudgetProgressData);

module.exports = router;
