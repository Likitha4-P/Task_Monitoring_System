import { Router } from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import { listUsers, createUser, updateUser, deleteUser, getUserById } from "../controllers/userController.js";

const router = Router();
router.use(authRequired);

// List all users (Admin only)
router.get("/", listUsers);

// Get single user by ID (Admin only, or self)
router.get("/:id", getUserById);

// Create user
router.post("/", requireRole("Admin"), createUser);

// Update user
router.put("/:id", requireRole("Admin"), updateUser);

// Delete user
router.delete("/:id", requireRole("Admin"), deleteUser);

export default router;
