const pdfParse = require("pdf-parse");
const zlib = require("zlib");
const ApiError = require("../utils/ApiError");

/**
 * Fallback PDF text extraction that parses and decompresses stream objects directly.
 */
function extractTextFromPdfBufferFallback(pdfBuffer) {
  const textParts = [];
  const streamMarker = Buffer.from("stream");
  const endStreamMarker = Buffer.from("endstream");

  let pos = 0;
  while ((pos = pdfBuffer.indexOf(streamMarker, pos)) !== -1) {
    const streamStart = pos + streamMarker.length;
    const streamEnd = pdfBuffer.indexOf(endStreamMarker, streamStart);
    if (streamEnd === -1) break;

    let streamContent = pdfBuffer.subarray(streamStart, streamEnd);
    if (streamContent[0] === 13) streamContent = streamContent.subarray(1);
    if (streamContent[0] === 10) streamContent = streamContent.subarray(1);

    let decompressedStr = "";
    try {
      decompressedStr = zlib.unzipSync(streamContent).toString("latin1");
    } catch {
      try {
        decompressedStr = zlib.inflateRawSync(streamContent.subarray(2)).toString("latin1");
      } catch {
        decompressedStr = streamContent.toString("latin1");
      }
    }

    // 1. Match hex encoded text strings e.g. <416C6578...> Tj
    const hexTjRegex = /<([0-9A-Fa-f]+)>\s*Tj/g;
    let match;
    while ((match = hexTjRegex.exec(decompressedStr)) !== null) {
      try {
        const decoded = Buffer.from(match[1], "hex").toString("utf8");
        if (decoded.trim()) textParts.push(decoded.trim());
      } catch {
        // continue
      }
    }

    // 2. Match standard parenthesized text strings e.g. (Alex Johnson) Tj
    const asciiTjRegex = /\(([^()]+)\)\s*Tj/g;
    while ((match = asciiTjRegex.exec(decompressedStr)) !== null) {
      if (match[1].trim()) textParts.push(match[1].trim());
    }

    pos = streamEnd + endStreamMarker.length;
  }

  return textParts.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * Extracts raw text from a PDF buffer using pdf-parse with fallback to stream decoding.
 */
async function extractTextFromPDF(pdfBuffer) {
  if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
    throw ApiError.badRequest("Invalid PDF buffer provided");
  }

  let text = "";
  try {
    const pdfData = await pdfParse(pdfBuffer);
    text = pdfData.text || "";
  } catch (parseError) {
    console.warn("pdf-parse standard extraction warning:", parseError.message, "- trying stream decoder fallback...");
    text = extractTextFromPdfBufferFallback(pdfBuffer);
  }

  // Clean null bytes and control characters (except newlines and tabs)
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();

  // Scanned / Image-only / Low text content check
  if (text.length < 50) {
    throw ApiError.badRequest(
      "PDF appears to be scanned, image-only, or empty. Please upload a text-readable PDF resume."
    );
  }

  return text;
}

module.exports = {
  extractTextFromPDF,
};
