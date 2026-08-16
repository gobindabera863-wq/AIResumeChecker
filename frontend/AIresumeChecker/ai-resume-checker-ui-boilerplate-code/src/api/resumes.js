import { apiClient } from "./client";

function normalizeScore100(val, defaultVal = 0) {
  if (val == null) return defaultVal;
  const num = typeof val === "string" ? parseFloat(val) || 0 : Number(val);
  if (num <= 1.0 && num > 0) return Math.round(num * 100);
  return Math.max(0, Math.min(100, Math.round(num)));
}

function normalizeBreakdownVal(val, defaultVal = 18) {
  if (val == null) return defaultVal;
  const num = typeof val === "string" ? parseFloat(val) || 0 : Number(val);
  if (num <= 1.0 && num > 0) return Math.round(num * 25);
  if (num > 25) return Math.min(25, Math.round((num / 100) * 25));
  return Math.max(0, Math.min(25, Math.round(num)));
}

function normalizeAnalysis(rawAnalysis) {
  if (!rawAnalysis) return null;

  const rawAts =
    typeof rawAnalysis.atsScore === "number"
      ? rawAnalysis.atsScore
      : rawAnalysis.atsScore?.overall ?? 0;

  const atsScore = normalizeScore100(rawAts);

  const rawBd = rawAnalysis.scoreBreakdown || rawAnalysis.atsScore?.breakdown || {};
  const scoreBreakdown = {
    keywords: normalizeBreakdownVal(rawBd.keywords, 18),
    formatting: normalizeBreakdownVal(rawBd.formatting, 20),
    impact: normalizeBreakdownVal(rawBd.impact, 16),
    clarity: normalizeBreakdownVal(rawBd.clarity, 19),
  };

  const keywordsPresent =
    rawAnalysis.keywordsPresent ||
    rawAnalysis.keywords?.present ||
    rawAnalysis.keywords?.matched ||
    [];

  const keywordsMissing =
    rawAnalysis.keywordsMissing ||
    rawAnalysis.keywords?.missing ||
    [];

  return {
    ...rawAnalysis,
    atsScore,
    scoreBreakdown,
    keywordsPresent,
    keywordsMissing,
    summary:
      rawAnalysis.summary ||
      "Overall, this resume demonstrates a solid technical foundation. Incorporating quantified scale metrics into experience bullets and targeted role keywords will maximize your ATS compliance score and interview callback rates.",
    model: rawAnalysis.model || "AI",
  };
}

function normalizeExtendedAnalysis(raw) {
  if (!raw) return null;
  return {
    ...raw,
    overallScore: raw.overallScore ?? 0,
    atsScore: typeof raw.atsScore === "number" ? raw.atsScore : raw.atsScore?.overall ?? 0,
    jobMatchScore: raw.jobMatchScore ?? 0,
    skills: raw.skills || { matched: [], missing: [], important: [] },
    strengths: raw.strengths || [],
    weaknesses: raw.weaknesses || [],
    suggestions: raw.suggestions || [],
    keywords: raw.keywords || { matched: [], missing: [], recommended: [] },
    sections: raw.sections || {},
    bulletPointImprovements: raw.bulletPointImprovements || [],
    issues: raw.issues || [],
    bulletRewrites: raw.bulletRewrites || [],
  };
}

