import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { PWAInstallBanner } from "@/components/pwa/PWAInstallBanner";
import "./globals.css";
import { COLOR } from "@/lib/palette";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, socialMetadata } from "@/lib/seo";
import { resolveMetadataBase } from "@/lib/server/metadata";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * `metadataBase` はここで一度だけ解決する。OG 画像（`opengraph-image.tsx`）の URL は
 * 絶対 URL でないといけないが、Cloud Run のホスト名はビルド時に確定しないため。
 * 下位のルートはこの値を継承するので、各ページは相対パスのまま書ける。
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: await resolveMetadataBase(),
    // 下位ページは title に見出しだけを書けば「〇〇 | Hanayori」になる。
    title: { default: SITE_TITLE, template: `%s | ${SITE_NAME}` },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    keywords: ["結婚式", "ウェディング", "席札", "QRコード", "手紙", "メッセージカード", "花嫁", "Hanayori"],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    // 電話番号・住所らしき文字列が手紙本文で勝手にリンク化されるのを防ぐ。
    formatDetection: { telephone: false, email: false, address: false },
    // 個別に noindex を指定したセグメント（/events・/join・/letter）がこれを上書きする。
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    ...socialMetadata({ title: SITE_TITLE, description: SITE_DESCRIPTION }),
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: SITE_NAME,
    },
    // favicon.ico は src/app に置いてあり Next が自動で（ハッシュ付き URL で）出力するので、
    // ここでは指定しない。二重に書くとキャッシュの効かない裸の /favicon.ico も並んでしまう。
    icons: {
      apple: "/icons/apple-touch-icon.png",
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: COLOR.accent,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NuqsAdapter>{children}</NuqsAdapter>
        <PWAInstallBanner />
      </body>
    </html>
  );
}
