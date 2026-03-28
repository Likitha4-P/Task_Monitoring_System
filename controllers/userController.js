import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import assertFields from "../utils/validate.js";

// ---------------- LIST USERS ----------------
export async function listUsers(req, res) {
  console.log(`👥 listUsers called by user ${req.user?.id || "unknown"}`);
  try {
    console.log(`📊 Querying all users`);
    const [rows] = await pool.query(
      `SELECT 
         u.id, 
         u.name, 
         u.email, 
         u.role, 
         u.department_id, 
         d.department_code AS department_code, 
         u.status, 
         u.created_at,
         u.Contact AS contact
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       ORDER BY u.id DESC`
    );
    console.log(`✅ Retrieved ${rows.length} users`);

    res.json(rows);
  } catch (e) {
    console.error("listUsers error:", e);
    res.status(500).json({ message: "Failed to list users" });
  }
}

// ---------------- CREATE USER ----------------
export async function createUser(req, res) {
  console.log(`➕ createUser called by user ${req.user?.id || "unknown"} for ${req.body.name}`);
  try {
    const { name, email, password, role, department_id, contact = null, status = "Active" } = req.body;

    console.log(`🔍 Validating user data: name=${name}, email=${email}, role=${role}`);
    assertFields(req.body, ["name", "email", "password", "role"]);

    console.log(`🔐 Hashing password for user ${name}`);
    const hashed = await bcrypt.hash(password, 10);
    console.log(`🔐 Password hashed`);

    console.log(`💾 Inserting user into database`);
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department_id, status, Contact) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, email, hashed, role, department_id || null, status, contact]
    );
    console.log(`✅ User inserted with id ${result.insertId}`);

    res.status(201).json({ id: result.insertId });

    console.log(`🏢 Fetching department name for notification`);
    const department_name = department_id ? (await pool.query("SELECT department_name FROM departments WHERE id = ?", [department_id]))[0][0].department_name : null;

    console.log(`📢 Creating notification for new user`);
    await pool.query(
`INSERT INTO user_notifications
(user_id,title,message,reference_type,reference_id)
VALUES (?,?,?,?,?)`,
[
 req.user.id,
 "New User Created",
 `User ${name} was added to the ${department_name || 'system'} department.`,
 "User",
 result.insertId
]
);
    console.log(`📢 Notification created`);
  } catch (e) {
    console.error("createUser error:", e);
    res.status(e.status || 500).json({ message: e.message || "Failed to create user" });
  }
}


// ---------------- UPDATE USER ----------------
export async function updateUser(req, res) {
  console.log(`✏️ updateUser called for user ${req.params.id} by user ${req.user?.id || "unknown"}`);
  try {
    const { id } = req.params;
    const { name, email, role, status } = req.body;

    console.log(`💾 Updating user ${id} with name=${name}, email=${email}, role=${role}, status=${status}`);
    const [result] = await pool.query(
      `
      UPDATE users
      SET name = ?, email = ?, role = ?, status = ?
      WHERE id = ?
      `,
      [name, email, role, status || "Active", id]
    );

    if (result.affectedRows === 0) {
      console.warn(`⚠️ User ${id} not found for update`);
      return res.status(404).json({ message: "User not found" });
    }
    console.log(`✅ User ${id} updated successfully`);

    res.json({ message: "User updated successfully" });
  } catch (err) {
    // Duplicate email handling
    if (err.code === "ER_DUP_ENTRY") {
      console.warn(`⚠️ Duplicate email during update`);
      return res.status(409).json({ message: "Email already exists" });
    }

    console.error("updateUser error:", err);
    res.status(500).json({ message: "Failed to update user" });
  }
}

// ---------------- DELETE USER ----------------
export async function deleteUser(req, res) {
  console.log(`🗑️ deleteUser called for user ${req.params.id} by user ${req.user?.id || "unknown"}`);
  const { id } = req.params;
  try {
    console.log(`💾 Deleting user ${id} from database`);
    await pool.query("DELETE FROM users WHERE id = ?", [id]);
    console.log(`✅ User ${id} deleted successfully`);

    res.json({ ok: true });
  } catch (e) {
    console.error("deleteUser error:", e);
    res.status(500).json({ message: "Failed to delete user" });
  }
}

// ---------------- GET USER BY ID ----------------
export async function getUserById(req, res) {
  console.log(`🔍 getUserById called for user ${req.params.id} by user ${req.user?.id || "unknown"}`);
  try {
    const { id } = req.params;

    console.log(`📊 Querying user ${id} details`);
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
      console.warn(`⚠️ User ${id} not found`);
      return res.status(404).json({ message: "User not found" });
    }
    console.log(`✅ User ${id} retrieved: ${rows[0].name}`);

    res.json(rows[0]);
  } catch (err) {
    console.error("getUserById error:", err);
    res.status(500).json({ message: "Server error" });
  }
}