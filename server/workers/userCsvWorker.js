const { parentPort } = require("worker_threads");
const fs = require("fs");
const csv = require("csv-parser");

parentPort.on("message", (filePath) => {
  const users = [];

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
      console.log("Parsed user row:", row);

      const name = row.name?.trim();
      const email = row.email?.trim() || null;
      const phone = row.phone?.trim() || null;
      const role = row.role?.trim().toLowerCase();

      // Basic validation: name and role are minimum requirements
      if (!name || !role) return;
      if (!email && !phone) return;

      users.push({
        name,
        email,
        phone,
        role,
      });
    })
    .on("end", () => {
      parentPort.postMessage({
        success: true,
        users,
      });
    })
    .on("error", (err) => {
      console.error("User CSV parse error:", err);
      parentPort.postMessage({
        success: false,
        error: err.message,
      });
    });
});
