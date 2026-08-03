import { headers } from "next/headers";

/**
 * OG 画像などの絶対 URL を組み立てるためのベース URL。
 *
 * Cloud Run へのデプロイでは `NEXT_PUBLIC_APP_URL` が環境ごと(stg/prod)に
 * ビルド時へ埋め込まれるので、それをそのまま使う。この場合ページは静的なまま
 * プリレンダリングできる。
 *
 * ローカル開発など未設定のときだけ、リクエストの Host ヘッダから解決する
 * (そのルートはリクエスト時レンダリングになる)。
 */
export async function resolveMetadataBase(): Promise<URL | undefined> {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return new URL(configured);

  const h = await headers();
  const host = h.get("host");
  if (!host) return undefined;
  const proto = h.get("x-forwarded-proto") ?? "https";
  return new URL(`${proto}://${host}`);
}
