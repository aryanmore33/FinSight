const { parseCSVInWorker } = require("./csvService");
const { bulkCreateTransactions } = require("../models/transactionModel");

const bulkUploadTransactions = async (userId, filePath) => {
  // parse CSV using worker
  const transactions = await parseCSVInWorker(filePath);

  if (!transactions.length) {
    throw new Error("No transactions found in CSV");
  }

  // insert into DB
  const result = await bulkCreateTransactions(userId, transactions);

  return result;
};

module.exports = {
  bulkUploadTransactions
};