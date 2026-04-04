const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Optional: verify once (does NOT block server)
transporter.verify((error) => {
  if (error) {
    console.error("❌ Gmail configuration failed:", error.message);
  } else {
    console.log("✅ Gmail ready to send alert emails");
  }
});

/**
 * Send budget exceeded alert email
 * @param {string} email - User's email
 * @param {string} categoryName - Category name (e.g., "Food")
 * @param {number} limitAmount - Budget limit
 * @param {number} spentAmount - Amount spent
 * @param {number} percentage - Percentage spent
 */
const sendBudgetExceededAlert = async (
  email,
  categoryName,
  limitAmount,
  spentAmount,
  percentage
) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #d32f2f; margin: 0; display: flex; align-items: center;">
          ⚠️ Budget Exceeded Alert
        </h2>
      </div>

      <div style="background-color: #fff3cd; border-left: 4px solid #d32f2f; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
        <p style="margin: 0; color: #d32f2f; font-weight: bold;">
          Your "${categoryName}" budget has been exceeded!
        </p>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #333; margin-top: 0;">Budget Details:</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px 0; color: #666;">Budget Limit:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #333;">₹${limitAmount.toFixed(
              2
            )}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px 0; color: #666;">Amount Spent:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #d32f2f;">₹${spentAmount.toFixed(
              2
            )}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px 0; color: #666;">Spent Percentage:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #d32f2f;">${percentage.toFixed(
              1
            )}%</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #666;">Exceeded By:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #d32f2f;">₹${(
              spentAmount - limitAmount
            ).toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #2e7d32; margin-top: 0;">💡 What You Can Do:</h3>
        <ul style="color: #555; padding-left: 20px;">
          <li>Review your recent transactions in the "${categoryName}" category</li>
          <li>Adjust your budget limit for the next period</li>
          <li>Plan your spending more carefully going forward</li>
        </ul>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
        <p style="color: #999; font-size: 12px; margin: 0;">
          This is an automated alert from FinSight. Please do not reply to this email.
        </p>
        <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
          © 2024 FinSight. All rights reserved.
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `FinSight Alerts <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `⚠️ Budget Alert: ${categoryName} Budget Exceeded!`,
      html,
    });
    console.log(
      `✅ Budget exceeded alert sent to ${email} for ${categoryName}`
    );
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("❌ Alert email send failed:", error.message);
    throw new Error("Alert email service failed");
  }
};

/**
 * Send budget warning alert email (80%+ of budget spent)
 * @param {string} email - User's email
 * @param {string} categoryName - Category name (e.g., "Food")
 * @param {number} limitAmount - Budget limit
 * @param {number} spentAmount - Amount spent
 * @param {number} percentage - Percentage spent
 * @param {number} remaining - Remaining amount
 */
const sendBudgetWarningAlert = async (
  email,
  categoryName,
  limitAmount,
  spentAmount,
  percentage,
  remaining
) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #f57c00; margin: 0; display: flex; align-items: center;">
          🔔 Budget Warning Alert
        </h2>
      </div>

      <div style="background-color: #fff3cd; border-left: 4px solid #f57c00; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
        <p style="margin: 0; color: #f57c00; font-weight: bold;">
          Your "${categoryName}" budget is running low!
        </p>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #333; margin-top: 0;">Budget Status:</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px 0; color: #666;">Budget Limit:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #333;">₹${limitAmount.toFixed(
              2
            )}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px 0; color: #666;">Amount Spent:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #f57c00;">₹${spentAmount.toFixed(
              2
            )}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px 0; color: #666;">Spent Percentage:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #f57c00;">${percentage.toFixed(
              1
            )}%</td>
          </tr>
          <tr style="background-color: #e8f5e9;">
            <td style="padding: 10px 0; color: #2e7d32; font-weight: bold;">Remaining Budget:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #2e7d32;">₹${remaining.toFixed(
              2
            )}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #2e7d32; margin-top: 0;">💡 Recommendations:</h3>
        <ul style="color: #555; padding-left: 20px;">
          <li>You have only ₹${remaining.toFixed(2)} remaining in this budget</li>
          <li>Be careful with your ${categoryName} spending for the rest of the month</li>
          <li>Track your expenses closely to avoid exceeding the limit</li>
        </ul>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
        <p style="color: #999; font-size: 12px; margin: 0;">
          This is an automated alert from FinSight. Please do not reply to this email.
        </p>
        <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
          © 2024 FinSight. All rights reserved.
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `FinSight Alerts <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🔔 Budget Warning: ${categoryName} Budget at ${percentage.toFixed(1)}%`,
      html,
    });
    console.log(
      `✅ Budget warning alert sent to ${email} for ${categoryName}`
    );
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("❌ Warning email send failed:", error.message);
    throw new Error("Warning email service failed");
  }
};

/**
 * Send budget reset alert email (new month/week started)
 * @param {string} email - User's email
 * @param {string} categoryName - Category name
 * @param {number} limitAmount - Budget limit
 * @param {string} period - Period (monthly/weekly)
 */
const sendBudgetResetAlert = async (
  email,
  categoryName,
  limitAmount,
  period
) => {
  const periodText = period === "monthly" ? "Monthly" : "Weekly";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #2e7d32; margin: 0; display: flex; align-items: center;">
          ✨ Budget Reset Alert
        </h2>
      </div>

      <div style="background-color: #e8f5e9; border-left: 4px solid #2e7d32; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
        <p style="margin: 0; color: #2e7d32; font-weight: bold;">
          Your "${categoryName}" budget has been reset for the new ${periodText} period!
        </p>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #333; margin-top: 0;">New Budget Details:</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px 0; color: #666;">Category:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #333;">${categoryName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px 0; color: #666;">New Budget Limit:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #2e7d32;">₹${limitAmount.toFixed(
              2
            )}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px 0; color: #666;">Period:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #333;">${periodText}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #666;">Amount Spent:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #333;">₹0.00</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #2e7d32; margin-top: 0;">💡 Start Fresh:</h3>
        <ul style="color: #555; padding-left: 20px;">
          <li>Your budget counter has been reset to ₹0 spent</li>
          <li>Track your expenses throughout the ${periodText.toLowerCase()} period</li>
          <li>Stay within your ₹${limitAmount.toFixed(2)} budget limit</li>
        </ul>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
        <p style="color: #999; font-size: 12px; margin: 0;">
          This is an automated alert from FinSight. Please do not reply to this email.
        </p>
        <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
          © 2024 FinSight. All rights reserved.
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `FinSight Alerts <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `✨ ${periodText} Budget Reset: ${categoryName}`,
      html,
    });
    console.log(
      `✅ Budget reset alert sent to ${email} for ${categoryName}`
    );
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("❌ Reset email send failed:", error.message);
    throw new Error("Reset email service failed");
  }
};

