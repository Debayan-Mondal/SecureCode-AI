import mongoose from "mongoose";
import Scan from "../models/Scan.js";
import Finding from "../models/Finding.js";
import { scanSourceCode } from "../services/semgrepService.js";

const ALLOWED_LANGUAGES = [
  "javascript",
  "typescript",
  "python",
];

const MAX_CODE_SIZE = 100 * 1024; 

const FILE_LANGUAGE_MAP = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
};





export const createScan = async (req, res) => {
  let scan;

  try {
    const {
      name,
      language,
      code,
      sourceType = "editor",
      fileName,
    } = req.body;

    
    if (typeof code !== "string" || !code.trim()) {
      return res.status(400).json({
        message: "Please provide source code to scan.",
      });
    }

    if (Buffer.byteLength(code, "utf8") > MAX_CODE_SIZE) {
      return res.status(413).json({
        message: "Source code cannot exceed 100 KB.",
      });
    }

    
    if (!ALLOWED_LANGUAGES.includes(language)) {
      return res.status(400).json({
        message: "Unsupported programming language.",
      });
    }

    
    if (!["editor", "upload"].includes(sourceType)) {
      return res.status(400).json({
        message: "Invalid scan source type.",
      });
    }

    let sanitizedFileName = null;

    
    if (sourceType === "upload") {
      if (
        typeof fileName !== "string" ||
        !fileName.trim()
      ) {
        return res.status(400).json({
          message: "A filename is required for uploaded scans.",
        });
      }

      
      
      const normalizedName = fileName.replace(/\\/g, "/");

      sanitizedFileName = normalizedName
        .split("/")
        .pop()
        .replace(/[\u0000-\u001f\u007f]/g, "")
        .trim()
        .slice(0, 255);

      if (
        !sanitizedFileName ||
        sanitizedFileName.startsWith(".")
      ) {
        return res.status(400).json({
          message: "Invalid uploaded filename.",
        });
      }

      const extension = sanitizedFileName
        .split(".")
        .pop()
        .toLowerCase();

      const expectedLanguage = FILE_LANGUAGE_MAP[extension];

      if (!expectedLanguage) {
        return res.status(400).json({
          message: "Unsupported uploaded file type.",
        });
      }

      if (expectedLanguage !== language) {
        return res.status(400).json({
          message:
            "Uploaded file extension does not match the selected language.",
        });
      }
    }

    
    scan = await Scan.create({
      user: req.user._id,
      name:
        typeof name === "string" && name.trim()
          ? name.trim().slice(0, 100)
          : "Untitled Scan",
      language,
      sourceType,
      fileName: sanitizedFileName,
      status: "running",
      startedAt: new Date(),
    });

    
    const result = await scanSourceCode({
      code,
      language,
    });

    
    if (result.findings.length > 0) {
      const findingsToSave = result.findings.map((finding) => ({
        ...finding,
        scan: scan._id,
        user: req.user._id,
      }));

      await Finding.insertMany(findingsToSave);
    }

    
    const completedAt = new Date();

    const duration =
      completedAt.getTime() - scan.startedAt.getTime();

    
    scan.status = "completed";
    scan.summary = result.summary;
    scan.completedAt = completedAt;
    scan.duration = duration;

    await scan.save();

    return res.status(201).json({
      message: "Scan completed successfully.",
      scan: {
        id: scan._id,
        name: scan.name,
        language: scan.language,
        sourceType: scan.sourceType,
        fileName: scan.fileName,
        status: scan.status,
        summary: scan.summary,
        duration: scan.duration,
        createdAt: scan.createdAt,
        completedAt: scan.completedAt,
      },
      findings: result.findings,
    });
  } catch (error) {
    
    console.error("Scan creation error:", error);

    
    if (scan) {
      await Finding.deleteMany({
        scan: scan._id,
        user: req.user._id,
      }).catch((cleanupError) => {
        console.error(
          "Unable to clean up failed scan findings:",
          cleanupError.message
        );
      });

      
      scan.status = "failed";
      scan.errorMessage =
        "Scan could not be completed. Please try again.";

      scan.completedAt = new Date();

      scan.duration = scan.startedAt
        ? scan.completedAt.getTime() - scan.startedAt.getTime()
        : 0;

      await scan.save().catch((saveError) => {
        console.error(
          "Unable to update failed scan:",
          saveError.message
        );
      });
    }

    return res.status(500).json({
      message: "Unable to complete the security scan.",
    });
  }
};





