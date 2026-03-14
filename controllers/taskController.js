import pool from "../config/db.js";
import assertFields from "../utils/validate.js";
import { sendTaskEmail, sendTaskUpdateEmail } from "../utils/mailer.js";
import { createNotification } from "../utils/notifyHelper.js";


// ---------------- CREATE TASK ----------------
export async function createTask(req, res) {
  try {
    const { 
      title, 
      description, 
      assigned_to, 
      assigned_by,
      department_id, 
      deliverables,
      deadline, 
      priority = "Medium", 
      status = "Pending" 
    } = req.body;

    assertFields(req.body, ["title", "assigned_to", "deadline"]);

    const [result] = await pool.query(
      `INSERT INTO tasks 
        (title, description, assigned_to, assigned_by, department_id, deliverables, deadline, priority, status, progress) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, 
        description || null, 
        assigned_to, 
        assigned_by, 
        department_id || null, 
        deliverables || null,
        deadline, 
        priority, 
        status,
        0
      ]
    );
     res.status(201).json({ id: result.insertId });
      const taskId = result.insertId;
      await createNotification(
 assigned_to,
 "New Task Assigned",
 `You have been assigned task: ${title} with deadline ${new Date(deadline).toLocaleDateString()}.`,
 "Task",
 taskId
);

    const [userRows] = await pool.query("SELECT email FROM users WHERE id = ?", [assigned_to]);
    if (userRows.length) {
      const assigneeEmail = userRows[0].email;
      sendTaskEmail(assigneeEmail, { title, description, deadline, priority, deliverables }).catch(console.error);
    }

   
  } catch (e) {
    console.error(e);
    res.status(e.status || 500).json({ message: e.message || "Failed to create task" });
  }
}

// ---------------- LIST TASKS ----------------
export async function listTasks(req, res) {
  try {
    let q = `
      SELECT 
        t.*, 
        u.name AS assignee_name, 
        ab.name AS assigner_name, 
        d.department_name AS department_name,
        CASE 
          WHEN EXISTS (
            SELECT 1 
            FROM task_deliverables td 
            WHERE td.task_id = t.id
          ) THEN TRUE 
          ELSE FALSE 
        END AS has_deliverables,
        td.id AS deliverable_id
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users ab ON t.assigned_by = ab.id
      LEFT JOIN departments d ON t.department_id = d.id
      LEFT JOIN task_deliverables td ON t.id = td.task_id
    `;
    const params = [];

    if (req.user.role !== "Admin") {
      q += ` WHERE t.assigned_to = ? 
             OR t.department_id IN (SELECT department_id FROM users WHERE id = ?)`;
      params.push(req.user.id, req.user.id);
    }

    q += ` ORDER BY t.id DESC`;

    const [rows] = await pool.query(q, params);
   
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to list tasks" });
  }
}


// ---------------- GET TASK ----------------
export async function getTask(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT 
         t.*, 
         u.name AS assignee_name, 
         ab.name AS assigner_name, 
         d.department_name AS department_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN users ab ON t.assigned_by = ab.id
       LEFT JOIN departments d ON t.department_id = d.id
       WHERE t.id = ?`,
      [id]
    );

    if (!rows.length) return res.status(404).json({ message: "Task not found" });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ message: "Failed to get task" });
  }
}

// ---------------- UPDATE TASK ----------------
export async function updateTask(req, res) {
  try {

    const { id } = req.params;

    const {
      title,
      description,
      assigned_to,
      deadline,
      priority,
      status,
      deliverables
    } = req.body;

    const userRole = req.user.role;

    // Get current task info
    const [taskRows] = await pool.query(
      `SELECT assigned_to, title FROM tasks WHERE id = ?`,
      [id]
    );

    if (!taskRows.length) {
      return res.status(404).json({ message: "Task not found" });
    }

    const oldTask = taskRows[0];

    // Update task
    await pool.query(
      `UPDATE tasks SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        assigned_to = COALESCE(?, assigned_to),
        deliverables = COALESCE(?, deliverables),
        deadline = COALESCE(?, deadline),
        priority = COALESCE(?, priority),
        status = COALESCE(?, status)
      WHERE id = ?`,
      [title, description, assigned_to, deliverables, deadline, priority, status, id]
    );

    const newAssignee = assigned_to || oldTask.assigned_to;

 

    // -------- Notification when status changed --------
    if (status) {
      await createNotification(
        newAssignee,
        "Task Status Updated",
        `Task "${title || oldTask.title}" status changed to ${status}`,
        "Task",
        id
      );
    } else {
         // -------- Notification when task updated --------
    await createNotification(
      newAssignee,
      "Task Updated",
      `Task "${title || oldTask.title}" was updated`,
      "Task",
      id
    );
    }

    // -------- Email notification --------
   
    if (assigned_to && (userRole === "Admin" || userRole === "Professor Incharge")) {

      const [userRows] = await pool.query(
        "SELECT email FROM users WHERE id = ?",
        [assigned_to]
      );



      if (userRows.length) {

        const assigneeEmail = userRows[0].email;
        console.log("Sending update email to:", assigneeEmail);

        sendTaskUpdateEmail(
          assigneeEmail,
          { title, description, deadline, priority, deliverables }
        ).catch(console.error);

      }
    }

    res.json({ ok: true, message: "Task updated successfully" });

  } catch (e) {

    console.error(e);
    res.status(500).json({ message: "Failed to update task" });

  }
}
// ---------------- UPDATE PROGRESS ----------------
export async function updateProgress(req, res) {
  try {
    const { id } = req.params;
    const { progress } = req.body;

    if (progress < 0 || progress > 100) {
      return res.status(400).json({ message: "Progress must be 0-100" });
    }

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


// ---------------- DELETE TASK ----------------
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
