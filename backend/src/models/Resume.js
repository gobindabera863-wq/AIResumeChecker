const mongoose = require("mongoose");

const versionSchema = new mongoose.Schema(
  {
    versionNumber: {
      type: Number,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    rawText: {
      type: String,
      required: true,
    },
    structuredData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    analysis: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    targetRole: {
      type: String,
      trim: true,
      default: "",
    },
    currentVersion: {
      type: Number,
      default: 1,
    },
    versions: [versionSchema],
  },
  { timestamps: true }
);

resumeSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model("Resume", resumeSchema);
