import pool from "../config/db.js";

export async function createNotification(userId,title,message,type,refId){
    await pool.query(
        `INSERT INTO user_notifications
        (user_id,title,message,reference_type,reference_id)
        VALUES (?,?,?,?,?)`,
        [userId,title,message,type,refId]
    );
}