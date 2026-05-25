"use client";
import { useRef, ReactNode } from "react";
import { motion, useScroll, useTransform } from "motion/react";

interface Props {
  children: ReactNode;
  intensity?: "gentle" | "medium" | "strong";
}

const ANGLES = {
  gentle: { enter: -6, exit: 3, enterScale: 0.94, exitScale: 0.97 },
  medium: { enter: -10, exit: 5, enterScale: 0.90, exitScale: 0.95 },
  strong: { enter: -14, exit: 7, enterScale: 0.86, exitScale: 0.93 },
};

export function LP2ScrollReveal({ children, intensity = "medium" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const { enter, exit, enterScale, exitScale } = ANGLES[intensity];

  const rotateX = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [enter, 0, 0, exit]);
  const scale = useTransform(scrollYProgress, [0, 0.12, 0.88, 1], [enterScale, 1, 1, exitScale]);
  const opacity = useTransform(scrollYProgress, [0, 0.08, 0.92, 1], [0, 1, 1, 0.55]);
  const y = useTransform(scrollYProgress, [0, 0.12, 0.88, 1], [50, 0, 0, -25]);

  return (
    <div ref={ref} style={{ perspective: "900px", perspectiveOrigin: "50% 40%" }}>
      <motion.div style={{ rotateX, scale, opacity, y, transformOrigin: "center 35%", willChange: "transform, opacity" }}>
        {children}
      </motion.div>
    </div>
  );
}
