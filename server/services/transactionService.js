const { parseCSVInWorker } = require("./csvService");
const { bulkCreateTransactions } = require("../models/transactionModel");
const { findOrCreateCategories } = require("../models/categoryModel");

const bulkUploadTransactions = async (userId, filePath) => {
  const transactions = await parseCSVInWorker(filePath);

  if (!transactions.length) {
    throw new Error("No transactions found in CSV");
  }

  const normalizedTransactions = transactions.map((tx, index) => {
    const category = tx.category?.trim();
    const type = tx.type?.trim().toLowerCase();
    const amount = Number(tx.amount);
    const transactionDate = tx.transaction_date ? new Date(tx.transaction_date) : new Date();

    if (!category || !type || Number.isNaN(amount)) {
      throw new Error(`Invalid CSV format on row ${index + 1}: category, type, and amount are required`);
    }

    if (!["income", "expense"].includes(type)) {
      throw new Error(`Invalid transaction type on row ${index + 1}: must be income or expense`);
    }

    if (amount <= 0) {
      throw new Error(`Invalid amount on row ${index + 1}: must be greater than 0`);
    }

    if (isNaN(transactionDate.getTime())) {
      throw new Error(`Invalid transaction_date on row ${index + 1}`);
    }

    return {
      category,
      type,
      amount,
      transaction_date: transactionDate.toISOString().split("T")[0],
      notes: tx.notes || null,
    };
  });

  const uniqueCategories = [];
  const categoryKeyMap = {};

  normalizedTransactions.forEach((tx) => {
    const key = `${tx.category.toLowerCase()}|${tx.type}`;
    if (!categoryKeyMap[key]) {
      categoryKeyMap[key] = { name: tx.category, type: tx.type };
      uniqueCategories.push(categoryKeyMap[key]);
    }
  });

  const categoryMap = await findOrCreateCategories(userId, uniqueCategories);

  const formattedTransactions = normalizedTransactions.map((tx) => {
    const key = `${tx.category.toLowerCase()}|${tx.type}`;
    const categoryId = categoryMap[key];

    if (!categoryId) {
      throw new Error(`Unable to resolve category for ${tx.category} (${tx.type})`);
    }

    return {
      category_id: categoryId,
      amount: tx.amount,
      type: tx.type,
      transaction_date: tx.transaction_date,
      notes: tx.notes,
    };
  });

  const result = await bulkCreateTransactions(userId, formattedTransactions);
  return result;
};

module.exports = {
  bulkUploadTransactions,
};