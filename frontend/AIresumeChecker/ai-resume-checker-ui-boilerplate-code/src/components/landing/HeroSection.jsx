import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Play, Sparkles, ShieldCheck } from "lucide-react";
import { DarkPanel } from "./DarkPanel";
import { HeroDashboardPreview } from "./HeroDashboardPreview";

export function HeroSection() {
  return (
    <section className="relative w-full">
      <DarkPanel
        className="w-full min-h-[760px] lg:min-h-[820px]"
        radius="rounded-b-[40px] sm:rounded-b-[56px]"
      >
        <div
          className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-10 items-center px-6 sm:px-10 lg:px-16 pt-32 sm:pt-36 lg:pt-40 pb-16 lg:pb-24"
          style={{ maxWidth: 1280, marginLeft: "auto", marginRight: "auto" }}
        >
          {/* Copy */}
          <div className="text-white">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-md"
            >
              <Sparkles size={13} className="text-[#34D399]" />
              <span className="text-[12px] tracking-wide text-emerald-200 uppercase font-bold">
                Now scoring against ATS 2026 criteria
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05 }}
              className="font-display text-[48px] sm:text-[64px] lg:text-[80px] leading-[0.98] tracking-tight mt-7 font-extrabold"
            >
              Beat the ATS.
              <br />
              <span className="text-white/95">Land more</span>{" "}
              <span
                style={{
                  backgroundImage:
                    "linear-gradient(120deg, #6EE7B7 0%, #34D399 45%, #A7F3D0 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "transparent",
                  filter: "drop-shadow(0 2px 8px rgba(52, 211, 153, 0.3))",
                }}
              >
                interviews.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="text-white/90 text-base sm:text-lg lg:text-[19px] mt-6 max-w-[540px] leading-relaxed font-medium"
            >
              Upload your resume. Get an instant ATS score, fixable issues, and AI-rewritten bullets
              that actually sound like you — built for engineers, by engineers.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="flex flex-wrap items-center gap-3 mt-8"
            >
              <Link
                to="/register"
                className="group relative inline-flex items-center gap-2 h-12 px-6 rounded-full font-bold text-[14px] text-white shadow-[0_10px_30px_-8px_rgba(52,211,153,0.6)] transition-all hover:shadow-[0_14px_36px_-8px_rgba(52,211,153,0.8)] active:scale-[0.98]"
                style={{
                  background:
                    "linear-gradient(135deg, #10B981 0%, #047857 55%, #064E3B 100%)",
                }}
              >
                <span
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 50%)",
                  }}
                />
                <span className="relative">Upload your resume</span>
                <ArrowRight size={15} className="relative group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 h-12 px-5 rounded-full font-semibold text-[14px] text-white bg-white/12 border border-white/20 backdrop-blur-md hover:bg-white/20 transition-colors"
              >
                <Play size={13} fill="currentColor" />
                See how it works
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 text-[13px] text-white/80 font-medium"
            >
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#34D399]" />
                No credit card required
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Free ATS analysis
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                47,300+ resumes analyzed
              </span>
            </motion.div>
          </div>

          {/* Visual */}
          <div className="relative">
            <HeroDashboardPreview />
          </div>
        </div>
      </DarkPanel>
    </section>
  );
}
