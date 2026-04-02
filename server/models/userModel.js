const pool = require("../config/pool");


// ================= CREATE USER =================
const createUser = async (name, email, passwordHash, role, phone) => {
  try {
    const query = `
      INSERT INTO users 
      (name, email, password_hash, role, phone) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id, name, email, role, phone, created_at;
    `;

    const result = await pool.query(query, [
      name,
      email,
      passwordHash,
      role,
      phone,
    ]);

    return result.rows[0];
  } catch (err) {
    console.error("Error creating user:", err);
    throw err;
  }
};



// ================= STORE OTP =================
const storeOtp = async ({ email, phone, otp, purpose, expiresAt }) => {
  const query = `
    INSERT INTO otp_verifications
    (email, phone, otp_code, purpose, expires_at)
    VALUES ($1, $2, $3, $4, $5)
  `;

  await pool.query(query, [
    email,
    phone,
    otp,
    purpose,
    expiresAt
  ]);
};



// ================= FIND OTP EMAIL =================
const findOtpByEmail = async (email) => {
  const query = `
    SELECT *
    FROM otp_verifications
    WHERE email = $1
    AND is_used = false
    ORDER BY created_at DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [email]);
  return result.rows[0];
};



// ================= FIND OTP PHONE =================
const findOtpByPhone = async (phone) => {
  const query = `
    SELECT *
    FROM otp_verifications
    WHERE phone = $1
    AND is_used = false
    ORDER BY created_at DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [phone]);
  return result.rows[0];
};



// ================= MARK OTP USED =================
const markOtpUsed = async (id) => {
  const query = `
    UPDATE otp_verifications
    SET is_used = true
    WHERE id = $1
  `;

  await pool.query(query, [id]);
};



// ================= VERIFY PHONE =================
const verifyUserPhone = async (phone) => {
  const query = `
    UPDATE users
    SET 
      is_phone_verified = TRUE,
      last_login_at = now()
    WHERE phone = $1
    RETURNING id, name, email, role, phone, is_phone_verified;
  `;

  const result = await pool.query(query, [phone]);
  return result.rows[0];
};



// ================= VERIFY EMAIL =================
const verifyUserEmail = async (email) => {
  const query = `
    UPDATE users
    SET 
      is_email_verified = TRUE,
      last_login_at = now()
    WHERE email = $1
    RETURNING id, name, email, role, phone, is_email_verified;
  `;

  const result = await pool.query(query, [email]);
  return result.rows[0];
};



// ================= FIND USER BY ID =================
const findUserById = async (id) => {
  const query = `SELECT * FROM users WHERE id = $1`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};



// ================= FIND USER BY EMAIL =================
const findUserByEmail = async (email) => {
  const query = `SELECT * FROM users WHERE email = $1`;
  const result = await pool.query(query, [email]);
  return result.rows[0];
};



// ================= FIND USER BY PHONE =================
const findUserByPhone = async (phone) => {
  const query = `SELECT * FROM users WHERE phone = $1`;
  const result = await pool.query(query, [phone]);
  return result.rows[0];
};



module.exports = {
  createUser,
  storeOtp,
  findOtpByEmail,
  findOtpByPhone,
  markOtpUsed,
  verifyUserPhone,
  verifyUserEmail,
  findUserById,
  findUserByEmail,
  findUserByPhone,
};