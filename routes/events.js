import { Router } from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import { createEvent, listEvents, approveEvent, rejectEvent, getApprovedEvents,getEventSummary } from "../controllers/eventController.js";

const router = Router();
router.use(authRequired);

router.post("/", requireRole("Admin", "Principal/Management", "Department Head"),createEvent); // anyone logged-in can propose
router.get("/", listEvents);
router.post("/:id/approve", requireRole("Admin", "Principal/Management", "Department Head"), approveEvent);
router.post("/:id/reject", requireRole("Admin", "Principal/Management", "Department Head"), rejectEvent);
router.get("/approved", getApprovedEvents);
router.get("/event-summary", getEventSummary);


export default router;
