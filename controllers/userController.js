import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import assertFields from "../utils/validate.js";

// ---------------- LIST USERS ----------------
export async function listUsers(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT 
         u.id, 
         u.name, 
         u.email, 
         u.role, 
         u.department_id, 
         d.name AS department_name, 
         u.status, 
         u.created_at,
         u.Contact AS contact
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       ORDER BY u.id DESC`
    );
    console.log("USERS FROM DB:", users);

    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: "Failed to list users" });
  }
}

// ---------------- CREATE USER ----------------
export async function createUser(req, res) {
  try {
    const { name, email, password, role, department_id, contact = null, status = "Active" } = req.body;
    assertFields(req.body, ["name", "email", "password", "role"]);

    const hashed = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department_id, status, Contact) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, email, hashed, role, department_id || null, status, contact]
    );

    res.status(201).json({ id: result.insertId });
  } catch (e) {
    console.error(e);
    res.status(e.status || 500).json({ message: e.message || "Failed to create user" });
  }
}


// ---------------- UPDATE USER ----------------
export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, email, role, status } = req.body;

    const [result] = await pool.query(
      `
      UPDATE users
      SET name = ?, email = ?, role = ?, status = ?
      WHERE id = ?
      `,
      [name, email, role, status || "Active", id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated successfully" });
  } catch (err) {
    // Duplicate email handling
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Email already exists" });
    }

    console.error(err);
    res.status(500).json({ message: "Failed to update user" });
  }
}

// ---------------- DELETE USER ----------------
export async function deleteUser(req, res) {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "Failed to delete user" });
  }
}

// ---------------- GET USER BY ID ----------------
export async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT 
         u.id, 
         u.name, 
         u.email, 
         u.role, 
         u.department_id, 
         d.department_name AS department_name, 
         u.status
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching user by ID:", err);
    res.status(500).json({ message: "Server error" });
  }
}