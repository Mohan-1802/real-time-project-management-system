import express from "express";
import { register,login, logout} from "../controllers/auth.controllers.js";
import { protect } from "../middlewear/auth.middlewear.js";
const router = express.Router();

router.post("/register",register);
router.post("/login",login);
router.post("/logout",logout);

router.get("/me",protect,(req,res)=>{
    res.status(200).json({
        success:true,
        message:"you are authenticated",
        user:{
            id:req.user._id,
            name:req.user.name,
            email:req.user.email,
        },
    });
});

export default router;