import express from "express";

import { assignTask, createTask, getTasks, removeTask, updateTask } from "../controllers/task.controller.js";
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
router.patch(
    "/:workspaceId/project/:projectId/task/:taskId",
    protect,
    requireRole("OWNER", "ADMIN"),
    updateTask
);
router.delete(
    "/:workspaceId/project/:projectId/task/:taskId",
    protect,
    requireRole("OWNER", "ADMIN"),
    removeTask
);
router.patch(
    "/:workspaceId/project/:projectId/task/:taskId/assign",
    protect,
    requireRole("OWNER", "ADMIN"),
    assignTask
);
export default router;