/**
 * アップロード画像のクライアント側エンコード設定と共通処理。
 *
 * 写真は表示・OG・印刷のいずれでも 900px 幅あれば足りるため、Storage コストと
 * 転送量を抑えるべく縮小して圧縮する。可能なら WebP(同品質で JPEG より
 * 2〜3 割小さい)、非対応ブラウザでは JPEG にフォールバックする。
 */

/** リサイズ後の最大幅(px)。表示・印刷とも実寸の 2x を満たす想定。 */
export const IMAGE_MAX_WIDTH = 900;

/** JPEG/WebP の品質(0〜1)。見た目とサイズの折り合い。 */
export const IMAGE_QUALITY = 0.82;

let webpSupport: boolean | null = null;

/**
 * canvas が WebP エンコードに対応しているか(結果をキャッシュ)。
 * 非対応ブラウザ(古い iOS Safari 等)では toDataURL が PNG を返すため、
 * その場合は false を返して JPEG にフォールバックさせる。
 */
function supportsWebp(): boolean {
  if (webpSupport === null) {
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    webpSupport = c.toDataURL("image/webp").startsWith("data:image/webp");
  }
  return webpSupport;
}

/**
 * canvas の内容を WebP(対応時)または JPEG の data URL に変換する。
 * アップロード先の contentType は data URL の MIME からそのまま決まる。
 */
export function encodeCanvas(
  canvas: HTMLCanvasElement,
  quality: number = IMAGE_QUALITY
): string {
  const type = supportsWebp() ? "image/webp" : "image/jpeg";
  return canvas.toDataURL(type, quality);
}
