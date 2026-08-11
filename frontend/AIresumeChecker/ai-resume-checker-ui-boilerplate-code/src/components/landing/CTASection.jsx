import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { DarkPanel } from "./DarkPanel";

export function CTASection() {
  return (
    <section
      id="pricing"
      className="px-3 sm:px-6 mt-28 sm:mt-36"
      style={{ maxWidth: 1240, marginLeft: "auto", marginRight: "auto" }}
    >
      <DarkPanel className="px-6 sm:px-12 lg:px-20 py-16 sm:py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-md"
        >
          <span className="h-2 w-2 rounded-full bg-[#34D399] animate-pulse" />
          <span className="text-[12px] tracking-wide text-emerald-200 uppercase font-bold">
            Free forever for your first 3 analyses
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="font-display text-[36px] sm:text-[52px] lg:text-[64px] leading-[1.04] tracking-tight text-white mt-6 max-w-3xl mx-auto font-extrabold"
        >
          Stop guessing what
          <br />
          recruiters{" "}
          <span
            style={{
              backgroundImage:
                "linear-gradient(120deg, #6EE7B7 0%, #34D399 50%, #A7F3D0 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
              filter: "drop-shadow(0 2px 8px rgba(52, 211, 153, 0.3))",
            }}
          >
            actually see.
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-white/90 text-base sm:text-lg mt-5 max-w-xl mx-auto leading-relaxed font-medium"
        >
          Upload your resume now. Get your ATS score, fixable issues, and AI rewrites
          in under 15 seconds.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            to="/register"
            className="group relative inline-flex items-center gap-2 h-12 px-6 rounded-full font-bold text-[14px] text-white shadow-[0_10px_30px_-8px_rgba(52,211,153,0.6)] hover:shadow-[0_14px_36px_-8px_rgba(52,211,153,0.8)] active:scale-[0.98] transition-all"
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
            <span className="relative">Start free ATS analysis</span>
            <ArrowRight size={15} className="relative group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 h-12 px-5 rounded-full font-semibold text-[14px] text-white bg-white/12 border border-white/20 backdrop-blur-md hover:bg-white/20 transition-colors"
          >
            I already have an account
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-6 inline-flex items-center gap-1.5 text-[13px] text-white/80 font-medium"
        >
          <ShieldCheck size={14} className="text-[#34D399]" />
          No credit card · We never store your resume PDF
        </motion.div>
      </DarkPanel>
    </section>
  );
}
