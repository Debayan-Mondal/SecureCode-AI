import express from "express";
import {
  explainFinding,
  generateFindingFix,
} from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/explain/:findingId", explainFinding);
router.post("/fix/:findingId", generateFindingFix);

export default router;