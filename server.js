import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cron from "node-cron";
import { sendDeadlineReminders } from "./utils/reminderScheduler.js";

// Load env variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// --- Import your routes ---
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import taskRoutes from "./routes/tasks.js";
import eventRoutes from "./routes/events.js";
import alertRoutes from "./routes/alertRoutes.js";
import reportRoutes from "./routes/reports.js";
import departmentRoutes from "./routes/departmentRoutes.js";

// --- API routes ---
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/departments", departmentRoutes);

// --- Serve Frontend (index.html + assets) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve everything inside /public as static files
// Serve static files
app.use(express.static(path.join(__dirname, "public")));
import cors from "cors";
app.use(cors());


console.log("Serving static files from:", path.join(__dirname, "public"));
console.log(process.env.EMAIL_USER); // Remove after testing!
console.log(process.env.EMAIL_PASS); // Remove after testing!
// Run every day at 11:35 AM
cron.schedule("35 11 * * *", async () => {
  console.log("⏳ Checking deadlines...");
  await sendDeadlineReminders();
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// --- Start server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT,"0.0.0.0", () => console.log(`✅ Server running at http://localhost:${PORT}`));