/**
 * Send unusual spending alert email
 * @param {string} email - User's email
 * @param {number} currentSpending - Current month spending
 * @param {number} averageSpending - Average monthly spending
 * @param {number} percentageIncrease - Percentage increase
 */
const sendUnusualSpendingAlert = async (
  email,
  currentSpending,
  averageSpending,
  percentageIncrease
) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #ff6f00; margin: 0;">
          🔍 Unusual Spending Alert
        </h2>
      </div>

      <div style="background-color: #fff3e0; border-left: 4px solid #ff6f00; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
        <p style="margin: 0; color: #ff6f00; font-weight: bold;">
          Your spending pattern has changed significantly this month!
        </p>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #333; margin-top: 0;">Spending Analysis:</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px 0; color: #666;">Average Monthly Spending:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #333;">₹${averageSpending.toFixed(2)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px 0; color: #666;">This Month's Spending:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #ff6f00;">₹${currentSpending.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #666;">Increase:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #ff6f00;">${percentageIncrease.toFixed(1)}%</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #ff6f00; margin-top: 0;">📊 What This Means:</h3>
        <p style="color: #555; margin: 0;">
          Your spending is ${percentageIncrease.toFixed(1)}% higher than your usual pattern. 
          This could be due to one-time expenses or a change in your spending habits.
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
        <p style="color: #999; font-size: 12px; margin: 0;">
          This is an automated alert from FinSight. Please do not reply to this email.
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `FinSight Alerts <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🔍 Unusual Spending Alert: ${percentageIncrease.toFixed(1)}% Increase Detected`,
      html,
    });
    console.log(`✅ Unusual spending alert sent to ${email}`);
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("❌ Unusual spending email send failed:", error.message);
    throw new Error("Unusual spending email service failed");
  }
};

/**
 * Send high transaction alert email
 * @param {string} email - User's email
 * @param {string} categoryName - Category name
 * @param {number} transactionAmount - Transaction amount
 * @param {number} averageTransaction - Average transaction in category
 */
