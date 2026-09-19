import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema(
    {
        user:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },
        workspace:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Workspace",
            required:true,
        },
        role:{
            type:String,
            enum:["OWNER","ADMIN","MEMBER"],
            default:"MEMBER",
        },
    },
    {
        timestamps:true,
    },
);

membershipSchema.index(
    {user:1,workspace:1},
    {unique:true}
);

const Membership = mongoose.model(
    "Membership",
    membershipSchema
);
export default Membership;