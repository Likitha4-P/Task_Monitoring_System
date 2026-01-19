import pool from "../config/db.js";
// GET all departments
// exports.getDepartments = (req, res) => {
//   const sql = "SELECT * FROM departments";

//   pool.query(sql, (err, results) => {
//     if (err) return res.status(500).json(err);
//     res.json(results);
//   });
// };
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
