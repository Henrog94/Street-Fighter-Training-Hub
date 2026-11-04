
import express from "express";
import multer from "multer";

import { protect } from "../middleware/authMiddleware.js";

import { uploadAvatar } from "../middleware/uploadMiddleware.js";

import {
  updateAvatar,
  deleteAvatar
} from "../controllers/profileController.js";

const router = express.Router();

// All profile routes require authentication.
router.use(protect);

// Upload a new profile picture.
router.post("/avatar", (req, res) => {
  uploadAvatar(req, res, (error) => {
    if (error) {
      return res.status(
        error instanceof multer.MulterError ? 400 : 400
      ).json({
        message: error.message
      });
    }

    return updateAvatar(req, res);
  });
});

// Remove the current profile picture.
router.delete("/avatar", deleteAvatar);

export default router;
