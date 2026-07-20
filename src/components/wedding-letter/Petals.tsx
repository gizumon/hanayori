"use client";

import { useEffect, useRef } from "react";

interface PetalsProps {
  color: string;
}

export function Petals({ color }: PetalsProps) {
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const petals: HTMLDivElement[] = [];
    for (let i = 0; i < 14; i++) {
      const p = document.createElement("div");
      p.style.cssText = `position:absolute;top:-3vh;width:${i % 2 ? 6 : 7}px;height:${
        i % 2 ? 7 : 9
      }px;background:${color};border-radius:60% 40% 55% 45% / 50% 55% 45% 50%;opacity:0;animation:wl-fall linear infinite;left:${
        Math.random() * 100
      }%;animation-duration:${14 + Math.random() * 12}s;animation-delay:${
        Math.random() * 16
      }s`;
      box.appendChild(p);
      petals.push(p);
    }
    return () => {
      petals.forEach((p) => p.remove());
    };
  }, [color]);

  return (
    <div
      ref={boxRef}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}
    />
  );
}
