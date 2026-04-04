const { parentPort } = require("worker_threads");
const fs = require("fs");
const csv = require("csv-parser");

parentPort.on("message", (filePath) => {
  const transactions = [];

  fs.createReadStream(filePath)
    .pipe(
      csv({
        separator: ',',
        skipEmptyLines: true,
        mapHeaders: ({ header }) =>
          header.replace(/^\uFEFF/, "").trim().toLowerCase(),
      })
    )
    .on("data", (row) => {
      console.log("Parsed row:", row);

      const category = row.category?.trim();
      const amount = parseFloat(row.amount);
      const type = row.type?.trim().toLowerCase();
      const transaction_date = row.transaction_date;
      const notes = row.notes || null;

      // Skip empty rows
      if (!category && !amount && !type) return;

      transactions.push({
        category,
        amount,
        type,
        transaction_date,
        notes,
      });
    })
    .on("end", () => {
      parentPort.postMessage({
        success: true,
        transactions,
      });
    })
    .on("error", (err) => {
      console.error("CSV parse error:", err);
      parentPort.postMessage({
        success: false,
        error: err.message,
      });
    });
});