import fs from "fs";
import path from "path";
import pool from "../config/db.js";
import { drive } from "../config/drive.js";
import { createNotification } from "../utils/notifyHelper.js";

const DRIVE_FOLDER_ID = process.env.DRIVE_DELIVERABLES_FOLDER_ID;
// Example: "1w8dHq4CrOLLeaciBKvuhYNiZ3J44sqx"

export async function uploadDeliverable(req, res) {
  console.log(`📤 uploadDeliverable called for task ${req.params.taskId} by user ${req.user?.id}`);
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const file = req.file;

    console.log(`🔍 Checking file upload for task ${taskId}, user ${userId}`);

    if (!file) {
      console.warn("⚠️ uploadDeliverable: no file uploaded");
      return res.status(400).json({ message: "No file uploaded" });
    }

    console.log(`📁 File received: ${file.originalname}, size: ${file.size}, mimetype: ${file.mimetype}`);

    /* -------------------------
       Upload file to Google Drive
    -------------------------- */
    console.log(`☁️ Starting Google Drive upload for file ${file.originalname}`);
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
    console.log(`✅ Google Drive upload success id=${fileId} user=${userId} task=${taskId}`);

    /* -------------------------
       Make file viewable
    -------------------------- */
    console.log(`🔓 Setting permissions for file ${fileId}`);
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone"
      }
    });
    console.log(`🔓 Permissions set for file ${fileId}`);

    const fileUrl = `https://drive.google.com/file/d/${fileId}/view`;
    res.json({
     message: "Deliverable uploaded successfully",
     fileUrl
   });

    /* -------------------------
       Save reference in DB
    -------------------------- */
    console.log(`💾 Saving deliverable to database: task ${taskId}, user ${userId}, file ${fileId}`);
    await pool.query(
      `INSERT INTO task_deliverables
       (task_id, uploaded_by, drive_file_id, drive_file_url)
       VALUES (?, ?, ?, ?)`,
      [taskId, userId, fileId, fileUrl]
    );
    console.log(`💾 Database insert successful for deliverable ${fileId}`);

     const [taskRows] = await pool.query(
  "SELECT title, assigned_by FROM tasks WHERE id = ?",
  [taskId]
);

const taskName = taskRows[0].title;
const taskAssignedBy = taskRows[0].assigned_by;

console.log(`📢 Creating notification for task "${taskName}" assigned by ${taskAssignedBy}`);
await createNotification(
  taskAssignedBy,
  "Deliverable Submitted",
  `Deliverable for task "${taskName}" has been uploaded and is awaiting verification.`,
  "Task",
  taskId
);
console.log(`📢 Notification created for task ${taskId}`);

 /* -------------------------
       Cleanup temp file
    -------------------------- */
    fs.unlinkSync(file.path);
    console.log(`🧹 Temp file removed: ${file.path}`);
    console.log(`✅ uploadDeliverable finished for task ${taskId}, file ${fileId}`);
  } catch (err) {
    console.error("Deliverable upload error:", err);
    res.status(500).json({ message: "Deliverable upload failed" });
  }
}


export async function getFileURL(req, res) {
  console.log(`🔍 getFileURL called for task ${req.params.id} by user ${req.user?.id}`);
  try {
    const { id } = req.params;

    console.log(`📊 Querying database for deliverable of task ${id}`);
    // Fetch deliverable reference from DB
    const [rows] = await pool.query(
      `SELECT drive_file_id, drive_file_url, uploaded_by, uploaded_at
       FROM task_deliverables
       WHERE task_id = ?
       ORDER BY uploaded_at DESC
       LIMIT 1`,   // 👈 latest deliverable
      [id]
    );

    console.log(`📊 Query result: ${rows.length} rows found for task ${id}`);

    if (rows.length === 0) {
      console.warn(`⚠️ No deliverable found for task ${id}`);
      return res.status(404).json({ message: "No deliverable found for this task" });
    }

    const deliverable = rows[0];
    console.log(`✅ Returning deliverable: file ${deliverable.drive_file_id}, uploaded by ${deliverable.uploaded_by}`);

    res.json(deliverable);
  } catch (err) {
    console.error("ViewDoc error:", err);
    res.status(500).json({ message: "Failed to retrieve deliverable" });
  }
}

export async function deleteDeliverable(req, res) {
  console.log(`🗑️ deleteDeliverable called for task ${req.params.taskId}, deliverable ${req.params.deliverableId} by user ${req.user?.id}`);
  try {
    const { taskId, deliverableId } = req.params;

    console.log(`🔍 Finding deliverable ${deliverableId} for task ${taskId}`);
    // Find the deliverable
    const [rows] = await pool.query(
      "SELECT * FROM task_deliverables WHERE id = ? AND task_id = ?",
      [deliverableId, taskId]
    );
    if (rows.length === 0) {
      console.warn(`⚠️ Deliverable ${deliverableId} not found for task ${taskId}`);
      return res.status(404).json({ message: "Deliverable not found" });
    }

    const deliverable = rows[0];
    console.log(`✅ Found deliverable: ${deliverable.drive_file_id}, uploaded by ${deliverable.uploaded_by}`);

    // Optional: permission check
    if (req.user.role !== "Admin" && req.user.id !== deliverable.uploaded_by) {
      console.warn(`🚫 Permission denied for user ${req.user.id} to delete deliverable ${deliverableId}`);
      return res.status(403).json({ message: "Not authorized to delete this file" });
    }

    console.log(`☁️ Deleting file from Google Drive: ${deliverable.drive_file_id}`);
    // Delete from Google Drive
    await drive.files.delete({ fileId: deliverable.drive_file_id });
    console.log(`✅ Google Drive file deleted: ${deliverable.drive_file_id}`);

    console.log(`💾 Deleting deliverable from database: ${deliverableId}`);
    // Delete from DB
    await pool.query("DELETE FROM task_deliverables WHERE id = ?", [deliverableId]);
    console.log(`✅ Database record deleted for deliverable ${deliverableId}`);

    res.json({ message: "Deliverable deleted successfully" });
  } catch (err) {
    console.error("Deliverable delete error:", err);
    res.status(500).json({ message: "Deliverable delete failed" });
  }
}