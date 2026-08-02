import type { ReactNode } from "react";

/** 利用規約・プライバシーポリシーの共通レイアウト（書体の読み込みのみ）。 */
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* App Router hoists <link> tags into <head>; scoped to the (legal) route group. */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;600&family=Zen+Kaku+Gothic+New&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  );
}
