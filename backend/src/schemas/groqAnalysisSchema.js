const { z } = require("zod");

/**
 * Extended Groq/AI analysis schema that includes all rich fields:
 * overallScore, atsScore, jobMatchScore, skills, strengths, weaknesses,
 * suggestions, keywords, sections, bulletPointImprovements.
 *
 * This coerces common LLM responses (e.g. numeric IDs → string, High/Medium/Low → critical/warning/minor).
 */

// Normalise severity strings from various LLM outputs
const normalizeSeverity = z
  .string()
  .transform((v) => {
    const lv = v.toLowerCase();
    if (lv === "critical" || lv === "high") return "critical";
    if (lv === "warning" || lv === "medium" || lv === "moderate") return "warning";
    return "minor";
  })
  .pipe(z.enum(["critical", "warning", "minor"]))
  .catch("warning");

const groqIssueSchema = z.object({
  id: z
    .union([z.string(), z.number()])
    .transform(String)
    .default(() => `issue-${Math.random().toString(36).substring(2, 9)}`),
  title: z.string().trim().default(""),
  severity: normalizeSeverity,
  section: z.string().trim().default("General"),
  problem: z.string().trim().default(""),
  fix: z.string().trim().default(""),
});

const groqStrengthSchema = z.object({
  id: z
    .union([z.string(), z.number()])
    .transform(String)
    .default(() => `str-${Math.random().toString(36).substring(2, 9)}`),
  title: z.string().trim().default(""),
  section: z.string().trim().default("General"),
  detail: z.string().trim().default(""),
  evidence: z.string().trim().default(""),
});

const groqBulletRewriteSchema = z.object({
  id: z
    .union([z.string(), z.number()])
    .transform(String)
    .default(() => `rw-${Math.random().toString(36).substring(2, 9)}`),
  original: z.string().trim().default(""),
  rewritten: z.string().trim().default(""),
  section: z.string().trim().default("Experience"),
  rationale: z.string().trim().default(""),
  metricsAdded: z.boolean().default(false),
});

const groqBulletImprovementSchema = z.object({
  original: z.string().trim().default(""),
  improved: z.string().trim().default(""),
  reason: z.string().trim().default(""),
});

const groqSkillsSchema = z.object({
  matched: z.array(z.string().trim()).default([]),
  missing: z.array(z.string().trim()).default([]),
  important: z.array(z.string().trim()).default([]),
});

const groqKeywordsSchema = z.object({
  matched: z.array(z.string().trim()).default([]),
  missing: z.array(z.string().trim()).default([]),
  recommended: z.array(z.string().trim()).default([]),
  // also accept legacy "present" from older analysis format
  present: z.array(z.string().trim()).default([]),
});

const normalizeScore0To100 = z
  .union([z.number(), z.string()])
  .transform((v) => {
    const num = typeof v === "string" ? parseFloat(v) || 0 : v;
    if (num <= 1.0 && num > 0) {
      return Math.round(num * 100);
    }
    return Math.max(0, Math.min(100, Math.round(num)));
  })
  .default(0);

const groqSectionScoresSchema = z
  .object({
    summary: normalizeScore0To100,
    education: normalizeScore0To100,
    skills: normalizeScore0To100,
    experience: normalizeScore0To100,
    projects: normalizeScore0To100,
    certifications: normalizeScore0To100,
    achievements: normalizeScore0To100,
  })
  .passthrough();

const groqAnalysisSchema = z.object({
  // Core scores
  overallScore: normalizeScore0To100,
  atsScore: z
    .union([
      z.number(),
      z.string(),
      z.object({ overall: z.union([z.number(), z.string()]).default(0) }).passthrough(),
    ])
    .transform((v) => {
      let rawVal = typeof v === "object" && v !== null ? v.overall ?? 0 : v;
      const num = typeof rawVal === "string" ? parseFloat(rawVal) || 0 : rawVal;
      if (num <= 1.0 && num > 0) return Math.round(num * 100);
      return Math.max(0, Math.min(100, Math.round(num)));
    })
    .default(0),
  jobMatchScore: normalizeScore0To100,

  // Summary text
  summary: z.string().trim().default(""),

  // Structured fields
  skills: groqSkillsSchema.default({}),
  strengths: z.array(groqStrengthSchema).default([]),
  weaknesses: z.array(z.string().trim()).default([]),
  suggestions: z.array(z.string().trim()).default([]),
  keywords: groqKeywordsSchema.default({}),
  sections: groqSectionScoresSchema.default({}),
  bulletPointImprovements: z.array(groqBulletImprovementSchema).default([]),

  // Also include legacy fields for compatibility with existing analysis components
  issues: z.array(groqIssueSchema).default([]),
  bulletRewrites: z.array(groqBulletRewriteSchema).default([]),
});

module.exports = {
  groqAnalysisSchema,
  groqIssueSchema,
  groqStrengthSchema,
  groqBulletRewriteSchema,
  groqBulletImprovementSchema,
  groqSkillsSchema,
  groqKeywordsSchema,
  groqSectionScoresSchema,
};
