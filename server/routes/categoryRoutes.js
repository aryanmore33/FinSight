const express = require("express");
const {
  addCategory,
  getCategories,
  getCategory,
  editCategory,
  removeCategory,
} = require("../controllers/categoryController");
const {
  jwtAuthMiddleware,
  analystOnly,
  adminOnly,
  viewerOnly,
} = require("../middlewares/jwtAuthMiddleware");

const router = express.Router();

router.use(jwtAuthMiddleware);

router.get("/", analystOnly,viewerOnly, getCategories);
router.post("/", adminOnly, addCategory);
router.get("/:categoryId", analystOnly, viewerOnly, getCategory);
router.put("/:categoryId", adminOnly, editCategory);
router.delete("/:categoryId", adminOnly, removeCategory);

module.exports = router;
