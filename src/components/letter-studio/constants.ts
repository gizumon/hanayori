import type { CardConfig, FontKey, ThemeKey } from "./types";

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
};

export const DEMO_BODY =
  "今日は私たちの結婚式に\n来てくれて本当にありがとう。\n\nさくらの顔を見つけた瞬間、\n緊張がすっとほどけて、\n心から笑うことができました。\n\nこれからもずっと、よろしくね。\n\n花嫁より";

export const DEFAULT_CARD_CONFIG: CardConfig = {
  orient: "landscape",
  honor: "様",
  frame: "line",
  heading: "WEDDING RECEPTION",
  note: "スマホで読み取ると\nあなた宛のお手紙が届きます",
};

export const uid = (): string => Math.random().toString(36).slice(2, 9);

export const STORAGE_KEY = "wl_studio_v1";
export const LETTERS_MIRROR_KEY = "wl_letters_v1";
