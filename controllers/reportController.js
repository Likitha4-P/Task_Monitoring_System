import pool from "../config/db.js";
export async function getTaskSummary(req, res) {
   
  try {
    const { role, department_id, id: userId } = req.user;

    let where = "WHERE 1=1";
    const params = [];
console.log(req.user);
    if (["Department Head", "Professor Incharge"].includes(role)) {
      if (!department_id) {
        return res.json({ pending: 0, completed: 0, in_progress: 0, overdue: 0, total: 0 });
      }
      where += " AND department_id = ?";
      params.push(department_id);
    }

    if (role === "Faculty/File Incharge") {
      where += " AND assigned_to = ?";
      params.push(userId);
    }

    const [rows] = await pool.query(
      `
      SELECT
        COALESCE(SUM(status = 'Pending'), 0) AS pending,
        COALESCE(SUM(status IN ('Completed','Closed')), 0) AS completed,
        COALESCE(SUM(status = 'In Progress'), 0) AS in_progress,
        COALESCE(SUM(deadline < CURDATE() AND status NOT IN ('Completed','Closed')), 0) AS overdue,
        COUNT(*) AS total
      FROM tasks
      ${where}
      `,
      params
    );

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load task summary" });
  }


  }
export async function getTasksByDepartment(req, res) {
 
  try {
    const { role, department_id, id: userId } = req.user;

    let joinCondition = "ON t.department_id = d.id";
    const params = [];

    if (["Department Head", "Professor Incharge"].includes(role)) {
      joinCondition += " AND d.id = ?";
      params.push(department_id);
    }

    if (role === "Faculty/File Incharge") {
      joinCondition += " AND t.assigned_to = ?";
      params.push(userId);
    }

    const [rows] = await pool.query(
      `
      SELECT
        d.department_code AS department,
        COUNT(t.id) AS count
      FROM departments d
      LEFT JOIN tasks t
        ${joinCondition}
      GROUP BY d.id
      ORDER BY count DESC
      `,
      params
    );
    const filtered = rows.filter(
  row => row.department?.toLowerCase() !== "admin"
);

res.json(filtered);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load tasks by department" });
  }


  }
export async function getUpcomingEvents(req, res) {
  try {
    const { from_date, to_date } = req.query;
    const { role, department_id } = req.user;
    console.log(req.user);
    console.log(req.query);

  

    let where = `
      WHERE e.status = 'Approved'
      AND e.event_date >= CURDATE()
    `;
    const params = [];

    // 🔐 Role-based filtering
    if (role !== "Admin") {
      where += " AND e.department_id = ?";
      params.push(department_id);
    }

    // 📅 Date filter
    if (from_date && to_date) {
      where += " AND e.event_date BETWEEN ? AND ?";
      params.push(from_date, to_date);
    }

    const [rows] = await pool.query(
      `
      SELECT 
        e.id,
        e.title,
        e.event_date,
        e.venue,
        d.department_name
      FROM events e
      LEFT JOIN departments d ON e.department_id = d.id
      ${where}
      ORDER BY e.event_date ASC
      LIMIT 5
      `,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error("Upcoming events error:", err);
    res.status(500).json({ message: "Failed to load upcoming events" });
  }
}

export async function getPendingEventApprovals(req, res) {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        e.id,
        e.title,
        d.department_name,
        e.created_at
      FROM events e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.status = 'Pending'
      ORDER BY e.created_at DESC
      LIMIT 5
      `
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load pending approvals" });
  }
}
export async function getDeadlineSummary(req, res) {
  try {
    const { department, faculty, from_date, to_date } = req.query;

    let where = "WHERE t.status != 'Closed'";
    const params = [];

    if (department) {
      where += " AND d.department_name = ?";
      params.push(department);
    }

    if (faculty) {
      where += " AND u.name = ?";
      params.push(faculty);
    }

    if (from_date && to_date) {
      where += " AND t.deadline BETWEEN ? AND ?";
      params.push(from_date, to_date);
    } else {
      where += " AND t.deadline <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)";
    }

    const [rows] = await pool.query(
      `
      SELECT
        t.id,
        t.title,
        t.deadline,
        t.status,
        d.department_name,
        u.name AS faculty_name
      FROM tasks t
      LEFT JOIN departments d ON t.department_id = d.id
      LEFT JOIN users u ON t.assigned_to = u.id
      ${where}
      ORDER BY t.deadline ASC
      `,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load deadline summary" });
  }
}
export async function exportReportData(req, res) {
  try {
    const { department_id, faculty_id, from_date, to_date } = req.query;

    /* ---------------- EVENTS ---------------- */
    let eventsWhere = "WHERE 1=1";
    const eventsParams = [];

    if (department_id) {
      eventsWhere += " AND e.department_id = ?";
      eventsParams.push(department_id);
    }

    if (from_date && to_date) {
      eventsWhere += " AND e.event_date BETWEEN ? AND ?";
      eventsParams.push(from_date, to_date);
    }

    const [events] = await pool.query(
      `
      SELECT 
        e.id,
        e.title AS name,
        d.department_name AS department,
        e.event_date AS date,
        e.status,
        e.participants AS attendees
      FROM events e
      LEFT JOIN departments d ON e.department_id = d.id
      ${eventsWhere}
      ORDER BY e.event_date ASC
      `,
      eventsParams
    );

    /* ---------------- TASKS ---------------- */
    let tasksWhere = "WHERE 1=1";
    const tasksParams = [];

    if (department_id) {
      tasksWhere += " AND t.department_id = ?";
      tasksParams.push(department_id);
    }

    if (faculty_id) {
      tasksWhere += " AND t.assigned_to = ?";
      tasksParams.push(faculty_id);
    }

    if (from_date && to_date) {
      tasksWhere += " AND t.deadline BETWEEN ? AND ?";
      tasksParams.push(from_date, to_date);
    }

    const [tasks] = await pool.query(
      `
      SELECT
        t.id,
        t.title AS task,
        t.deadline AS dueDate,
        t.status,
        t.priority,
        d.department_name AS course
      FROM tasks t
      LEFT JOIN departments d ON t.department_id = d.id
      ${tasksWhere}
      ORDER BY t.deadline ASC
      `,
      tasksParams
    );

    /* ---------------- FACULTY SUMMARY ---------------- */
    let facultyWhere = "WHERE u.role = 'Faculty/File Incharge'";
    const facultyParams = [];

    if (department_id) {
      facultyWhere += " AND u.department_id = ?";
      facultyParams.push(department_id);
    }

    const [faculty] = await pool.query(
      `
      SELECT
        u.name,
        d.department_name AS department,
        COUNT(DISTINCT t.id) AS tasksAssigned,
        COUNT(DISTINCT e.id) AS eventsOrganized
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN tasks t ON t.assigned_to = u.id
      LEFT JOIN events e ON e.created_by = u.id
      ${facultyWhere}
      GROUP BY u.id
      `,
      facultyParams
    );

    /* ---------------- SUMMARY ---------------- */
    const summary = {
      totalEvents: events.length,
      pendingApprovals: events.filter(e => e.status === "Pending").length,
      upcomingDeadlines: tasks.filter(t => new Date(t.dueDate) >= new Date()).length,
      overdueItems: tasks.filter(t => new Date(t.dueDate) < new Date()).length,
      completedTasks: tasks.filter(t => t.status === "Closed").length
    };

    res.json({ summary, events, tasks, faculty });

  } catch (err) {
    console.error("Export error:", err);
    res.status(500).json({ message: "Failed to export report data" });
  }
}
