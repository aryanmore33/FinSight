const { parentPort } = require("worker_threads");
const fs = require("fs");
const csv = require("csv-parser");

parentPort.on("message", (filePath) => {
  const transactions = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => {
      transactions.push({
        category_id: row.category_id || null,
        amount: parseFloat(row.amount),
        type: row.type?.toLowerCase(),
        transaction_date: row.transaction_date,
        notes: row.notes || null
      });
    })
    .on("end", () => {
      parentPort.postMessage({
        success: true,
        transactions
      });
    })
    .on("error", (err) => {
      parentPort.postMessage({
        success: false,
        error: err.message
      });
    });
});