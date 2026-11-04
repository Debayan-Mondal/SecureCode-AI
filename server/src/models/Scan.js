import mongoose from "mongoose";

const scanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      trim: true,
      default: "Untitled Scan",
      maxlength: 100,
    },

    language: {
      type: String,
      enum: ["javascript", "typescript", "python"],
      required: true,
    },

    sourceType: {
      type: String,
      enum: ["editor", "upload"],
      default: "editor",
    },

    fileName: {
      type: String,
      trim: true,
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed"],
      default: "pending",
      index: true,
    },

    summary: {
      totalFindings: { type: Number, default: 0 },
      critical: { type: Number, default: 0 },
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 },
      info: { type: Number, default: 0 },
    },

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    duration: {
      type: Number,
      default: 0,
    },

    errorMessage: {
      type: String,
      default: null,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

scanSchema.index({ user: 1, createdAt: -1 });

const Scan = mongoose.model("Scan", scanSchema);

export default Scan;
