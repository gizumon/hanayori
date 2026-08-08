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

/**
 * 画像の file input に付ける accept。
 *
 * `image/*` にしないのは HEIC/HEIF(iPhone の既定形式)を避けるため。縮小・
 * 切り取りはブラウザに画像をデコードさせて行うが、Safari 以外は HEIC を
 * デコードできず、選んだ時点で読み込みエラーになる。ここで受け付ける形式を
 * 挙げておくと、iOS の写真選択は HEIC を JPEG に変換して渡してくれるし、
 * パソコンのファイル選択では読めない形式がそもそも選べなくなる。
 */
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

/**
 * 読み込めなかったときのエラー。HEIC は「エラーになる形式」だと分かるよう
 * 名指しで案内する(iOS から AirDrop 等で渡ってきたファイルはここに来る)。
 */
function decodeError(file: File): Error {
  const heic = /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
  return new Error(
    heic
      ? "HEIC 形式の写真は読み込めません。JPEG などで保存し直してからお試しください"
      : "画像の読み込みに失敗しました"
  );
}

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

/**
 * 選んだ画像ファイルを切り取りモーダルに渡せる data URL にする。縮小はここでは
 * せず、切り取りの確定時に `encodeCanvas` が IMAGE_MAX_WIDTH まで縮めて圧縮する。
 */
export function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(decodeError(file));
    reader.onload = () => {
      // 読み込めても描けない形式(HEIC など)があるので、ここで一度デコードして
      // 確かめる。切り取りモーダルに渡ってから失敗すると、伝える先が無くなる。
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => reject(decodeError(file));
      img.onload = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
