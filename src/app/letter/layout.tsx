import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NOINDEX } from "@/lib/seo";
import "@/components/wedding-letter/animations.css";

export const metadata: Metadata = {
  // 特定のゲスト宛の私信。URL を知っている人だけが読むものなので検索結果には出さない。
  // robots.txt では塞いでいないので、LINE などに貼ったときの OG プレビューは従来どおり出る。
  robots: NOINDEX,
};

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
