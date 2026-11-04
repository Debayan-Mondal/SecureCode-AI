import express from "express";

import {
  createScan,
  getScans,
  getScanById,
  getScanFindings,
  deleteScan,
  updateFindingStatus,
} from "../controllers/scanController.js";

import { generateScanReport } from "../controllers/reportController.js";
import { globalSearch } from "../controllers/searchController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();


router.use(protect);


router.post("/", createScan);
router.get("/", getScans);


router.get("/:id/findings", getScanFindings);
router.patch("/:id/findings/:findingId/status",updateFindingStatus);
router.patch("/:id/findings/:findingId/status",updateFindingStatus);
router.get("/:id/report", generateScanReport);

router.get("/search", globalSearch);

router.get("/:id", getScanById);
router.delete("/:id", deleteScan);


export default router;
