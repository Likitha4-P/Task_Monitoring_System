import { Router } from "express";
import { login, forgotPassword,resetPassword } from "../controllers/authController.js";

const router = Router();

// POST /api/auth/login
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);


export default router;
