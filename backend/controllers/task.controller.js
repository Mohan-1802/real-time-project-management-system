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
            Tasks:{
                task_List:tasks.title,
            },
        });
        
    } catch (error) {
        console.log("error in viewing tasks",error);
        return res.status(500).json({
            success:true,
            message:"server error",
        });
    }
}
export const updateTask = async (req, res) => {
    try {
        const { workspaceId, projectId, taskId } = req.params;
        const { title, description, priority } = req.body;

        if (
            title === undefined &&
            description === undefined &&
            priority === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter at least one field to update the task!",
            });
        }

        const task = await Task.findOne({
            _id: taskId,
            project: projectId,
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found in the project!",
            });
        }

        if (title !== undefined) {
            task.title = title;
        }

        if (description !== undefined) {
            task.description = description;
        }

        if (priority !== undefined) {
            task.priority = priority;
        }

        await task.save();
         await createActivity({
            workspace: workspaceId,
            project: projectId,
            user: req.user._id,
            action: "TASK_UPDATED",
            target: "TASK",
            targetId: task._id,
            metadata: {
                title: task.title,
                priority: task.priority,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Task details updated successfully!",
            task,
        });

    } catch (error) {
        console.log("Error in updating task details:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};
export const removeTask = async (req,res)=>{
    try {
        const{workspaceId,projectId,taskId}= await req.params;
        const workspace = await Workspace.findById(workspaceId);
        if(!workspace){
            return res.status(404).json({
                success:false,
                message:"workspace not found",
            });
        }
        const project = await Project.findOne({
            _id:projectId,
            workspace:workspaceId,
        });
        if(!project){
            return res.status(404).json({
                success:false,
                message:"project not found in the workspace ",
            });
        }
        const task = await Task.findOne({
            _id:taskId,
            project:projectId,
        });
        if(!task){
            return res.status(404).json({
                success:false,
                message:"task not found",
            });
        }
        await task.deleteOne();
        await createActivity({
            workspace: workspaceId,
            project: projectId,
            user: req.user._id,
            action: "TASK_DELETED",
            target: "TASK",
            targetId: task._id,
            metadata: {
                title: task.title,
                priority: task.priority,
            },
        });
        
    } catch (error) {
        console.log("error in deleting task",error);
        return res.status(500).json({
            success:false,
            message:"server error",
        });
    }
}
export const assignTask = async(req,res)=>{
    try {
        const{workspaceId,projectId,taskId}=  req.params;
        const{assignedTo} = req.body;
        if(assignedTo===undefined){
            return res.status(403).json({
                success:false,
                message:"enter the field to assign task to someone"
            })
        }
        const workspace = await Workspace.findById(workspaceId);
        if(!workspace){
            return res.status(404).json({
                success:false,
                message:"workspace not found",
            });
        }
        const project = await Project.findOne({
            _id:projectId,
            workspace:workspaceId,
        });
        if(!project){
            return res.status(404).json({
                success:false,
                message:"project not found in the workspace ",
            });
        }
        const task = await Task.findOne({
            _id:taskId,
            project:projectId,
        });
        if(!task){
            return res.status(404).json({
                success:false,
                message:"task not found",
            });
        }
        const isMemberAssigned = await Membership.findOne({
            user: assignedTo,
            workspace: workspaceId,
        });
        if(!isMemberAssigned){
            return res.status(403).json({
                success:false,
                message:"Bad request",
            });
        }
        task.assignedTo=assignedTo;
        await task.save();
         await createActivity({
            workspace: workspaceId,
            project: projectId,
            user: req.user._id,
            action: "TASK_ASSIGNED",
            target: "TASK",
            targetId: task._id,
            metadata: {
                title: task.title,
                priority: task.priority,
            },
        });
        return res.status(200).json({
            success: true,
            message: "Task assigned successfully!",
            task,
        });


        
    } catch (error) {
        console.log("error in assigning task",error);
        return res.status(500).json({
            success:false,
            message:"server error",
        });
    }
}
