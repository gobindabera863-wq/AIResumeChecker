const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const Resume = require("../models/Resume");

const router = express.Router();

/**
 * @route   GET /api/insights
 * @desc    Get aggregate analytics, score trends, top recurring issues, keyword frequency, and per-resume performance
 * @access  Private
 */
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const resumes = await Resume.find({ user: req.user._id }).sort({ updatedAt: -1 });

    // Flatten all versions across user resumes
    const allVersions = resumes.flatMap((r) =>
      (r.versions || []).map((v) => ({
        _id: v._id,
        versionNumber: v.versionNumber,
        fileName: v.fileName,
        createdAt: v.createdAt,
        analysis: v.analysis,
        resumeId: r._id,
        resumeTitle: r.title,
        targetRole: r.targetRole,
      }))
    );

    if (allVersions.length === 0) {
      return res.json({ empty: true });
    }

    allVersions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const validScores = allVersions
      .map((v) => v.analysis?.atsScore?.overall)
      .filter((s) => typeof s === "number");

    const averageScore = validScores.length
      ? Math.round(validScores.reduce((acc, curr) => acc + curr, 0) / validScores.length)
      : 0;

    // Find best version
    let bestVer = allVersions[0];
    allVersions.forEach((v) => {
      const s = v.analysis?.atsScore?.overall || 0;
      const bestS = bestVer?.analysis?.atsScore?.overall || 0;
      if (s > bestS) bestVer = v;
    });

    const bestScoreObj = {
      value: bestVer?.analysis?.atsScore?.overall || 0,
      resumeTitle: bestVer?.resumeTitle || "Untitled Resume",
    };

    // Per resume performance with score evolution history
    const resumePerformance = resumes.map((r) => {
      const analyzedVersions = (r.versions || []).filter((v) => typeof v.analysis?.atsScore?.overall === "number");
      const rScores = analyzedVersions.map((v) => v.analysis.atsScore.overall);

      const latestScore = rScores.length ? rScores[rScores.length - 1] : 0;
      const bestScore = rScores.length ? Math.max(...rScores) : 0;
      const initialScore = rScores.length ? rScores[0] : 0;
      const improvement = latestScore - initialScore;

      return {
        resumeId: r._id,
        title: r.title,
        latestScore,
        bestScore,
        improvement,
        analysesCount: analyzedVersions.length || r.versions.length,
        scoreEvolution: rScores,
        latestVersionId: r.versions?.length ? r.versions[r.versions.length - 1]._id : null,
      };
    });

    // Filter versions that have valid analysis scores for score trend timeline
    const analyzedVersionsAll = allVersions.filter((v) => typeof v.analysis?.atsScore?.overall === "number");
    const scoreTrend = (analyzedVersionsAll.length ? analyzedVersionsAll : allVersions).map((v) => ({
      score: v.analysis?.atsScore?.overall || 0,
      at: v.createdAt,
      resumeTitle: v.resumeTitle,
      resumeId: v.resumeId,
      versionNumber: v.versionNumber,
    }));

    // Aggregate top recurring issues across all versions
    const issueMap = new Map();
    allVersions.forEach((v) => {
      const issues = v.analysis?.issues || [];
      issues.forEach((issue) => {
        if (!issue.title) return;
        const key = issue.title.trim().toLowerCase();
        if (!issueMap.has(key)) {
          issueMap.set(key, {
            title: issue.title,
            count: 0,
            severity: issue.severity || "warning",
            section: issue.section || "General",
            problem: issue.problem || "",
            fix: issue.fix || "",
          });
        }
        issueMap.get(key).count += 1;
      });
    });

    const topIssues = Array.from(issueMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Aggregate top recurring strengths across all versions
    const strengthMap = new Map();
    allVersions.forEach((v) => {
      const strengths = v.analysis?.strengths || [];
      strengths.forEach((str) => {
        if (!str.title) return;
        const key = str.title.trim().toLowerCase();
        if (!strengthMap.has(key)) {
          strengthMap.set(key, {
            title: str.title,
            count: 0,
            section: str.section || "General",
            detail: str.detail || "",
            evidence: str.evidence || "",
          });
        }
        strengthMap.get(key).count += 1;
      });
    });

    const topStrengths = Array.from(strengthMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Aggregate keyword frequencies (present vs missing)
    const presentKwMap = new Map();
    const missingKwMap = new Map();

    allVersions.forEach((v) => {
      const present = v.analysis?.keywords?.present || [];
      const missing = v.analysis?.keywords?.missing || [];

      present.forEach((kw) => {
        const clean = kw.trim();
        if (clean) presentKwMap.set(clean, (presentKwMap.get(clean) || 0) + 1);
      });

      missing.forEach((kw) => {
        const clean = kw.trim();
        if (clean) missingKwMap.set(clean, (missingKwMap.get(clean) || 0) + 1);
      });
    });

    const topPresentKeywords = Array.from(presentKwMap.entries())
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    const topMissingKeywords = Array.from(missingKwMap.entries())
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    res.json({
      empty: false,
      averageScore,
      bestScore: bestScoreObj,
      totalAnalyses: analyzedVersionsAll.length || allVersions.length,
      scoreTrend,
      topIssues,
      topStrengths,
      topPresentKeywords,
      topMissingKeywords,
      resumePerformance,
      // Backward compatibility keys
      metrics: {
        averageScore,
        bestScore: bestScoreObj.value,
        totalAnalyzedResumes: resumes.length,
        totalVersionsAnalyzed: (analyzedVersionsAll.length || allVersions.length),
      },
      topRecurringIssues: topIssues,
      topRecurringStrengths: topStrengths,
      topKeywords: {
        present: topPresentKeywords,
        missing: topMissingKeywords,
      },
      perResumePerformance: resumePerformance,
    });
  })
);

module.exports = router;
