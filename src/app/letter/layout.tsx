import type { ReactNode } from "react";
import "@/components/wedding-letter/animations.css";

export default function LetterLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router hoists <link> from anywhere in the tree; scoped to /letter route group */}
      <link
        href="https://fonts.googleapis.com/css2?family=Yomogi&family=Shippori+Mincho:wght@500;600&family=Klee+One&family=Zen+Kaku+Gothic+New&family=Zen+Maru+Gothic&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  );
}
