"use client";

import { useEffect, useRef } from "react";
import { initArchScene } from "@/lib/archScene";

const THREE_CDN_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
const THREE_SCRIPT_ID = "three-js-cdn";

function loadThree(): Promise<void> {
  return new Promise((resolve, reject) => {
    const w = window as unknown as { THREE?: unknown };
    if (w.THREE) {
      resolve();
      return;
    }
    const existing = document.getElementById(THREE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("three.js failed to load")));
      return;
    }
    const script = document.createElement("script");
    script.id = THREE_SCRIPT_ID;
    script.src = THREE_CDN_URL;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("three.js failed to load"));
    document.head.appendChild(script);
  });
}

// Mounts the wine/cream arch scene (see lib/archScene.ts) as a fixed,
// full-viewport canvas behind whatever page renders it. Place this before
// the page's own content in the DOM, and give that content `position:
// relative` so it stacks above this fixed canvas.
export function ArchSceneCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    loadThree()
      .then(() => {
        if (cancelled || !canvasRef.current) return;
        cleanup = initArchScene(canvasRef.current);
      })
      .catch(() => {
        // Decorative background only — a failed CDN load just means no scene.
      });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="fixed inset-0 block h-full w-full" />;
}
