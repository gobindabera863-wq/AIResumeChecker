const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const Resume = require("../models/Resume");

const router = express.Router();

/**
 * @route   GET /api/dashboard
 * @desc    Get aggregate dashboard metrics, totals, score evolution, version stack, KPI cards, and activity feed
 * @access  Private
 */
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const resumes = await Resume.find({ user: req.user._id }).sort({ updatedAt: -1 });

    const totalResumes = resumes.length;
    const latestResume = totalResumes > 0 ? resumes[0] : null;

    // Flatten all versions across user resumes
    const allVersions = resumes.flatMap((r) =>
      (r.versions || []).map((v) => ({
        _id: v._id,
        versionNumber: v.versionNumber,
        fileName: v.fileName,
        fileSize: v.fileSize,
        createdAt: v.createdAt,
        analysis: v.analysis,
        resumeId: r._id,
        resumeTitle: r.title,
        targetRole: r.targetRole,
      }))
    );

    // Sort versions descending by creation date
    allVersions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const totalVersions = allVersions.length;
    const totalRewritesApplied = allVersions.filter((v) => v.versionNumber > 1).length;

    // Collect valid ATS scores
    const validScores = allVersions
      .map((v) => v.analysis?.atsScore?.overall)
      .filter((s) => typeof s === "number");

    const averageAtsScore = validScores.length
      ? Math.round(validScores.reduce((acc, curr) => acc + curr, 0) / validScores.length)
      : 0;

    const bestAtsScore = validScores.length ? Math.max(...validScores) : 0;

    // Latest resume scores for delta calculation
    let currentScore = 0;
    let previousScore = 0;
    let atsDelta = 0;
    let issuesCount = 0;
    let keywordsMatchedCount = 0;
    let keywordsTotalCount = 0;

    if (latestResume && latestResume.versions.length) {
      const vLatest = latestResume.versions[latestResume.versions.length - 1];
      currentScore = vLatest.analysis?.atsScore?.overall || 0;

      if (latestResume.versions.length > 1) {
        const vPrev = latestResume.versions[latestResume.versions.length - 2];
        previousScore = vPrev.analysis?.atsScore?.overall || 0;
        atsDelta = currentScore - previousScore;
      }

      issuesCount = vLatest.analysis?.issues?.length || 0;
      keywordsMatchedCount = vLatest.analysis?.keywords?.present?.length || 0;
      keywordsTotalCount =
        keywordsMatchedCount + (vLatest.analysis?.keywords?.missing?.length || 0);
    }

    // Score evolution timeline (chronological ascending)
    const analyzedVersionsAsc = allVersions
      .filter((v) => typeof v.analysis?.atsScore?.overall === "number")
      .slice()
      .reverse();

    const scoreSeries = (analyzedVersionsAsc.length ? analyzedVersionsAsc : allVersions.slice().reverse()).map((v, i) => ({
      at: v.createdAt,
      timestamp: v.createdAt,
      dateLabel: new Date(v.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      label: `V${v.versionNumber}`,
      shortLabel: `#${i + 1}`,
      versionNumber: v.versionNumber,
      score: v.analysis?.atsScore?.overall || 0,
      resumeTitle: v.resumeTitle,
      resumeId: v.resumeId,
    }));

    // Sparkline scores (last 7 data points)
    const sparklineScores = validScores.slice(-7);

    // Recent version stack (top 10 latest versions)
    const versionStack = allVersions.slice(0, 10).map((v) => ({
      id: v._id,
      versionId: v._id,
      resumeId: v.resumeId,
      resumeTitle: v.resumeTitle,
      versionNumber: v.versionNumber,
      label: `V${v.versionNumber}`,
      sourceType: v.versionNumber === 1 ? "upload" : "rewrite",
      fileName: v.fileName,
      fileSize: v.fileSize,
      targetRole: v.targetRole,
      atsScore: v.analysis?.atsScore?.overall || 0,
      score: v.analysis?.atsScore?.overall || 0,
      createdAt: v.createdAt,
    }));

    // Activity Feed formatted for ActivityFeed.jsx
    const activity = allVersions.slice(0, 15).map((v) => {
      const isInitial = v.versionNumber === 1;
      return {
        id: `act-${v._id}`,
        type: isInitial ? "upload" : "rewrite",
        title: v.resumeTitle || "Resume",
        subtitle: isInitial
          ? `Uploaded PDF file "${v.fileName || "resume.pdf"}"`
          : `Applied AI bullet rewrites (V${v.versionNumber})`,
        label: `V${v.versionNumber}`,
        at: v.createdAt,
        timestamp: v.createdAt,
        resumeId: v.resumeId,
        versionNumber: v.versionNumber,
        score: v.analysis?.atsScore?.overall || 0,
      };
    });

    res.json({
      totals: {
        resumes: totalResumes,
        rewrites: totalRewritesApplied,
        analyses: totalVersions,
        totalResumes,
        totalVersions,
        totalRewritesApplied,
        averageAtsScore,
        bestAtsScore,
      },
      latestResume,
      scoreSeries,
      scoreEvolution: scoreSeries,
      versionStack,
      kpi: {
        atsScore: {
          value: currentScore,
          delta: atsDelta,
          spark: sparklineScores,
        },
        versions: {
          value: totalVersions,
          spark: [1, 2, totalVersions],
        },
        issuesIdentified: {
          value: issuesCount,
          delta: 0,
          spark: [issuesCount],
        },
        keywordsMatched: {
          value: keywordsMatchedCount,
          total: keywordsTotalCount,
          delta: 0,
          spark: [keywordsMatchedCount],
        },
      },
      activity,
      activityFeed: activity,
    });
  })
);

module.exports = router;
