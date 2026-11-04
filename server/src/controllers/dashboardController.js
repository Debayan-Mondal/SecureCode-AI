import mongoose from "mongoose";
import Scan from "../models/Scan.js";
import Finding from "../models/Finding.js";

export const getDashboardStats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const [
      totalScans,
      completedScans,
      failedScans,
      scanTotals,
      findingStats,
      recentScans,
    ] = await Promise.all([
      Scan.countDocuments({ user: userId }),

      Scan.countDocuments({
        user: userId,
        status: "completed",
      }),

      Scan.countDocuments({
        user: userId,
        status: "failed",
      }),

      Scan.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: null,
            totalFindings: { $sum: "$summary.totalFindings" },
          },
        },
      ]),

      Finding.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },

            critical: {
              $sum: { $cond: [{ $eq: ["$severity", "critical"] }, 1, 0] },
            },
            high: {
              $sum: { $cond: [{ $eq: ["$severity", "high"] }, 1, 0] },
            },
            medium: {
              $sum: { $cond: [{ $eq: ["$severity", "medium"] }, 1, 0] },
            },
            low: {
              $sum: { $cond: [{ $eq: ["$severity", "low"] }, 1, 0] },
            },
            info: {
              $sum: { $cond: [{ $eq: ["$severity", "info"] }, 1, 0] },
            },

            open: {
              $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] },
            },
            fixed: {
              $sum: { $cond: [{ $eq: ["$status", "fixed"] }, 1, 0] },
            },
            ignored: {
              $sum: { $cond: [{ $eq: ["$status", "ignored"] }, 1, 0] },
            },
          },
        },
      ]),

      Scan.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select(
          "name language status summary duration createdAt completedAt"
        )
        .lean(),
    ]);

    const findings = findingStats[0] || {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
      open: 0,
      fixed: 0,
      ignored: 0,
    };

    res.status(200).json({
      stats: {
        totalScans,
        completedScans,
        failedScans,
        totalFindings: scanTotals[0]?.totalFindings || 0,
      },
      findings,
      recentScans,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);

    res.status(500).json({
      message: "Unable to load dashboard statistics.",
    });
  }
};