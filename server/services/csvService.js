const { Worker } = require("worker_threads");
const path = require("path");

const parseCSVInWorker = (filePath) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      path.join(__dirname, "../workers/transactionCsvWorker.js")
    );

    worker.postMessage(filePath);

    worker.on("message", (data) => {
      if (data.success) {
        resolve(data.transactions);
      } else {
        reject(new Error(data.error));
      }
    });

    worker.on("error", reject);

    worker.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
};

module.exports = {
  parseCSVInWorker
};