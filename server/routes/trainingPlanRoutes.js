
import express from "express";

import {
  createTrainingPlan,
  getTrainingPlans,
  getTrainingPlanById,
  updateTrainingPlan,
  deleteTrainingPlan
} from "../controllers/trainingPlanController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All training plan routes require authentication.
router.use(protect);

router.route("/")
  .get(getTrainingPlans)
  .post(createTrainingPlan);

router.route("/:id")
  .get(getTrainingPlanById)
  .patch(updateTrainingPlan)
  .delete(deleteTrainingPlan);

export default router;
