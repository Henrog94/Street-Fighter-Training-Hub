import express from "express";
import steamNewsRoutes from "./routes/steamNewsRoutes.js";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import fighterRoutes from "./routes/fighterRoutes.js";
import contentRoutes from "./routes/contentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import trainingPlanRoutes from "./routes/trainingPlanRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import path from "path";
import fs from "fs";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173"
  })
);

app.use(express.json());


const avatarDirectory = path.resolve(
  "uploads",
  "avatars"
);

fs.mkdirSync(avatarDirectory, {
  recursive: true
});

app.use(
  "/uploads/avatars",
  express.static(avatarDirectory)
);


// Main API test
app.get("/", (req, res) => {
  res.json({
    message: "FightLab API is running!"
  });
});

// Database connection status
app.get("/api/health", (req, res) => {
  res.json({
    status: "success",
    message: "FightLab backend connected",
    database: mongoose.connection.name,
    readyState: mongoose.connection.readyState
  });
});

// Fighter CRUD routes
app.use("/api/fighters", fighterRoutes);
app.use("/api/data", contentRoutes);
app.use("/api/steam", steamNewsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/training-plans", trainingPlanRoutes);
app.use("/api/profile/favorites", favoriteRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/progress", progressRoutes);
app.use("/uploads/replays",express.static(path.resolve("uploads","replays")));

// Handle unknown API endpoints
app.use("/api", (req, res) => {
  res.status(404).json({
    message: "API endpoint not found"
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(
      `FightLab backend running on http://localhost:${PORT}`
    );
  });
}

startServer();
