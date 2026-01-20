import pool from "../config/db.js";
import assertFields from "../utils/validate.js";
import { sendEventEmail } from "../utils/mailer.js";

export async function createEvent(req, res) {
  try {
    const { title, department, date, participants = 0 } = req.body;
    assertFields(req.body, ["title", "date"]);
    const [result] = await pool.query(
      `INSERT INTO events (title, department, date, participants, status, created_by)
       VALUES (?, ?, ?, ?, 'Pending', ?)`,
      [title, department || null, date, participants, req.user.id]
    );
    console.log("Creating event by user ID:", req.user.id);
    const [userRows] = await pool.query(
  `SELECT email FROM users WHERE role = 'Admin' OR (role = 'Faculty' AND department = ?) LIMIT 1`,
  [department]
);
if (userRows.length) {
  const reviewerEmail = userRows[0].email;
  try {
    // await sendEventEmail(reviewerEmail, { title, department, date, participants });
    console.log("email sent", reviewerEmail);
    console.log("email sent", { title, department, date, participants });
  } catch (err) {
    console.error("Failed to send email:", err.message);
    // continue without failing event creation
  }
}


    res.status(201).json({ id: result.insertId });
  } catch (e) {
    console.error(e);
    res.status(e.status || 500).json({ message: e.message || "Failed to create event" });
  }
}
// GET ALL EVENTS
export async function listEvents(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        e.id,
        e.title,
        e.event_date,
        e.participants,
        e.venue,
        e.status,
        e.created_by,
        d.department_code
      FROM events e
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY e.created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load events" });
  }
}
// export async function approveEvent(req, res) {
//   try {
//     const { id } = req.params;
//     await pool.query("UPDATE events SET status = 'Approved' WHERE id = ?", [id]);
//     res.json({ ok: true });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ message: "Failed to approve event" });
//   }
// }

// export async function rejectEvent(req, res) {
//   try {
//     const { id } = req.params;
//     await pool.query("UPDATE events SET status = 'Rejected' WHERE id = ?", [id]);
//     res.json({ ok: true });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ message: "Failed to reject event" });
//   }
// }
import { sendEventStatusEmail } from "../utils/mailer.js";

export async function approveEvent(req, res) {
  try {
    const { id } = req.params;

    // Update status

    await pool.query("UPDATE events SET status = 'Approved',updated_at = NOW() WHERE id = ?", [id]);

    // Fetch event + creator email
    const [[event]] = await pool.query(`
      SELECT e.*, u.email AS creator_email
      FROM events e JOIN users u ON e.created_by = u.id
      WHERE e.id = ?
    `, [id]);
    

    if (event) {
      try {
        // await sendEventStatusEmail(event.creator_email, event, "Approved");
        console.log("Approval email sent to:", event.creator_email);
      } catch (err) {
        console.error("Failed to send approval email:", err.message);
      }
    }

    res.json({ ok: true });
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

    if (event) {
      try {
        // await sendEventStatusEmail(event.creator_email, event, "Rejected");
        console.log("Rejection email sent to:", event.creator_email);
      } catch (err) {
        console.error("Failed to send rejection email:", err.message);
      }
    }

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to reject event" });
  }
}
