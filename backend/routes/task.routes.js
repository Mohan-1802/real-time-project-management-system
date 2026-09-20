import express from "express";

import { createTask, getTasks } from "../controllers/task.controller.js";
import { protect } from "../middlewear/auth.middlewear.js";
import { requireRole } from "../middlewear/role.middlewear.js";

const router = express.Router();

router.post(
    "/:workspaceId/project/:projectId/task",
    protect,
    requireRole("OWNER", "ADMIN"),
    createTask
);
router.get(
    "/:workspaceId/project/:projectId/task",
    protect,
    requireRole("OWNER", "ADMIN"),
    getTasks
);
export default router;