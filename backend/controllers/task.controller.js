import Task from "../models/task.model.js";
import Project from "../models/project.model.js";
import createActivity from "../services/activity.js";
import Workspace from "../models/workspace.model.js";
import Membership from "../models/membership.model.js";

export const createTask = async (req, res) => {
    try {
        const { workspaceId, projectId } = req.params;

        const {
            title,
            description,
            assignedTo,
            priority,
            dueDate,
            labels,
        } = req.body;

        const project = await Project.findOne({
            _id: projectId,
            workspace: workspaceId,
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found!",
            });
        }

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Task title is required",
            });
        }

        const task = await Task.create({
            title: title.trim(),
            description,
            project: projectId,
            createdBy: req.user._id,
            assignedTo: assignedTo || null,
            priority: priority || "MEDIUM",
            dueDate: dueDate || null,
            labels: labels || [],
        });

        await createActivity({
            workspace: workspaceId,
            project: projectId,
            user: req.user._id,
            action: "TASK_CREATED",
            target: "TASK",
            targetId: task._id,
            metadata: {
                title: task.title,
                assignedTo: task.assignedTo,
                priority: task.priority,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Task created successfully!",
            task,
        });

    } catch (error) {
        console.error("Error creating task:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};
export const getTasks = async(req,res)=>{
    try {
        const{workspaceId,projectId} = await req.params;
        const workspace = await Workspace.findById(workspaceId);
        if(!workspace){
            return res.status(403).json({
                success:false,
                message:"workspace not found!",
            });
        }
        const project = await Project.findOne({
            workspace:workspaceId,
        });
        if(!project){
            return res.status(403).json({
                success:false,
                message:"project not found!",
            });
        }
        const tasks = await Task.find({project:projectId})
        if(!tasks){
            return res.status(404).json({
                success:true,
                message:"No tasks found !"
            })
        }
        return res.status(200).json({
            success:true,
            message:"here is the list of tasks",
            Tasks:tasks,
        });
        
    } catch (error) {
        console.log("error in viewing tasks",error);
        return res.status(500).json({
            success:true,
            message:"server error",
        });
    }
}
export const updateTask = async (req,res)=>{
    try {
        const{workspaceId,projectId,taskId}=req.params;
        const{assignedTo}=req.body;

        if(assignedTo==undefined){
            return res.status(403).json({
                success:false,
                message:"Please enter atleast one field to update the project!",
            });
        }
        const task = await Task.findOne({
            _id: taskId,
            project: projectId,
        });
        if(!task){
            return res.status(403).json({
                success:false,
                message:"Task not found in the project!"
            });
        }
        //pp

        if (assignedTo !== undefined) {
            Task.assignedTo = assignedTo;
        }
        
        //save
        await Task.save();
        return res.status(200).json({
            success:true,
            message:"Task details updated successfully!"
        });

    } 
    catch (error) {
        console.log("error in updating task details",error);
        return res.status(500).json({
            success:false,
            message:"server error",
        });
    }
}
