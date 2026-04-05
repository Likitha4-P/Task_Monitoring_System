import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,

  waitForConnections: true,
  connectionLimit: 5, // 🔥 match Clever Cloud limit
  queueLimit: 0,

  ssl: { rejectUnauthorized: false }, // 🔥 required

  dateStrings: true
});

export default pool;