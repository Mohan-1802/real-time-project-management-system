import Workspace from "../models/workspace.model.js";
import Membership from "../models/membership.model.js";
import User from "../models/user.model.js";

export const createWorkspace = async (req, res) => {
    try {
        const { name, description, teamSize } = req.body;

        if (!name || !teamSize) {
            return res.status(400).json({
                success: false,
                message: "workspace name and teamsize are required !",
            });
        }

        const dupWorkspace = await Workspace.findOne({ name });

        if (dupWorkspace) {
            return res.status(400).json({
                success: false,
                message: "workspace name is not available",
            });
        }

        const workspace = await Workspace.create({
            name,
            description,
            teamSize,
            createdBy: req.user._id,
        });

        await Membership.create({
            user: req.user._id,
            workspace: workspace._id,
            role: "OWNER",
        });
        await createActivity({
            workspace:workspace._id,
            user:req.user._id,
            action:"WORKSPACE_CREATED",
            target:"WORKSPACE",
            targetId:workspace._id,
            metadata:{
               Workspace:workspace.name,
               createdBy:req.user._id,
            },
        });
        return res.status(201).json({
            success: true,
            message: "Workspace created successfully",
            workspace,
        });
    } catch (error) {
        console.log("worspace error", error);
        return res.status(500).json({
            success: false,
            message: "server error",
        });
    }
};

export const getMyWorkspace = async (req, res) => {
    try {
       const memberships = await Membership.find({
            user: req.user._id,
            }).populate({
                path: "workspace",
                model: "Workspace",
            });
        const workspaces = memberships
            .map((membership) => membership.workspace)
            .filter(Boolean);

        return res.status(200).json({
            success: true,
            workspaces,
        });

    } catch (error) {
        console.log("server error:", error);

        return res.status(500).json({
            success: false,
            message: "server problem",
        });
    }
};

export const getMyWorkspaceDetails = async (req,res)=>{
    try {
        const {workspaceId}=req.params;
        const membership = await Membership.findOne({
            user:req.user._id,
            workspace:workspaceId,
        });
        if(!membership){
            return res.status(403).json({
                success:false,
                message:"you don'thave access to this workspace",
            });
        }
        const workspace = await Workspace.findById(workspaceId);
        if(!workspace){
            return res.status(404).json({
                success:false,
                message:"workspae not foud",
            });
        }
        
    } catch (error) {
        console.log("server issue",error);
        res.status(500).json({
            success:false,
            message:"server error",
        });
    }
}

export const addMember = async (req,res)=>{
    try {
        const{workspaceId} = req.params;
        const {email,role} = req.body;
        if(!["OWNER","ADMIN","MEMBER"].includes(role)){
            return res.status(400).json({
                success:false,
                message:"Invalid role",
            });
        }

        if(req.membership.role === "ADMIN"&& role!=="MEMBER"){
            return res.status(403).json({
                success:false,
                message:"admins can only add members",
            })
        }
        const user = await User.findOne({email});

        if(!user){
            return res.status(404).json({
                success:false,
                message:"user not found",
            });
        }
        const existingmembership = await Membership.findOne({
            user:user._id,
            workspace:workspaceId,
        });
        if(existingmembership){
            return res.status(409).json({
                success:false,
                message:"user already exist in this workspace",
            });
        }
        const workspace = await Workspace.findById(workspaceId);

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found",
            });
        }
        const memberCount = await Membership.countDocuments({
            workspace:workspaceId,
        });

        if(memberCount >= workspace.teamSize){
            return res.status(400).json({
                success:false,
                message:"Workspace has reached its max team size",
            });
        }
        const membership = await Membership.create({
            user:user._id,
            workspace:workspaceId,
            role,
        });
        await createActivity({
            workspace:workspace._id,
            user:req.user._id,
            action:"MEMBER_JOINED",
            target:"MEMBER",
            targetId:membership._id,
            metadata:{
               member:membership.user,
               addedBy:req.user._id
            },
        });
        return res.status(200).json({
            success:true,
            message:"member added successfully",
            membership:{
                id:membership._id,
                user:membership.user,
                workspace:membership.workspace,
                role:membership.role,
            },
        });

    } catch (error) {
        console.log("Add member error",error);
        return res.status(500).json({
            success:false,
            message:"server error",
        });
    }
}

export const updateMemberRole = async (req, res) => {
    try {

        const { workspaceId, memberId } = req.params;
        const { role } = req.body;

        /* ---------- Validate role ---------- */

        if (!["ADMIN", "MEMBER"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Role must be ADMIN or MEMBER",
            });
        }

        /* ---------- Find target membership ---------- */

        const membership = await Membership.findOne({
            _id: memberId,
            workspace: workspaceId,
        });

        if (!membership) {
            return res.status(404).json({
                success: false,
                message: "Member not found in this workspace",
            });
        }

        /* ---------- Only OWNER can change roles ---------- */

        if (req.membership.role !== "OWNER") {
            return res.status(403).json({
                success: false,
                message: "Only the workspace owner can change member role",
            });
        }

        /* ---------- Prevent owner changing themselves ---------- */

        if (
            membership.user.toString() ===
            req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "Owner cannot change their own role",
            });
        }

        /* ---------- One ADMIN rule ---------- */

        if (role === "ADMIN") {

            const existingAdmin = await Membership.findOne({
                workspace: workspaceId,
                role: "ADMIN",
                _id: { $ne: memberId },
            });

            if (existingAdmin) {
                return res.status(403).json({
                    success: false,
                    message: "Only one ADMIN is allowed in this workspace",
                });
            }
        }
        const oldRole = membership.role;


        /* ---------- Update role ---------- */

        membership.role = role;

        await membership.save();
        await createActivity({
            workspace:workspaceId,
            user:req.user._id,
            action:"ROLE_UPDATED",
            target:"MEMBER",
            targetId:membership._id,
            metadata:{
               Member:membership.name,
               Updated_By:req.user._id,
               role:{
                old_role:oldRole,
                new_role:membership.role,
               },
            },
        });

        return res.status(200).json({
            success: true,
            message: "Member role updated successfully",
            membership: {
                id: membership._id,
                user: membership.user,
                workspace: membership.workspace,
                role: membership.role,
            },
        });

    } catch (error) {
        console.error("Update member role error:", error);

        return res.status(500).json({
            success: false,
            message: "Error updating member role",
        });
    }
};
export const removeMember = async (req,res) =>{
    try {
        const{workspaceId,memberId} = req.params;
        const membership = await Membership.findOne({
            _id: memberId,
            workspace: workspaceId,
        });

        if (!membership) {
            return res.status(404).json({
                success: false,
                message: "Member not found in this workspace",
            });
        }
        if(membership.role === "OWNER"){
            return res.status(400).json({
                success:false,
                message:"Invalid action: you are the OWNER",
            });
        }
        if(membership.role === "ADMIN" && req.membership.role === "ADMIN"){
            return res.status(403).json({
                success:false,
                message:"You can't remove an admin"
            });
        }
        await membership.deleteOne();
        await createActivity({
            workspace:workspaceId,
            user:req.user._id,
            action:"MEMBER_REMOVED",
            target:"MEMBER",
            targetId:membership._id,
            metadata:{
               Member:membership.user,
               Removed_By:req.user._id,
            },
        });
        return res.status(200).json({
            success:true,
            message:"member removed successfully",
            user:{
                id:memberId,
                workspace:workspaceId,
            },
        });
    } catch (error) {
        console.log("error while removing member :",error);
        return res.status(500).json({
            success:false,
            message:"failed to remove the member!"
        })
    }
}