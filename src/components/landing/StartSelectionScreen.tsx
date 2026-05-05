"use client";

import { motion } from "motion/react";
import { DS, GRD } from "@/lib/design-tokens";
import { Sparkles, Palette, ArrowRight } from "lucide-react";

interface Props {
  onSelectTemplate: () => void;
  onSelectCustom: () => void;
  t: {
    title: string;
    subtitle: string;
    templateLabel: string;
    templateDesc: string;
    templateBtn: string;
    customLabel: string;
    customDesc: string;
    customBtn: string;
  };
}

export function StartSelectionScreen({ onSelectTemplate, onSelectCustom, t }: Props) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-12">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-16 text-center"
      >
        <h1 className="mb-4 font-heading text-4xl font-black tracking-tight text-white sm:text-5xl">
          {t.title}
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-400">
          {t.subtitle}
        </p>
      </motion.div>

      {/* Cards Grid */}
      <div className="grid w-full max-w-5xl gap-8 sm:grid-cols-2">
        {/* Option 1: Template */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          whileHover={{ y: -8 }}
          className="group relative flex flex-col items-center rounded-[32px] border border-slate-800 bg-slate-900/40 p-10 text-center backdrop-blur-xl transition-all hover:border-indigo-500/50 hover:bg-slate-800/60"
        >
          <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-indigo-500/10 text-4xl shadow-[0_0_40px_rgba(99,102,241,0.15)] transition-transform group-hover:scale-110">
            <Palette className="h-12 w-12 text-indigo-400" />
          </div>
          <h2 className="mb-4 font-heading text-2xl font-bold text-white">{t.templateLabel}</h2>
          <p className="mb-10 text-slate-400 leading-relaxed">
            {t.templateDesc}
          </p>
          <button
            onClick={onSelectTemplate}
            className="group/btn relative mt-auto flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-8 py-4 font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40"
          >
            <span className="relative z-10">{t.templateBtn}</span>
            <ArrowRight className="relative z-10 h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-500 group-hover/btn:translate-x-full" />
          </button>
        </motion.div>

        {/* Option 2: Custom Design */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          whileHover={{ y: -8 }}
          className="group relative flex flex-col items-center rounded-[32px] border border-slate-800 bg-slate-900/40 p-10 text-center backdrop-blur-xl transition-all hover:border-purple-500/50 hover:bg-slate-800/60"
        >
          <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-purple-500/10 text-4xl shadow-[0_0_40px_rgba(168,85,247,0.15)] transition-transform group-hover:scale-110">
            <Sparkles className="h-12 w-12 text-purple-400" />
          </div>
          <h2 className="mb-4 font-heading text-2xl font-bold text-white">{t.customLabel}</h2>
          <p className="mb-10 text-slate-400 leading-relaxed">
            {t.customDesc}
          </p>
          <button
            onClick={onSelectCustom}
            className="group/btn relative mt-auto flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-8 py-4 font-bold text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-purple-500/40"
          >
            <span className="relative z-10">{t.customBtn}</span>
            <ArrowRight className="relative z-10 h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-500 group-hover/btn:translate-x-full" />
          </button>
        </motion.div>
      </div>

      {/* Decorative background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 opacity-20 blur-[120px]">
        <div className="h-[500px] w-[800px] rounded-full bg-gradient-to-r from-indigo-500/30 to-purple-500/30" />
      </div>
    </div>
  );
}
