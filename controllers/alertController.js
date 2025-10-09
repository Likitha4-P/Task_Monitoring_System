import pool from "../config/db.js";

// ✅ Get system alerts dynamically based on user's role & department
export const getSystemAlerts = async (req, res) => {
  try {
    const user = req.user; // From auth middleware
    const { id, role, department } = user;

    let alerts = [];

    if (role === "Faculty/File Incharge" || role === "Professor Incharge") {
      // ✅ For Faculty & Professors → Show recently assigned or updated tasks
      const [taskAlerts] = await pool.query(
        `SELECT id, title, status, created_at 
         FROM tasks 
         WHERE assigned_to = ? 
         ORDER BY created_at DESC 
         LIMIT 5`,
        [id]
      );

      alerts = taskAlerts.map(task => ({
        type: "Task",
        message: `Task "${task.title}" was assigned/updated. Status: ${task.status}`,
        date: task.created_at,
      }));
    }

    else if (role === "Department Head") {
      // ✅ For Department Heads → Show recent events of their department
      const [eventAlerts] = await pool.query(
        `SELECT id, title, status, updated_at
FROM events
WHERE department = ?
  AND status IN ('Approved', 'Rejected')
  AND updated_at >= NOW() - INTERVAL 7 DAY
ORDER BY updated_at DESC;
`,
        [department]
      );

      alerts = eventAlerts.map(event => ({
        type: "Event",
        message: `Event "${event.title}" was ${event.status}`,
        date: event.created_at,
      }));
    }

    else if (role === "Admin") {
      // ✅ For Admin → Show newly proposed events
      const [eventAlerts] = await pool.query(
        `SELECT id, title, status, created_at 
         FROM events 
         WHERE status = 'Pending' 
         ORDER BY created_at DESC 
         LIMIT 5`
      );

      alerts = eventAlerts.map(event => ({
        type: "Event",
        message: `New event proposed: "${event.title}"`,
        date: event.created_at,
      }));
    }

    else {
      // ✅ Default: No alerts for View-Only / Principal unless we want later
      alerts = [];
    }

    if (alerts.length === 0) {
      return res.status(200).json({ success: true, alerts: [], message: "No new alerts" });
    }

    res.status(200).json({ success: true, alerts });

  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
