const express = require("express");
const { z } = require("zod");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { requireAuth } = require("../middleware/auth");
const { analyzeLimiter } = require("../middleware/rateLimit");
const { handleUploadMiddleware } = require("../middleware/upload");
const { extractTextFromPDF } = require("../services/pdfService");
const { parseResumeToJSON, analyzeResume } = require("../services/geminiService");
const { applyRewritesToResume } = require("../services/rewriteService");
const { compareVersions } = require("../services/diffService");
const Resume = require("../models/Resume");

const router = express.Router();

const uploadOptionsSchema = z.object({
  title: z.string().trim().max(120).optional(),
  targetRole: z.string().trim().max(100).optional(),
});

const analyzeBodySchema = z.object({
  targetRole: z.string().trim().max(100).optional(),
  versionNumber: z.number().int().min(1).optional(),
});

const applyRewritesBodySchema = z.object({
  selectedRewriteIds: z.array(z.string()).optional(),
  applyAll: z.boolean().optional(),
});

/**
 * @route   POST /api/resumes/upload
 * @desc    Upload PDF resume, extract text, AI parse to JSON, generate AI Analysis, save V1 resume
 * @access  Private
 */
router.post(
  "/upload",
  requireAuth,
  analyzeLimiter,
  handleUploadMiddleware("resume"),
  asyncHandler(async (req, res) => {
    // 1. Validate optional text options
    const parsedOptions = uploadOptionsSchema.safeParse(req.body);
    const titleOption = parsedOptions.success ? parsedOptions.data.title : "";
    const targetRole = parsedOptions.success ? parsedOptions.data.targetRole || "" : "";

    const file = req.file;

    // 2. Extract raw text from PDF buffer
    const rawText = await extractTextFromPDF(file.buffer);

    // 3. AI Structured Parsing with Gemini
    const structuredData = await parseResumeToJSON(rawText, targetRole);

    // 4. Full AI Analysis with Gemini (ATS Score, Issues, Strengths, Rewrites, Keywords)
    let analysis = null;
    try {
      analysis = await analyzeResume(rawText, structuredData, targetRole);
    } catch (analysisErr) {
      console.error("AI Analysis failed during upload (proceeding with parsing only):", analysisErr.message);
    }

    // 5. Determine title
    const defaultTitle = file.originalname.replace(/\.pdf$/i, "").trim() || "Untitled Resume";
    const resumeTitle = titleOption || defaultTitle;

    // 6. Create Resume document with initial Version V1
    const resume = await Resume.create({
      user: req.user._id,
      title: resumeTitle,
      targetRole,
      currentVersion: 1,
      versions: [
        {
          versionNumber: 1,
          fileName: file.originalname,
          fileSize: file.size,
          rawText,
          structuredData,
          analysis,
          createdAt: new Date(),
        },
      ],
    });

    res.status(201).json({
      message: "Resume uploaded, parsed, and analyzed successfully",
      resume,
    });
  })
);

/**
 * @route   POST /api/resumes/:id/analyze
 * @desc    Trigger/refresh AI Analysis (ATS Score, Issues, Strengths, Rewrites, Keywords) for a resume version
 * @access  Private
 */
router.post(
  "/:id/analyze",
  requireAuth,
  analyzeLimiter,
  asyncHandler(async (req, res) => {
    const { targetRole, versionNumber } = analyzeBodySchema.parse(req.body || {});

    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) {
      throw ApiError.notFound("Resume not found");
    }

    if (targetRole !== undefined) {
      resume.targetRole = targetRole;
    }
    const activeTargetRole = resume.targetRole || "";

    const targetVerNum = versionNumber || resume.currentVersion;
    const versionObj = resume.versions.find((v) => v.versionNumber === targetVerNum);

    if (!versionObj) {
      throw ApiError.notFound(`Resume version ${targetVerNum} not found`);
    }

    const analysis = await analyzeResume(versionObj.rawText, versionObj.structuredData, activeTargetRole);

    versionObj.analysis = analysis;
    resume.markModified("versions");
    await resume.save();

    res.json({
      message: `AI Analysis generated successfully for Version ${targetVerNum}`,
      versionNumber: targetVerNum,
      analysis,
      resume,
    });
  })
);

/**
 * @route   POST /api/resumes/:id/apply-rewrites
 * @desc    Apply selected (or all) AI bullet rewrites to create a new version (V2, V3...) with fresh AI analysis
 * @access  Private
 */
