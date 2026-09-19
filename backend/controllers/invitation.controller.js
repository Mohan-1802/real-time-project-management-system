import Invitation from "../models/invitation.model.js";
import Membership from "../models/membership.model.js";
import Workspace from "../models/workspace.model.js";
import crypto from "crypto";
import User from "../models/user.model.js";
import mongoose from "mongoose";

export const inviteMember = async (req,res)=>{
    try {
        const{workspaceId} = req.params;
        const{email,role} = req.body;
        if(!email || !role){
            return res.status(400).json({
                success:false,
                message:"please enter all the fields!"
            });
        }
        if (!["ADMIN", "MEMBER"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Role must be ADMIN or MEMBER",
            });
        }
        if(req.membership.role === "ADMIN" && role === "ADMIN"){
            return res.status(403).json({
                success:false,
                message:"Admin can's invite another admin!"
            });
        }
        
        const userExist = await User.findOne({email:email.trim().toLowerCase(),});

        if (userExist) {
            const membershipExist = await Membership.findOne({
                user: userExist._id,
                workspace: workspaceId
            });

        if (membershipExist) {
            return res.status(409).json({
                success: false,
                message: "Member already exists",
            });
        }
        }
        //checking whether the invitation sent and also the status [A,P,E]
        const inviteSent = await Invitation.findOne({workspace:workspaceId,email,status:"PENDING"});
        if(inviteSent){
            return res.status(409).json({
                success:false,
                message:"Invitation already sent and its in pending status",
            });
        }
        //admin check for invitation mail
        const adminExist = await Membership.findOne({
                workspace:workspaceId,
                role:"ADMIN",
            });
        if(role === "ADMIN" && adminExist){
            return res.status(403).json({
                success:false,
                message:"workspace already has an admin",
            });
        }
        const token = crypto.randomBytes(32).toString("hex");       
        const expiresAt = new Date(Date.now() + 7*24*60*60*1000);
        const invitation = await Invitation.create({
            workspace: workspaceId,
            invitedBy: req.user._id,
            email: email.trim().toLowerCase(),
            role,
            token,
            expiresAt,
        });
        await createActivity({
            workspace: workspaceId,
            user: req.user._id,
            action: "MEMBER_INVITED",
            target: "INVITATION",
            targetId: invitation._id,
            metadata: {
                email: invitation.email,
                role: invitation.role,
                invitedBy: req.user._id,
                expiresAt: invitation.expiresAt,
    },
});
        return res.status(201).json({
            success:true,
            message:"Invitation created succesfully",
        });
    } catch (error) {
        console.log("invite member error",error);
        return res.status(500).json({
            success:false,
            message:"invitation failed",
        });
    }
}
export const acceptInvitation = async (req, res) => {
    let session;

    try {
        session = await mongoose.startSession();
        session.startTransaction();

        const { token } = req.params;

        // Find invitation
        const invitation = await Invitation.findOne({
            token,
        }).session(session);

        if (!invitation) {
            await session.abortTransaction();
            session.endSession();

            return res.status(404).json({
                success: false,
                message: "Invitation not found",
            });
        }

        // Check expiration
        if (invitation.expiresAt < new Date()) {
            await session.abortTransaction();
            session.endSession();

            return res.status(400).json({
                success: false,
                message: "Invitation has expired!",
            });
        }

        // Check invitation status
        if (invitation.status !== "PENDING") {
            await session.abortTransaction();
            session.endSession();

            return res.status(400).json({
                success: false,
                message: "Invitation is no longer valid",
            });
        }

        // Check invited email
        if (req.user.email !== invitation.email) {
            await session.abortTransaction();
            session.endSession();

            return res.status(403).json({
                success: false,
                message: "This invitation was not sent to your email",
            });
        }

        // Find workspace
        const workspace = await Workspace.findById(
            invitation.workspace
        ).session(session);

        if (!workspace) {
            await session.abortTransaction();
            session.endSession();

            return res.status(404).json({
                success: false,
                message: "Workspace not found",
            });
        }

        // Check workspace team size
        const memberCount = await Membership.countDocuments({
            workspace: invitation.workspace,
        }).session(session);

        if (memberCount >= workspace.teamSize) {
            await session.abortTransaction();
            session.endSession();

            return res.status(400).json({
                success: false,
                message: "Workspace has reached its maximum team size",
            });
        }

        // Create membership
        const membership = await Membership.create(
            [
                {
                    user: req.user._id,
                    workspace: invitation.workspace,
                    role: invitation.role,
                },
            ],
            { session }
        );

        const createdMembership = membership[0];

        // Mark invitation as accepted
        invitation.status = "ACCEPTED";

        await invitation.save({ session });

        // Create activity log
        await createActivity({
            workspace: invitation.workspace,
            user: req.user._id,
            action: "MEMBER_JOINED",
            target: "MEMBER",
            targetId: createdMembership._id,
            metadata: {
                member: createdMembership.user,
                role: createdMembership.role,
                invitation: invitation._id,
            },
            session,
        });

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            success: true,
            message: "Invitation accepted successfully",
            membership: {
                id: createdMembership._id,
                user: createdMembership.user,
                workspace: createdMembership.workspace,
                role: createdMembership.role,
            },
        });

    } catch (error) {

        if (session) {
            await session.abortTransaction();
            session.endSession();
        }

        console.log("Accept invitation error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to accept invitation",
        });
    }
};