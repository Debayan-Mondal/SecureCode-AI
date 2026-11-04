import mongoose from "mongoose";
import Finding from "../models/Finding.js";
import Scan from "../models/Scan.js";
import { explainFindingWithAI, generateFixWithAI } from "../services/geminiService.js";

export const explainFinding = async (req, res) => {
  try {
    const { findingId } = req.params;
    const userId = req.user._id;

    if (!mongoose.isValidObjectId(findingId)) {
      return res.status(400).json({
        message: "Invalid finding ID.",
      });
    }

    const finding = await Finding.findOne({
      _id: findingId,
      user: userId,
    });

    if (!finding) {
      return res.status(404).json({
        message: "Finding not found.",
      });
    }

    const scan = await Scan.findOne({
      _id: finding.scan,
      user: userId,
    });

    if (!scan) {
      return res.status(404).json({
        message: "Associated scan not found.",
      });
    }

    if (
      finding.aiExplanation &&
      finding.aiImpact &&
      finding.recommendation &&
      finding.suggestedFix?.trim()
    ) {
      return res.status(200).json({
        message: "Existing AI analysis retrieved.",
        cached: true,
        analysis: {
          explanation: finding.aiExplanation,
          impact: finding.aiImpact,
          recommendation: finding.recommendation,
          suggestedFix: finding.suggestedFix || "",
        },
      });
    }

    const analysis = await explainFindingWithAI(
      finding,
      scan.language
    );

    finding.aiExplanation = analysis.explanation;
    finding.aiImpact = analysis.impact;
    finding.recommendation = analysis.recommendation;
    finding.suggestedFix = analysis.suggestedFix;
    finding.aiAnalyzedAt = new Date();

    await finding.save();

    return res.status(200).json({
      message: "AI analysis generated successfully.",
      cached: false,
      analysis,
    });
  } catch (error) {
    console.error("AI analysis failed:", error.message);

    return res.status(500).json({
      message: "Unable to generate AI analysis. Please try again later.",
    });
  }
};

export const generateFindingFix = async (req, res) => {
  try {
    const { findingId } = req.params;
    const userId = req.user._id;

    if (!mongoose.isValidObjectId(findingId)) {
      return res.status(400).json({
        message: "Invalid finding ID.",
      });
    }

    const finding = await Finding.findOne({
      _id: findingId,
      user: userId,
    });

    if (!finding) {
      return res.status(404).json({
        message: "Finding not found.",
      });
    }

    const scan = await Scan.findOne({
      _id: finding.scan,
      user: userId,
    });

    if (!scan) {
      return res.status(404).json({
        message: "Associated scan not found.",
      });
    }

    if (finding.suggestedFix?.trim() && !req.body?.regenerate) {
      return res.status(200).json({
        message: "Existing AI fix retrieved.",
        cached: true,
        analysis: {
          suggestedFix: finding.suggestedFix,
          recommendation: finding.recommendation || "",
        },
      });
    }

    const result = await generateFixWithAI(finding, scan.language);

    if (!result.suggestedFix?.trim()) {
      return res.status(422).json({
        message: "AI could not generate a reliable secure replacement for this finding.",
      });
    }

    finding.suggestedFix = result.suggestedFix;

    if (result.recommendation) {
      finding.recommendation = result.recommendation;
    }

    await finding.save();

    return res.status(200).json({
      message: "AI fix generated successfully.",
      cached: false,
      analysis: result,
    });
  } catch (error) {
    console.error("AI fix generation failed:", error.message);

    return res.status(500).json({
      message: "Unable to generate an AI fix. Please try again later.",
    });
  }
};