import mongoose from "mongoose";

const findingSchema = new mongoose.Schema(
  {
    scan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scan",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    ruleId: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    severity: {
      type: String,
      enum: ["critical", "high", "medium", "low", "info"],
      required: true,
      index: true,
    },

    category: {
      type: String,
      default: "General",
    },

    cwe: {
      type: [String],
      default: [],
    },

    owasp: {
      type: String,
      default: null,
    },

    description: {
      type: String,
      required: true,
    },

    filePath: {
      type: String,
      required: true,
    },

    startLine: {
      type: Number,
      required: true,
    },

    endLine: {
      type: Number,
      default: null,
    },

    startColumn: {
      type: Number,
      default: null,
    },

    endColumn: {
      type: Number,
      default: null,
    },

    codeSnippet: {
      type: String,
      default: null,
      maxlength: 10000,
    },

    recommendation: {
      type: String,
      default: null,
    },

    suggestedFix: {
      type: String,
      default: null,
    },

    aiExplanation: { 
      type: String, 
      default: null 
    },
    
    aiImpact: { 
      type: String, 
      default: null 
    },

    aiAnalyzedAt: { 
      type: Date, 
      default: null 
    },

    status: {
      type: String,
      enum: ["open", "fixed", "ignored"],
      default: "open",
    },
  },
  {
    timestamps: true,
  }
);

findingSchema.index({ scan: 1, severity: 1 });
findingSchema.index({ user: 1, createdAt: -1 });

const Finding = mongoose.model("Finding", findingSchema);

export default Finding;
