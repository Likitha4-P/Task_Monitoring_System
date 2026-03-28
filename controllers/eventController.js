import pool from "../config/db.js";
import assertFields from "../utils/validate.js";
import { sendEventEmail } from "../utils/mailer.js";
import { createNotification } from "../utils/notifyHelper.js";

export async function createEvent(req, res) {
  console.log(`🎉 createEvent called by user ${req.user?.id} for event "${req.body.title}"`);
  try {
    const {
      title,
      department_id,
      event_date,
      participants = 0,
      venue = null
    } = req.body;

    console.log(`🔍 Validating event data: title=${title}, date=${event_date}, dept=${department_id}`);
    // Validate required fields
    assertFields(req.body, ["title", "event_date"]);

    console.log(`💾 Inserting event into database`);
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
        created_by,
        updated_at
        
      )
      VALUES (?, ?, ?, ?, ?, 'Pending', ?, Now())
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
    console.log(`✅ Event inserted with id ${result.insertId}`);

    /* ---------------- FIND REVIEWER EMAIL ---------------- */
    console.log(`👤 Finding reviewer email for department ${department_id}`);
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
      console.log(`📧 Sending email to reviewer: ${reviewerEmail}`);

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
        console.log(`📧 Event email sent successfully`);

      } catch (err) {
        console.error("Failed to send email:", err.message);
        // Do NOT fail event creation
      }
      
      console.log(`📢 Creating notification for admin`);
      const adminId = (await pool.query(
        `SELECT id FROM users WHERE role = 'Admin' LIMIT 1`
      ))[0][0].id;
      await createNotification(
        adminId,
        "New Event Proposed",
        `${title} has been proposed and is awaiting your review.`,
        "Event",
        result.insertId
      );
      console.log(`📢 Notification created`);
    } else {
      console.warn(`⚠️ No reviewer found for event ${result.insertId}`);
      res.status(201).json({ id: result.insertId });
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
  console.log(`📋 listEvents called by user ${req.user?.id} (role: ${req.user?.role})`);
  try {
    const { role, department_id } = req.user;

    let where = "1=1";
    const params = [];

    if (role !== "Admin") {
      where += " AND e.department_id = ?";
      params.push(department_id);
      console.log(`🔐 Filtering events for department ${department_id}`);
    }

    console.log(`📊 Querying events with filter: ${where}`);
    const [rows] = await pool.query(
      `
      SELECT 
        e.id,
        e.title,
        e.event_date,
        e.participants,
        e.venue,
        e.status,
        d.department_code,
        d.id AS department_id
      FROM events e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ${where}
      ORDER BY e.event_date DESC
      `,
      params
    );
    console.log(`✅ Retrieved ${rows.length} events`);

    res.json(rows);
  } catch (err) {
    console.error("listEvents error:", err);
    res.status(500).json({ message: "Failed to load events" });
  }
}


import { sendEventStatusEmail } from "../utils/mailer.js";

export async function approveEvent(req, res) {
  console.log(`✅ approveEvent called for event ${req.params.id} by user ${req.user?.id}`);
  try {
    const { id } = req.params;

    console.log(`💾 Updating event ${id} status to Approved`);
    // Update status
    await pool.query("UPDATE events SET status = 'Approved',updated_at = NOW() WHERE id = ?", [id]);
    console.log(`✅ Event ${id} status updated`);

    // Fetch event + creator email
    console.log(`📊 Fetching event details for ${id}`);
    const [[event]] = await pool.query(
  `
  SELECT 
    e.*,
    u.email AS creator_email,
    u.id AS creator_id,
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
      console.log(`📧 Sending approval email to ${event.creator_email}`);
      try {
        
        await sendEventStatusEmail(event.creator_email, event, "Approved");
        console.log(`📧 Approval email sent`);
        
      } catch (err) {
        console.error("Failed to send approval email:", err.message);
      }
    }
    
    console.log(`📢 Creating notifications for department users`);
    const [users] = await pool.query(
      `SELECT id FROM users 
       WHERE department_id = ? 
       AND status='Active'`,
      [event.department_id]
    );

    for (const user of users) {
      await createNotification(
        user.id,
        "Event Approved",
        `Event "${event.title}" has been approved`,
        "Event",
        event.id
      );
    }
    console.log(`📢 Notifications created for ${users.length} users`);
    
  } catch (e) {
    console.error("approveEvent error:", e);
    res.status(500).json({ message: "Failed to approve event" });
  }
}

export async function rejectEvent(req, res) {
  console.log(`❌ rejectEvent called for event ${req.params.id} by user ${req.user?.id}`);
  try {
    const { id } = req.params;

    console.log(`💾 Updating event ${id} status to Rejected`);
    // Update status
    await pool.query("UPDATE events SET status = 'Rejected', updated_at = NOW() WHERE id = ?", [id]);
    console.log(`✅ Event ${id} status updated to Rejected`);

    // Fetch event + creator email
    console.log(`📊 Fetching event details for ${id}`);
    const [[event]] = await pool.query(`
      SELECT e.*, u.email AS creator_email, u.id AS creator_id
      FROM events e JOIN users u ON e.created_by = u.id
      WHERE e.id = ?
    `, [id]);

    res.json({ ok: true });

    if (event) {
      console.log(`📧 Sending rejection email to ${event.creator_email}`);
      try {
      
        await sendEventStatusEmail(event.creator_email, event, "Rejected");
        console.log(`📧 Rejection email sent`);
      
      } catch (err) {
        console.error("Failed to send rejection email:", err.message);
      }
    }

    console.log(`📢 Creating rejection notification`);
    await createNotification(
      event.creator_id,
      "Event Rejected",
      "Your event Hackathon 2026 was rejected",
      "Event",
      id
    );
    console.log(`📢 Notification created`);
    
  } catch (e) {
    console.error("rejectEvent error:", e);
    res.status(500).json({ message: "Failed to reject event" });
  }
}

export async function getApprovedEvents(req, res) {
  console.log(`📅 getApprovedEvents called by user ${req.user?.id}`);
  try {
    console.log(`📊 Querying approved events`);
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
    console.log(`✅ Retrieved ${rows.length} approved events`);

    res.json(rows);
  } catch (err) {
    console.error("getApprovedEvents error:", err);
    res.status(500).json({ message: "Failed to load approved events" });
  }
}
export async function getEventSummary(req, res) {
  console.log(`📊 getEventSummary called by user ${req.user?.id} (role: ${req.user?.role})`);
  try {
    const { role, department_id } = req.user;

    let where = "1=1";
    const params = [];

    // 🔐 Role-based filtering
    if (role !== "Admin") {
      where += " AND department_id = ?";
      params.push(department_id);
      console.log(`🔐 Filtering summary for department ${department_id}`);
    }

    console.log(`📈 Calculating event summary`);
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

    const summary = {
      pending: row.pending || 0,
      approved: row.approved || 0,
      rejected: row.rejected || 0
    };
    console.log(`✅ Event summary: ${JSON.stringify(summary)}`);

    res.json(summary);

  } catch (err) {
    console.error("Event summary error:", err);
    res.status(500).json({ message: "Failed to load event summary" });
  }
}
