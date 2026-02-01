import fs from "fs";
import path from "path";
import pool from "../config/db.js";
import { drive } from "../config/drive.js";

const DRIVE_FOLDER_ID = process.env.DRIVE_DELIVERABLES_FOLDER_ID;
// Example: "1w8dHq4CrOLLeaciBKvuhYNiZ3J44sqx"

export async function uploadDeliverable(req, res) {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const file = req.file;

    console.log("PARAMS:", req.params);
    console.log("FILE:", req.file);

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

    /* -------------------------
       Save reference in DB
    -------------------------- */
    await pool.query(
      `INSERT INTO task_deliverables
       (task_id, uploaded_by, drive_file_id, drive_file_url)
       VALUES (?, ?, ?, ?)`,
      [taskId, userId, fileId, fileUrl]
    );

 res.json({
      message: "Deliverable uploaded successfully",
      fileUrl
    });

    /* -------------------------
       Update task status
    -------------------------- */
    await pool.query(
      `UPDATE tasks
       SET status = 'Submitted'
       WHERE id = ?`,
      [taskId]
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
