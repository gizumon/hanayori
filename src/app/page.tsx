import type { Metadata } from "next";
import { Landing } from "@/components/landing/Landing";

const title = "Hanayori | 花嫁のお便り";
const description =
  "結婚式のゲストひとりひとりに宛てた、デジタルのお手紙をつくれるサービス。席札のQRコードを読み取ると、封筒がひらいてあなたの言葉が届きます。";

// 画像は同ディレクトリの opengraph-image.tsx。metadataBase はルートレイアウトから継承する。
export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: "website", siteName: "Hanayori", locale: "ja_JP" },
  twitter: { card: "summary_large_image", title, description },
};

export default function Home() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Yomogi&family=Shippori+Mincho:wght@500;600&family=Zen+Kaku+Gothic+New&family=Zen+Maru+Gothic&display=swap"
        rel="stylesheet"
      />
      <Landing />
    </>
  );
}
