
import User from "../models/User.js";
import fs from "fs/promises";
import path from "path";

const avatarDirectory = path.resolve(
  "uploads",
  "avatars"
);

// Safely remove an avatar stored in our upload directory.
const removeAvatarFile = async (avatarPath) => {
  if (!avatarPath?.startsWith("/uploads/avatars/")) {
    return;
  }

  const filename = path.basename(avatarPath);

  try {
    await fs.unlink(
      path.join(avatarDirectory, filename)
    );
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error(
        "Avatar cleanup error:",
        error.message
      );
    }
  }
};

// POST /api/profile/avatar
export const updateAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "Please upload an image."
    });
  }

  const newAvatarPath =
    `/uploads/avatars/${req.file.filename}`;

  try {
    const user = await User.findById(
      req.user.userId
    );

    if (!user) {
      await removeAvatarFile(newAvatarPath);

      return res.status(404).json({
        message: "User not found."
      });
    }

    const previousAvatar = user.avatar;

    user.avatar = newAvatarPath;
    await user.save();

    await removeAvatarFile(previousAvatar);

    return res.status(200).json({
      message: "Profile picture updated.",
      avatar: user.avatar,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    await removeAvatarFile(newAvatarPath);

    console.error(
      "Avatar update error:",
      error.message
    );

    return res.status(500).json({
      message: "Unable to update profile picture."
    });
  }
};

// DELETE /api/profile/avatar
export const deleteAvatar = async (req, res) => {
  try {
    const user = await User.findById(
      req.user.userId
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    const previousAvatar = user.avatar;

    user.avatar = "";
    await user.save();

    await removeAvatarFile(previousAvatar);

    return res.status(200).json({
      message: "Profile picture removed.",
      avatar: ""
    });
  } catch (error) {
    console.error(
      "Avatar deletion error:",
      error.message
    );

    return res.status(500).json({
      message: "Unable to remove profile picture."
    });
  }
};
