import fs from "fs";
import path from "path";
import pool from "../config/db.js";
import { drive } from "../config/drive.js";
import { createNotification } from "../utils/notifyHelper.js";

const DRIVE_FOLDER_ID = process.env.DRIVE_DELIVERABLES_FOLDER_ID;
// Example: "1w8dHq4CrOLLeaciBKvuhYNiZ3J44sqx"

export async function uploadDeliverable(req, res) {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const file = req.file;

   

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    /* -------------------------
       Upload file to Google Drive
    -------------------------- */
    const driveResponse = await drive.files.create({
      requestBody: {
        name: file.originalname,
        parents: [DRIVE_FOLDER_ID]   // 👈 central folder
      },
      media: {
        mimeType: file.mimetype,
        body: fs.createReadStream(file.path)
      }
    });

    const fileId = driveResponse.data.id;

    /* -------------------------
       Make file viewable
    -------------------------- */
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone"
      }
    });

    const fileUrl = `https://drive.google.com/file/d/${fileId}/view`;
    res.json({
     message: "Deliverable uploaded successfully",
     fileUrl
   });

    /* -------------------------
       Save reference in DB
    -------------------------- */
    await pool.query(
      `INSERT INTO task_deliverables
       (task_id, uploaded_by, drive_file_id, drive_file_url)
       VALUES (?, ?, ?, ?)`,
      [taskId, userId, fileId, fileUrl]
    );

     const [taskRows] = await pool.query(
  "SELECT title, assigned_by FROM tasks WHERE id = ?",
  [taskId]
);

const taskName = taskRows[0].title;
const taskAssignedBy = taskRows[0].assigned_by;

await createNotification(
  taskAssignedBy,
  "Deliverable Submitted",
  `Deliverable for task "${taskName}" has been uploaded and is awaiting verification.`,
  "Task",
  taskId
);
 /* -------------------------
       Cleanup temp file
    -------------------------- */
    fs.unlinkSync(file.path);
  } catch (err) {
    console.error("Deliverable upload error:", err);
    res.status(500).json({ message: "Deliverable upload failed" });
  }
}


export async function getFileURL(req, res) {
  try {
    const { id } = req.params;

    // Fetch deliverable reference from DB
    const [rows] = await pool.query(
      `SELECT drive_file_id, drive_file_url, uploaded_by, uploaded_at
       FROM task_deliverables
       WHERE task_id = ?
       ORDER BY uploaded_at DESC
       LIMIT 1`,   // 👈 latest deliverable
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "No deliverable found for this task" });
    }

    const deliverable = rows[0];

    res.json(deliverable);
  } catch (err) {
    console.error("ViewDoc error:", err);
    res.status(500).json({ message: "Failed to retrieve deliverable" });
  }
}

export async function deleteDeliverable(req, res) {
  try {
    const { taskId, deliverableId } = req.params;

    // Find the deliverable
    const [rows] = await pool.query(
      "SELECT * FROM task_deliverables WHERE id = ? AND task_id = ?",
      [deliverableId, taskId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Deliverable not found" });
    }

    const deliverable = rows[0];

    // Optional: permission check
    if (req.user.role !== "Admin" && req.user.id !== deliverable.uploaded_by) {
      return res.status(403).json({ message: "Not authorized to delete this file" });
    }

    // Delete from Google Drive
    await drive.files.delete({ fileId: deliverable.drive_file_id });

    // Delete from DB
    await pool.query("DELETE FROM task_deliverables WHERE id = ?", [deliverableId]);

    res.json({ message: "Deliverable deleted successfully" });
  } catch (err) {
    console.error("Deliverable delete error:", err);
    res.status(500).json({ message: "Deliverable delete failed" });
  }
}