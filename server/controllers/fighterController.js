
import mongoose from "mongoose";
import Fighter from "../models/Fighter.js";

// CREATE - Add a fighter
export const createFighter = async (req, res) => {
  try {
    const fighter = await Fighter.create(req.body);

    res.status(201).json(fighter);
  } catch (error) {
    res.status(400).json({
      message: "Failed to create fighter",
      error: error.message
    });
  }
};

// READ - Get all fighters
export const getFighters = async (req, res) => {
  try {
    const fighters = await Fighter.find().sort({ name: 1 });

    res.status(200).json(fighters);
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve fighters",
      error: error.message
    });
  }
};

// READ - Get one fighter
export const getFighterById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid fighter ID"
      });
    }

    const fighter = await Fighter.findById(req.params.id);

    if (!fighter) {
      return res.status(404).json({
        message: "Fighter not found"
      });
    }

    res.status(200).json(fighter);
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve fighter",
      error: error.message
    });
  }
};

// UPDATE - Modify an existing fighter
export const updateFighter = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid fighter ID"
      });
    }

    const fighter = await Fighter.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!fighter) {
      return res.status(404).json({
        message: "Fighter not found"
      });
    }

    res.status(200).json(fighter);
  } catch (error) {
    res.status(400).json({
      message: "Failed to update fighter",
      error: error.message
    });
  }
};

// DELETE - Remove a fighter
export const deleteFighter = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid fighter ID"
      });
    }

    const fighter = await Fighter.findByIdAndDelete(req.params.id);

    if (!fighter) {
      return res.status(404).json({
        message: "Fighter not found"
      });
    }

    res.status(200).json({
      message: "Fighter deleted successfully",
      fighter
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete fighter",
      error: error.message
    });
  }
};
