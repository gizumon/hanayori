import type { Metadata } from "next";

/** サービス名。OG の siteName やタイトルのテンプレートに使う。 */
export const SITE_NAME = "Hanayori";

/** どのページにも当てはまるフォールバックのタイトル。 */
export const SITE_TITLE = "Hanayori | 花嫁のお便り";

/** サービス全体の説明。ランディング・manifest・JSON-LD で共有する。 */
export const SITE_DESCRIPTION =
  "結婚式のゲストひとりひとりに宛てた、デジタルのお手紙をつくれるサービス。席札のQRコードを読み取ると、封筒がひらいてあなたの言葉が届きます。";

/**
 * 検索結果に出さないページ用の robots 設定。
 *
 * metadata の入れ子フィールドは「後のセグメントが丸ごと上書きする」ので、
 * これを指定したセグメント配下ではルートレイアウトの index 許可は効かなくなる（それが狙い）。
 * なお robots.txt では該当パスをブロックしない。クロールを止めると
 * この noindex 自体が読まれず、URL だけが検索結果に残ってしまうため。
 */
export const NOINDEX: Metadata["robots"] = { index: false, follow: false };

/** 利用規約・プライバシーポリシーの最終改定日（表示と sitemap の lastModified で共有）。 */
export const LEGAL_UPDATED_AT = "2026-08-02";

/** ISO の日付文字列を「2026年8月2日」形式にする（実行環境のタイムゾーンに依存させない）。 */
export function formatJaDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return `${year}年${month}月${day}日`;
}

interface SocialMetadataInput {
  title: string;
  description: string;
  /** 記事的なページは "article"。既定はサービス紹介向けの "website"。 */
  type?: "website" | "article";
}

/**
 * OG と Twitter カードをまとめて組み立てる。
 *
 * openGraph は浅いマージなので、ページ側で一部だけ指定するとルートレイアウトで
 * 入れた siteName や locale が消える。取りこぼしを防ぐためここで必ず全部を埋める。
 */
export function socialMetadata({
  title,
  description,
  type = "website",
}: SocialMetadataInput): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: { title, description, type, siteName: SITE_NAME, locale: "ja_JP" },
    twitter: { card: "summary_large_image", title, description },
  };
}
