import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true,
        maxlength:50,
    },
    description:{
        type:String,
        required:true,
    },
    workspace:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Workspace",
        required:true,
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    status:{
        type:String,
        enum:["ACTIVE","ARCHIVED"],
        default:"ACTIVE",
    },

},
{
    timestamps:true,
})

const Project = mongoose.model("Project",projectSchema);
export default Project;