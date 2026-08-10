const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const Resume = require("../models/Resume");

const historyRouter = express.Router();
const versionsRouter = express.Router();

/**
 * @route   GET /api/history
 * @desc    Get account-wide chronological event audit log feed formatted for History.jsx
 * @access  Private
 */
historyRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const resumes = await Resume.find({ user: req.user._id }).sort({ updatedAt: -1 });

    const { type, resumeId, limit } = req.query;

    let events = resumes.flatMap((r) =>
      (r.versions || []).map((v) => {
        const isInitial = v.versionNumber === 1;
        const eventType = isInitial ? "upload" : "rewrite";

        return {
          id: `hist-${v._id}`,
          type: eventType,
          title: r.title || "Untitled Resume",
          subtitle: isInitial
            ? `Uploaded PDF file "${v.fileName || "resume.pdf"}" as Version V1`
            : `Applied AI bullet rewrites creating Version V${v.versionNumber}`,
          label: `V${v.versionNumber}`,
          at: v.createdAt,
          resumeId: r._id,
          versionNumber: v.versionNumber,
          score: v.analysis?.atsScore?.overall || 0,
        };
      })
    );

    // Filter by type if provided
    if (type && type !== "all") {
      events = events.filter((e) => e.type.toLowerCase() === type.toLowerCase());
    }

    // Filter by resumeId
    if (resumeId) {
      events = events.filter((e) => e.resumeId.toString() === resumeId);
    }

    // Sort descending by timestamp
    events.sort((a, b) => new Date(b.at) - new Date(a.at));

    if (limit) {
      const max = parseInt(limit, 10);
      if (!isNaN(max) && max > 0) {
        events = events.slice(0, max);
      }
    }

    const uploadCount = events.filter((e) => e.type === "upload").length;
    const analyzeCount = events.filter((e) => e.type === "analyze").length;
    const rewriteCount = events.filter((e) => e.type === "rewrite").length;

    res.json({
      totals: {
        all: events.length,
        upload: uploadCount,
        analyze: analyzeCount,
        rewrite: rewriteCount,
      },
      events,
      totalCount: events.length,
    });
  })
);

/**
 * @route   GET /api/versions
 * @desc    Get flat list of all resume versions across user resumes formatted for Versions.jsx
 * @access  Private
 */
versionsRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const resumes = await Resume.find({ user: req.user._id }).sort({ updatedAt: -1 });

    const { resumeId, minScore, search } = req.query;

    let allVersions = resumes.flatMap((r) =>
      (r.versions || []).map((v) => ({
        id: v._id,
        versionId: v._id,
        resumeId: r._id,
        label: `V${v.versionNumber}`,
        resumeTitle: r.title || "Untitled Resume",
        targetRole: r.targetRole,
        versionNumber: v.versionNumber,
        sourceType: v.versionNumber === 1 ? "upload" : "rewrite",
        fileName: v.fileName,
        fileSize: v.fileSize,
        score: v.analysis?.atsScore?.overall ?? null,
        atsScore: v.analysis?.atsScore?.overall || 0,
        createdAt: v.createdAt,
      }))
    );

    // Filter by resumeId
    if (resumeId) {
      allVersions = allVersions.filter((v) => v.resumeId.toString() === resumeId);
    }

    // Filter by minScore
    if (minScore) {
      const threshold = parseInt(minScore, 10);
      if (!isNaN(threshold)) {
        allVersions = allVersions.filter((v) => (v.score || 0) >= threshold);
      }
    }

    // Search filter
    if (search) {
      const term = search.toLowerCase();
      allVersions = allVersions.filter(
        (v) =>
          v.resumeTitle.toLowerCase().includes(term) ||
          v.fileName.toLowerCase().includes(term) ||
          (v.targetRole || "").toLowerCase().includes(term)
      );
    }

    // Sort descending by creation date
    allVersions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const uploadCount = allVersions.filter((v) => v.sourceType === "upload").length;
    const rewriteCount = allVersions.filter((v) => v.sourceType === "rewrite").length;

    res.json({
      totals: {
        all: allVersions.length,
        uploads: uploadCount,
        rewrites: rewriteCount,
      },
      versions: allVersions,
      totalCount: allVersions.length,
    });
  })
);

module.exports = {
  historyRouter,
  versionsRouter,
};
