const { Worker } = require("worker_threads");
const path = require("path");

const parseCSVInWorker = (filePath, workerScript = "transactionCsvWorker.js") => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      path.join(__dirname, `../workers/${workerScript}`)
    );

    worker.postMessage(filePath);

    worker.on("message", (data) => {
      if (data.success) {
        // Return whatever data property the worker sent back
        resolve(data.transactions || data.users || data.data);
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