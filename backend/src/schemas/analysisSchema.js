const { z } = require("zod");

const atsScoreBreakdownSchema = z.object({
  keywords: z.number().min(0).max(100).default(70),
  formatting: z.number().min(0).max(100).default(70),
  impact: z.number().min(0).max(100).default(70),
  clarity: z.number().min(0).max(100).default(70),
});

const atsScoreSchema = z.object({
  overall: z.number().min(0).max(100).default(70),
  breakdown: atsScoreBreakdownSchema.default({}),
});

const normalizeSeverity = z
  .union([z.string(), z.number()])
  .transform((v) => {
    const lv = String(v).toLowerCase();
    if (lv === "critical" || lv === "high" || lv === "3") return "critical";
    if (lv === "warning" || lv === "medium" || lv === "moderate" || lv === "2") return "warning";
    return "minor";
  })
  .pipe(z.enum(["critical", "warning", "minor"]))
  .catch("warning");

const issueItemSchema = z.object({
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

const strengthItemSchema = z.object({
  id: z
    .union([z.string(), z.number()])
    .transform(String)
    .default(() => `str-${Math.random().toString(36).substring(2, 9)}`),
  title: z.string().trim().default(""),
  section: z.string().trim().default("General"),
  detail: z.string().trim().default(""),
  evidence: z.string().trim().default(""),
});

const bulletRewriteSchema = z.object({
  id: z
    .union([z.string(), z.number()])
    .transform(String)
    .default(() => `rw-${Math.random().toString(36).substring(2, 9)}`),
  original: z.string().trim().default(""),
  rewritten: z.string().trim().default(""),
  section: z.string().trim().default("Experience"),
  rationale: z.string().trim().default(""),
  metricsAdded: z.union([z.boolean(), z.string(), z.number()]).transform(Boolean).default(false),
});

const keywordAnalysisSchema = z.object({
  present: z.array(z.string().trim()).default([]),
  missing: z.array(z.string().trim()).default([]),
  matchPercentage: z.number().min(0).max(100).default(70),
});

const analysisSchema = z.object({
  summary: z.string().trim().default(""),
  atsScore: atsScoreSchema.default({}),
  issues: z.array(issueItemSchema).default([]),
  strengths: z.array(strengthItemSchema).default([]),
  bulletRewrites: z.array(bulletRewriteSchema).default([]),
  keywords: keywordAnalysisSchema.default({}),
});

module.exports = {
  analysisSchema,
  atsScoreSchema,
  issueItemSchema,
  strengthItemSchema,
  bulletRewriteSchema,
  keywordAnalysisSchema,
};
