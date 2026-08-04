import type { Metadata } from "next";
import { Landing } from "@/components/landing/Landing";
import { SITE_DESCRIPTION, SITE_NAME, socialMetadata } from "@/lib/seo";
import { resolveMetadataBase } from "@/lib/server/metadata";

// 検索結果に出る唯一の入口なので、タイトルには「何ができるサービスか」まで入れる。
const title = "Hanayori | 花嫁のお便り — 結婚式の席札QRで贈るお手紙";

// 画像は同ディレクトリの opengraph-image.tsx。metadataBase はルートレイアウトから継承する。
export const metadata: Metadata = {
  // ルートレイアウトの "%s | Hanayori" テンプレートは効かせない。
  title: { absolute: title },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  ...socialMetadata({ title, description: SITE_DESCRIPTION }),
};

/** 検索エンジンに「無料で使える Web アプリ」だと伝えるための構造化データ。 */
function buildJsonLd(base: URL | undefined) {
  const url = (path: string) => (base ? new URL(path, base).toString() : path);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": url("/#website"),
        name: SITE_NAME,
        alternateName: "花嫁のお便り",
        url: url("/"),
        description: SITE_DESCRIPTION,
        inLanguage: "ja-JP",
      },
      {
        "@type": "WebApplication",
        "@id": url("/#webapp"),
        name: SITE_NAME,
        url: url("/"),
        description: SITE_DESCRIPTION,
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Web",
        inLanguage: "ja-JP",
        isPartOf: { "@id": url("/#website") },
        offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
      },
    ],
  };
}

export default async function Home() {
  const jsonLd = buildJsonLd(await resolveMetadataBase());

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Yomogi&family=Shippori+Mincho:wght@500;600&family=Zen+Kaku+Gothic+New&family=Zen+Maru+Gothic&display=swap"
        rel="stylesheet"
      />
      <script
        type="application/ld+json"
        // 値はこのファイル内の定数だけだが、ガイドラインに合わせて `<` はエスケープしておく。
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Landing />
    </>
  );
}
