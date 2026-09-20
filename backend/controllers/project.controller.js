import Membership from "../models/membership.model.js";
import Project from "../models/project.model.js";
import Workspace from "../models/workspace.model.js";
import ProjectMember from "../models/projectMember.model.js";
import createActivity from "../services/activity.js";

export const createProject = async (req,res)=>{
    try {
        const{workspaceId} = req.params;
        const{name,description} = req.body;
        if(!name || !description){
            return res.status(400).json({
                success:false,
                message:"Invalid : missing details!",
            });
        }
        const workspace = await Workspace.findById(workspaceId);
        if(!workspace){
            return res.status(404).json({
                success:false,
                message:"Workspace not found !",
            });
        }
        const existingProject = await Project.findOne({
            name:name.trim(),
            workspace:workspaceId,
        });
        if(existingProject){
            return res.status(409).json({
                success:false,
                message:"project already exist in the workspace !"
            })
        }
        const project = await Project.create({
            name:name.trim(),
            description:description.trim(),
            workspace:workspaceId,
            createdBy:req.user._id,
        });
        await createActivity({
            workspace:workspaceId,
            project:project._id,
            user:req.user._id,
            action:"PROJECT_CREATED",
            target:"PROJECT",
            targetId:project._id,
            metadata:{
                Project:project.name,
                Desc:project.description,
            },
        });
        return res.status(201).json({
            success:true,
            message:"Project created succesfully"
        });

        
    } catch (error) {
        console.log("error in creating project",error);
        return res.status(500).json({
            success:false,
            message:"failed to create project !"
        })
    }
}

