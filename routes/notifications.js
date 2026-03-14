import { Router } from "express";
import { authRequired } from "../middleware/auth.js";

import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from "../controllers/notificationController.js";

const router = Router();
router.use(authRequired);

// Get notifications
router.get("/", getNotifications);

// Mark one notification read
router.patch("/:id/read", markNotificationRead);

// Mark all notifications read
router.patch("/read-all", markAllNotificationsRead);

export default router;