import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema(
    {
        workspace:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Workspace",
            required:true,
        },
        invitedBy:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },
        email:{
            type:String,
            required:true,
        },
        role:{
            type:String,
            enum:["ADMIN","MEMBER"],
            default:"MEMBER",
        },
        token:{
            type:String,
            required:true,
        },
        status:{
            type:String,
            enum:["PENDING","ACCEPTED","EXPIRED"],
            default:"PENDING",
        },
        expiresAt:{
            type:Date,
        },
    },
    {
        timestamps:true,
    },
);

const Invitation = mongoose.model("Invitation",invitationSchema);
export default Invitation;