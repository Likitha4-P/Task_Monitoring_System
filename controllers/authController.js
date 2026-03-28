import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { sendEmail } from "../utils/mailer.js";



/**
 * User Login
 */
export const login = async (req, res) => {
  console.log(`🔐 Login attempt for email: ${req.body.email}`);
  try {
    const { email, password } = req.body;
   

    // 1. Find user
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      console.log("User not found", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = rows[0];
    console.log(`✅ User found: ${user.id}, role: ${user.role}`);

    // 2. Compare password with bcrypt
    console.log(`🔑 Verifying password for user ${user.id}`);
    


    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      console.warn(`❌ Password mismatch for user ${user.id}`);
      return res.status(400).json({ message: "Invalid credentials" });
    }
    console.log(`✅ Password verified for user ${user.id}`);

    // 3. Generate JWT
    console.log(`🎫 Generating JWT token for user ${user.id}`);
    const token = jwt.sign(
      { id: user.id, role: user.role, department_id: user.department_id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    console.log(`🎫 JWT token generated for user ${user.id}`);

    // 4. Send response
    console.log(`📤 Sending login response for user ${user.id}`);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,  
        department_id: user.department_id
        
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export async function resetPassword(req, res) {
  console.log(`🔄 Reset password attempt with token`);
  const { token, newPassword } = req.body;

  console.log(`👤 Verifying reset token`);
  const [[user]] = await pool.query(
    `SELECT id FROM users
     WHERE reset_token = ?
     AND reset_token_expiry > NOW()`,
    [token]
  );

  if (!user) {
    console.warn(`❌ Invalid or expired token`);
    return res.status(400).json({ message: "Invalid or expired token" });
  }
  console.log(`✅ Valid token for user ${user.id}`);

  console.log(`🔐 Hashing new password for user ${user.id}`);
  const hashed = await bcrypt.hash(newPassword, 10);
  console.log(`🔐 Password hashed`);

  console.log(`💾 Updating password in database for user ${user.id}`);
  await pool.query(
    `UPDATE users
     SET password_hash=?, reset_token=NULL, reset_token_expiry=NULL
     WHERE id=?`,
    [hashed, user.id]
  );
  console.log(`✅ Password reset successful for user ${user.id}`);

  res.json({ message: "Password reset successful" });
}


import crypto from "crypto";

export async function forgotPassword(req, res) {
  console.log(`📧 Forgot password request for email: ${req.body.email}`);
  const { email } = req.body;

  console.log(`👤 Checking if email is registered: ${email}`);
  const [[user]] = await pool.query(
    "SELECT id FROM users WHERE email = ?",
    [email]
  );

  if (!user) {
    console.warn(`❌ Email not registered: ${email}`);
    return res.status(404).json({ message: "Email not registered" });
  }
  console.log(`✅ User found for email: ${email}, id: ${user.id}`);

  console.log(`🎫 Generating reset token for user ${user.id}`);
  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min
  console.log(`🎫 Token generated, expires at ${expiry}`);

  console.log(`💾 Saving reset token to database for user ${user.id}`);
  await pool.query(
    "UPDATE users SET reset_token=?, reset_token_expiry=? WHERE id=?",
    [token, expiry, user.id]
  );
  console.log(`💾 Token saved`);

  const resetLink = `https://task-monitoring-system-z2lx.onrender.com/reset-password.html?token=${token}`;

  console.log(`📧 Sending reset email to ${email}`);
  await sendEmail(email, "Reset Password", `
    Click the link to reset password:
    ${resetLink}
  `);
  console.log(`📧 Reset email sent to ${email}`);

  res.json({ message: "Reset link sent to email" });
}
