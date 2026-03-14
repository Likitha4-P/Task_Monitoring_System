import { Router } from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import { createTask, listTasks, getTask, updateTask,deleteTask, updateProgress } from "../controllers/taskController.js";
import { getFileURL, deleteDeliverable } from "../controllers/deliverableController.js";
import { upload } from "../middleware/upload.js";

const router = Router();
router.use(authRequired);

// Admin & Professor Incharge can create tasks
router.post("/", requireRole("Admin", "Professor Incharge"), createTask);

// Everyone authenticated can list tasks (filtered by role in controller)
router.get("/", listTasks);
router.get("/:id", getTask);

// Update status 
router.put("/:id", updateTask);

router.delete("/:id", requireRole("Admin", "Professor Incharge"), deleteTask);

// Update only progress (assigned user can update their own)
router.patch("/:id/progress", updateProgress);


router.get("/:id/viewDoc",getFileURL);

router.delete("/:taskId/deliverable/:deliverableId", deleteDeliverable);

export default router;
