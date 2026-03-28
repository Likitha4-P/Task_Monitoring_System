import SibApiV3Sdk from "sib-api-v3-sdk";
import dotenv from "dotenv";
dotenv.config();

// Brevo client setup
const client = SibApiV3Sdk.ApiClient.instance;
client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

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
    console.error("❌ Email error:", err.message || err);
  }
}

/*---------------- Reset Password Email ------------------*/
export async function sendEmail(to, subject, text) {
  const html = `<p>${text}</p>`;
  return sendMail(to, subject, html);
}

/* ------------------ TASK ASSIGNMENT EMAIL ------------------ */
export async function sendTaskEmail(to, taskDetails) {
  const { title, description, deadline, priority, deliverables } = taskDetails;

  const html = `
    <h2>📌 New Task Assigned</h2>
    <p><b>Title:</b> ${title}</p>
    <p><b>Description:</b> ${description || "N/A"}</p>
    <p><b>Deadline:</b> ${deadline}</p>
    <p><b>Priority:</b> ${priority}</p>
    <p><b>Deliverables:</b> ${deliverables || "N/A"}</p>
  `;

  return sendMail(to, `New Task Assigned: ${title}`, html);
}

/* ------------------ TASK UPDATE EMAIL ------------------ */
export async function sendTaskUpdateEmail(to, taskDetails) {
  const { title, description, deadline, priority, deliverables } = taskDetails;

  const html = `
    <h2>🔄 Task Updated</h2>
    <p><b>Title:</b> ${title}</p>
    <p><b>Description:</b> ${description || "N/A"}</p>
    <p><b>Deadline:</b> ${deadline}</p>
    <p><b>Priority:</b> ${priority}</p>
    <p><b>Deliverables:</b> ${deliverables || "N/A"}</p>
  `;

  return sendMail(to, `Task Updated: ${title}`, html);
}

/* ------------------ EVENT CREATION EMAIL ------------------ */
export async function sendEventEmail(to, eventDetails) {
  const { title, department_name, event_date, participants, venue } = eventDetails;

  const html = `
    <h2>📅 New Event Created</h2>
    <p><b>Title:</b> ${title}</p>
    <p><b>Department:</b> ${department_name || "General"}</p>
    <p><b>Date:</b> ${event_date}</p>
    <p><b>Participants:</b> ${participants}</p>
    <p><b>Venue:</b> ${venue || "Not specified"}</p>
    <p>Status: <b>Pending Approval</b></p>
  `;

  return sendMail(to, `New Event Created: ${title}`, html);
}

/* ------------------ EVENT STATUS EMAIL ------------------ */
export async function sendEventStatusEmail(to, eventDetails, status) {
  const { title, department_name, event_date, participants, venue } = eventDetails;

  const html = `
    <h2>📢 Event ${status}</h2>
    <p><b>Title:</b> ${title}</p>
    <p><b>Department:</b> ${department_name || "General"}</p>
    <p><b>Date:</b> ${event_date}</p>
    <p><b>Participants:</b> ${participants}</p>
    <p><b>Venue:</b> ${venue || "Not specified"}</p>
    <p>Status: <b>${status}</b></p>
  `;

  return sendMail(to, `Event ${status}: ${title}`, html);
}

/* ------------------ DEADLINE REMINDER EMAIL ------------------ */
export async function sendDeadlineReminderEmail(to, taskDetails) {
  const { title, description, deadline, priority } = taskDetails;

  const html = `
    <h2>⏳ Deadline Reminder</h2>
    <p><b>Task:</b> ${title}</p>
    <p><b>Description:</b> ${description || "N/A"}</p>
    <p><b>Deadline:</b> ${deadline}</p>
    <p><b>Priority:</b> ${priority}</p>
    <p style="color:red;"><b>Complete before deadline!</b></p>
  `;

  return sendMail(to, `Reminder: ${title}`, html);
}