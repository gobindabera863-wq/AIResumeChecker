import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sparkles, ArrowLeft, Loader2, FileText, Download, Brain } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { AtsGauge } from "@/components/dashboard/AtsGauge";
import { ScoreBreakdown } from "@/components/analysis/ScoreBreakdown";
import { IssuesList } from "@/components/analysis/IssuesList";
import { StrengthsList } from "@/components/analysis/StrengthsList";
import { KeywordChips } from "@/components/analysis/KeywordChips";
import { BulletRewrites } from "@/components/analysis/BulletRewrites";
import { GroqAnalysisPanel } from "@/components/analysis/GroqAnalysisPanel";
import { VersionSwitcher } from "@/components/resume/VersionSwitcher";
import { DiffView } from "@/components/resume/DiffView";
import { relativeTime } from "@/lib/utils";
import {
  useResume,
  useAnalysisForVersion,
  useAnalyzeResume,
  useApplyRewrites,
  useGroqAnalyze,
} from "@/hooks/useResumes";

export default function ResumeDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  const { data, isLoading, error } = useResume(id);
  const resume = data?.resume;
  const versions = useMemo(() => data?.versions || [], [data?.versions]);

  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const activeVersionId = selectedVersionId || resume?.currentVersionId || versions[versions.length - 1]?._id;

  const activeVersion = useMemo(
    () => versions.find((v) => v._id === activeVersionId),
    [versions, activeVersionId]
  );

  const analysisQuery = useAnalysisForVersion(id, activeVersionId);
  const analysis = analysisQuery.data?.analysis;
  const extendedAnalysis =
    analysisQuery.data?.extendedAnalysis ||
    activeVersion?.extendedAnalysis ||
    null;

  const analyze = useAnalyzeResume(id);
  const applyRewrites = useApplyRewrites(id);
  const groqAnalyze = useGroqAnalyze(id);

  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [showJdDeep, setShowJdDeep] = useState(false);
  const [tab, setTab] = useState("score");

  const [liveExtended, setLiveExtended] = useState(null);
  const activeExtended = liveExtended || extendedAnalysis;

  async function runAnalyze() {
    try {
      await analyze.mutateAsync({
        versionId: activeVersionId,
        targetRole: targetRole.trim() || undefined,
      });
    } catch {
      /* surfaced in UI */
    }
  }

  async function runGroqAnalyze() {
    try {
      const result = await groqAnalyze.mutateAsync({
        versionId: activeVersionId,
        targetRole: targetRole.trim() || undefined,
        jobDescription: jobDescription.trim() || undefined,
      });
      if (result?.extendedAnalysis) {
        setLiveExtended(result.extendedAnalysis);
        setTab("deep");
      }
    } catch {
      /* surfaced in UI */
    }
  }

  async function runApplyRewrites(rewriteIds = []) {
    try {
      const res = await applyRewrites.mutateAsync({
        rewriteIds: rewriteIds && rewriteIds.length ? rewriteIds : undefined,
        applyAll: !rewriteIds || !rewriteIds.length,
      });
      if (res?.version?._id || res?.version?.versionNumber) {
        const newVersionId = res.version._id || `v-${res.version.versionNumber}`;
        setSelectedVersionId(newVersionId);
        setLiveExtended(null);
        setTab("score");
        try {
          await analyze.mutateAsync({
            versionId: newVersionId,
            targetRole: targetRole.trim() || undefined,
          });
        } catch {
          /* surfaced in UI */
        }
      }
    } catch {
      /* surfaced in UI */
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-1/3 rounded-2xl" />
        <Skeleton className="h-[400px] rounded-3xl" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={FileText}
        title="Resume not found"
        description={error.message}
        action={
          <Button variant="outline" onClick={() => nav("/resumes")}>
            Back to resumes
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={resume?.title || "Resume"}
        description={
          resume
            ? `Updated ${relativeTime(resume.updatedAt)} · ${versions.length} version${
                versions.length > 1 ? "s" : ""
              }`
            : ""
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => nav("/resumes")}>
              <ArrowLeft size={14} /> All resumes
            </Button>
            <Button
              variant="outline"
              onClick={() => nav(`/resumes/${id}/export`)}
            >
              <Download size={14} /> Export PDF
            </Button>
          </div>
        }
      />

      {/* ── Analyze Card ── */}
      <Card>
        <div className="flex flex-wrap items-start gap-4 justify-between">
          <div className="space-y-2">
            <CardTitle className="text-base">Run analysis</CardTitle>
            <CardDescription>
              Score this version with AI and get issues, strengths, and rewrites.
            </CardDescription>
            <VersionSwitcher
              versions={versions}
              activeId={activeVersionId}
              onChange={setSelectedVersionId}
            />
          </div>
          <div className="flex flex-col gap-3 flex-1 min-w-[280px] max-w-[560px]">
            <Input
              placeholder="Target role (optional, e.g. Senior Frontend Engineer)"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            />

            {/* Job description toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowJdDeep((v) => !v)}
                className="text-xs text-[var(--accent-strong)] hover:underline transition-colors"
              >
                {showJdDeep ? "▾ Hide job description" : "▸ Add job description (enables match scoring)"}
              </button>
              {showJdDeep && (
                <textarea
                  className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] p-3 resize-none focus:outline-none focus:border-[var(--accent)] transition-colors"
                  rows={4}
                  placeholder="Paste the job description here…"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="accent"
                size="lg"
                onClick={runAnalyze}
                disabled={analyze.isPending || groqAnalyze.isPending || !activeVersionId}
                className="flex-1"
              >
                {analyze.isPending ? (
                  <><Loader2 size={14} className="animate-spin" /> Analyzing…</>
                ) : (
                  <><Sparkles size={14} /> Quick Analyze</>
                )}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={runGroqAnalyze}
                disabled={groqAnalyze.isPending || analyze.isPending || !activeVersionId}
                className="flex-1"
              >
                {groqAnalyze.isPending ? (
                  <><Loader2 size={14} className="animate-spin" /> Deep Analyzing…</>
                ) : (
                  <><Brain size={14} /> Deep Analyze</>
                )}
              </Button>
            </div>
          </div>
        </div>
        {analyze.error && (
          <div className="mt-4 text-xs text-[var(--danger)] bg-[#F8E3E0] rounded-xl px-3 py-2">
            {analyze.error.message}
          </div>
        )}
        {groqAnalyze.error && (
          <div className="mt-2 text-xs text-[var(--danger)] bg-[#F8E3E0] rounded-xl px-3 py-2">
            {groqAnalyze.error.message}
          </div>
        )}
      </Card>

      {!analysis && !activeExtended && !analysisQuery.isLoading && (
        <EmptyState
          icon={Sparkles}
          title="No analysis yet for this version"
          description="Click Quick Analyze for ATS scoring, or Deep Analyze for a full Groq-powered breakdown."
        />
      )}

      {analysisQuery.isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Skeleton className="h-[280px] rounded-3xl" />
          <Skeleton className="h-[280px] rounded-3xl lg:col-span-2" />
        </div>
      )}

      {(analysis || activeExtended) && (
        <>
          {analysis && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-4">
                <AtsGauge
                  score={
                    typeof analysis.atsScore === "number"
                      ? analysis.atsScore
                      : analysis.atsScore?.overall || 0
                  }
                  delta={0}
                />
              </div>
              <div className="lg:col-span-5">
                <ScoreBreakdown
                  breakdown={analysis.scoreBreakdown || analysis.atsScore?.breakdown}
                />
              </div>
              <div className="lg:col-span-3">
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <div>
                      <CardTitle className="text-base">Verdict</CardTitle>
                      <CardDescription className="mt-1">
                        AI overall summary
                      </CardDescription>
                    </div>
                    <Badge tone="accent">{analysis.model || "AI"}</Badge>
                  </CardHeader>
                  <p className="text-sm text-[var(--ink)] leading-relaxed">
                    {analysis.summary ||
                      (analysis.strengths && analysis.strengths[0]?.detail) ||
                      "Resume analysis completed."}
                  </p>
                </Card>
              </div>
            </div>
          )}

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="score">Issues</TabsTrigger>
              <TabsTrigger value="strengths">Strengths</TabsTrigger>
              <TabsTrigger value="keywords">Keywords</TabsTrigger>
              <TabsTrigger value="rewrites">Rewrites</TabsTrigger>
              {activeExtended && (
                <TabsTrigger value="deep">
                  <Brain size={12} className="mr-1" />
                  Deep Analysis
                </TabsTrigger>
              )}
              {versions.length >= 2 && (
                <TabsTrigger value="diff">Diff</TabsTrigger>
              )}
            </TabsList>

            <div className="mt-5">
              <TabsContent value="score">
                <IssuesList issues={analysis?.issues || []} />
              </TabsContent>
              <TabsContent value="strengths">
                <StrengthsList strengths={analysis?.strengths || []} />
              </TabsContent>
              <TabsContent value="keywords">
                <KeywordChips
                  present={analysis?.keywordsPresent || analysis?.keywords?.present || []}
                  missing={analysis?.keywordsMissing || analysis?.keywords?.missing || []}
                />
              </TabsContent>
              <TabsContent value="rewrites">
                <BulletRewrites
                  rewrites={analysis?.bulletRewrites}
                  onApply={runApplyRewrites}
                  isApplying={applyRewrites.isPending}
                  error={applyRewrites.error?.message}
                />
              </TabsContent>
              <TabsContent value="deep">
                {groqAnalyze.isPending ? (
                  <div className="space-y-3 py-6">
                    <Skeleton className="h-[140px] rounded-3xl" />
                    <div className="grid grid-cols-3 gap-4">
                      <Skeleton className="h-[160px] rounded-3xl" />
                      <Skeleton className="h-[160px] rounded-3xl" />
                      <Skeleton className="h-[160px] rounded-3xl" />
                    </div>
                    <Skeleton className="h-[200px] rounded-3xl" />
                  </div>
                ) : activeExtended ? (
                  <GroqAnalysisPanel analysis={activeExtended} />
                ) : (
                  <EmptyState
                    icon={Brain}
                    title="No deep analysis yet"
                    description="Click Deep Analyze above to get a full Groq-powered breakdown with job match score, skills gap, section scores, and bullet improvements."
                  />
                )}
              </TabsContent>
              <TabsContent value="diff">
                <DiffView resumeId={id} versions={versions} />
              </TabsContent>
            </div>
          </Tabs>
        </>
      )}

      {activeVersion && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-base">Parsed Sections ({activeVersion.label})</CardTitle>
              <CardDescription className="mt-1">
                Quick preview of what we extracted from the PDF
              </CardDescription>
            </div>
          </CardHeader>
          <ParsedSectionsPreview version={activeVersion} />
        </Card>
      )}
    </div>
  );
}

function PreviewLabel({ children }) {
  return (
    <div className="text-[10px] uppercase tracking-wide text-[var(--ink-muted)] mb-1.5">
      {children}
    </div>
  );
}

function ParsedSectionsPreview({ version }) {
  const s = version.parsedSections || {};
  const b = s.basics || {};

  return (
    <div className="space-y-4 text-sm">
      {(b.name || b.title || b.email) && (
        <div className="pb-4 border-b border-[var(--border)]">
          {b.name && (
            <div className="font-display text-lg font-semibold tracking-tight text-[var(--ink)]">
              {b.name}
            </div>
          )}
          {b.title && (
            <div className="text-[var(--accent-strong)] text-sm">{b.title}</div>
          )}
          <div className="text-xs text-[var(--ink-muted)] mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {b.email && <span>{b.email}</span>}
            {b.phone && <span>{b.phone}</span>}
            {b.location && <span>{b.location}</span>}
            {(b.links || []).map((l, i) => (
              <span key={i}>{l.label}</span>
            ))}
          </div>
        </div>
      )}

      {s.summary && (
        <div>
          <PreviewLabel>Summary</PreviewLabel>
          <p className="text-[var(--ink)] leading-relaxed">{s.summary}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {s.experience?.length > 0 && (
          <div>
            <PreviewLabel>Experience ({s.experience.length})</PreviewLabel>
            <ul className="space-y-1.5">
              {s.experience.slice(0, 5).map((e, i) => (
                <li key={i}>
                  <span className="text-[var(--ink)] font-medium">{e.role}</span>
                  {e.company && (
                    <span className="text-[var(--ink-muted)]"> · {e.company}</span>
                  )}
                  {e.period && (
                    <span className="ml-2 text-[11px] text-[var(--ink-muted)]">
                      {e.period}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {s.education?.length > 0 && (
          <div>
            <PreviewLabel>Education ({s.education.length})</PreviewLabel>
            <ul className="space-y-1.5">
              {s.education.map((e, i) => (
                <li key={i}>
                  <span className="text-[var(--ink)] font-medium">{e.degree}</span>
                  {e.school && (
                    <span className="text-[var(--ink-muted)]"> · {e.school}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {s.skills?.length > 0 && (
        <div>
          <PreviewLabel>Skills ({s.skills.length})</PreviewLabel>
          <div className="flex flex-wrap gap-1.5">
            {s.skills.slice(0, 24).map((sk, i) => (
              <Badge key={i} tone="accent">{sk}</Badge>
            ))}
          </div>
        </div>
      )}

      {s.projects?.length > 0 && (
        <div>
          <PreviewLabel>Projects ({s.projects.length})</PreviewLabel>
          <ul className="space-y-1.5">
            {s.projects.slice(0, 5).map((p, i) => (
              <li key={i}>
                <span className="text-[var(--ink)] font-medium">{p.name}</span>
                {p.tech?.length > 0 && (
                  <span className="ml-2 text-[11px] text-[var(--accent-strong)]">
                    {p.tech.join(" · ")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {s.certifications?.length > 0 && (
          <div>
            <PreviewLabel>Certifications</PreviewLabel>
            <ul className="space-y-1 text-xs text-[var(--ink-muted)]">
              {s.certifications.map((c, i) => (
                <li key={i}>
                  <span className="text-[var(--ink)]">{c.name}</span>
                  {c.year && <span> · {c.year}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
        {s.languages?.length > 0 && (
          <div>
            <PreviewLabel>Languages</PreviewLabel>
            <div className="flex flex-wrap gap-1">
              {s.languages.map((l, i) => (
                <Badge key={i} tone="neutral">{l}</Badge>
              ))}
            </div>
          </div>
        )}
        {s.interests?.length > 0 && (
          <div>
            <PreviewLabel>Interests</PreviewLabel>
            <div className="flex flex-wrap gap-1">
              {s.interests.map((l, i) => (
                <Badge key={i} tone="neutral">{l}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
