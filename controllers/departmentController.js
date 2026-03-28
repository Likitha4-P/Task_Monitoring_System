import pool from "../config/db.js";
import { createNotification } from "../utils/notifyHelper.js";

// GET all departments
export async function getDepartments(req, res) {
  console.log(`📋 getDepartments called by user ${req.user?.id}`);
  try {
    console.log(`📊 Querying all departments`);
    const [rows] = await pool.query("SELECT * FROM departments");
    console.log(`✅ Retrieved ${rows.length} departments`);
    res.json(rows);
  } catch (e) {
    console.error("getDepartments error:", e);
    res.status(500).json({ message: "Failed to list departments" });
  }
}
// ADD department
export async function addDepartment(req, res) {
  console.log(`➕ addDepartment called by user ${req.user?.id} for ${req.body.department_name}`);
  try {
    const { department_code, department_name, is_active } = req.body;

    console.log(`🔍 Validating department data: code=${department_code}, name=${department_name}`);
    if (!department_code || !department_name) {
      console.warn(`⚠️ Missing required fields`);
      return res.status(400).json({
        message: "department_code and department_name are required"
      });
    }

    console.log(`💾 Inserting department into database`);
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
    console.log(`✅ Department inserted with id ${result.insertId}`);

    res.status(201).json({
      message: "Department added successfully",
      departmentId: result.insertId
    });

    console.log(`📢 Creating notification for new department`);
    const adminId = (await pool.query("SELECT id FROM users WHERE role = 'Admin' LIMIT 1"))[0][0].id;
    await createNotification(
      adminId,
      "Department Added",
      `${department_name} has been added to the system.`,
      "Department",
      result.insertId
    );
    console.log(`📢 Notification created`);
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      console.warn(`⚠️ Duplicate department code or name`);
      return res.status(409).json({
        message: "Department code or name already exists"
      });
    }

    console.error("addDepartment error:", e);
    res.status(500).json({
      message: "Failed to add department"
    });
  }
}

export async function getDepartmentStats(req, res) {
  console.log(`📊 getDepartmentStats called for department ${req.params.id} by user ${req.user?.id}`);
  try {
    const { id } = req.params;

    console.log(`📈 Calculating stats for department ${id}`);
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
    console.log(`✅ Stats calculated: ${JSON.stringify(rows[0])}`);

    res.json(rows[0]);
  } catch (err) {
    console.error("getDepartmentStats error:", err);
    res.status(500).json({ message: "Failed to load department stats" });
  }
}

export async function getDepartmentUsers(req, res) {
  console.log(`👥 getDepartmentUsers called for department ${req.params.id} by user ${req.user?.id}`);
  try {
    const { id } = req.params;

    console.log(`📋 Querying users for department ${id}`);
    const [users] = await pool.query(
      `
      SELECT id, name, email, role, status,contact
      FROM users
      WHERE department_id = ? AND status = 'Active'
      ORDER BY role
      `,
      [id]
    );
    console.log(`✅ Retrieved ${users.length} users for department ${id}`);

    res.json(users);
  } catch (err) {
    console.error("getDepartmentUsers error:", err);
    res.status(500).json({ message: "Failed to load department users" });
  }
}


// DELETE DEPARTMENT
export const deleteDepartment = async (req, res) => {
  console.log(`🗑️ deleteDepartment called for department ${req.params.id} by user ${req.user?.id}`);
  try {
    const { id } = req.params;

    console.log(`💾 Deleting department ${id} from database`);
    const [result] = await pool.query(
      "DELETE FROM departments WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      console.warn(`⚠️ Department ${id} not found`);
      return res.status(404).json({ message: "Department not found" });
    }
    console.log(`✅ Department ${id} deleted successfully`);

    res.json({ message: "Department deleted successfully" });

  } catch (err) {
    console.error("deleteDepartment error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// UPDATE / EDIT DEPARTMENT
export const updateDepartment = async (req, res) => {
  console.log(`✏️ updateDepartment called for department ${req.params.id} by user ${req.user?.id}`);
  try {

    const { id } = req.params;
    const { department_code, department_name } = req.body;

    console.log(`💾 Updating department ${id} with code=${department_code}, name=${department_name}`);
    const [result] = await pool.query(
      `UPDATE departments
       SET department_code = ?, department_name = ?
       WHERE id = ?`,
      [department_code, department_name, id]
    );

    if (result.affectedRows === 0) {
      console.warn(`⚠️ Department ${id} not found for update`);
      return res.status(404).json({ message: "Department not found" });
    }
    console.log(`✅ Department ${id} updated successfully`);

    res.json({ message: "Department updated successfully" });

  } catch (err) {

    if (err.code === "ER_DUP_ENTRY") {
      console.warn(`⚠️ Duplicate department code or name during update`);
      return res.status(409).json({
        message: "Department code or name already exists"
      });
    }

    console.error("updateDepartment error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
