import pool from "../config/db.js";
import assertFields from "../utils/validate.js";
import { sendEventEmail } from "../utils/mailer.js";
export async function createEvent(req, res) {
 
  try {
    const {
      title,
      department_id,
      event_date,
      participants = 0,
      venue = null
    } = req.body;

    // Validate required fields
    assertFields(req.body, ["title", "event_date"]);

    // Insert event
    const [result] = await pool.query(
      `
      INSERT INTO events (
        title,
        department_id,
        event_date,
        participants,
        venue,
        status,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, 'Pending', ?)
      `,
      [
        title,
        department_id || null,
        event_date,
        participants,
        venue,
        req.user.id
      ]
    );

    console.log("Creating event by user ID:", req.user.id);

    /* ---------------- FIND REVIEWER EMAIL ---------------- */
    const [userRows] = await pool.query(
      `
      SELECT email
      FROM users
      WHERE
        role = 'Admin'
        OR (
          role IN ('Department Head', 'Faculty/File Incharge')
          AND department_id = ?
        )
      ORDER BY role = 'Admin' DESC
      LIMIT 1
      `,
      [department_id]
    );



    /* ---------------- SEND EMAIL ---------------- */
    if (userRows.length) {
  const reviewerEmail = userRows[0].email;

  const [deptRows] = await pool.query(
    `SELECT department_name FROM departments WHERE id = ?`,
    [department_id]
  );

  const departmentName = deptRows.length
    ? deptRows[0].department_name
    : null;
    res.status(201).json({ id: result.insertId });

  try {
    await sendEventEmail(reviewerEmail, {
      title,
      department_name: departmentName,
      event_date,
      participants,
      venue
    });

    console.log("Event review email sent to:", reviewerEmail);
  } catch (err) {
    console.error("Failed to send email:", err.message);
    // Do NOT fail event creation
  }
}


    

  } catch (e) {
    console.error("Create event error:", e);
    res
      .status(e.status || 500)
      .json({ message: e.message || "Failed to create event" });
  }
}

// GET ALL EVENTS
export async function listEvents(req, res) {
  try {
    const { role, department_id } = req.user;

    let where = "1=1";
    const params = [];

    if (role !== "Admin") {
      where += " AND e.department_id = ?";
      params.push(department_id);
    }

    const [rows] = await pool.query(
      `
      SELECT 
        e.id,
        e.title,
        e.event_date,
        e.participants,
        e.venue,
        e.status,
        d.department_code
      FROM events e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ${where}
      ORDER BY e.event_date DESC
      `,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load events" });
  }
}


import { sendEventStatusEmail } from "../utils/mailer.js";

export async function approveEvent(req, res) {
  try {
    const { id } = req.params;

    // Update status

    await pool.query("UPDATE events SET status = 'Approved',updated_at = NOW() WHERE id = ?", [id]);

    // Fetch event + creator email
    const [[event]] = await pool.query(
  `
  SELECT 
    e.*,
    u.email AS creator_email,
    d.department_name
  FROM events e
  JOIN users u 
    ON e.created_by = u.id
  LEFT JOIN departments d 
    ON e.department_id = d.id
  WHERE e.id = ?
  `,
  [id]
);

    res.json({ ok: true });

    if (event) {
      try {
        console.log(event);
        await sendEventStatusEmail(event.creator_email, event, "Approved");
        console.log("Approval email sent to:", event.creator_email);
      } catch (err) {
        console.error("Failed to send approval email:", err.message);
      }
    }

    
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to approve event" });
  }
}

export async function rejectEvent(req, res) {
  try {
    const { id } = req.params;

    // Update status
    await pool.query("UPDATE events SET status = 'Rejected', updated_at = NOW() WHERE id = ?", [id]);

    // Fetch event + creator email
    const [[event]] = await pool.query(`
      SELECT e.*, u.email AS creator_email
      FROM events e JOIN users u ON e.created_by = u.id
      WHERE e.id = ?
    `, [id]);

    res.json({ ok: true });

    if (event) {
      try {
        console.log(event);
        await sendEventStatusEmail(event.creator_email, event, "Rejected");
        console.log("Rejection email sent to:", event.creator_email);
      } catch (err) {
        console.error("Failed to send rejection email:", err.message);
      }
    }

  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to reject event" });
  }
}

export async function getApprovedEvents(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT
        e.id,
        e.title,
        e.event_date,
        e.participants,
        e.venue,
        d.department_code
      FROM events e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.status = 'Approved'
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load approved events" });
  }
}
export async function getEventSummary(req, res) {
  try {
    const { role, department_id } = req.user;

    let where = "1=1";
    const params = [];

    // 🔐 Role-based filtering
    if (role !== "Admin") {
      where += " AND department_id = ?";
      params.push(department_id);
    }

    const [[row]] = await pool.query(
      `
      SELECT
        SUM(status = 'Pending')   AS pending,
        SUM(status = 'Approved')  AS approved,
        SUM(status = 'Rejected')  AS rejected
      FROM events
      WHERE ${where}
      `,
      params
    );

    res.json({
      pending: row.pending || 0,
      approved: row.approved || 0,
      rejected: row.rejected || 0
    });

  } catch (err) {
    console.error("Event summary error:", err);
    res.status(500).json({ message: "Failed to load event summary" });
  }
}
