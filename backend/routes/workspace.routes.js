import express from "express";

import { addMember, createWorkspace,getMyWorkspace, getMyWorkspaceDetails, removeMember, updateMemberRole } from "../controllers/workspace.controllers.js";
import { protect } from "../middlewear/auth.middlewear.js";
import { requireRole } from "../middlewear/role.middlewear.js";
import { acceptInvitation, inviteMember } from "../controllers/invitation.controller.js";
import { assignProjectMember, createProject, getProjectDetails, getProjectMembers, getProjects, removeProject, removeProjectMember, updateProject } from "../controllers/project.controller.js";

const router = express.Router();

router.post("/",protect,createWorkspace);
router.get("/",protect,getMyWorkspace);
router.get("/:workspaceId",protect,getMyWorkspaceDetails);
router.get(
    "/:workspaceId/owner-test",
    protect,
    requireRole("ADMIN"),
    (req,res)=>{
        res.status(200).json({
            success:true,
            message:"admin access granted",
            role:req.membership.role,
        });
    })
router.post("/:workspaceId/member",protect,requireRole("OWNER","ADMIN"),addMember);
router.patch("/:workspaceId/member/:memberId",
    protect,requireRole("OWNER"),
    updateMemberRole
);
router.delete("/:workspaceId/member/:memberId",protect,requireRole("OWNER","ADMIN"),removeMember);
router.post(
    "/:workspaceId/invitation",
    protect,
    requireRole("OWNER", "ADMIN"),
    inviteMember
);
router.post("/:workspaceId/member/:token/accept",protect,acceptInvitation);
router.post(
    "/:workspaceId/project",
    protect,
    requireRole("OWNER","ADMIN"),
    createProject
    );
router.get("/:workspaceId/project",protect,requireRole("MEMBER","OWNER","ADMIN"),getProjects);
router.get("/:workspaceId/project/:projectId",protect,requireRole("MEMBER","OWNER","ADMIN"),getProjectDetails);
router.patch("/:workspaceId/project/:projectId",protect,requireRole("OWNER","ADMIN"),updateProject);
router.delete("/:workspaceId/project/:projectId",protect,requireRole("OWNER","ADMIN"),removeProject);
router.post("/:workspaceId/member/:membershipId/project/:projectId",protect,requireRole("OWNER","ADMIN"),assignProjectMember);
router.get("/:workspaceId/project/:projectId/member",protect,requireRole("OWNER","ADMIN"),getProjectMembers);
router.delete("/:workspaceId/project/:projectId/projectmember/:projectMemberId",protect,requireRole("OWNER","ADMIN"),removeProjectMember);


export default router;