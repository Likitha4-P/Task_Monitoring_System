import pool from "../config/db.js";
import { sendDeadlineReminderEmail } from "./mailer.js";

export async function sendDeadlineReminders() {
  try {
    const [tasks] = await pool.query(`
      SELECT t.id, t.title, t.description, t.deadline, t.priority, u.email
      FROM tasks t
      JOIN users u ON t.assigned_to = u.id
      WHERE t.status != 'Completed'
    `);

    const today = new Date();

    for (const task of tasks) {
      const deadline = new Date(task.deadline);
      const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

      // Send reminder if 3 days OR 1 day  before deadline
      if (diffDays === 3 || diffDays === 1 || diffDays === 0) {
        await sendDeadlineReminderEmail(task.email, {
          title: task.title,
          description: task.description,
          deadline: task.deadline,
          priority: task.priority,
        });
        console.log(`📧 Reminder sent to ${task.email} for task "${task.title}"`);
      }
    }
  } catch (error) {
    console.error("Error sending reminders:", error);
  }
}
