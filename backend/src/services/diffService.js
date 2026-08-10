const Diff = require("diff");
const ApiError = require("../utils/ApiError");

/**
 * Compares two resume version objects and generates line-level diff, word-level diff, and ATS score metrics comparison.
 * @param {object} ver1 - Version object 1
 * @param {object} ver2 - Version object 2
 * @returns {object} Structured diff result
 */
function compareVersions(ver1, ver2) {
  if (!ver1 || !ver2) {
    throw ApiError.badRequest("Both version objects must be provided for diff comparison");
  }

  const text1 = ver1.rawText || "";
  const text2 = ver2.rawText || "";

  // Line-level diff
  const rawLineDiff = Diff.diffLines(text1, text2);
  const lineDiff = rawLineDiff.map((chunk) => ({
    value: chunk.value,
    added: Boolean(chunk.added),
    removed: Boolean(chunk.removed),
  }));

  // Word-level diff
  const rawWordDiff = Diff.diffWordsWithSpace(text1, text2);
  const wordDiff = rawWordDiff.map((chunk) => ({
    value: chunk.value,
    added: Boolean(chunk.added),
    removed: Boolean(chunk.removed),
  }));

  // ATS score & metrics comparison
  const v1Score = ver1.analysis?.atsScore?.overall || 0;
  const v2Score = ver2.analysis?.atsScore?.overall || 0;
  const scoreDelta = v2Score - v1Score;

  const v1Breakdown = ver1.analysis?.atsScore?.breakdown || { keywords: 0, formatting: 0, impact: 0, clarity: 0 };
  const v2Breakdown = ver2.analysis?.atsScore?.breakdown || { keywords: 0, formatting: 0, impact: 0, clarity: 0 };

  const v1IssuesCount = ver1.analysis?.issues?.length || 0;
  const v2IssuesCount = ver2.analysis?.issues?.length || 0;
  const issuesDelta = v1IssuesCount - v2IssuesCount;

  return {
    v1Number: ver1.versionNumber,
    v2Number: ver2.versionNumber,
    lineDiff,
    wordDiff,
    scoreComparison: {
      v1Overall: v1Score,
      v2Overall: v2Score,
      scoreDelta,
      v1Breakdown,
      v2Breakdown,
      issuesDelta,
    },
  };
}

module.exports = {
  compareVersions,
};
