import { Router } from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import { createEvent, listEvents, approveEvent, rejectEvent, getApprovedEvents,getEventSummary, updateStatus } from "../controllers/eventController.js";

const router = Router();
router.use(authRequired);

router.post("/", requireRole("Department Head","Professor Incharge"),createEvent);
router.get("/", listEvents);
router.post("/:id/approve", requireRole("Admin"), approveEvent);
router.post("/:id/reject", requireRole("Admin"), rejectEvent);
router.put("/:id/:status", requireRole("Department Head"), updateStatus);

router.get("/approved", getApprovedEvents);
router.get("/event-summary", getEventSummary);



export default router;




