const pool = require("../config/pool");


// ================= FIND ROLE BY NAME =================
const findRoleByName = async (roleName) => {
  const query = `
    SELECT id, name
    FROM roles
    WHERE name = $1
  `;

  const result = await pool.query(query, [roleName]);
  return result.rows[0];
};


// ================= CREATE USER =================
const createUser = async (name, email, passwordHash, roleId, phone) => {
  try {
    const query = `
      INSERT INTO users 
      (name, email, password_hash, role_id, phone) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id, name, email, role_id, phone, created_at;
    `;

    const result = await pool.query(query, [
      name,
      email,
      passwordHash,
      roleId,
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
    RETURNING id, name, email, role_id, phone, is_phone_verified;
  `;

  const result = await pool.query(query, [phone]);

  if (!result.rows[0]) return null;

  return findUserById(result.rows[0].id);
};



// ================= VERIFY EMAIL =================
const verifyUserEmail = async (email) => {
  const query = `
    UPDATE users
    SET 
      is_email_verified = TRUE,
      last_login_at = now()
    WHERE email = $1
    RETURNING id;
  `;

  const result = await pool.query(query, [email]);

  if (!result.rows[0]) return null;

  return findUserById(result.rows[0].id);
};



// ================= FIND USER BY ID =================
const findUserById = async (id) => {
  const query = `
    SELECT 
      u.id,
      u.name,
      u.email,
      u.phone,
      u.created_at,
      r.name as role
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.id = $1
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0];
};



// ================= UPDATE PROFILE =================
const updateUserProfile = async (id, { name, email, phone }) => {
  try {
    const query = `
      UPDATE users
      SET name = $1, email = $2, phone = $3
      WHERE id = $4
      RETURNING id, name, email, phone;
    `;

    const result = await pool.query(query, [
      name,
      email,
      phone,
      id
    ]);

    return findUserById(result.rows[0].id);

  } catch (err) {
    console.error("Error updating user profile:", err);
    throw err;
  }
};



// ================= FIND USER BY EMAIL =================
const findUserByEmail = async (email) => {
  const query = `
    SELECT 
      u.*,
      r.name as role
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.email = $1
  `;

  const result = await pool.query(query, [email]);
  return result.rows[0];
};



// ================= FIND USER BY PHONE =================
const findUserByPhone = async (phone) => {
  const query = `
    SELECT 
      u.*,
      r.name as role
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.phone = $1
  `;

  const result = await pool.query(query, [phone]);
  return result.rows[0];
};



module.exports = {
  createUser,
  findRoleByName,
  storeOtp,
  findOtpByEmail,
  findOtpByPhone,
  markOtpUsed,
  verifyUserPhone,
  verifyUserEmail,
  findUserById,
  findUserByEmail,
  findUserByPhone,
  updateUserProfile,
};