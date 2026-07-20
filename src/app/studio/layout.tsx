import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "LetterStudio | Hanayori",
  description: "結婚式のお手紙とQR席札をつくる、Hanayoriのお手紙スタジオ。",
};

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* App Router hoists <link> tags from anywhere in the tree into <head>;
          this is scoped to the /studio route group, not a pages/_document case. */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Yomogi&family=Shippori+Mincho:wght@500;600&family=Klee+One&family=Zen+Kaku+Gothic+New&family=Zen+Maru+Gothic&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  );
}
