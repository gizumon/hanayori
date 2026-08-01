export type ThemeKey = "rose" | "blue" | "sage" | "kinari";
export type FontKey =
  | "yomogi"
  | "klee"
  | "mincho"
  | "gothic"
  | "maru"
  | "anzumoji"
  | "fuiji";
export type Screen = "login" | "home" | "project" | "editor";
export type CardOrient = "landscape" | "portrait" | "tent-l" | "tent-p";
export type CardFrame = "line" | "frame" | "minimal";
export type EscortStyle = "ticket" | "card";
/** イベント既定の敬称。"" = 敬称なし。 */
export type Honor = "" | "様" | "さん";
export type SettingsTab = "general" | "card" | "escort";
export type EditorTab = "letter" | "card" | "escort";
/** イベント配下の画面タブ。一覧 / 一括編集 / 確認。 */
export type EventTab = "list" | "bulk" | "review";

export interface Letter {
  id: string;
  to: string;
  body: string;
  theme: ThemeKey;
  photo: string | null;
  photoRatio?: number;
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
  createdAt: string;
  updatedAt: string;
}

/** お手紙のイベント共通設定 */
export interface LetterConfig {
  font: FontKey;
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
  letterConfig: LetterConfig;
  cardConfig: CardConfig;
  escortConfig: EscortConfig;
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

export type Draft = Partial<Letter>;

/** 一覧の一括編集で送る手紙 1 通分のパッチ。id で対象を指定し、残りは部分更新。 */
export type BulkLetterPatch = { id: string } & Partial<
  Pick<
    Letter,
    | "to"
    | "body"
    | "theme"
    | "photo"
    | "photoRatio"
    | "cardName"
    | "honor"
    | "tableNo"
    | "escortName"
    | "escortMessage"
    | "escortHonor"
    | "escortPhoto"
    | "escortPhotoRatio"
  >
>;

export interface StudioState {
  screen: Screen;
  userName: string;
  projects: EventSummary[];
  curP: string | null;
  curL: string | null;
  /** 開いているイベントの手紙一覧。イベントを開いたときに取得する。 */
  letters: Letter[];
  draft: Draft;
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
  /** エスコート写真のクロップ待ち画像(dataUrl)。null = モーダル閉。 */
  escortCropSrc: string | null;
  /** 共通設定ドロワー。null = 閉。どの画面からでも開ける。 */
  settingsTab: SettingsTab | null;
  edTab: EditorTab;
}
