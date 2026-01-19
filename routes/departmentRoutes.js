import { Router } from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
const router = Router();
// router.use(authRequired);
import { getDepartments, addDepartment, getDepartmentStats, getDepartmentUsers } from "../controllers/departmentController.js";


router.get("/", getDepartments);
router.post("/", addDepartment);
router.get("/:id/stats", getDepartmentStats);
router.get("/:id/users", getDepartmentUsers);
export default router;