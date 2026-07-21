import type { Timestamp } from "firebase-admin/firestore";

export type ThemeKey = "rose" | "blue" | "sage" | "kinari";
export type FontKey = "yomogi" | "klee" | "mincho" | "gothic" | "maru";
export type CardOrient = "landscape" | "portrait" | "tent-l" | "tent-p";
export type CardFrame = "line" | "frame" | "minimal";
/** イベント側の既定敬称。"" = 敬称なし。 */
export type Honor = "" | "様" | "さん";

/** お手紙のイベント共通設定 */
export interface LetterConfigDoc {
  font: FontKey;
}

/** 席札/QRカードのイベント共通設定 */
export interface CardConfigDoc {
  enabled: boolean;
  font: FontKey;
  orient: CardOrient;
  honor: Honor;
  frame: CardFrame;
  heading: string;
  note: string;
}

/**
 * Firestore `{prefix}events/{eventId}` ドキュメント。
 * 旧形式(トップレベルの font / cardFont / cardEnabled、enabled/font を持たない
 * cardConfig)のドキュメントは読み込み時に events.ts の normalizeEventDoc で
 * この形へ畳み込む。
 */
export interface EventDoc {
  name: string;
  date: string | null;
  createdBy: string;
  memberUids: string[];
  inviteToken: string | null;
  letterConfig: LetterConfigDoc;
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
