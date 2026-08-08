import { ulid } from "ulid";
import type { LetterPhoto } from "./schema";

/**
 * 写真 1 枚(API の形)。Firestore の `LetterPhoto` の `dataUrl` を `url` という
 * 名前で返すだけで、中身は同じ。
 */
export interface LetterPhotoJson {
  id: string;
  url: string;
  ratio: number | null;
}

/** クライアントから届く写真 1 枚。id は既存写真の引き継ぎ用(無ければ採番する)。 */
export interface LetterPhotoInput {
  id?: string;
  url: string;
  ratio?: number | null;
}

/**
 * JSON で届いた写真の配列を既知フィールドだけに絞る。
 * 枚数はここでは制限しない(画面が 1 枚に絞っているだけで、データとしては複数持てる)。
 */
export function sanitizePhotos(raw: unknown): LetterPhotoInput[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const p = item as Record<string, unknown>;
    if (typeof p.url !== "string" || !p.url) return [];
    return [
      {
        id: typeof p.id === "string" && p.id ? p.id : undefined,
        url: p.url,
        ratio: typeof p.ratio === "number" ? p.ratio : null,
      },
    ];
  });
}

/**
 * 届いた写真の配列をドキュメントの形に直す。空の URL は落とし、id を持たない
 * ものには ULID を採番する(以後の更新で同じ写真だと分かるようにするため)。
 */
export function photosFromInput(photos: LetterPhotoInput[] | null | undefined): LetterPhoto[] {
  if (!photos) return [];
  return photos
    .filter((p) => p && typeof p.url === "string" && p.url)
    .map((p) => ({ id: p.id || ulid(), dataUrl: p.url, ratio: p.ratio ?? null }));
}

export function photosToJson(photos: LetterPhoto[] | undefined): LetterPhotoJson[] {
  return (photos ?? []).map((p) => ({ id: p.id, url: p.dataUrl, ratio: p.ratio ?? null }));
}

/**
 * そのお手紙に実際に出す写真を決める。
 *
 * 優先順は **お手紙の写真 > 「出さない」 > イベント既定の写真**。写真を持たない
 * お手紙はイベント既定にフォールバックし、`hidePhotos` を立てたお手紙だけが
 * 既定も含めて何も出さない。
 */
export function resolvePhotos<T>(own: T[], hidePhotos: boolean | undefined, fallback: T[]): T[] {
  if (own.length > 0) return own;
  return hidePhotos ? [] : fallback;
}