export const getProjects = async (req,res)=>{
    try {
        const {workspaceId} = req.params;
        //validate the workspace
        const workspace = await Workspace.findById(workspaceId);
        if(!workspace){
            return res.status(404).json({
                success:false,
                message:"Invalid workspace!"
            })
        }
        //validate project with workspaceID
        const projects = await Project.find({workspace:workspaceId});
        if(!projects){
            return res.status(404).json({
                success:false,
                message:"no projects found in the workspace",
            });
        }
        return res.status(200).json({
            success:true,
            message:"Here are the list of projects from the workspace",
            project:projects,
        });

    } catch (error) {
        console.log("error in viewing projects",error);
        return res.status(500).json({
            success:false,
            message:"Server error"
        })
    }    
}
export const getProjectDetails = async (req, res) => {
    try {
        const { workspaceId, projectId } = req.params;

        const projectExist = await Project.findById({
            _id:projectId,
            workspace:workspaceId
        });
        if(!projectExist){
            return res.status(403).json({
                success:false,
                message:"Invalid project details",
            });
        }

        console.log("PROJECT FOUND:", projectExist);

        return res.status(200).json({
            success: true,
            message: "TEST: Project found",
            project: projectExist
        });

    } catch (error) {
        console.log("error in viewing a single project details", error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};
export const updateProject = async (req,res)=>{
    try {
        const{workspaceId,projectId}=req.params;
        const{name,description,status}=req.body;

        if(name==undefined && description==undefined && status==undefined){
            return res.status(403).json({
                success:false,
                message:"Please enter atleast one field to update the project!",
            });
        }
        const project = await Project.findOne({
            _id: projectId,
            workspace: workspaceId
        });
        if(!project){
            return res.status(403).json({
                success:false,
                message:"project not found in the workspace!"
            });
        }
        //pp

        if (name !== undefined) {
            project.name = name;
        }

        if (description !== undefined) {
            project.description = description;
        }

        if (status !== undefined) {
            project.status = status;
        }
        await createActivity({
            workspace:workspaceId,
            project:projectId,
            user:req.user._id,
            action:"PROJECT_UPDATED",
            target:"PROJECT",
            targetId:project._id,
            metadata:{
                Project:project.name,
                Desc:project.description,
            },
        });
        //save
        await project.save();
        return res.status(200).json({
            success:true,
            message:"projectdetails updated successfully!"
        });

               
    } catch (error) {
        console.log("eroor in updating the project");
        return res.status(500).json({
            success:false,
            message:"server srror!",
            project,
        });
    }
}
export const removeProject = async (req,res)=>{
    try {
        const{workspaceId,projectId} = req.params;
        const projectExist = await Project.findOne({
            _id:projectId,
            workspace:workspaceId,
        });
        if(!projectExist){
            return res.status(404).json({
                success:false,
                message:"project not found",
            });
        }
        await projectExist.deleteOne();

        await createActivity({
            workspace:workspaceId,
            project:projectId,
            user:req.user._id,
            action:"PROJECT_DELETED",
            target:"PROJECT",
            targetId:projectExist._id,
            metadata:{
                Project:projectExist.name,
                Desc:projectExist.description,
            },
        })
        return res.status(200).json({
            success:true,
            message:"project deleted successfully!",
        });
    } catch (error) {
        console.log("error in deleting project",error);
        return res.status(500).json({
            success:false,
            message:"server error",
        });
    }
}
export const assignProjectMember = async (req,res)=>{
    try {
        const{workspaceId,projectId,membershipId} = req.params;
        const projectExist = await Project.findOne({
            _id:projectId,
            workspace:workspaceId,
        });
        if(!projectExist){
            return res.status(404).json({
                success:false,
                message:"project not found",
            });
        }
        const membership = await Membership.findOne({
            _id:membershipId,
            workspace:workspaceId,
        });
        if(!membership){
            return res.status(404).json({
                success:false,
                message:"membership not found!",
            });
        }
        const existingMember = await ProjectMember.findOne({
            project: projectId,
            user: membership.user,
        });
        if (existingMember) {
            return res.status(409).json({
            success: false,
            message: "User is already a member of this project",
            });
        }
        const projectMember = await ProjectMember.create({
            project: projectExist._id,
            user: membership.user,
            addedBy: req.user._id,
        });
        await createActivity({
            workspace:workspaceId,
            project:projectId,
            user:req.user._id,
            action:"PROJECT_MEMBER_ADDED",
            target:"MEMBER",
            targetId:projectMember._id,
            metadata:{
                Member:projectMember._id,
                AddedBy:req.user._id,
            },
        })

        return res.status(201).json({
            success:true,
            message:"member assigned to the project successfully!",
            projectMember,
        });

        
    } catch (error) {
        console.log("error in assigning project members",error);
        return res.status(500).json({
            success:false,
            message:"server error"
        })
    }
}
export const getProjectMembers = async (req, res) => {
    try {
        const { workspaceId, projectId } = req.params;

        const projectBelongs = await Project.findOne({
            _id: projectId,
            workspace: workspaceId,
        });

        if (!projectBelongs) {
            return res.status(404).json({
                success: false,
                message: "Project not found!",
            });
        }

        const projectMembers = await ProjectMember.find({
            project: projectId,
        }).populate("user", "name email avatar");

        return res.status(200).json({
            success: true,
            message: "Project members fetched successfully!",
            members: projectMembers,
        });

    } catch (error) {
        console.log("Error in viewing project members:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};
export const removeProjectMember = async (req, res) => {
    try {
        const { workspaceId, projectId, projectMemberId } = req.params;

        const projectExist = await Project.findOne({
            _id: projectId,
            workspace: workspaceId,
        });

        if (!projectExist) {
            return res.status(404).json({
                success: false,
                message: "Project not found!",
            });
        }

        const projectMemberExist = await ProjectMember.findOne({
            _id: projectMemberId,
            project: projectId,
        });

        if (!projectMemberExist) {
            return res.status(404).json({
                success: false,
                message: "Project member not found!",
            });
        }
        await projectMemberExist.deleteOne();
        await createActivity({
            workspace:workspaceId,
            project:projectId,
            user:req.user._id,
            action:"PROJECT_MEMBER_REMOVED",
            target:"PROJECT_MEMBER",
            targetId:projectMemberExist._id,
            metadata:{
                Member:projectMemberExist._id,
                RemovedBy:req.user._id,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Project member removed successfully!",
        });

    } catch (error) {
        console.log("Error in deleting project member:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};