const express = require("express");
const {
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
} = require("../controllers/transactionControllers");

const {
  jwtAuthMiddleware,
  analystOnly,
  adminOnly
} = require("../middlewares/jwtAuthMiddleware");

const upload = require("../middlewares/uploadCsv");

const router = express.Router();

router.use(jwtAuthMiddleware);

router.get("/", analystOnly, getAllTransactions);

router.post("/addTransaction", adminOnly, addTransaction);

router.get("/:transactionId", analystOnly, getTransaction);

router.put("/:transactionId", adminOnly, editTransaction);

router.delete("/:transactionId", adminOnly, removeTransaction);

router.post(
  "/upload/csv",
  adminOnly,
  upload.single("file"),
  uploadTransactionsCSV
);

router.post("/bulk/create", adminOnly, bulkCreateTransactionsJson);

router.get("/analytics/statistics", analystOnly, getStatistics);

router.get("/analytics/categories", analystOnly, getCategoryStats);

router.get("/analytics/monthly", analystOnly, getMonthlyStats);

router.get(
  "/analytics/top-categories",
  analystOnly,
  getTopSpendingCategories
);

router.get("/analytics/recent", analystOnly, getRecentActivity);

module.exports = router;