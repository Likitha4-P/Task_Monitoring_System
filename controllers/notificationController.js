import pool from "../config/db.js";


// GET notifications
export const getNotifications = async (req, res) => {
  try {

    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT *
       FROM user_notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load notifications" });
  }
};



// MARK ONE READ
export const markNotificationRead = async (req, res) => {
  try {

    const notificationId = req.params.id;
    const userId = req.user.id;

    await pool.query(
      `UPDATE user_notifications
       SET is_read = 'Yes'
       WHERE id = ? AND user_id = ?`,
      [notificationId, userId]
    );

    res.json({ message: "Notification marked as read" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update notification" });
  }
};



// MARK ALL READ
export const markAllNotificationsRead = async (req, res) => {
  try {

    const userId = req.user.id;

    await pool.query(
      `UPDATE user_notifications
       SET is_read = 'Yes'
       WHERE user_id = ?`,
      [userId]
    );

    res.json({ message: "All notifications marked as read" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update notifications" });
  }
};