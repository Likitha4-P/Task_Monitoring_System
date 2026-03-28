import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "college_task_monitoring",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
});

(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ DB connection check passed");
    conn.release();
  } catch (error) {
    console.error("❌ DB connection check failed:", error.message);
  }
})();

export default pool;

