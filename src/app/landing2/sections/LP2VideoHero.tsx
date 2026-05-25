"use client";
import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ChevronDown, Play } from "lucide-react";

export function LP2VideoHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="video-hero"
      style={{
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#000"
      }}
    >
      {/* Video Background */}
      <motion.div style={{ position: "absolute", inset: -20, y, opacity }}>
        {mounted && (
          <video
            autoPlay
            loop
            muted
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            src="/assets/tesst.mp4"
          />
        )}
      </motion.div>
    </section>
  );
}
