import { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain, CheckCircle2, XCircle, Lightbulb, AlertTriangle,
  TrendingUp, BarChart3, Zap, ChevronDown, ChevronUp, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

/* ─────────────────────────────── helpers ─── */
function ScoreRing({ score, size = 88, label, subLabel, color = "var(--accent)" }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  const getColor = () => {
    if (score >= 75) return "var(--success)";
    if (score >= 50) return "var(--warning)";
    return "var(--danger)";
  };

  const ringColor = color === "auto" ? getColor() : color;

  return (
    <div className="flex flex-col items-center gap-1">
      <div style={{ width: size, height: size }} className="relative">
        <svg width={size} height={size} className="rotate-[-90deg]">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={8} />
          <motion.circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={ringColor}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-xl font-bold tabular" style={{ color: ringColor }}>{score}</span>
          <span className="text-[9px] text-[var(--ink-muted)] uppercase tracking-wide">/ 100</span>
        </div>
      </div>
      {label && <div className="text-xs font-semibold text-[var(--ink)] text-center">{label}</div>}
      {subLabel && <div className="text-[10px] text-[var(--ink-muted)] text-center">{subLabel}</div>}
    </div>
  );
}

function SectionBar({ label, score }) {
  const getColor = () => {
    if (score >= 75) return "var(--success)";
    if (score >= 50) return "var(--warning)";
    return "var(--danger)";
  };
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--ink)] capitalize font-medium">{label}</span>
        <span className="tabular font-semibold" style={{ color: getColor() }}>{score}</span>
      </div>
      <div className="h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: getColor() }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function CollapsibleCard({ icon: Icon, title, tone = "accent", children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const toneClasses = {
    accent: "bg-[var(--accent-soft)] text-[var(--accent-strong)]",
    warning: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
    danger: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
    success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-500",
  };

  return (
    <Card>
      <button
        className="w-full flex items-center justify-between gap-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", toneClasses[tone])}>
            <Icon size={16} />
          </div>
          <span className="font-display font-semibold tracking-tight text-sm text-[var(--ink)]">{title}</span>
        </div>
        {open ? <ChevronUp size={14} className="text-[var(--ink-muted)]" /> : <ChevronDown size={14} className="text-[var(--ink-muted)]" />}
      </button>
      {open && <div className="mt-4 border-t border-[var(--border)] pt-4">{children}</div>}
    </Card>
  );
}

/* ─────────────────────────────── panels ─── */

function ScoresRow({ analysis }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card className="flex flex-col items-center py-6">
        <ScoreRing score={analysis.overallScore} color="auto" label="Overall Score" subLabel="Holistic quality" />
      </Card>
      <Card className="flex flex-col items-center py-6">
        <ScoreRing score={analysis.atsScore} color="auto" label="ATS Score" subLabel="Keyword & format fit" />
      </Card>
      <Card className="flex flex-col items-center py-6">
        <ScoreRing
          score={analysis.jobMatchScore}
          color={analysis.jobMatchScore > 0 ? "auto" : "var(--ink-muted)"}
          label="Job Match"
          subLabel={analysis.jobMatchScore > 0 ? "vs. job description" : "No JD provided"}
        />
      </Card>
    </div>
  );
}

