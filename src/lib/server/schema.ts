import type { Timestamp } from "firebase-admin/firestore";

export type ThemeKey = "rose" | "blue" | "sage" | "kinari";
export type FontKey = "yomogi" | "klee" | "mincho" | "gothic" | "maru";
export type CardOrient = "landscape" | "portrait" | "tent-l" | "tent-p";
export type CardFrame = "line" | "frame" | "minimal";
/** イベント側の既定敬称。"" = 敬称なし。 */
export type Honor = "" | "様" | "さん";

export interface CardConfigDoc {
  orient: CardOrient;
  honor: Honor;
  frame: CardFrame;
  heading: string;
  note: string;
}

/** Firestore `{prefix}events/{eventId}` ドキュメント */
export interface EventDoc {
  name: string;
  date: string | null;
  createdBy: string;
  memberUids: string[];
  inviteToken: string | null;
  font: FontKey;
  cardFont: FontKey;
  cardEnabled: boolean;
  cardConfig: CardConfigDoc;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** 写真 1 枚分。将来 Cloud Storage 移行時は dataUrl を storagePath + 署名付き URL に置き換える。 */
export interface LetterPhoto {
  id: string;
  dataUrl: string;
  ratio: number | null;
}

/** Firestore `{prefix}letters/{letterId}` ドキュメント(letterId は ULID) */
export interface LetterDoc {
  eventId: string;
  to: string;
  body: string;
  theme: ThemeKey;
  photos: LetterPhoto[];
  cardName: string | null;
  /** null = イベント既定の敬称に従う */
  honor: Honor | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
