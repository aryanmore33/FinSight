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
  adminOnly,
  viewerOnly
} = require("../middlewares/jwtAuthMiddleware");

const upload = require("../middlewares/uploadCsv");

const router = express.Router();

router.use(jwtAuthMiddleware);

router.get("/", analystOnly, viewerOnly, getAllTransactions);

router.post("/addTransaction", adminOnly, addTransaction);

router.get("/:transactionId", viewerOnly, analystOnly, getTransaction);

router.put("/:transactionId", adminOnly, editTransaction);

router.delete("/:transactionId", adminOnly, removeTransaction);

router.post(
  "/upload/csv",
  adminOnly,
  upload.single("file"),
  uploadTransactionsCSV
);

router.post("/bulk/create", adminOnly, bulkCreateTransactionsJson);

// analytics routes

router.get("/analytics/statistics", analystOnly,viewerOnly, getStatistics);

router.get("/analytics/categories", analystOnly, viewerOnly, getCategoryStats);

router.get("/analytics/monthly", analystOnly, viewerOnly, getMonthlyStats);

router.get(
  "/analytics/top-categories",
  analystOnly,
  viewerOnly,
  getTopSpendingCategories
);

router.get("/analytics/recent", analystOnly, viewerOnly, getRecentActivity);

module.exports = router;