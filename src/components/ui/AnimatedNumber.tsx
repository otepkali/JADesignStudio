"use client";

import { useEffect, useRef, useState } from "react";

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false)
  );
}

export function AnimatedNumber({
  value,
  formatter = (n) => String(Math.round(n)),
  duration = 900,
}: {
  value: number;
  formatter?: (n: number) => string;
  duration?: number;
}) {
  const [reduced] = useState(prefersReducedMotion);
  const [display, setDisplay] = useState(() => (reduced ? value : 0));
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (reduced) return;

    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      setDisplay(value * easeOutCubic(progress));
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      }
    }

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [value, duration, reduced]);

  return <>{formatter(display)}</>;
}
