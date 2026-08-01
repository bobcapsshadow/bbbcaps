import { Router } from "express";
const router=Router();

router.get("/",(req,res)=>{
  res.json({success:true,message:"ucstocks endpoint placeholder"});
});

export default router;
