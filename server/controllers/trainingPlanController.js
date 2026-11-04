
import mongoose from "mongoose";
import TrainingPlan from "../models/TrainingPlan.js";

// Only allow fields that belong to a training plan.
const allowedFields = [
  "fighter",
  "focus",
  "goal",
  "recommendations",
  "notes",
  "scheduledDate",
  "startTime",
  "duration",
  "status"
];

const getPlanFields = (body) => {
  const fields = {};

  for (const key of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      fields[key] = body[key];
    }
  }

  return fields;
};

const isValidId = (id) => mongoose.isValidObjectId(id);

const handleError = (res, error) => {
  console.error("Training plan error:", error.message);

  if (error.name === "ValidationError" ||
      error.name === "CastError") {
    return res.status(400).json({
      message: "Invalid training plan data.",
      details: error.message
    });
  }

  return res.status(500).json({
    message: "Unable to process training plan."
  });
};

// CREATE
// POST /api/training-plans
export const createTrainingPlan = async (req, res) => {
  try {
    const fields = getPlanFields(req.body);

    const plan = await TrainingPlan.create({
      ...fields,
      user: req.user.userId
    });

    return res.status(201).json({
      message: "Training plan saved successfully.",
      plan
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// READ ALL
// GET /api/training-plans
export const getTrainingPlans = async (req, res) => {
  try {
    const plans = await TrainingPlan.find({
      user: req.user.userId
    }).sort({
      scheduledDate: 1,
      startTime: 1
    });

    return res.status(200).json(plans);
  } catch (error) {
    return handleError(res, error);
  }
};

// READ ONE
// GET /api/training-plans/:id
export const getTrainingPlanById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid training plan ID."
      });
    }

    const plan = await TrainingPlan.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!plan) {
      return res.status(404).json({
        message: "Training plan not found."
      });
    }

    return res.status(200).json(plan);
  } catch (error) {
    return handleError(res, error);
  }
};

// UPDATE
// PATCH /api/training-plans/:id
export const updateTrainingPlan = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid training plan ID."
      });
    }

    const fields = getPlanFields(req.body);

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({
        message: "No valid fields supplied."
      });
    }

    const plan = await TrainingPlan.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.userId
      },
      { $set: fields },
      {
        new: true,
        runValidators: true
      }
    );

    if (!plan) {
      return res.status(404).json({
        message: "Training plan not found."
      });
    }

    return res.status(200).json({
      message: "Training plan updated successfully.",
      plan
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// DELETE
// DELETE /api/training-plans/:id
export const deleteTrainingPlan = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid training plan ID."
      });
    }

    const plan = await TrainingPlan.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!plan) {
      return res.status(404).json({
        message: "Training plan not found."
      });
    }

    return res.status(200).json({
      message: "Training plan deleted successfully."
    });
  } catch (error) {
    return handleError(res, error);
  }
};
