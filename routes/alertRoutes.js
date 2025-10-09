import { Router } from "express";
import { getSystemAlerts } from "../controllers/alertController.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.get("/", authRequired, getSystemAlerts);

export default router;
