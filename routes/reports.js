import express from 'express';
import pool from '../config/db.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = express.Router();

/* ----------------------------------
   TASK SUMMARY (Donut Chart)
---------------------------------- */
router.get(
  '/task-summary',
  authRequired,
  requireRole('Admin', 'Principal/Management'),
  async (req, res) => {

    const [rows] = await pool.query(`
      SELECT
        COALESCE(SUM(status = 'Pending'), 0) AS pending,
        COALESCE(SUM(status IN ('Completed','Closed')), 0) AS completed,
        COALESCE(SUM(status = 'In Progress'), 0) AS in_progress,
        COALESCE(SUM(deadline < CURDATE() AND status NOT IN ('Completed','Closed')), 0) AS overdue,
        COUNT(*) AS total
      FROM tasks
    `);

    res.json(rows[0]);
  }
);


/* ----------------------------------
   TASKS BY DEPARTMENT (Bar Chart)
---------------------------------- */
router.get(
  '/tasks-by-department',
  authRequired,
  requireRole('Admin', 'Principal/Management'),
  async (req, res) => {

   

    const [rows] = await pool.query(`
      SELECT
        d.department_code AS department,
        COUNT(t.id) AS count
      FROM departments d
      LEFT JOIN tasks t ON t.department_id = d.id
      GROUP BY d.id
      ORDER BY count DESC
    `);

    res.json(rows);
  }
);

export default router;
