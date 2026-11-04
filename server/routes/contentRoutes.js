import { Router } from "express";
import { getContent, listContent } from "../controllers/contentController.js";
const router = Router();
router.get("/", listContent);
router.get("/:key", getContent);
export default router;