const sendHighTransactionAlert = async (
  email,
  categoryName,
  transactionAmount,
  averageTransaction
) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #c62828; margin: 0;">
          💸 High Transaction Alert
        </h2>
      </div>

      <div style="background-color: #ffebee; border-left: 4px solid #c62828; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
        <p style="margin: 0; color: #c62828; font-weight: bold;">
          A large transaction was detected in your ${categoryName} category!
        </p>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #333; margin-top: 0;">Transaction Details:</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px 0; color: #666;">Category:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #333;">${categoryName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px 0; color: #666;">Transaction Amount:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #c62828;">₹${transactionAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #666;">Your Average Transaction:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #333;">₹${averageTransaction.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #ffebee; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #c62828; margin-top: 0;">⚠️ Note:</h3>
        <p style="color: #555; margin: 0;">
          This transaction is ${((transactionAmount / averageTransaction - 1) * 100).toFixed(0)}% higher than your usual ${categoryName} spending.
          Please verify this transaction is legitimate.
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
        <p style="color: #999; font-size: 12px; margin: 0;">
          This is an automated alert from FinSight. Please do not reply to this email.
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `FinSight Alerts <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `💸 High Transaction Alert: ₹${transactionAmount.toFixed(2)} in ${categoryName}`,
      html,
    });
    console.log(`✅ High transaction alert sent to ${email}`);
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("❌ High transaction email send failed:", error.message);
    throw new Error("High transaction email service failed");
  }
};

/**
 * Send OTP email (for authentication)
 * @param {string} email - User's email
 * @param {string} otp - OTP code
 */
const sendEmail = async (email, otp) => {
  const html = `
    <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #1976d2; margin: 0;">🔐 FinSight Verification</h2>
      </div>

      <p style="font-size: 16px; color: #333;">Your OTP verification code is:</p>
      
      <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <h1 style="color: #1976d2; letter-spacing: 5px; margin: 0;">${otp}</h1>
      </div>

      <p style="color: #666; font-size: 14px;">
        This OTP is valid for <strong>10 minutes</strong>.
      </p>

      <p style="color: #d32f2f; font-weight: bold; font-size: 14px;">
        ⚠️ Do not share this code with anyone. FinSight support will never ask for your OTP.
      </p>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
        <p style="color: #999; font-size: 12px; margin: 0;">
          This is an automated message from FinSight. Please do not reply to this email.
        </p>
        <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
          © 2024 FinSight. All rights reserved.
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `FinSight <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔐 FinSight OTP Verification",
      html
    });
    console.log(`✅ OTP email sent to ${email}`);
    return { success: true, message: "OTP sent successfully" };
  } catch (error) {
    console.error("❌ OTP email send failed:", error.message);
    throw new Error("Email service failed");
  }
};

/**
 * Send Admin Approval Notification
 * @param {string} adminEmail - Existing admin's email
 * @param {object} requester - New admin requester details
 */
const sendAdminApprovalNotification = async (adminEmail, requester) => {
  const html = `
    <div style="font-family: Arial; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #f4b400; padding: 20px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0;">🛡️ New Admin Registration Request</h2>
      </div>

      <div style="padding: 20px; color: #333;">
        <p style="font-size: 16px;">Hello Admin,</p>
        <p style="font-size: 14px;">A new user has requested <strong>Administrator</strong> access to FinSight. Please review the details below and approve or reject the request from your dashboard.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Name:</td>
              <td style="padding: 8px 0; color: #333;">${requester.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Email:</td>
              <td style="padding: 8px 0; color: #333;">${requester.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Phone:</td>
              <td style="padding: 8px 0; color: #333;">${requester.phone}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Requested At:</td>
              <td style="padding: 8px 0; color: #333;">${new Date().toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <p style="color: #666; font-size: 12px; font-style: italic;">Note: This user will not be able to log in until they are approved by an existing administrator.</p>
      </div>

      <div style="background-color: #f1f3f4; padding: 15px; text-align: center; border-top: 1px solid #e0e0e0;">
        <p style="color: #999; font-size: 12px; margin: 0;">© 2024 FinSight. Security & Administration.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `FinSight Account Security <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: "🛡️ Action Required: New Admin Registration Request",
      html
    });
    console.log(`✅ Admin approval notification sent to ${adminEmail}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Admin notification failed:", error.message);
    throw new Error("Admin notification service failed");
  }
};

module.exports = {
  sendBudgetExceededAlert,
  sendBudgetWarningAlert,
  sendBudgetResetAlert,
  sendUnusualSpendingAlert,
  sendHighTransactionAlert,
  sendEmail,
  sendAdminApprovalNotification,
};