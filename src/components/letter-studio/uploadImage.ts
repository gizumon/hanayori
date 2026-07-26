interface SignedUpload {
  uploadUrl: string;
  headers: Record<string, string>;
  url: string;
}

/**
 * data: URL(クロップ済みのローカル画像)を Cloud Storage へアップロードし、
 * 恒久的な公開 URL を返す。サーバーから署名付き PUT URL を受け取り、画像
 * バイナリはサーバーを経由せずブラウザから直接バケットへアップロードする。
 */
export async function uploadDataUrl(dataUrl: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  const contentType = blob.type || "image/jpeg";

  const res = await fetch("/api/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || "画像のアップロードに失敗しました");
  }
  const { uploadUrl, headers, url } = (await res.json()) as SignedUpload;

  const put = await fetch(uploadUrl, { method: "PUT", headers, body: blob });
  if (!put.ok) throw new Error("画像のアップロードに失敗しました");
  return url;
}

/**
 * data: URL ならアップロードして URL を返す。すでに URL(=保存済み画像)や
 * null/空ならそのまま返す。保存時にドラフトの画像を確定するのに使う。
 */
export async function uploadIfDataUrl(
  value: string | null | undefined
): Promise<string | null> {
  if (!value) return null;
  if (!value.startsWith("data:")) return value;
  return uploadDataUrl(value);
}