router.post(
  "/:id/apply-rewrites",
  requireAuth,
  analyzeLimiter,
  asyncHandler(async (req, res) => {
    const { selectedRewriteIds, applyAll } = applyRewritesBodySchema.parse(req.body || {});

    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) {
      throw ApiError.notFound("Resume not found");
    }

    // Find current active version
    const currentVersionObj = resume.versions.find((v) => v.versionNumber === resume.currentVersion);
    if (!currentVersionObj) {
      throw ApiError.notFound(`Current version V${resume.currentVersion} not found`);
    }

    // Apply bullet rewrites to build new content
    const { updatedStructuredData, updatedRawText, appliedCount, appliedRewrites } = applyRewritesToResume(
      currentVersionObj,
      selectedRewriteIds,
      applyAll
    );

    // Compute new version number
    const newVersionNumber = resume.currentVersion + 1;

    // Run AI Analysis on the new version text & structured data
    let newAnalysis = null;
    try {
      newAnalysis = await analyzeResume(updatedRawText, updatedStructuredData, resume.targetRole);
    } catch (analysisErr) {
      console.error("AI Analysis failed for new version (proceeding with version creation):", analysisErr.message);
    }

    // Create new version object
    const baseFileName = currentVersionObj.fileName.replace(/(_V\d+)?\.pdf$/i, "");
    const newVersionObj = {
      versionNumber: newVersionNumber,
      fileName: `${baseFileName}_V${newVersionNumber}.pdf`,
      fileSize: currentVersionObj.fileSize,
      rawText: updatedRawText,
      structuredData: updatedStructuredData,
      analysis: newAnalysis,
      createdAt: new Date(),
    };

    resume.versions.push(newVersionObj);
    resume.currentVersion = newVersionNumber;
    await resume.save();

    res.status(201).json({
      message: `Applied ${appliedCount} bullet rewrite(s) and created Version ${newVersionNumber}`,
      appliedCount,
      appliedRewrites,
      newVersionNumber,
      version: newVersionObj,
      resume,
    });
  })
);

/**
 * @route   GET /api/resumes/:id/diff
 * @desc    Compare any two versions of a resume with word-level diff, line-level diff, and ATS score metrics
 * @access  Private
 */
router.get(
  "/:id/diff",
  requireAuth,
  asyncHandler(async (req, res) => {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) {
      throw ApiError.notFound("Resume not found");
    }

    const v1Num = req.query.v1 ? parseInt(req.query.v1, 10) : 1;
    const v2Num = req.query.v2 ? parseInt(req.query.v2, 10) : resume.currentVersion;

    const ver1 = resume.versions.find((v) => v.versionNumber === v1Num);
    const ver2 = resume.versions.find((v) => v.versionNumber === v2Num);

    if (!ver1) {
      throw ApiError.notFound(`Version ${v1Num} not found`);
    }
    if (!ver2) {
      throw ApiError.notFound(`Version ${v2Num} not found`);
    }

    const diffResult = compareVersions(ver1, ver2);

    res.json({
      resumeId: resume._id,
      resumeTitle: resume.title,
      diff: diffResult,
    });
  })
);

/**
 * @route   GET /api/resumes/:id/analysis
 * @desc    Get AI Analysis payload for current or specified version of a resume
 * @access  Private
 */
router.get(
  "/:id/analysis",
  requireAuth,
  asyncHandler(async (req, res) => {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) {
      throw ApiError.notFound("Resume not found");
    }

    const versionParam = req.query.version ? parseInt(req.query.version, 10) : resume.currentVersion;
    const versionObj = resume.versions.find((v) => v.versionNumber === versionParam);

    if (!versionObj) {
      throw ApiError.notFound(`Version ${versionParam} not found for this resume`);
    }

    if (!versionObj.analysis) {
      throw ApiError.notFound(`No AI Analysis generated yet for Version ${versionParam}. Call POST /api/resumes/${resume._id}/analyze first.`);
    }

    res.json({
      resumeId: resume._id,
      versionNumber: versionObj.versionNumber,
      targetRole: resume.targetRole,
      analysis: versionObj.analysis,
    });
  })
);

/**
 * @route   GET /api/resumes
 * @desc    Get all resumes for the authenticated user
 * @access  Private
 */
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const resumes = await Resume.find({ user: req.user._id }).sort({ updatedAt: -1 });
    res.json({ resumes });
  })
);

/**
 * @route   GET /api/resumes/:id
 * @desc    Get a single resume by ID for the authenticated user
 * @access  Private
 */
router.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) {
      throw ApiError.notFound("Resume not found");
    }
    res.json({ resume });
  })
);

/**
 * @route   DELETE /api/resumes/:id
 * @desc    Delete a resume by ID for the authenticated user
 * @access  Private
 */
router.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!resume) {
      throw ApiError.notFound("Resume not found");
    }
    res.json({ message: "Resume deleted successfully", id: req.params.id });
  })
);

module.exports = router;
