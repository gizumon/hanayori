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
  /**
   * お手紙側で写真を設定しなかったときに使う既定の写真。並びは配列の順で、
   * データとしては何枚でも持てる(画面から設定できるのは 1 枚)。
   */
  defaultPhotos: LetterPhoto[];
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
  /** 最初にイベントを作った uid。権限差は無く(メンバーは全員共同オーナー)、表示と保護のためだけに持つ。 */
  createdBy: string;
  memberUids: string[];
  /**
   * 自分が作ったお手紙を他のメンバーにも見せることにした人の uid。
   *
   * 既定(未設定)は空 = 誰も見せていない。つまり各メンバーには自分が作った
   * お手紙と、見せる設定にした人のお手紙だけが見える(席札・エスコートカードは
   * 対象外で、常に全員ぶんが見える)。この配列を書き換えられるのは本人だけで、
   * 他のメンバーから見せる設定に変えられることはない。
   */
  letterSharingUids?: string[];
  letterConfig: LetterConfigDoc;
  cardConfig: CardConfigDoc;
  escortConfig: EscortConfigDoc;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Firestore `{prefix}invites/{token}` ドキュメント(token は ULID)。
 *
 * 1 リンク 1 人の使い切り + 発行から 7 日で失効。イベント側の 1 フィールドでは
 * 「複数の未使用リンクが同時に存在する」を表現できないため独立コレクションにした。
 * ドキュメント ID をトークンそのものにしてあるので、受諾はトークンだけで単一
 * `get` に落ちる(letters/{ulid} と同じ発想)。
 *
 * ステータスは保存せず acceptedBy / expiresAt から派生する(§inviteStatus)。
 * 取消は物理削除。受諾済みレコードは「誰がいつ参加したか」の記録として残す。
 */
export interface InviteDoc {
  eventId: string;
  /** 発行者の uid。 */
  createdBy: string;
  createdAt: Timestamp;
  /** createdAt + 7 日。これを過ぎたリンクは受諾できない。 */
  expiresAt: Timestamp;
  /** 受諾者の uid。null 以外 = 消費済みで再利用不可。 */
  acceptedBy: string | null;
  acceptedAt: Timestamp | null;
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
  /**
   * 作成した人の uid。共同編集で「誰が書いた手紙か」を示すために持つ。
   * この機能より前に作られた手紙には無いので optional(表示は「作成者不明」)。
   */
  createdBy?: string;
  to: string;
  body: string;
  theme: ThemeKey;
  /** このお手紙の写真。空ならイベント既定(`letterConfig.defaultPhotos`)を使う。 */
  photos: LetterPhoto[];
  /**
   * true = このお手紙では写真を出さない(イベント既定も使わない)。
   * 写真を持っているお手紙では意味を持たない(自分の写真が優先される)。
   */
  hidePhotos?: boolean;
  cardName: string | null;
  /** null = イベント既定の敬称に従う */
  honor: Honor | null;
  /** エスコートカード情報。旧ドキュメントには無いので optional。 */
  escort?: EscortFieldsDoc;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
