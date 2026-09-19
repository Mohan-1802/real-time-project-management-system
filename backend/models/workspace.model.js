import mongoose from "mongoose";
const workspaceSchema = new mongoose.Schema(
    {
        name:{
            type:String,
            required:true,
            trim:true,
            maxlength:100,
        },
        description:{
            type:String,
            trim:true,
            maxlength:500,
            default:"",
        },
        createdBy:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },
        teamSize:{
            type:Number,
            required:true,
            min:1,
            max:100,
        },
        avatar:{
            type:String,
            default:"",
        },
    },
    {
        timestamps:true,
    }
);

const Workspace = mongoose.model("Workspace",workspaceSchema);
export default Workspace;