"use client";

import { useEffect, useRef, useState } from "react";
import { formatTenge } from "@/lib/format";

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false)
  );
}

// `format` is a plain string (not a function) so this component can be
// rendered from a Server Component — passing a function prop across that
// boundary throws ("Functions cannot be passed directly to Client Components").
const FORMATTERS = {
  integer: (n: number) => String(Math.round(n)),
  tenge: formatTenge,
} as const;

export function AnimatedNumber({
  value,
  format = "integer",
  duration = 900,
}: {
  value: number;
  format?: keyof typeof FORMATTERS;
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

  return <>{FORMATTERS[format](display)}</>;
}
