import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

/* ------------------ TASK ASSIGNMENT EMAIL ------------------ */
export async function sendTaskEmail(to, taskDetails) {
  const { title, description, deadline, priority , deliverables } = taskDetails;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color:#2c3e50;">📌 New Task Assigned</h2>
      <p>Dear Team Member,</p>
      <p>You have been assigned a new task. Please find the details below:</p>

      <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Task Title</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${title}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Description</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${description || "No description provided"}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Deadline</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${deadline}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Priority</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${priority}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Deliverables</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${deliverables || "No deliverables provided"}</td>
        </tr>
      </table>

      <p style="margin-top:15px;">Please ensure to complete the task before the deadline.</p>
      <p style="color:#555;">Best Regards,<br><strong>College Task Monitoring System</strong></p>
    </div>
  `;

  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: `New Task Assigned: ${title}`,
    html
  });
}

/* ------------------ TASK UPDATE EMAIL ------------------ */
export async function sendTaskUpdateEmail(to, taskDetails) {
  const { title, description, deadline, priority, deliverables } = taskDetails;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color:#2c3e50;">🔄 Task Updated</h2>
      <p>Dear Team Member,</p>
      <p>The following task has been updated. Please review the revised details:</p>

      <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Task Title</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${title}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Description</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${description || "No description provided"}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Deadline</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${deadline}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Priority</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${priority}</td>
        </tr>
    
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Deliverables</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${deliverables || "No deliverables provided"}</td>
        </tr>
      </table>

      <p style="margin-top:15px;">Kindly take note of the updated details.</p>
      <p style="color:#555;">Best Regards,<br><strong>College Task Monitoring System</strong></p>
    </div>
  `;

  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: `Task Updated: ${title}`,
    html
  });
}

/* ------------------ EVENT CREATION EMAIL ------------------ */
export async function sendEventEmail(to, eventDetails) {
  const { title, department_name, event_date, participants, venue } = eventDetails;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color:#2c3e50;">📅 New Event Created</h2>
      <p>Dear Participant,</p>
      <p>A new event has been scheduled. Please find the details below:</p>

      <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Event Title</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${title}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Department</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${department_name || "General"}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>📅Date</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${event_date}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Participants👥</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${participants}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Venue📍</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${venue || "Not specified"}</td>
        </tr>
      </table>

      <p style="margin-top:15px;">This event is currently <strong>Pending Approval</strong>.</p>
      <p style="color:#555;">Best Regards,<br><strong>College Task Monitoring System</strong></p>
    </div>
  `;

  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: `New Event Created: ${title}`,
    html
  });
}

/* ------------------ EVENT STATUS UPDATE EMAIL ------------------ */
export async function sendEventStatusEmail(to, eventDetails, status) {
  const { title, department_name, event_date, participants, venue } = eventDetails;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color:#2c3e50;">📢 Event ${status === "Approved" ? "Approved ✅" : "Rejected ❌"}</h2>
      <p>Dear Participant,</p>
      <p>The status of the following event has been updated:</p>

      <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Event Title</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${title}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Department</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${department_name || "General"}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Date</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${event_date}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Participants</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${participants}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Venue</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${venue || "Not specified"}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Status</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd; color: ${status === "Approved" ? "green" : "red"};">
            <strong>${status}</strong>
          </td>
        </tr>
      </table>

      <p style="margin-top:15px;">Please make note of this update.</p>
      <p style="color:#555;">Best Regards,<br><strong>College Task Monitoring System</strong></p>
    </div>
  `;

  return transporter.sendMail({
    from: "CTMS Notifications <" + process.env.EMAIL_USER + ">",
    to,
    subject: `Event ${status}: ${title}`,
    html
  });
}
/* ------------------ DEADLINE REMINDER EMAIL ------------------ */
export async function sendDeadlineReminderEmail(to, taskDetails) {
  const { title, description, deadline, priority } = taskDetails;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color:#d35400;">⏳ Task Deadline Reminder</h2>
      <p>Dear Faculty,</p>
      <p>This is a friendly reminder that the following task is nearing its deadline:</p>

      <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Task Title</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${title}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Description</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${description || "No description provided"}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Deadline</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd; color: red;"><b>${deadline}</b></td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Priority</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${priority}</td>
        </tr>
      </table>

      <p style="margin-top:15px; color:red;"><b>Please complete the task before the deadline!</b></p>
      <p style="color:#555;">Best Regards,<br><strong>College Task Monitoring System</strong></p>
    </div>
  `;

  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: `⏳ Reminder: Task Deadline Approaching - ${title}`,
    html
  });
}
