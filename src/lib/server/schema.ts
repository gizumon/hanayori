import type { Timestamp } from "firebase-admin/firestore";

export type ThemeKey = "rose" | "blue" | "sage" | "kinari";
export type FontKey =
  | "yomogi"
  | "klee"
  | "mincho"
  | "gothic"
  | "maru"
  | "anzumoji"
  | "fuiji";
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
  /** 席札のフッターに載せる名前。空欄ならイベント名を使う。 */
  nameOverride: string;
}

/** エスコートカードのイベント共通設定 */
export interface EscortConfigDoc {
  enabled: boolean;
  style: EscortStyle;
  font: FontKey;
  honor: Honor;
  heading: string;
  /** 卓番のラベル。例 "YOUR TABLE" / "Table" */
  tableLabel: string;
  /** エスコートカードのフッターに載せる名前。空欄ならイベント名を使う。 */
  nameOverride: string;
  /** 手紙側でエスコート写真を設定しなかったときに使う既定写真(URL)。null = なし。 */
  defaultPhoto: string | null;
  /** 既定写真の縦横比。 */
  defaultPhotoRatio: number | null;
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

/**
 * 写真 1 枚分。dataUrl は表示にそのまま使える文字列で、
 * 新規保存分は Cloud Storage の公開ダウンロード URL(`uploadImage` が発行)。
 * 旧データは base64 の data: URL を保持しており、どちらも `url(...)` で表示できる。
 */
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
