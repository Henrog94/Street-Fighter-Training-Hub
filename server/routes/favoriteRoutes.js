import {Router} from 'express';
import User from '../models/User.js';
import {protect} from '../middleware/authMiddleware.js';
const router=Router();router.use(protect);
router.get('/',async(req,res)=>{try{const u=await User.findById(req.user.userId);if(!u)return res.status(404).json({message:'User not found'});res.json({favorites:u.favorites||[]})}catch{res.status(500).json({message:'Unable to load favorites'})}});
router.put('/',async(req,res)=>{try{const {favorites}=req.body;if(!Array.isArray(favorites)||favorites.length>60||favorites.some(f=>typeof f!=='string'||!f.trim()||f.length>80))return res.status(400).json({message:'Invalid favorites list'});const cleaned=[...new Set(favorites.map(f=>f.trim()))];const u=await User.findByIdAndUpdate(req.user.userId,{$set:{favorites:cleaned}},{new:true,runValidators:true});if(!u)return res.status(404).json({message:'User not found'});res.json({favorites:u.favorites})}catch{res.status(500).json({message:'Unable to save favorites'})}});
export default router;
