import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { sendEmail } from "../utils/mailer.js";



/**
 * User Login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body)

    // 1. Find user
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      console.log("User not found", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = rows[0];

    // 2. Compare password with bcrypt
    


    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 3. Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, department_id: user.department_id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 4. Send response
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
  const { token, newPassword } = req.body;

  const [[user]] = await pool.query(
    `SELECT id FROM users
     WHERE reset_token = ?
     AND reset_token_expiry > NOW()`,
    [token]
  );

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  const hashed = await bcrypt.hash(newPassword, 10);

  await pool.query(
    `UPDATE users
     SET password_hash=?, reset_token=NULL, reset_token_expiry=NULL
     WHERE id=?`,
    [hashed, user.id]
  );

  res.json({ message: "Password reset successful" });
}


import crypto from "crypto";

export async function forgotPassword(req, res) {
  const { email } = req.body;

  const [[user]] = await pool.query(
    "SELECT id FROM users WHERE email = ?",
    [email]
  );

  if (!user) {
    return res.status(404).json({ message: "Email not registered" });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min

  await pool.query(
    "UPDATE users SET reset_token=?, reset_token_expiry=? WHERE id=?",
    [token, expiry, user.id]
  );

  const resetLink = `http://localhost:5000/reset-password.html?token=${token}`;

  await sendEmail(email, "Reset Password", `
    Click the link to reset password:
    ${resetLink}
  `);

  res.json({ message: "Reset link sent to email" });
}
