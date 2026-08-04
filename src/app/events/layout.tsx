import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { StudioShell } from "@/components/letter-studio/StudioShell";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = {
  title: "LetterStudio",
  description: "結婚式のお手紙とQR席札をつくる、Hanayoriのお手紙スタジオ。",
  // ログインしないと中身が無いアプリ画面。検索結果に出す価値がないので弾く。
  robots: NOINDEX,
};

export default function EventsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* App Router hoists <link> tags from anywhere in the tree into <head>;
          this is scoped to the /events route group, not a pages/_document case. */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Yomogi&family=Shippori+Mincho:wght@500;600&family=Klee+One&family=Zen+Kaku+Gothic+New&family=Zen+Maru+Gothic&display=swap"
        rel="stylesheet"
      />
      {/* 共有シェル(ヘッダー・モーダル・設定ドロワー等)。各画面は children。
          nuqs(useSearchParams)を使うため、静的生成時のために Suspense で包む。 */}
      <Suspense>
        <StudioShell>{children}</StudioShell>
      </Suspense>
    </>
  );
}
