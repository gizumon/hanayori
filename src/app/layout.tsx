import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { PWAInstallBanner } from "@/components/pwa/PWAInstallBanner";
import "./globals.css";
import { COLOR } from "@/lib/palette";
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
    title: "Hanayori | 花嫁のお便り",
    description:
      "結婚式のゲストひとりひとりに宛てた、デジタルのお手紙をつくれるサービス。",
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Hanayori",
    },
    icons: {
      icon: "/favicon.ico",
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
