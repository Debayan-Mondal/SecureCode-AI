import Scan from "../models/Scan.js";
import Finding from "../models/Finding.js";


const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const globalSearch = async (req, res) => {
  try {
    const query = req.query.q?.trim();

    if (!query || query.length < 2) {
      return res.status(400).json({
        message: "Search query must contain at least 2 characters.",
      });
    }

    if (query.length > 80) {
      return res.status(400).json({
        message: "Search query cannot exceed 80 characters.",
      });
    }

    const searchRegex = new RegExp(escapeRegex(query), "i");
    const userId = req.user._id;

    const [scans, findings] = await Promise.all([
      Scan.find({
        user: userId,
        $or: [
          { name: searchRegex },
          { fileName: searchRegex },
          { language: searchRegex },
          { status: searchRegex },
        ],
      })
        .select("_id name fileName language status createdAt")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      Finding.find({
        user: userId,
        $or: [
          { title: searchRegex },
          { ruleId: searchRegex },
          { category: searchRegex },
          { cwe: searchRegex },
          { owasp: searchRegex },
          { filePath: searchRegex },
          { severity: searchRegex },
        ],
      })
        .select(
          "_id scan title ruleId severity category cwe filePath startLine status"
        )
        .populate("scan", "name")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return res.status(200).json({
      scans,
      findings,
    });
  } catch (error) {
    console.error("Global search failed:", error);

    return res.status(500).json({
      message: "Unable to perform search.",
    });
  }
};