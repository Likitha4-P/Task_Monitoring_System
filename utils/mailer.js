import SibApiV3Sdk from "sib-api-v3-sdk";
import dotenv from "dotenv";
dotenv.config();

// Brevo client setup
const client = SibApiV3Sdk.ApiClient.instance;
client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

console.log("API exists:", process.env.BREVO_API_KEY);
console.log("EMAIL:", process.env.EMAIL_USER);

// Common send function
async function sendMail(to, subject, html) {
  try {
    const response = await apiInstance.sendTransacEmail({
      sender: {
        email: process.env.EMAIL_USER,
        name: "College Task Monitoring System"
      },
      to: [{ email: to }],
      subject,
      htmlContent: html
    });

    console.log("✅ Email sent:", response.messageId);
  } catch (err) {
    console.error("❌ Email error FULL:", err);
  }
}

/*---------------- Reset Password Email ------------------*/
export async function sendEmail(to, subject, text) {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9; border-radius: 8px;">
      <h2 style="color: #4CAF50; text-align: center;">🔐 Password Reset</h2>
      <p style="font-size: 16px; color: #333;">${text}</p>
    </div>
  `;
  return sendMail(to, subject, html);
}

/* ------------------ TASK ASSIGNMENT EMAIL ------------------ */
export async function sendTaskEmail(to, taskDetails) {
  const { title, description, deadline, priority, deliverables } = taskDetails;

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #eef6ff; border-radius: 8px;">
      <h2 style="color: #007BFF;">📌 New Task Assigned</h2>
      <ul style="list-style: none; padding: 0; font-size: 15px; color: #333;">
        <li><b>Title:</b> ${title}</li>
        <li><b>Description:</b> ${description || "N/A"}</li>
        <li><b>Deadline:</b> <span style="color: #d9534f;">${deadline}</span></li>
        <li><b>Priority:</b> <span style="color: #f0ad4e;">${priority}</span></li>
        <li><b>Deliverables:</b> ${deliverables || "N/A"}</li>
      </ul>
    </div>
  `;
  return sendMail(to, `New Task Assigned: ${title}`, html);
}

/* ------------------ TASK UPDATE EMAIL ------------------ */
export async function sendTaskUpdateEmail(to, taskDetails) {
  const { title, description, deadline, priority, deliverables } = taskDetails;

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff3cd; border-radius: 8px;">
      <h2 style="color: #856404;">🔄 Task Updated</h2>
      <ul style="list-style: none; padding: 0; font-size: 15px; color: #333;">
        <li><b>Title:</b> ${title}</li>
        <li><b>Description:</b> ${description || "N/A"}</li>
        <li><b>Deadline:</b> <span style="color: #d9534f;">${deadline}</span></li>
        <li><b>Priority:</b> <span style="color: #f0ad4e;">${priority}</span></li>
        <li><b>Deliverables:</b> ${deliverables || "N/A"}</li>
      </ul>
    </div>
  `;
  return sendMail(to, `Task Updated: ${title}`, html);
}

/* ------------------ EVENT CREATION EMAIL ------------------ */
export async function sendEventEmail(to, eventDetails) {
  const { title, department_name, event_date, participants, venue } = eventDetails;

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #e8f5e9; border-radius: 8px;">
      <h2 style="color: #2e7d32;">📅 New Event Created</h2>
      <ul style="list-style: none; padding: 0; font-size: 15px; color: #333;">
        <li><b>Title:</b> ${title}</li>
        <li><b>Department:</b> ${department_name || "General"}</li>
        <li><b>Date:</b> ${event_date}</li>
        <li><b>Participants:</b> ${participants}</li>
        <li><b>Venue:</b> ${venue || "Not specified"}</li>
      </ul>
      <p style="color: #ff9800; font-weight: bold;">Status: Pending Approval</p>
    </div>
  `;
  return sendMail(to, `New Event Created: ${title}`, html);
}

/* ------------------ EVENT STATUS EMAIL ------------------ */
export async function sendEventStatusEmail(to, eventDetails, status) {
  const { title, department_name, event_date, participants, venue } = eventDetails;

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f1f8ff; border-radius: 8px;">
      <h2 style="color: #0056b3;">📢 Event ${status}</h2>
      <ul style="list-style: none; padding: 0; font-size: 15px; color: #333;">
        <li><b>Title:</b> ${title}</li>
        <li><b>Department:</b> ${department_name || "General"}</li>
        <li><b>Date:</b> ${event_date}</li>
        <li><b>Participants:</b> ${participants}</li>
        <li><b>Venue:</b> ${venue || "Not specified"}</li>
      </ul>
      <p style="color: #007BFF; font-weight: bold;">Status: ${status}</p>
    </div>
  `;
  return sendMail(to, `Event ${status}: ${title}`, html);
}

/* ------------------ DEADLINE REMINDER EMAIL ------------------ */
export async function sendDeadlineReminderEmail(to, taskDetails) {
  const { title, description, deadline, priority } = taskDetails;

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #ffebee; border-radius: 8px;">
      <h2 style="color: #c62828;">⏳ Deadline Reminder</h2>
      <ul style="list-style: none; padding: 0; font-size: 15px; color: #333;">
        <li><b>Task:</b> ${title}</li>
        <li><b>Description:</b> ${description || "N/A"}</li>
        <li><b>Deadline:</b> <span style="color: #d32f2f;">${deadline}</span></li>
        <li><b>Priority:</b> <span style="color: #f57c00;">${priority}</span></li>
      </ul>
      <p style="color:red; font-weight:bold; text-align:center;">⚠️ Complete before deadline!</p>
    </div>
  `;
  return sendMail(to, `Reminder: ${title}`, html);
}