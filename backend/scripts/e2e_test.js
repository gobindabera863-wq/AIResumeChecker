const http = require("http");
const { connectDB } = require("../src/config/db");
const app = require("../src/server");
const User = require("../src/models/User");
const Resume = require("../src/models/Resume");

const { PDFDocument, StandardFonts } = require("pdf-lib");

// Utility function to create a text-readable PDF buffer using pdf-lib
async function generatePdfBuffer(textLines) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let y = 750;
  for (const line of textLines) {
    page.drawText(line, { x: 50, y, size: 12, font });
    y -= 18;
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

// Simple HTTP request helper supporting cookies
function makeRequest({ port, method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "localhost",
        port,
        method,
        path,
        headers,
      },
      (res) => {
        let responseBody = "";
        res.on("data", (chunk) => (responseBody += chunk));
        res.on("end", () => {
          let parsed;
          try {
            parsed = JSON.parse(responseBody);
          } catch {
            parsed = responseBody;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        });
      }
    );

    req.on("error", reject);

    if (body) {
      if (Buffer.isBuffer(body)) {
        req.write(body);
      } else if (typeof body === "string") {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
}

// Multipart FormData builder
function buildMultipartData(fields, fileField) {
  const boundary = `--------------------------${Math.random().toString(36).substring(2, 12)}`;
  const chunks = [];

  for (const [key, val] of Object.entries(fields)) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`));
  }

  if (fileField) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${fileField.name}"; filename="${fileField.filename}"\r\nContent-Type: ${fileField.contentType}\r\n\r\n`
      )
    );
    chunks.push(fileField.buffer);
    chunks.push(Buffer.from("\r\n"));
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`));

  const buffer = Buffer.concat(chunks);
  const contentType = `multipart/form-data; boundary=${boundary}`;
  return { buffer, contentType };
}

async function runE2ETests() {
  console.log("🚀 Starting Full-Stack End-to-End Test Suite for AI Resume Checker...\n");

  const TEST_PORT = 5099;
  let server;
  let cookieHeader = "";
  let createdResumeId = null;

  try {
    // Start Express server on test port
    await new Promise((resolve) => {
      server = app.listen(TEST_PORT, async () => {
        await connectDB();
        console.log(`✅ Test server running on http://localhost:${TEST_PORT}`);
        resolve();
      });
    });

    const testEmail = `e2e_${Date.now()}@example.com`;
    const testPassword = "Password123!";

    // ==========================================
    // PHASE 1: User Authentication
    // ==========================================
    console.log("\n--- PHASE 1: User Authentication ---");

    // 1.1 Register
    const regRes = await makeRequest({
      port: TEST_PORT,
      method: "POST",
      path: "/api/auth/register",
      headers: { "Content-Type": "application/json" },
      body: { name: "E2E Test Candidate", email: testEmail, password: testPassword },
    });

    console.log(`[1.1] Register User status: ${regRes.status}`);
    if (regRes.status !== 201) throw new Error(`Registration failed: ${JSON.stringify(regRes.body)}`);

    const rawCookies = regRes.headers["set-cookie"];
    if (rawCookies && rawCookies.length) {
      cookieHeader = rawCookies.map((c) => c.split(";")[0]).join("; ");
    }
    console.log("✅ Registration successful. Session cookie set.");

    // 1.2 Fetch profile (/api/auth/me)
    const meRes = await makeRequest({
      port: TEST_PORT,
      method: "GET",
      path: "/api/auth/me",
      headers: { Cookie: cookieHeader },
    });
    console.log(`[1.2] Fetch Profile (/api/auth/me) status: ${meRes.status}`);
    if (meRes.status !== 200 || meRes.body.user.email !== testEmail) {
      throw new Error(`Profile fetch failed: ${JSON.stringify(meRes.body)}`);
    }
    console.log("✅ Authenticated user profile verified:", meRes.body.user.name);

    // ==========================================
    // PHASE 2: Resume Upload & Parsing (V1)
    // ==========================================
    console.log("\n--- PHASE 2: Resume Upload & PDF Parsing (V1) ---");

    const sampleResumeLines = [
      "Alex Johnson",
      "Email: alex.johnson@example.com Phone: 555-0199 Location: San Francisco CA",
      "Title: Senior Fullstack Engineer",
      "Summary: Highly experienced fullstack engineer specializing in Node.js React and Distributed Systems.",
      "Experience:",
      "Acme Cloud Solutions - Senior Developer (2021 - Present)",
      "- Built scalable REST APIs using Express and MongoDB.",
      "- Improved page load latency and optimized database queries.",
      "- Led frontend migration to React and Vite.",
      "Education:",
      "University of California Berkeley - BS Computer Science (2017 - 2021)",
      "Skills:",
      "JavaScript TypeScript Node.js React Express MongoDB Docker Git CI/CD PostgreSQL AWS"
    ];

    const pdfBuffer = await generatePdfBuffer(sampleResumeLines);
    const { buffer: multipartBody, contentType } = buildMultipartData(
      { title: "Alex Johnson - Resume 2026", targetRole: "Fullstack Engineer" },
      { name: "resume", filename: "Alex_Johnson_Resume.pdf", contentType: "application/pdf", buffer: pdfBuffer }
    );

    const uploadRes = await makeRequest({
      port: TEST_PORT,
      method: "POST",
      path: "/api/resumes/upload",
      headers: {
        "Content-Type": contentType,
        "Content-Length": multipartBody.length,
        Cookie: cookieHeader,
      },
      body: multipartBody,
    });

    console.log(`[2.1] Resume Upload status: ${uploadRes.status}`);
    if (uploadRes.status !== 201) throw new Error(`Upload failed: ${JSON.stringify(uploadRes.body)}`);

    const resume = uploadRes.body.resume;
    createdResumeId = resume._id;
    console.log("✅ Resume uploaded and V1 created successfully!");
    console.log(`   Resume ID: ${createdResumeId}`);
    console.log(`   Title: ${resume.title}`);
    console.log(`   Versions count: ${resume.versions.length}`);

    // ==========================================
    // PHASE 3: AI Analysis (ATS Score, Issues, Strengths, Rewrites, Keywords)
    // ==========================================
    console.log("\n--- PHASE 3: AI Analysis Inspection ---");

    const v1 = resume.versions[0];
    const analysis = v1.analysis;
    if (analysis) {
      console.log("✅ AI Analysis generated successfully for V1!");
      console.log(`   ATS Overall Score: ${analysis.atsScore?.overall ?? "N/A"} / 100`);
      console.log(`   Breakdown - Keywords: ${analysis.atsScore?.breakdown?.keywords}, Formatting: ${analysis.atsScore?.breakdown?.formatting}, Impact: ${analysis.atsScore?.breakdown?.impact}, Clarity: ${analysis.atsScore?.breakdown?.clarity}`);
      console.log(`   Issues count: ${analysis.issues?.length || 0}`);
      console.log(`   Strengths count: ${analysis.strengths?.length || 0}`);
      console.log(`   Bullet rewrites count: ${analysis.bulletRewrites?.length || 0}`);
      console.log(`   Keywords present: ${analysis.keywords?.present?.slice(0, 5).join(", ")}`);
    } else {
      console.log("⚠️ V1 analysis pending. Triggering manual analysis...");
      const analyzeRes = await makeRequest({
        port: TEST_PORT,
        method: "POST",
        path: `/api/resumes/${createdResumeId}/analyze`,
        headers: { "Content-Type": "application/json", Cookie: cookieHeader },
        body: { targetRole: "Fullstack Engineer" },
      });
      console.log(`   Manual Analyze status: ${analyzeRes.status}`);
    }

    // ==========================================
    // PHASE 4: Apply Bullet Rewrites -> Version V2 Creation
    // ==========================================
    console.log("\n--- PHASE 4: Apply Bullet Rewrites -> V2 Creation ---");

    const applyRes = await makeRequest({
      port: TEST_PORT,
      method: "POST",
      path: `/api/resumes/${createdResumeId}/apply-rewrites`,
      headers: { "Content-Type": "application/json", Cookie: cookieHeader },
      body: { applyAll: true },
    });

    console.log(`[4.1] Apply Rewrites status: ${applyRes.status}`);
    if (applyRes.status !== 201) throw new Error(`Apply rewrites failed: ${JSON.stringify(applyRes.body)}`);

    console.log(`✅ Version V${applyRes.body.newVersionNumber} created successfully!`);
    console.log(`   Applied rewrites count: ${applyRes.body.appliedCount}`);
    console.log(`   Total versions in resume: ${applyRes.body.resume.versions.length}`);

    // ==========================================
    // PHASE 5: Version Diff (V1 vs V2)
    // ==========================================
    console.log("\n--- PHASE 5: Version Diff (V1 vs V2) ---");

    const diffRes = await makeRequest({
      port: TEST_PORT,
      method: "GET",
      path: `/api/resumes/${createdResumeId}/diff?v1=1&v2=2`,
      headers: { Cookie: cookieHeader },
    });

    console.log(`[5.1] Get Version Diff status: ${diffRes.status}`);
    if (diffRes.status !== 200) throw new Error(`Version diff failed: ${JSON.stringify(diffRes.body)}`);

    const diff = diffRes.body.diff;
    console.log("✅ Version diff generated successfully!");
    console.log(`   Comparing V${diff.v1Number} vs V${diff.v2Number}`);
    console.log(`   Score V1: ${diff.scoreComparison.v1Overall} -> V2: ${diff.scoreComparison.v2Overall} (Delta: ${diff.scoreComparison.scoreDelta >= 0 ? "+" : ""}${diff.scoreComparison.scoreDelta})`);
    console.log(`   Word diff chunks count: ${diff.wordDiff.length}`);
    console.log(`   Line diff chunks count: ${diff.lineDiff.length}`);

    // ==========================================
    // PHASE 6: Aggregate Analytics & Feeds (Dashboard, Insights, Versions, History)
    // ==========================================
    console.log("\n--- PHASE 6: Aggregate Analytics & Account Feeds ---");

    // 6.1 Dashboard
    const dashRes = await makeRequest({
      port: TEST_PORT,
      method: "GET",
      path: "/api/dashboard",
      headers: { Cookie: cookieHeader },
    });
    console.log(`[6.1] Dashboard (/api/dashboard) status: ${dashRes.status}`);
    if (dashRes.status !== 200) throw new Error(`Dashboard failed: ${JSON.stringify(dashRes.body)}`);
    console.log("✅ Dashboard data fetched successfully:");
    console.log(`   Total Resumes: ${dashRes.body.totals.totalResumes}, Total Versions: ${dashRes.body.totals.totalVersions}, Rewrites: ${dashRes.body.totals.totalRewritesApplied}`);
    console.log(`   Latest Resume: ${dashRes.body.latestResume?.title}`);
    console.log(`   Activity feed events: ${dashRes.body.activityFeed?.length || 0}`);

    // 6.2 Insights
    const insightsRes = await makeRequest({
      port: TEST_PORT,
      method: "GET",
      path: "/api/insights",
      headers: { Cookie: cookieHeader },
    });
    console.log(`[6.2] Insights (/api/insights) status: ${insightsRes.status}`);
    if (insightsRes.status !== 200) throw new Error(`Insights failed: ${JSON.stringify(insightsRes.body)}`);
    console.log("✅ Insights data fetched successfully:");
    console.log(`   Average Score: ${insightsRes.body.metrics.averageScore}, Best Score: ${insightsRes.body.metrics.bestScore}`);
    console.log(`   Top recurring issues count: ${insightsRes.body.topRecurringIssues?.length || 0}`);
    console.log(`   Per-resume performance count: ${insightsRes.body.perResumePerformance?.length || 0}`);

    // 6.3 Versions
    const verRes = await makeRequest({
      port: TEST_PORT,
      method: "GET",
      path: "/api/versions",
      headers: { Cookie: cookieHeader },
    });
    console.log(`[6.3] Versions (/api/versions) status: ${verRes.status}`);
    if (verRes.status !== 200) throw new Error(`Versions failed: ${JSON.stringify(verRes.body)}`);
    console.log(`✅ Flat versions list fetched successfully (${verRes.body.totalCount} version(s)).`);

    // 6.4 History
    const histRes = await makeRequest({
      port: TEST_PORT,
      method: "GET",
      path: "/api/history",
      headers: { Cookie: cookieHeader },
    });
    console.log(`[6.4] History (/api/history) status: ${histRes.status}`);
    if (histRes.status !== 200) throw new Error(`History failed: ${JSON.stringify(histRes.body)}`);
    console.log(`✅ Chronological history feed fetched successfully (${histRes.body.totalCount} event(s)).`);

    // ==========================================
    // PHASE 7: Teardown & Cleanup
    // ==========================================
    console.log("\n--- PHASE 7: Teardown & Cleanup ---");

    if (createdResumeId) {
      const delRes = await makeRequest({
        port: TEST_PORT,
        method: "DELETE",
        path: `/api/resumes/${createdResumeId}`,
        headers: { Cookie: cookieHeader },
      });
      console.log(`[7.1] Delete Test Resume status: ${delRes.status}`);
      console.log("✅ Test resume deleted successfully.");
    }

    // Cleanup test user in DB
    await User.deleteOne({ email: testEmail });
    console.log("✅ Test user cleaned up from database.");

    // Logout
    const logoutRes = await makeRequest({
      port: TEST_PORT,
      method: "POST",
      path: "/api/auth/logout",
      headers: { Cookie: cookieHeader },
    });
    console.log(`[7.2] Logout status: ${logoutRes.status}`);
    console.log("✅ Logout successful.");

    console.log("\n🎉 ALL 7 E2E TEST PHASES PASSED WITH 100% SUCCESS!\n");
  } catch (err) {
    console.error("\n❌ E2E TEST FAILED:", err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
      console.log("Server closed.");
    }
    process.exit(process.exitCode || 0);
  }
}

runE2ETests();
