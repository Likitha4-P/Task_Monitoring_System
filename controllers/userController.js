import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import assertFields from "../utils/validate.js";

export async function listUsers(req, res) {
  try {
    const [rows] = await pool.query("SELECT id, name, email, role, department, status, created_at FROM users ORDER BY id DESC");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: "Failed to list users" });
  }
}

export async function createUser(req, res) {
  try {
    const { name, email, password, role, department, status = "Active" } = req.body;
    assertFields(req.body, ["name", "email", "password", "role"]);
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, role, department, status) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, hashed, role, department || null, status]
    );
    res.status(201).json({ id: result.insertId });
  } catch (e) {
    console.error(e);
    res.status(e.status || 500).json({ message: e.message || "Failed to create user" });
  }
}

export async function updateUser(req, res) {
  const { id } = req.params;
  const { name, email, password, role, department, status } = req.body;
  try {
    let q = "UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), role = COALESCE(?, role), department = COALESCE(?, department), status = COALESCE(?, status)";
    const params = [name, email, role, department, status];
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      q += ", password = ?";
      params.push(hashed);
    }
    q += " WHERE id = ?";
    params.push(id);
    await pool.query(q, params);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to update user" });
  }
}

export async function deleteUser(req, res) {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "Failed to delete user" });
  }
}
export async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT id, name, email, role, department, status FROM users WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching user by ID:", err);
    res.status(500).json({ message: "Server error" });
  }
}

