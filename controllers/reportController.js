import pool from "../config/db.js";
export async function getTaskSummary(req, res) {
  console.log(`📊 getTaskSummary called by user ${req.user?.id} (role: ${req.user?.role})`);
  try {
    const { role, department_id, id: userId } = req.user;

    let where = "WHERE 1=1";
    const params = [];

    if (["Department Head", "Professor Incharge"].includes(role)) {
      if (!department_id) {
        console.log(`⚠️ No department_id for role ${role}, returning zeros`);
        return res.json({ pending: 0, completed: 0, in_progress: 0, overdue: 0, total: 0 });
      }
      where += " AND department_id = ?";
      params.push(department_id);
      console.log(`🔐 Filtering for department ${department_id}`);
    }

    if (role === "Faculty/File Incharge") {
      where += " AND assigned_to = ?";
      params.push(userId);
      console.log(`🔐 Filtering for faculty ${userId}`);
    }

    console.log(`📈 Calculating task summary with filter: ${where}`);
    const [rows] = await pool.query(
      `
      SELECT
        COALESCE(SUM(status = 'Pending'), 0) AS pending,
        COALESCE(SUM(status IN ('Submitted','Closed')), 0) AS completed,
        COALESCE(SUM(status = 'In Progress'), 0) AS in_progress,
        COALESCE(SUM(deadline < CURDATE() AND status NOT IN ('Submitted','Closed')), 0) AS overdue,
        COUNT(*) AS total
      FROM tasks
      ${where}
      `,
      params
    );
    console.log(`✅ Task summary: ${JSON.stringify(rows[0])}`);

    res.json(rows[0]);
  } catch (err) {
    console.error("getTaskSummary error:", err);
    res.status(500).json({ message: "Failed to load task summary" });
  }


  }
