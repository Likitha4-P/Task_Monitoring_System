import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cron from "node-cron";
import { sendDeadlineReminders } from "./utils/reminderScheduler.js";
import { uploadDeliverable } from "./controllers/deliverableController.js";
import { upload } from "./middleware/upload.js";
import { authRequired } from "./middleware/auth.js";


// Load env variables
dotenv.config();

const app = express();

console.log("🚀 Starting app with NODE_ENV=", process.env.NODE_ENV);
console.log("📌 Database host=", process.env.DB_HOST || process.env.MYSQLHOST);
console.log("📌 Google drive folder=", process.env.DRIVE_DELIVERABLES_FOLDER_ID);

app.post(
  "/api/tasks/:taskId/deliverables",
  authRequired,
  upload.single("file"),
  uploadDeliverable
);

// Middleware
app.use(express.json( ));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));


// --- Import your routes ---
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import taskRoutes from "./routes/tasks.js";
import eventRoutes from "./routes/events.js";
import reportRoutes from "./routes/reports.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import notificationRoutes from "./routes/notifications.js";


// --- API routes ---
app.use("/api/notifications", notificationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/events", eventRoutes);
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

// Basic request logging for Render debugging
app.use((req, res, next) => {
  console.log(`➡️ [${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

console.log("Serving static files from:", path.join(__dirname, "public"));

// Run every day at 10:00 AM server time
cron.schedule("30 4 * * *", async () => {
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