export const getScans = async (req, res) => {
  try {
    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      50,
      Math.max(
        1,
        Number.parseInt(req.query.limit, 10) || 10
      )
    );

    const skip = (page - 1) * limit;

    const filter = {
      user: req.user._id,
    };

    const [scans, totalScans] = await Promise.all([
      Scan.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-__v"),

      Scan.countDocuments(filter),
    ]);

    return res.status(200).json({
      scans,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalScans / limit),
        totalScans,
        limit,
      },
    });
  } catch (error) {
    console.error("Get scans error:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve scan history.",
    });
  }
};





export const getScanById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid scan ID.",
      });
    }

    const scan = await Scan.findOne({
      _id: id,
      user: req.user._id,
    }).select("-__v");

    if (!scan) {
      return res.status(404).json({
        message: "Scan not found.",
      });
    }

    return res.status(200).json({
      scan,
    });
  } catch (error) {
    console.error("Get scan error:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve scan.",
    });
  }
};





export const getScanFindings = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid scan ID.",
      });
    }

    const scan = await Scan.findOne({
      _id: id,
      user: req.user._id,
    }).select("_id");

    if (!scan) {
      return res.status(404).json({
        message: "Scan not found.",
      });
    }

    const findings = await Finding.find({
      scan: scan._id,
      user: req.user._id,
    })
      .sort({ severity: 1, startLine: 1 })
      .select("-__v");

    return res.status(200).json({
      scanId: scan._id,
      totalFindings: findings.length,
      findings,
    });
  } catch (error) {
    console.error("Get scan findings error:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve scan findings.",
    });
  }
};





export const deleteScan = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid scan ID.",
      });
    }

    const scan = await Scan.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!scan) {
      return res.status(404).json({
        message: "Scan not found.",
      });
    }

    await Finding.deleteMany({
      scan: scan._id,
      user: req.user._id,
    });

    await scan.deleteOne();

    return res.status(200).json({
      message:
        "Scan and associated findings deleted successfully.",
    });
  } catch (error) {
    console.error("Delete scan error:", error.message);

    return res.status(500).json({
      message: "Unable to delete scan.",
    });
  }
};





export const updateFindingStatus = async (req, res) => {
  try {
    const { id: scanId, findingId } = req.params;
    const { status } = req.body;

    const userId = req.user._id;

    
    if (
      !mongoose.isValidObjectId(scanId) ||
      !mongoose.isValidObjectId(findingId)
    ) {
      return res.status(400).json({
        message: "Invalid scan or finding ID.",
      });
    }

    
    const allowedStatuses = [
      "open",
      "fixed",
      "ignored",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid finding status.",
        allowedStatuses,
      });
    }

    
    const scan = await Scan.findOne({
      _id: scanId,
      user: userId,
    }).select("_id");

    if (!scan) {
      return res.status(404).json({
        message: "Scan not found.",
      });
    }

    
    const finding = await Finding.findOneAndUpdate(
      {
        _id: findingId,
        scan: scanId,
        user: userId,
      },
      {
        $set: {
          status,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-__v");

    if (!finding) {
      return res.status(404).json({
        message: "Finding not found.",
      });
    }

    return res.status(200).json({
      message: `Finding status updated to ${status}.`,
      finding,
    });
  } catch (error) {
    console.error(
      "Finding status update failed:",
      error.message
    );

    return res.status(500).json({
      message: "Unable to update finding status.",
    });
  }
};
