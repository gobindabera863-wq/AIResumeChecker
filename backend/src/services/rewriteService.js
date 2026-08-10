const ApiError = require("../utils/ApiError");

/**
 * Applies selected (or all) AI bullet rewrites to a resume version's structuredData and rawText.
 * @param {object} currentVersion - The current version object containing structuredData, rawText, analysis
 * @param {string[]} [selectedRewriteIds=[]] - Array of rewrite IDs to apply
 * @param {boolean} [applyAll=false] - Whether to apply all available rewrites
 * @returns {object} { updatedStructuredData, updatedRawText, appliedCount, appliedRewrites }
 */
function applyRewritesToResume(currentVersion, selectedRewriteIds = [], applyAll = false) {
  if (!currentVersion) {
    throw ApiError.badRequest("Current version data is missing");
  }

  const availableRewrites = currentVersion.analysis?.bulletRewrites || [];
  if (!availableRewrites.length) {
    throw ApiError.badRequest("No bullet rewrites available in the current version's analysis");
  }

  // Determine target rewrites
  let targetRewrites = [];
  if (applyAll || !selectedRewriteIds || selectedRewriteIds.length === 0) {
    targetRewrites = [...availableRewrites];
  } else {
    const idSet = new Set(selectedRewriteIds.map(String));
    targetRewrites = availableRewrites.filter((rw) =>
      idSet.has(String(rw.id)) || idSet.has(String(rw._id))
    );
  }

  if (!targetRewrites.length) {
    targetRewrites = [...availableRewrites];
  }

  // Deep clone structuredData
  const structuredData = JSON.parse(JSON.stringify(currentVersion.structuredData || {}));
  let rawText = currentVersion.rawText || "";
  const appliedRewrites = [];

  // Helper to match and replace a bullet
  const replaceBullet = (originalBullet) => {
    if (!originalBullet) return originalBullet;
    const match = targetRewrites.find(
      (rw) =>
        (rw.original && rw.original.trim().toLowerCase() === originalBullet.trim().toLowerCase()) ||
        (rw.original && originalBullet.includes(rw.original.trim()))
    );
    if (match) {
      appliedRewrites.push(match);
      return match.rewritten;
    }
    return originalBullet;
  };

  // Update Experience bullets
  if (Array.isArray(structuredData.experience)) {
    structuredData.experience = structuredData.experience.map((exp) => {
      if (Array.isArray(exp.bullets)) {
        exp.bullets = exp.bullets.map((b) => replaceBullet(b));
      }
      return exp;
    });
  }

  // Update Project bullets
  if (Array.isArray(structuredData.projects)) {
    structuredData.projects = structuredData.projects.map((proj) => {
      if (Array.isArray(proj.bullets)) {
        proj.bullets = proj.bullets.map((b) => replaceBullet(b));
      }
      return proj;
    });
  }

  // Replace matched bullet text inside rawText
  targetRewrites.forEach((rw) => {
    if (rw.original && rw.rewritten) {
      const origClean = rw.original.trim();
      if (rawText.includes(origClean)) {
        rawText = rawText.split(origClean).join(rw.rewritten);
      }
    }
  });

  return {
    updatedStructuredData: structuredData,
    updatedRawText: rawText,
    appliedCount: appliedRewrites.length || targetRewrites.length,
    appliedRewrites: appliedRewrites.length ? appliedRewrites : targetRewrites,
  };
}

module.exports = {
  applyRewritesToResume,
};
