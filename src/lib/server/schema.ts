import type { Timestamp } from "firebase-admin/firestore";

export type ThemeKey = "rose" | "blue" | "sage" | "kinari";
export type FontKey = "yomogi" | "klee" | "mincho" | "gothic" | "maru";
export type CardOrient = "landscape" | "portrait" | "tent-l" | "tent-p";
export type CardFrame = "line" | "frame" | "minimal";
export type EscortStyle = "ticket" | "card";
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

/** エスコートカードのイベント共通設定 */
export interface EscortConfigDoc {
  enabled: boolean;
  style: EscortStyle;
  font: FontKey;
  honor: Honor;
  /** QR コード(お手紙へのリンク)をカードに載せるか */
  qr: boolean;
  heading: string;
  /** 卓番のラベル。例 "YOUR TABLE" / "Table" */
  tableLabel: string;
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
  escortConfig: EscortConfigDoc;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** お手紙ごとのエスコートカード情報。 */
export interface EscortFieldsDoc {
  tableNo: string | null;
  /** エスコートカード用の名前。null = 席札の名前にフォールバック。 */
  name: string | null;
  message: string | null;
  /** null = イベント既定の敬称に従う */
  honor: Honor | null;
  /** 切り取り済みの写真。トリミングはアップロード時にクライアントで確定する。 */
  photo: LetterPhoto | null;
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
  /** エスコートカード情報。旧ドキュメントには無いので optional。 */
  escort?: EscortFieldsDoc;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
