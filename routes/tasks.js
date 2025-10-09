import { Router } from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import { createTask, listTasks, getTask, updateTask,deleteTask, updateProgress } from "../controllers/taskController.js";

const router = Router();
router.use(authRequired);

// Admin & Professor Incharge can create tasks
router.post("/", requireRole("Admin", "Professor Incharge"), createTask);

// Everyone authenticated can list tasks (filtered by role in controller)
router.get("/", listTasks);
router.get("/:id", getTask);

// Update status or assignee (Admin, Department Head, Professor Incharge)
router.put("/:id", requireRole("Admin", "Department Head", "Professor Incharge"), updateTask);

router.delete("/:id", requireRole("Admin", "Department Head"), deleteTask);

// Update only progress (assigned user can update their own)
router.patch("/:id/progress", updateProgress);

export default router;
