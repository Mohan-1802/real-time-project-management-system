import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
    {
        workspace: {
            type: mongoose.Types.ObjectId,
            ref: "Workspace",
            required: true,
        },

        project: {
            type: mongoose.Types.ObjectId,
            ref: "Project",
        },

        user: {
            type: mongoose.Types.ObjectId,
            ref: "User",
            required: true,
        },

        action: {
            type: String,
            enum: [
                "WORKSPACE_CREATED",
                "MEMBER_INVITED",
                "MEMBER_JOINED",
                "MEMBER_REMOVED",
                "ROLE_UPDATED",
                "INVITATION_ACCEPTED",
                "PROJECT_CREATED",
                "PROJECT_UPDATED",
                "PROJECT_ARCHIVED",
                "PROJECT_DELETED",
                "PROJECT_MEMBER_ADDED",
                "PROJECT_MEMBER_REMOVED",
            ],
            required: true,
        },

        target: {
            type: String,
            enum: [
                "WORKSPACE",
                "MEMBER",
                "PROJECT",
                "INVITATION",
                "PROJECT_MEMBER",
            ],
            required: true,
        },

        targetId: {
            type: mongoose.Types.ObjectId,
            required: true,
        },

        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;