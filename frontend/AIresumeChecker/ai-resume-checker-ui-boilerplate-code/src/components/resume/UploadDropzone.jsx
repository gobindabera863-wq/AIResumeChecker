import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, X, Loader2, Brain, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useUploadResume } from "@/hooks/useResumes";

const MAX_BYTES = 5 * 1024 * 1024;

const UPLOAD_STEPS = [
  { icon: UploadCloud, label: "Uploading file…" },
  { icon: FileText,  label: "Extracting text…" },
  { icon: Brain,     label: "Parsing resume…"  },
  { icon: Cpu,       label: "Running AI analysis…" },
];

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function UploadProgress() {
  const [step, setStep] = useState(0);

  if (step < UPLOAD_STEPS.length - 1) {
    setTimeout(() => setStep((s) => Math.min(s + 1, UPLOAD_STEPS.length - 1)), 1800);
  }

  const current = UPLOAD_STEPS[step];

  return (
    <div className="space-y-3 py-2">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent-strong)] shrink-0">
          <Loader2 size={16} className="animate-spin" />
        </div>
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="text-sm font-medium text-[var(--ink)]"
            >
              {current.label}
            </motion.div>
          </AnimatePresence>
          <div className="text-xs text-[var(--ink-muted)] mt-0.5">This may take 15–30 seconds</div>
        </div>
      </div>
      <div className="h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[var(--accent)] to-emerald-400 rounded-full"
          initial={{ width: "5%" }}
          animate={{ width: `${((step + 1) / UPLOAD_STEPS.length) * 100}%` }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </div>
      <div className="flex gap-1.5 mt-1">
        {UPLOAD_STEPS.map((s, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-500",
              i <= step ? "bg-[var(--accent)]" : "bg-[var(--border)]"
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function UploadDropzone({ onUploaded, compact = false }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [showJdField, setShowJdField] = useState(false);
  const [err, setErr] = useState("");
  const upload = useUploadResume();

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    maxSize: MAX_BYTES,
    multiple: false,
    onDropAccepted: (files) => {
      setErr("");
      setFile(files[0]);
      if (!title) setTitle(files[0].name.replace(/\.(pdf|docx)$/i, ""));
    },
    onDropRejected: (rejections) => {
      const reason = rejections?.[0]?.errors?.[0]?.message || "File rejected";
      setErr(reason);
    },
  });

  async function submit() {
    if (!file) return;
    setErr("");
    try {
      const data = await upload.mutateAsync({ file, title, jobDescription });
      setFile(null);
      setTitle("");
      setJobDescription("");
      setShowJdField(false);
      onUploaded?.(data.resume);
    } catch (e) {
      setErr(e.message || "Upload failed");
    }
  }

  function reset() {
    setFile(null);
    setTitle("");
    setJobDescription("");
    setShowJdField(false);
    setErr("");
  }

  return (
    <div className="space-y-3">
      {!file && (
        <div
          {...getRootProps()}
          className={cn(
            "rounded-3xl border border-dashed cursor-pointer transition-all duration-200 outline-none",
            compact ? "p-6" : "p-10",
            isDragActive
              ? "border-[var(--accent)] bg-[var(--accent-soft)]"
              : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)]/40",
            isDragReject && "border-[var(--danger)] bg-[#F8E3E0]"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center text-center">
            <motion.div
              animate={isDragActive ? { y: -4 } : { y: 0 }}
              className={cn(
                "rounded-2xl flex items-center justify-center mb-3",
                compact ? "h-10 w-10" : "h-14 w-14",
                isDragActive
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
              )}
            >
              <UploadCloud size={compact ? 18 : 22} />
            </motion.div>
            <div className={cn("font-display font-semibold tracking-tight", compact ? "text-sm" : "text-base")}>
              {isDragActive ? "Drop it here" : "Drop your resume"}
            </div>
            <div className="text-xs text-[var(--ink-muted)] mt-1">
              or click to browse · PDF or DOCX · max 5 MB
            </div>
          </div>
        </div>
      )}

      {file && (
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent-strong)] shrink-0">
            <FileText size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{file.name}</div>
            <div className="text-xs text-[var(--ink-muted)]">{formatBytes(file.size)}</div>
          </div>
          <button
            onClick={reset}
            className="h-8 w-8 rounded-full hover:bg-[var(--surface-2)] flex items-center justify-center text-[var(--ink-muted)]"
            disabled={upload.isPending}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {file && !upload.isPending && (
        <div className="space-y-3">
          <Input
            placeholder="Resume title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div>
            <button
              type="button"
              onClick={() => setShowJdField((v) => !v)}
              className="text-xs text-[var(--accent-strong)] hover:underline flex items-center gap-1 transition-colors"
            >
              {showJdField ? "▾ Hide job description" : "▸ Paste job description (boosts match scoring)"}
            </button>
            <AnimatePresence>
              {showJdField && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <textarea
                    className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] p-3 resize-none focus:outline-none focus:border-[var(--accent)] transition-colors"
                    rows={5}
                    placeholder="Paste the job description here to get a job match score and tailored skill gap analysis…"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button
            onClick={submit}
            variant="accent"
            size="lg"
            disabled={upload.isPending}
            className="w-full"
          >
            Upload &amp; Analyze
          </Button>
        </div>
      )}

      {file && upload.isPending && <UploadProgress />}

      {err && (
        <div className="text-xs text-[var(--danger)] bg-[#F8E3E0] rounded-xl px-3 py-2">
          {err}
        </div>
      )}
    </div>
  );
}
