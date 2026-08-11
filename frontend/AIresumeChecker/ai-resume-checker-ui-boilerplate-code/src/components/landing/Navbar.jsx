import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, ArrowRight, Sparkles } from "lucide-react";
import AILogo from "@/components/layout/AILogo";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Dashboard", href: "#dashboard-preview" },
  { label: "Pricing", href: "#pricing" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);

      // Section scroll spy logic
      const sections = NAV_LINKS.map((l) => l.href.substring(1));
      const scrollPosition = window.scrollY + 180;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(`#${sectionId}`);
            break;
          }
        }
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-3 inset-x-0 z-50 px-3 sm:px-6"
    >
      <div
        style={{ maxWidth: 1240, marginLeft: "auto", marginRight: "auto" }}
        className={cn(
          "rounded-2xl md:rounded-full border transition-all duration-300",
          scrolled
            ? "bg-[var(--surface)]/90 border-emerald-500/25 backdrop-blur-xl shadow-[0_8px_30px_rgb(16,185,129,0.12)]"
            : "bg-[var(--surface)]/95 border-emerald-500/15 backdrop-blur-md shadow-sm"
        )}
      >
        <div className="flex items-center justify-between gap-4 px-4 py-2.5">
          {/* Logo & Brand Name */}
          <Link to="/" className="flex items-center gap-2.5 pl-1 group">
            <div className="transition-transform group-hover:scale-105">
              <AILogo />
            </div>
            <span className="font-display text-[16px] font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-400 bg-clip-text text-transparent hidden sm:inline">
              Resume Roaster
            </span>
          </Link>

          {/* Desktop Nav Links with Vibrant Highlighting */}
          <nav className="hidden md:flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2">
            {NAV_LINKS.map((l) => {
              const isActive = activeSection === l.href;
              return (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setActiveSection(l.href)}
                  className={cn(
                    "relative px-4 py-1.5 rounded-full text-[13.5px] font-semibold transition-all duration-200 flex items-center gap-1.5",
                    isActive
                      ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 shadow-sm font-bold scale-105"
                      : "text-[var(--ink)] hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10"
                  )}
                >
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                  {l.label}
                </a>
              );
            })}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <Link
              to="/login"
              className="hidden sm:inline-flex h-9 px-4 rounded-full text-[13.5px] font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/12 items-center transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="group inline-flex items-center gap-1.5 h-9.5 pl-4 pr-3.5 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white text-[13.5px] font-bold shadow-[0_4px_16px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_24px_rgba(16,185,129,0.55)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Sparkles size={13} className="text-emerald-200" />
              <span>Get started</span>
              <ArrowRight
                size={13}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
            <button
              onClick={() => setOpen((o) => !o)}
              className="md:hidden h-9 w-9 rounded-full flex items-center justify-center text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/12"
              aria-label="Toggle menu"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu with Full Color Highlights */}
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="md:hidden border-t border-emerald-500/20 px-4 py-3 space-y-1.5 bg-[var(--surface)]/95 rounded-b-2xl"
          >
            {NAV_LINKS.map((l) => {
              const isActive = activeSection === l.href;
              return (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => {
                    setActiveSection(l.href);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all",
                    isActive
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                      : "text-[var(--ink)] hover:text-emerald-600 hover:bg-emerald-500/10"
                  )}
                >
                  <span>{l.label}</span>
                  {isActive && <Sparkles size={14} className="text-emerald-500" />}
                </a>
              );
            })}
            <div className="pt-2 border-t border-emerald-500/15">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="block px-3.5 py-2.5 rounded-xl text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 text-center"
              >
                Sign in
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
