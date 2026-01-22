import express from 'express';
import pool from '../config/db.js';
import { authRequired} from '../middleware/auth.js';
import { getUpcomingEvents, getPendingEventApprovals } from '../controllers/reportController.js';
import { getDeadlineSummary, exportReportData, getTaskSummary, getTasksByDepartment} from '../controllers/reportController.js';

const router = express.Router();

router.get('/task-summary',authRequired,getTaskSummary);
router.get('/tasks-by-department',authRequired,getTasksByDepartment); 




router.get("/events/upcoming", authRequired,getUpcomingEvents);
router.get("/events/pending", authRequired,getPendingEventApprovals);
router.get("/tasks/deadlines", authRequired, getDeadlineSummary);
router.get("/export", authRequired, exportReportData);

export default router;


