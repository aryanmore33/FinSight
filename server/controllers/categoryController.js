const {
  createCategory,
  getCategoriesByUserId,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../models/categoryModel");

const addCategory = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { name, type, color, icon } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    if (type && !["income", "expense"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Category type must be 'income' or 'expense'",
      });
    }

    const category = await createCategory(userId, name, type, color, icon);

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const categories = await getCategoriesByUserId(userId);
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

const getCategory = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { categoryId } = req.params;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "categoryId is required",
      });
    }

    const category = await getCategoryById(categoryId, userId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

const editCategory = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { categoryId } = req.params;
    const { name, type, color, icon } = req.body;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "categoryId is required",
      });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (type !== undefined) updates.type = type;
    if (color !== undefined) updates.color = color;
    if (icon !== undefined) updates.icon = icon;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No category fields provided to update",
      });
    }

    const updatedCategory = await updateCategory(categoryId, userId, updates);

    if (!updatedCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found or already deleted",
      });
    }

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    next(error);
  }
};

const removeCategory = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { categoryId } = req.params;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "categoryId is required",
      });
    }

    const deleted = await deleteCategory(categoryId, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Category not found or already deleted",
      });
    }

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addCategory,
  getCategories,
  getCategory,
  editCategory,
  removeCategory,
};
