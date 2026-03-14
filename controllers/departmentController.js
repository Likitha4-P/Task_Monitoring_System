import pool from "../config/db.js";
import { createNotification } from "../utils/notifyHelper.js";

// GET all departments
export async function getDepartments(req, res) {
  try {
    const [rows] = await pool.query("SELECT * FROM departments");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: "Failed to list departments" });
  }
}
// ADD department
export async function addDepartment(req, res) {
  try {
    const { department_code, department_name, is_active } = req.body;

    if (!department_code || !department_name) {
      return res.status(400).json({
        message: "department_code and department_name are required"
      });
    }

    const [result] = await pool.query(
      `INSERT INTO departments 
       (department_code, department_name, is_active)
       VALUES (?, ?, ?)`,
      [
        department_code,
        department_name,
        is_active ?? "Yes"
      ]
    );

    res.status(201).json({
      message: "Department added successfully",
      departmentId: result.insertId
    });
    const adminId = (await pool.query("SELECT id FROM users WHERE role = 'Admin' LIMIT 1"))[0][0].id;
await createNotification(
  adminId,
  "Department Added",
  `${department_name} has been added to the system.`,
  "Department",
  result.insertId
)
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Department code or name already exists"
      });
    }

    res.status(500).json({
      message: "Failed to add department"
    });
  }
}

export async function getDepartmentStats(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT
        COUNT(*) AS total,
        SUM(status = 'Pending') AS pending,
        SUM(status = 'In Progress') AS inProgress,
        SUM(status IN ('Submitted','Verified','Closed')) AS completed
      FROM tasks
      WHERE department_id = ?
      `,
      [id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load department stats" });
  }
}

export async function getDepartmentUsers(req, res) {
  try {
    const { id } = req.params;

    const [users] = await pool.query(
      `
      SELECT id, name, email, role, status,contact
      FROM users
      WHERE department_id = ? AND status = 'Active'
      ORDER BY role
      `,
      [id]
    );

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load department users" });
  }
}


// DELETE DEPARTMENT
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      "DELETE FROM departments WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.json({ message: "Department deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// UPDATE / EDIT DEPARTMENT
export const updateDepartment = async (req, res) => {
  try {

    const { id } = req.params;
    const { department_code, department_name } = req.body;

    const [result] = await pool.query(
      `UPDATE departments
       SET department_code = ?, department_name = ?
       WHERE id = ?`,
      [department_code, department_name, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.json({ message: "Department updated successfully" });

  } catch (err) {

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Department code or name already exists"
      });
    }

    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
