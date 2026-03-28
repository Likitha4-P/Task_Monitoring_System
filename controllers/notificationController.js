import pool from "../config/db.js";


// GET notifications
export const getNotifications = async (req, res) => {
  console.log(`🔔 getNotifications called for user ${req.user?.id}`);
  try {

    const userId = req.user.id;

    console.log(`📋 Querying notifications for user ${userId}`);
    const [rows] = await pool.query(
      `SELECT *
       FROM user_notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );
    console.log(`✅ Retrieved ${rows.length} notifications for user ${userId}`);

    res.json(rows);

  } catch (err) {
    console.error("getNotifications error:", err);
    res.status(500).json({ message: "Failed to load notifications" });
  }
};



// MARK ONE READ
export const markNotificationRead = async (req, res) => {
  console.log(`✅ markNotificationRead called for notification ${req.params.id} by user ${req.user?.id}`);
  try {

    const notificationId = req.params.id;
    const userId = req.user.id;

    console.log(`💾 Marking notification ${notificationId} as read for user ${userId}`);
    await pool.query(
      `UPDATE user_notifications
       SET is_read = 'Yes'
       WHERE id = ? AND user_id = ?`,
      [notificationId, userId]
    );
    console.log(`✅ Notification ${notificationId} marked as read`);

    res.json({ message: "Notification marked as read" });

  } catch (err) {
    console.error("markNotificationRead error:", err);
    res.status(500).json({ message: "Failed to update notification" });
  }
};



// MARK ALL READ
export const markAllNotificationsRead = async (req, res) => {
  console.log(`✅ markAllNotificationsRead called by user ${req.user?.id}`);
  try {

    const userId = req.user.id;

    console.log(`💾 Marking all notifications as read for user ${userId}`);
    await pool.query(
      `UPDATE user_notifications
       SET is_read = 'Yes'
       WHERE user_id = ?`,
      [userId]
    );
    console.log(`✅ All notifications marked as read for user ${userId}`);

    res.json({ message: "All notifications marked as read" });

  } catch (err) {
    console.error("markAllNotificationsRead error:", err);
    res.status(500).json({ message: "Failed to update notifications" });
  }
};