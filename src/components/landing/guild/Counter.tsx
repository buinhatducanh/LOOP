"use client";

/**
 * Counter — Animated number display using Framer Motion
 * Animates from 0 to `value` with expo-out easing.
 */
import { useEffect, useState, useRef } from "react";
import { animate } from "motion/react";

interface CounterProps {
  value: number;
  duration?: number;
  delay?: number;
  formatter?: (val: number) => string;
}

export function Counter({ value, duration = 1.5, delay = 0, formatter }: CounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) {
      setDisplayValue(value);
      return;
    }

    const controls = animate(0, value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      onUpdate: (latest: number) => setDisplayValue(latest),
      onComplete: () => {
        hasAnimated.current = true;
      },
    });

    return () => controls.stop();
  }, [value, duration, delay]);

  const val = Math.round(displayValue);
  return <>{formatter ? formatter(val) : val}</>;
}
