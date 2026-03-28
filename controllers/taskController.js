import pool from "../config/db.js";
import assertFields from "../utils/validate.js";
import { sendTaskEmail, sendTaskUpdateEmail } from "../utils/mailer.js";
import { createNotification } from "../utils/notifyHelper.js";


// ---------------- CREATE TASK ----------------
export async function createTask(req, res) {
  console.log(`📌 createTask called by user ${req.user?.id || "unknown"}`);
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

    console.log(`🔍 Validating task data: title=${title}, assigned_to=${assigned_to}, deadline=${deadline}`);
    assertFields(req.body, ["title", "assigned_to", "deadline"]);

    console.log(`💾 Inserting task into database`);
    const [result] = await pool.query(
      `INSERT INTO tasks 
        (title, description, assigned_to, assigned_by, department_id, deliverables, deadline, priority, status, progress, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, Now())`,
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
    console.log(`✅ Task inserted with id ${result.insertId}`);

    res.status(201).json({ id: result.insertId });
    const taskId = result.insertId;

    console.log(`📢 Creating notification for assigned user ${assigned_to}`);
    await createNotification(
      assigned_to,
      "New Task Assigned",
      `You have been assigned task: ${title} with deadline ${new Date(deadline).toLocaleDateString()}.`,
      "Task",
      taskId
    );

    console.log(`📧 Sending task email to assignee`);
    const [userRows] = await pool.query("SELECT email FROM users WHERE id = ?", [assigned_to]);
    if (userRows.length) {
      const assigneeEmail = userRows[0].email;
      sendTaskEmail(assigneeEmail, { title, description, deadline, priority, deliverables }).catch(console.error);
      console.log(`📧 Task email sent to ${assigneeEmail}`);
    } else {
      console.warn(`⚠️ No email found for user ${assigned_to}`);
    }

  } catch (e) {
    console.error("createTask error:", e);
    res.status(e.status || 500).json({ message: e.message || "Failed to create task" });
  }
}

// ---------------- LIST TASKS ----------------
export async function listTasks(req, res) {
  console.log(`📋 listTasks called by user ${req.user?.id || "unknown"} (role: ${req.user?.role})`);
  try {
    let q = `
      SELECT 
        t.*, 
        u.name AS assignee_name, 
        ab.name AS assigner_name, 
        d.department_name AS department_name,
        d.id AS department_id,
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
      console.log(`🔐 Filtering tasks for user ${req.user.id}`);
    }

    q += ` ORDER BY t.id DESC`;

    console.log(`📊 Querying tasks with params: ${params}`);
    const [rows] = await pool.query(q, params);
    console.log(`✅ listTasks returned ${rows.length} rows for user ${req.user?.id || "unknown"}`);

    res.json(rows);
  } catch (e) {
    console.error("listTasks error:", e);
    res.status(500).json({ message: "Failed to list tasks" });
  }
}


// ---------------- GET TASK ----------------
export async function getTask(req, res) {
  console.log(`🔍 getTask called with id=${req.params.id} by user ${req.user?.id || "unknown"}`);
  try {
    const { id } = req.params;

    console.log(`📊 Querying task ${id} details`);
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

    if (!rows.length) {
      console.warn(`⚠️ Task ${id} not found`);
      return res.status(404).json({ message: "Task not found" });
    }
    console.log(`✅ Task ${id} retrieved: ${rows[0].title}`);

    res.json(rows[0]);
  } catch (e) {
    console.error("getTask error:", e);
    res.status(500).json({ message: "Failed to get task" });
  }
}

// ---------------- UPDATE TASK ----------------
export async function updateTask(req, res) {
  console.log(`✏️ updateTask called for task ${req.params.id} by user ${req.user?.id || "unknown"}`);
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
      console.warn(`⚠️ Task ${id} not found for update`);
      return res.status(404).json({ message: "Task not found" });
    }

    const oldTask = taskRows[0];
    console.log(`✅ Found task: ${oldTask.title}, assigned to ${oldTask.assigned_to}`);

    const clean = v => (v === "" ? null : v);

    const titleVal = clean(title);
    const descriptionVal = clean(description);
    const assignedToVal = clean(assigned_to);
    const deliverablesVal = clean(deliverables);
    const deadlineVal = clean(deadline);
    const priorityVal = clean(priority);
    const statusVal = clean(status);

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
      [
        titleVal,
        descriptionVal,
        assignedToVal,
        deliverablesVal,
        deadlineVal,
        priorityVal,
        statusVal,
        id
      ]
    );
    console.log(`✅ Task ${id} updated successfully`);

    const newAssignee = assigned_to || oldTask.assigned_to;



    // -------- Notification when status changed --------
    if (status) {
      console.log(`📢 Creating status update notification for user ${newAssignee}`);
      await createNotification(
        newAssignee,
        "Task Status Updated",
        `Task "${title || oldTask.title}" status changed to ${status}`,
        "Task",
        id
      );
    } else {
      console.log(`📢 Creating task update notification for user ${newAssignee}`);
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
  console.log(`📈 updateProgress called for task ${req.params.id} by user ${req.user?.id || "unknown"}`);
  try {
    const { id } = req.params;
    const { progress } = req.body;

    console.log(`🔍 Validating progress: ${progress}`);
    if (progress < 0 || progress > 100) {
      console.warn(`⚠️ Invalid progress value: ${progress}`);
      return res.status(400).json({ message: "Progress must be 0-100" });
    }

    console.log(`👤 Checking task ownership for user ${req.user.id}`);
    const [rows] = await pool.query("SELECT assigned_to FROM tasks WHERE id = ?", [id]);
    if (!rows.length) {
      console.warn(`⚠️ Task ${id} not found`);
      return res.status(404).json({ message: "Task not found" });
    }

    const task = rows[0];
    if (task.assigned_to !== req.user.id) {
      console.warn(`🚫 Permission denied: user ${req.user.id} trying to update task ${id} assigned to ${task.assigned_to}`);
      return res.status(403).json({ message: "You can only update your own tasks" });
    }

    console.log(`💾 Updating progress to ${progress} for task ${id}`);
    await pool.query("UPDATE tasks SET progress = ? WHERE id = ?", [progress, id]);
    console.log(`✅ Progress updated for task ${id}`);

    res.json({ ok: true });
  } catch (e) {
    console.error("updateProgress error:", e);
    res.status(500).json({ message: "Failed to update progress" });
  }
}


// ---------------- DELETE TASK ----------------
export async function deleteTask(req, res) {
  console.log(`🗑️ deleteTask called for task ${req.params.id} by user ${req.user?.id || "unknown"}`);
  try {
    const { id } = req.params;

    console.log(`🔍 Checking if task ${id} exists`);
    const [rows] = await pool.query("SELECT * FROM tasks WHERE id = ?", [id]);
    if (!rows.length) {
      console.warn(`⚠️ Task ${id} not found`);
      return res.status(404).json({ message: "Task not found" });
    }

    console.log(`💾 Deleting task ${id} from database`);
    await pool.query("DELETE FROM tasks WHERE id = ?", [id]);
    console.log(`✅ Task ${id} deleted successfully`);

    res.json({ ok: true, message: "Task deleted successfully" });
  } catch (e) {
    console.error("deleteTask error:", e);
    res.status(500).json({ message: "Failed to delete task" });

  }
}
