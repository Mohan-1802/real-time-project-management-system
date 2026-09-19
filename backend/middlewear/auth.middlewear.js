import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || "";
        const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
        const token = req.cookies?.token || bearerToken;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "not authenticated",
            });
        }

        const decode = jwt.verify(token, process.env.JWT_SECRET || "project_manager_secret");
        const user = await User.findById(decode.userId).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};