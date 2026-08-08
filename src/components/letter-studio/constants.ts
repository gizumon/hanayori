import type { FontKey, ThemeKey } from "./types";

/**
 * 非公開の本文の代わりにぼかして敷くダミー文字。
 *
 * 「見せない」設定のお手紙は、サーバーが本文も写真も落として `hidden` だけを
 * 付けて返す。だから一覧・一括編集・確認のどこでも、ぼかしの下にあるのはこの
 * 文言だけで、本物の中身はクライアントに届いていない。
 */
export const HIDDEN_BODY_FILLER =
  "このお手紙の本文は非公開に設定されています。ぼかしの下にあるのはダミーの文字で、本文ではありません。";

/** 非公開のお手紙に添える一言。錠前アイコンと並べて使う。 */
export const HIDDEN_BODY_NOTE = "本文は作成した人だけが見られます";

/**
 * お手紙に載せられる写真の枚数。データ(Letter.photos / Firestore の photos)は
 * 何枚でも持てるが、画面から追加できるのはこの枚数まで。
 */
export const MAX_LETTER_PHOTOS = 1;

export const THEMES: Record<
  ThemeKey,
  {
    label: string;
    bg1: string;
    bg2: string;
    g1: string;
    g2: string;
    paper: string;
    rule: string;
    ink: string;
    inkSoft: string;
    accent: string;
    gold: string;
  }
> = {
  rose: {
    label: "ローズ",
    bg1: "#F7ECEF",
    bg2: "#FCF6F8",
    g1: "#F1E0E7",
    g2: "#EDD8E1",
    paper: "#FFFCF8",
    rule: "#F0E2E7",
    ink: "#5C4A4A",
    inkSoft: "#8C7676",
    accent: "#D3A5B4",
    gold: "#E3C293",
  },
  blue: {
    label: "ブルーグレー",
    bg1: "#EAEFF4",
    bg2: "#F7FAFC",
    g1: "#E2E9F0",
    g2: "#D9E2EC",
    paper: "#FDFDFB",
    rule: "#E3EAF0",
    ink: "#4A545E",
    inkSoft: "#7C8894",
    accent: "#A3B8CC",
    gold: "#D9C79A",
  },
  sage: {
    label: "セージ",
    bg1: "#EBF0E6",
    bg2: "#F7FAF3",
    g1: "#E3EADB",
    g2: "#DAE3D0",
    paper: "#FDFDF8",
    rule: "#E4EBDC",
    ink: "#4D5749",
    inkSoft: "#7E8A78",
    accent: "#A9BC9E",
    gold: "#DCC08F",
  },
  kinari: {
    label: "生成り",
    bg1: "#F4EEE3",
    bg2: "#FBF8F1",
    g1: "#EFE6D6",
    g2: "#E9DECA",
    paper: "#FFFDF7",
    rule: "#EDE4D2",
    ink: "#5A4F41",
    inkSoft: "#8D8172",
    accent: "#CBAD7C",
    gold: "#E3C293",
  },
};

export const FONTS: Record<FontKey, { label: string; family: string }> = {
  yomogi: { label: "可愛い手書き風", family: "'Yomogi', sans-serif" },
  klee: { label: "おしゃれな手書き風", family: "'Klee One', cursive" },
  mincho: { label: "明朝体", family: "'Shippori Mincho', serif" },
  gothic: { label: "ゴシック体", family: "'Zen Kaku Gothic New', sans-serif" },
  maru: { label: "丸ゴシック", family: "'Zen Maru Gothic', sans-serif" },
  anzumoji: { label: "あんずもじ", family: "'Anzumoji', sans-serif" },
  fuiji: { label: "ふい字", family: "'FuiJi', sans-serif" },
};