export async function getTasksByDepartment(req, res) {
  console.log(`🏢 getTasksByDepartment called by user ${req.user?.id}`);
  try {
    console.log(`📊 Querying tasks by department`);
    const [rows] = await pool.query(`
      SELECT
        d.department_code AS department,
        COUNT(t.id) AS count
      FROM departments d
      LEFT JOIN tasks t ON t.department_id = d.id
      GROUP BY d.id
      ORDER BY count DESC
    `);
    console.log(`✅ Retrieved tasks count for ${rows.length} departments`);

    res.json(rows);
  } catch (err) {
    console.error("getTasksByDepartment error:", err);
    res.status(500).json({ message: "Failed to load tasks by department" });
  }
}
export async function getUpcomingEvents(req, res) {
  console.log(`📅 getUpcomingEvents called by user ${req.user?.id} with dates ${req.query.from_date} to ${req.query.to_date}`);
  try {
    const { from_date, to_date } = req.query;
    const { role, department_id } = req.user;

    let where = `
      WHERE e.status = 'Approved'
      AND e.event_date >= CURDATE()
    `;
    const params = [];

    

    // 📅 Date filter
    if (from_date && to_date) {
      where += " AND e.event_date BETWEEN ? AND ?";
      params.push(from_date, to_date);
      console.log(`📅 Applying date filter: ${from_date} to ${to_date}`);
    }

    console.log(`📊 Querying upcoming events with filter: ${where}`);
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
      
      `,
      params
    );
    console.log(`✅ Retrieved ${rows.length} upcoming events`);

    res.json(rows);
  } catch (err) {
    console.error("Upcoming events error:", err);
    res.status(500).json({ message: "Failed to load upcoming events" });
  }
}

export async function getPendingEventApprovals(req, res) {
  console.log(`⏳ getPendingEventApprovals called by user ${req.user?.id}`);
  try {
    console.log(`📊 Querying pending event approvals`);
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
     
      `
    );
    console.log(`✅ Retrieved ${rows.length} pending approvals`);

    res.json(rows);
  } catch (err) {
    console.error("getPendingEventApprovals error:", err);
    res.status(500).json({ message: "Failed to load pending approvals" });
  }
}
export async function getDeadlineSummary(req, res) {
  console.log(`⏰ getDeadlineSummary called by user ${req.user?.id} with filters: dept=${req.query.department_id}, faculty=${req.query.faculty_id}, dates=${req.query.from_date}-${req.query.to_date}`);
  try {
    const { department_id, faculty_id, from_date, to_date } = req.query;

    let where = "WHERE t.status != 'Closed'";
    const params = [];

    if (department_id) {
      where += " AND d.id = ?";
      params.push(department_id);
      console.log(`🏢 Filtering by department ${department_id}`);
    }

    if (faculty_id) {
      where += " AND u.id = ?";
      params.push(faculty_id);
      console.log(`👨‍🏫 Filtering by faculty ${faculty_id}`);
    }

    if (from_date && to_date) {
      where += " AND t.deadline BETWEEN ? AND ?";
      params.push(from_date, to_date);
      console.log(`📅 Filtering by dates ${from_date} to ${to_date}`);
    } else {
      where += " AND t.deadline <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)";
      console.log(`📅 Default filter: next 7 days`);
    }

    console.log(`📋 Querying deadline summary with filter: ${where}`);
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
    console.log(`✅ Retrieved ${rows.length} deadline items`);

    res.json(rows);
  } catch (err) {
    console.error("getDeadlineSummary error:", err);
    res.status(500).json({ message: "Failed to load deadline summary" });
  }
}
export async function exportReportData(req, res) {
  console.log(`📤 exportReportData called by user ${req.user?.id} with filters: dept=${req.query.department_id}, faculty=${req.query.faculty_id}, dates=${req.query.from_date}-${req.query.to_date}`);
  try {
    const { department_id, faculty_id, from_date, to_date } = req.query;

    /* ---------------- EVENTS ---------------- */
    let eventsWhere = "WHERE 1=1";
    const eventsParams = [];

    if (department_id) {
      eventsWhere += " AND e.department_id = ?";
      eventsParams.push(department_id);
      console.log(`🏢 Filtering events by department ${department_id}`);
    }

    if (from_date && to_date) {
      eventsWhere += " AND e.event_date BETWEEN ? AND ?";
      eventsParams.push(from_date, to_date);
      console.log(`📅 Filtering events by dates ${from_date} to ${to_date}`);
    }

    console.log(`🎉 Querying events for export`);
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
    console.log(`✅ Retrieved ${events.length} events for export`);

    /* ---------------- TASKS ---------------- */
    let tasksWhere = "WHERE 1=1";
    const tasksParams = [];

    if (department_id) {
      tasksWhere += " AND t.department_id = ?";
      tasksParams.push(department_id);
      console.log(`🏢 Filtering tasks by department ${department_id}`);
    }

    if (faculty_id) {
      tasksWhere += " AND t.assigned_to = ?";
      tasksParams.push(faculty_id);
      console.log(`👨‍🏫 Filtering tasks by faculty ${faculty_id}`);
    }

    if (from_date && to_date) {
      tasksWhere += " AND t.deadline BETWEEN ? AND ?";
      tasksParams.push(from_date, to_date);
      console.log(`📅 Filtering tasks by dates ${from_date} to ${to_date}`);
    }

    console.log(`📋 Querying tasks for export`);
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
    console.log(`✅ Retrieved ${tasks.length} tasks for export`);

    /* ---------------- FACULTY SUMMARY ---------------- */
    let facultyWhere = "WHERE u.role = 'Faculty/File Incharge'";
    const facultyParams = [];

    if (department_id) {
      facultyWhere += " AND u.department_id = ?";
      facultyParams.push(department_id);
      console.log(`🏢 Filtering faculty by department ${department_id}`);
    }

    console.log(`👥 Querying faculty summary for export`);
    const [faculty] = await pool.query(
      `
      SELECT
        u.name,
        d.department_name AS department,
        COUNT(DISTINCT t.id) AS tasksAssigned,
        COUNT(DISTINCT e.id) AS eventsOrganized,
        COUNT(DISTINCT CASE WHEN t.status IN ('submitted', 'verified') THEN t.id END) AS tasksCompleted
        
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN tasks t ON t.assigned_to = u.id
      LEFT JOIN events e ON e.created_by = u.id
      ${facultyWhere}
      GROUP BY u.id
      `,
      facultyParams
    );
    console.log(`✅ Retrieved ${faculty.length} faculty records for export`);

    /* ---------------- SUMMARY ---------------- */
    const summary = {
      totalEvents: events.length,
      pendingApprovals: events.filter(e => e.status === "Pending").length,
      upcomingDeadlines: tasks.filter(t => new Date(t.dueDate) >= new Date()).length,
      overdueItems: tasks.filter(t => (new Date(t.dueDate) < new Date() && t.status !== "Closed")).length,
      completedTasks: tasks.filter(t => t.status === "Closed").length
    };
    console.log(`📊 Generated summary: ${JSON.stringify(summary)}`);

    res.json({ summary, events, tasks, faculty });

  } catch (err) {
    console.error("Export error:", err);
    res.status(500).json({ message: "Failed to export report data" });
  }
}
