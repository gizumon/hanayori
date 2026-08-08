export type ThemeKey = "rose" | "blue" | "sage" | "kinari";
export type FontKey =
  | "yomogi"
  | "klee"
  | "mincho"
  | "gothic"
  | "maru"
  | "anzumoji"
  | "fuiji";
export type Screen = "login" | "home" | "project";
export type CardOrient = "landscape" | "portrait" | "tent-l" | "tent-p";
export type CardFrame = "line" | "frame" | "minimal";
export type EscortStyle = "ticket" | "card";
/** イベント既定の敬称。"" = 敬称なし。 */
export type Honor = "" | "様" | "さん";
export type SettingsTab = "general" | "card" | "escort" | "members";
export type EditorTab = "letter" | "card" | "escort";
/** イベント配下の画面タブ。一覧 / 一括編集 / 確認。 */
export type EventTab = "list" | "bulk" | "review";

/**
 * お手紙の本文のあとに載せる写真 1 枚。`url` は保存済みなら Storage の公開 URL、
 * 選んだ直後のドラフトでは data: URL(保存時に `uploadIfDataUrl` が URL 化する)。
 * `ratio` は横 / 縦。null なら表示側の既定(4:3)を使う。
 */
export interface LetterPhoto {
  id: string;
  url: string;
  ratio: number | null;
}

export interface Letter {
  id: string;
  /** 作成した人の uid。この機能より前の手紙には無いので null。 */
  createdBy?: string | null;
  /** 作成者の表示名(サーバーが users から解決したもの)。null = 不明。 */
  createdByName?: string | null;
  /** 作成者のアバター URL。null なら頭文字で描く。 */
  createdByPhoto?: string | null;
  /**
   * 他のメンバーが作ったお手紙で、中身が伏せられている(サーバーが本文・写真を
   * 返していない)。作った人が「見せる」を選んでいないときに立つ。
   */
  hidden?: boolean;
  to: string;
  body: string;
  theme: ThemeKey;
  /**
   * このお手紙の写真。並びは配列の順で、データとしては何枚でも持てる。画面から
   * 追加できるのは今のところ 1 枚だけ(`MAX_LETTER_PHOTOS`)。
   * 空ならイベント既定(`letterConfig.defaultPhotos`)が使われる。
   */
  photos: LetterPhoto[];
  /** true = このお手紙では写真を出さない(イベント既定も使わない)。 */
  hidePhotos?: boolean;
  cardName?: string | null;
  /** null/undefined = イベント既定の敬称に従う */
  honor?: Honor | null;
  tableNo?: string | null;
  escortName?: string | null;
  escortMessage?: string | null;
  /** null/undefined = イベント既定のエスコート敬称に従う */
  escortHonor?: Honor | null;
  /** 切り取り済みの写真(dataUrl)。トリミングはアップロード時に確定する。 */
  escortPhoto?: string | null;
  escortPhotoRatio?: number;
  /** true = このお手紙のエスコートカードには写真を出さない(イベント既定も使わない)。 */
  hideEscortPhoto?: boolean;
  createdAt: string;
  updatedAt: string;
}

/** お手紙のイベント共通設定 */
export interface LetterConfig {
  font: FontKey;
  /** お手紙側で写真を設定しなかったときに使う既定の写真。UI は 1 枚だが配列で持つ。 */
  defaultPhotos: LetterPhoto[];
}

/** 席札/QRカードのイベント共通設定 */
export interface CardConfig {
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
export interface EscortConfig {
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

/** イベント本体。手紙は別途 letters state で保持する(サーバー上も別コレクション)。 */
export interface Project {
  id: string;
  name: string;
  date: string | null;
  /**
   * 自分が作ったお手紙を他のメンバーにも見せる設定にしているか。既定は false で、
   * 見せていない人のお手紙は一覧・確認タブの「お手紙」に出ない(席札・エスコート
   * カードは設定にかかわらず全員ぶんが見える)。他のメンバーの設定は分からない。
   */
  shareMyLetters: boolean;
  letterConfig: LetterConfig;
  cardConfig: CardConfig;
  escortConfig: EscortConfig;
  /** 共同編集メンバーの人数。1 人なら作成者まわりの UI を出さない。 */
  memberCount: number;
  /**
   * 共同編集メンバー(作成者が先頭、以降は参加順)。顔アイコンの表示用。
   * 招待リンクの発行・取消はここには載らないので、メンバータブは別途取得する。
   */
  members: EventMember[];
}

/** ホーム画面のイベント一覧用(手紙数はサーバーで集計)。 */
export interface EventSummary extends Project {
  letterCount: number;
  createdAt: string;
  updatedAt: string;
}

/** 共通設定ドロワーの保存ペイロード(イベントPATCHの形)。 */
export interface EventSettingsPatch {
  name: string;
  date: string | null;
  letterConfig: LetterConfig;
  cardConfig: CardConfig;
  escortConfig: EscortConfig;
}

/** イベントの共同編集メンバー。メンバーは全員が同じ権限(共同オーナー)を持つ。 */
export interface EventMember {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoUrl: string | null;
  /** 最初にイベントを作った人。権限は同じで、表示と誤操作防止にだけ使う。 */
  isCreator: boolean;
}

/** 招待リンク。受諾済みのものはサーバー側で除かれるので届かない。 */
export interface EventInvite {
  /** URL に載る ULID。`/join/{token}` */
  token: string;
  status: "active" | "expired";
  createdAt: string;
  expiresAt: string;
}

export type Draft = Partial<Letter>;

/** 一覧の一括編集で送る手紙 1 通分のパッチ。id で対象を指定し、残りは部分更新。 */
export type BulkLetterPatch = { id: string } & Partial<
  Pick<
    Letter,
    | "to"
    | "body"
    | "theme"
    | "photos"
    | "hidePhotos"
    | "cardName"
    | "honor"
    | "tableNo"
    | "escortName"
    | "escortMessage"
    | "escortHonor"
    | "escortPhoto"
    | "escortPhotoRatio"
    | "hideEscortPhoto"
  >
>;

/**
 * 一括追加で送る 1 通ぶんの入力。宛名だけ必須で、残りは画面で選んだ項目だけが入る。
 * 本文・写真は一括追加では扱わず、あとから個別編集・一括編集で埋める。
 */
export type BulkCreateLetter = { to: string } & Partial<
  Pick<Letter, "cardName" | "honor" | "tableNo" | "escortName" | "escortMessage" | "escortHonor">
>;

export interface StudioState {
  screen: Screen;
  userName: string;
  /** ログイン中の uid。未ログインなら null。 */
  userUid: string | null;
  /** プロフィール写真の URL。無ければ null(頭文字を表示する)。 */
  userPhoto: string | null;
  projects: EventSummary[];
  curP: string | null;
  /** 開いているイベントの手紙一覧。イベントを開いたときに取得する。 */
  letters: Letter[];
  /**
   * そのうち中身を見せてよいもの(伏せられたお手紙を除いたもの)。お手紙として
   * 並べる場所はこちらを使い、席札・エスコートカードは `letters` を使う。
   */
  visibleLetters: Letter[];
  modalShown: boolean;
  /** 宛名まとめて追加モーダル。 */
  addModal: boolean;
  /** 1 通ぶんの編集ドロワーの対象。null = 閉。 */
  editLetter: Letter | null;
  newName: string;
  newDate: string;
  toastMsg: string;
  qrModal: Letter | null;
  escortModal: Letter | null;
  /** 共通設定ドロワー。null = 閉。どの画面からでも開ける。 */
  settingsTab: SettingsTab | null;
  edTab: EditorTab;
}
