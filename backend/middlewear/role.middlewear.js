import Membership from "../models/membership.model.js";

export const requireRole = (...allowedRoles)=>{
    return async(req,res,next)=>{
        try {
            const{workspaceId} = req.params;

            const membership = await Membership.findOne({
                    user:req.user._id,
                    workspace:workspaceId,
            });

            if(!membership){
                return res.status(403).json({
                    success:false,
                    message:"you are not a member of this workspace",
                });
            }

            if(!allowedRoles.includes(membership.role)){
                return res.status(403).json({
                    success:false,
                    message:"you dont have permission for this action",
                });
            }
            req.membership = membership;
            next();
        } catch (error) {
            console.log("role middlewear error",error);
            return res.status(500).json({
                success:false,
                message:"server error",
            });
            
        }
    }
}