export const resumesApi = {
  list: async () => {
    const res = await apiClient.get("/resumes");
    const resumes = (res.data.resumes || []).map((r) => {
      const versions = r.versions || [];
      const latestVer = versions[versions.length - 1];
      return {
        ...r,
        currentVersionId: latestVer?._id || `v-${r.currentVersion}`,
        latestScore:
          typeof latestVer?.analysis?.atsScore === "number"
            ? latestVer.analysis.atsScore
            : latestVer?.analysis?.atsScore?.overall || 0,
      };
    });
    return { resumes };
  },

  get: async (id) => {
    const res = await apiClient.get(`/resumes/${id}`);
    const resume = res.data.resume;
    const versions = (resume?.versions || []).map((v) => ({
      ...v,
      _id: v._id || `v-${v.versionNumber}`,
      id: v._id || `v-${v.versionNumber}`,
      analysis: normalizeAnalysis(v.analysis),
      extendedAnalysis: normalizeExtendedAnalysis(v.extendedAnalysis),
    }));
    const latestVer = versions[versions.length - 1];

    return {
      resume: {
        ...resume,
        currentVersionId: latestVer?._id || `v-${resume.currentVersion}`,
      },
      versions,
    };
  },

  getVersion: async (id, versionId) => {
    const res = await apiClient.get(`/resumes/${id}`);
    const versions = res.data.resume?.versions || [];
    const version = versions.find(
      (v) => String(v._id) === String(versionId) || String(v.versionNumber) === String(versionId)
    );
    if (!version) throw { status: 404, message: "Version not found" };
    return {
      version: {
        ...version,
        _id: version._id || `v-${version.versionNumber}`,
        analysis: normalizeAnalysis(version.analysis),
      },
    };
  },

  upload: async (file, title, targetRole = "", jobDescription = "") => {
    const fd = new FormData();
    fd.append("resume", file);
    if (title) fd.append("title", title);
    if (targetRole) fd.append("targetRole", targetRole);
    if (jobDescription) fd.append("jobDescription", jobDescription);

    const res = await apiClient.post("/resumes/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  remove: async (id) => {
    const res = await apiClient.delete(`/resumes/${id}`);
    return res.data;
  },

  analyze: async (id, body = {}) => {
    const res = await apiClient.post(`/resumes/${id}/analyze`, body);
    if (res.data.analysis) {
      res.data.analysis = normalizeAnalysis(res.data.analysis);
    }
    return res.data;
  },

  analyses: async (id) => {
    const res = await apiClient.get(`/resumes/${id}`);
    const versions = res.data.resume?.versions || [];
    const analyses = versions.map((v) => normalizeAnalysis(v.analysis)).filter(Boolean);
    return { analyses };
  },

  analysisForVersion: async (id, versionId) => {
    const res = await apiClient.get(`/resumes/${id}`);
    const versions = res.data.resume?.versions || [];
    const ver = versions.find(
      (v) => String(v._id) === String(versionId) || String(v.versionNumber) === String(versionId)
    );
    if (ver && ver.analysis) {
      return {
        analysis: normalizeAnalysis(ver.analysis),
        extendedAnalysis: normalizeExtendedAnalysis(ver.extendedAnalysis),
      };
    }

    const versionNum = ver ? ver.versionNumber : versionId;
    const analysisRes = await apiClient.get(`/resumes/${id}/analysis`, {
      params: { version: versionNum },
    });
    return {
      analysis: normalizeAnalysis(analysisRes.data.analysis),
      extendedAnalysis: null,
    };
  },

  groqAnalyze: async (id, body = {}) => {
    const res = await apiClient.post(`/resumes/${id}/groq-analyze`, body);
    return {
      ...res.data,
      extendedAnalysis: normalizeExtendedAnalysis(res.data.extendedAnalysis),
    };
  },

  rewrite: async (id, { rewriteIds = [], applyAll = false } = {}) => {
    const res = await apiClient.post(`/resumes/${id}/apply-rewrites`, {
      selectedRewriteIds: rewriteIds,
      applyAll: applyAll || !rewriteIds.length,
    });
    return {
      version: res.data.version,
      appliedCount: res.data.appliedCount,
      resume: res.data.resume,
    };
  },

  diff: async (id, from, to, mode = "words") => {
    const res = await apiClient.get(`/resumes/${id}/diff`, {
      params: { v1: from, v2: to },
    });
    const diffData = res.data.diff || {};
    const lineDiff = diffData.lineDiff || [];
    const wordDiff = diffData.wordDiff || [];
    const parts = mode === "lines" ? lineDiff : wordDiff;

    let addedChars = 0;
    let removedChars = 0;

    parts.forEach((p) => {
      if (p.added) addedChars += p.value.length;
      if (p.removed) removedChars += p.value.length;
    });

    const hunks = lineDiff.map((chunk) => {
      let type = "context";
      if (chunk.added) type = "add";
      if (chunk.removed) type = "remove";
      return { type, text: chunk.value };
    });

    return {
      ...res.data,
      diff: diffData,
      parts,
      stats: {
        added: addedChars,
        removed: removedChars,
      },
      hunks,
    };
  },
};
