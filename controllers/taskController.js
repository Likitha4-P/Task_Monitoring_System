import pool from "../config/db.js";
import assertFields from "../utils/validate.js";
import { sendTaskEmail } from "../utils/mailer.js";
import { sendTaskUpdateEmail } from "../utils/mailer.js";



export async function createTask(req, res) {
  try {
    const { title, description, assigned_to, department, deadline, priority = "Medium", status = "Pending" } = req.body;
    assertFields(req.body, ["title", "assigned_to", "deadline"]);
    const [result] = await pool.query(
      `INSERT INTO tasks (title, description, assigned_to, assigned_by, department, deadline, priority, status, progress)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [title, description || null, assigned_to, req.user.id, department || null, deadline, priority, status]
    );
    const [userRows] = await pool.query("SELECT email FROM users WHERE id = ?", [assigned_to]);
if (userRows.length) {
  const assigneeEmail = userRows[0].email;
  // sendTaskEmail(assigneeEmail, { title, description, deadline, priority }).catch(console.error);
}

    res.status(201).json({ id: result.insertId });
  } catch (e) {
    console.error(e);
    res.status(e.status || 500).json({ message: e.message || "Failed to create task" });
  }
}

export async function deleteTask(req, res) {
  try {
    const { id } = req.params;


    const [rows] = await pool.query("SELECT * FROM tasks WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Task not found" });

    await pool.query("DELETE FROM tasks WHERE id = ?", [id]);
    res.json({ ok: true, message: "Task deleted successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to delete task" });
  }
}


export async function listTasks(req, res) {
  try {
    // Basic filter: if not Admin, show tasks assigned to the user or their department
    let q = "SELECT t.*, u.name as assignee_name FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id";
    const params = [];
    if (req.user.role !== "Admin") {
      q += " WHERE t.assigned_to = ? OR t.department IN (SELECT department FROM users WHERE id = ?)";
      params.push(req.user.id, req.user.id);
    }
    q += " ORDER BY t.id DESC";
    const [rows] = await pool.query(q, params);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to list tasks" });
  }
}

export async function getTask(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM tasks WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Task not found" });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ message: "Failed to get task" });
  }
}


export async function updateTask(req, res) {
  try {
    const { id } = req.params;
    const { title, description, assigned_to, department, deadline, priority, status, progress } = req.body;
    const userRole = req.user.role;
    const userId = req.user.id;

    // ✅ Role-based updates
    if (userRole === "Admin" || userRole === "Department Head") {
      // Full access → update everything
      await pool.query(
        `UPDATE tasks SET
          title = COALESCE(?, title),
          description = COALESCE(?, description),
          assigned_to = COALESCE(?, assigned_to),
          department = COALESCE(?, department),
          deadline = COALESCE(?, deadline),
          priority = COALESCE(?, priority),
          status = COALESCE(?, status)
         WHERE id = ?`,
        [title, description, assigned_to, department, deadline, priority, status, id]
      );
    } 
    else if (userRole === "Professor Incharge") {
      // Can ONLY update status
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      await pool.query(`UPDATE tasks SET status = ? WHERE id = ?`, [status, id]);
    } 
    else if (userRole === "Faculty") {
      // Faculty can ONLY update their own task progress
      const [check] = await pool.query(
        `SELECT assigned_to FROM tasks WHERE id = ?`,
        [id]
      );

      if (!check.length || check[0].assigned_to !== userId) {
        return res.status(403).json({ message: "You cannot update this task" });
      }

      if (progress === undefined) {
        return res.status(400).json({ message: "Progress is required" });
      }

      await pool.query(`UPDATE tasks SET progress = ? WHERE id = ?`, [progress, id]);
    } 
    else {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // ✅ Send email notification when Admin/Dept Head reassigns
    if (assigned_to && (userRole === "Admin" || userRole === "Department Head")) {
      const [userRows] = await pool.query("SELECT email FROM users WHERE id = ?", [assigned_to]);
      if (userRows.length) {
        const assigneeEmail = userRows[0].email;
        // sendTaskUpdateEmail(assigneeEmail, { title, description, deadline, priority }).catch(console.error);
      }
    }

    res.json({ ok: true, message: "Task updated successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to update task" });
  }
}


export async function updateProgress(req, res) {
  try {
    const { id } = req.params;
    const { progress } = req.body;
    if (progress < 0 || progress > 100) return res.status(400).json({ message: "Progress must be 0-100" });
    const [rows] = await pool.query("SELECT assigned_to FROM tasks WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Task not found" });
    const task = rows[0];
    if (task.assigned_to !== req.user.id) {
      return res.status(403).json({ message: "You can only update your own tasks" });
    }
    await pool.query("UPDATE tasks SET progress = ? WHERE id = ?", [progress, id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to update progress" });
  }
}
