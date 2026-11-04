
import express from "express";

import {
  createFighter,
  getFighters,
  getFighterById,
  updateFighter,
  deleteFighter
} from "../controllers/fighterController.js";

const router = express.Router();

router.route("/")
  .get(getFighters)
  .post(createFighter);

router.route("/:id")
  .get(getFighterById)
  .patch(updateFighter)
  .delete(deleteFighter);

export default router;