function SkillsPanel({ skills }) {
  if (!skills) return null;
  const matched = skills.matched || [];
  const missing = skills.missing || [];
  const important = skills.important || [];

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="text-base">Skills Analysis</CardTitle>
          <CardDescription className="mt-1">Matched vs missing vs standout skills</CardDescription>
        </div>
      </CardHeader>
      <div className="space-y-5">
        {matched.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[var(--ink-muted)] mb-2 flex items-center gap-1.5">
              <CheckCircle2 size={11} className="text-[var(--success)]" /> Matched in JD
            </div>
            <div className="flex flex-wrap gap-1.5">
              {matched.map((s, i) => (
                <Badge key={i} tone="success">{s}</Badge>
              ))}
            </div>
          </div>
        )}
        {missing.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[var(--ink-muted)] mb-2 flex items-center gap-1.5">
              <XCircle size={11} className="text-[var(--danger)]" /> Missing / Gap
            </div>
            <div className="flex flex-wrap gap-1.5">
              {missing.map((s, i) => (
                <Badge key={i} tone="danger">{s}</Badge>
              ))}
            </div>
          </div>
        )}
        {important.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[var(--ink-muted)] mb-2 flex items-center gap-1.5">
              <Zap size={11} className="text-[var(--accent-strong)]" /> Standout skills
            </div>
            <div className="flex flex-wrap gap-1.5">
              {important.map((s, i) => (
                <Badge key={i} tone="accent">{s}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function SectionsPanel({ sections }) {
  if (!sections || Object.keys(sections).length === 0) return null;
  const entries = Object.entries(sections).filter(([, v]) => typeof v === "number" && v > 0);
  if (entries.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="text-base">Section Scores</CardTitle>
          <CardDescription className="mt-1">AI evaluation of each resume section</CardDescription>
        </div>
        <BarChart3 size={16} className="text-[var(--ink-muted)]" />
      </CardHeader>
      <div className="space-y-3">
        {entries.map(([label, score]) => (
          <SectionBar key={label} label={label} score={score} />
        ))}
      </div>
    </Card>
  );
}

function WeaknessesPanel({ weaknesses }) {
  if (!weaknesses || weaknesses.length === 0) return null;
  return (
    <CollapsibleCard icon={AlertTriangle} title={`Weaknesses (${weaknesses.length})`} tone="warning" defaultOpen={true}>
      <ul className="space-y-2">
        {weaknesses.map((w, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[var(--ink)]">
            <AlertTriangle size={13} className="shrink-0 mt-0.5 text-[var(--warning)]" />
            <span>{w}</span>
          </li>
        ))}
      </ul>
    </CollapsibleCard>
  );
}

function SuggestionsPanel({ suggestions }) {
  if (!suggestions || suggestions.length === 0) return null;
  return (
    <CollapsibleCard icon={Lightbulb} title={`Suggestions (${suggestions.length})`} tone="accent" defaultOpen={true}>
      <ul className="space-y-2">
        {suggestions.map((s, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[var(--ink)]">
            <ArrowRight size={13} className="shrink-0 mt-0.5 text-[var(--accent-strong)]" />
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </CollapsibleCard>
  );
}

function BulletImprovementsPanel({ improvements }) {
  if (!improvements || improvements.length === 0) return null;
  return (
    <CollapsibleCard icon={TrendingUp} title={`Bullet Improvements (${improvements.length})`} tone="success" defaultOpen={true}>
      <div className="space-y-4">
        {improvements.map((item, i) => (
          <div key={i} className="rounded-2xl border border-[var(--border)] overflow-hidden text-sm">
            <div className="p-3 bg-[var(--surface-2)] text-[var(--ink-muted)]">
              <div className="text-[10px] uppercase tracking-wide mb-1 text-[var(--danger)]">Original</div>
              {item.original}
            </div>
            <div className="p-3 bg-[var(--accent-soft)] text-[var(--ink)]">
              <div className="text-[10px] uppercase tracking-wide mb-1 text-[var(--success)]">Improved</div>
              {item.improved}
            </div>
            {item.reason && (
              <div className="px-3 py-2 text-xs text-[var(--ink-muted)] border-t border-[var(--border)]">
                💡 {item.reason}
              </div>
            )}
          </div>
        ))}
      </div>
    </CollapsibleCard>
  );
}

function KeywordsPanel({ keywords }) {
  if (!keywords) return null;
  const matched = keywords.matched || keywords.present || [];
  const missing = keywords.missing || [];
  const recommended = keywords.recommended || [];

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="text-base">Keywords</CardTitle>
          <CardDescription className="mt-1">Keyword presence and recommendations</CardDescription>
        </div>
      </CardHeader>
      <div className="space-y-4">
        {matched.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[var(--ink-muted)] mb-2">✓ Found</div>
            <div className="flex flex-wrap gap-1.5">
              {matched.map((k, i) => <Badge key={i} tone="success">{k}</Badge>)}
            </div>
          </div>
        )}
        {missing.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[var(--ink-muted)] mb-2">✗ Missing</div>
            <div className="flex flex-wrap gap-1.5">
              {missing.map((k, i) => <Badge key={i} tone="danger">{k}</Badge>)}
            </div>
          </div>
        )}
        {recommended.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[var(--ink-muted)] mb-2">+ Recommended</div>
            <div className="flex flex-wrap gap-1.5">
              {recommended.map((k, i) => <Badge key={i} tone="neutral">{k}</Badge>)}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ─────────────────────────────── main panel ─── */

export function GroqAnalysisPanel({ analysis }) {
  if (!analysis) return null;

  return (
    <div className="space-y-5">
      {/* Summary card */}
      {analysis.summary && (
        <Card className="border-l-4 border-l-[var(--accent)]">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent-strong)] shrink-0 mt-0.5">
              <Brain size={15} />
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-1">AI Verdict</div>
              <p className="text-sm text-[var(--ink)] leading-relaxed">{analysis.summary}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Score rings */}
      <ScoresRow analysis={analysis} />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SkillsPanel skills={analysis.skills} />
        <SectionsPanel sections={analysis.sections} />
      </div>

      <KeywordsPanel keywords={analysis.keywords} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <WeaknessesPanel weaknesses={analysis.weaknesses} />
        <SuggestionsPanel suggestions={analysis.suggestions} />
      </div>

      <BulletImprovementsPanel improvements={analysis.bulletPointImprovements} />
    </div>
  );
}
