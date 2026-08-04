import type { MetadataRoute } from "next";
import { getAppEnv } from "@/lib/server/env";
import { resolveMetadataBase } from "@/lib/server/metadata";

/**
 * APP_ENV は Cloud Run の実行時にだけ渡ってくる（Docker のビルド時は未設定）ので、
 * プリレンダリングされると stg 判定が本番にも焼き付いてしまう。必ずリクエスト時に評価する。
 */
export const dynamic = "force-dynamic";

/**
 * 非公開ページ（/events・/join・/letter）はここではブロックしない。
 * クロールを止めると各ページの noindex が読まれず、URL だけが検索結果に残るため。
 * また /letter・/join は SNS のクローラーが OG 画像を取りに来るので、
 * robots.txt で塞ぐと共有時のプレビューまで壊れる。
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  if (getAppEnv() !== "production") {
    // stg（dev-hanayori.*）が本番と重複したコンテンツとして拾われないようにする。
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  const base = await resolveMetadataBase();
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: base ? new URL("/sitemap.xml", base).toString() : undefined,
  };
}
