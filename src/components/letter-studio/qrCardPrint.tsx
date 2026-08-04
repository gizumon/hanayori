"use client";

import { createRoot } from "react-dom/client";
import { THEMES } from "./constants";
import { cardNameFor, geom } from "./geometry";
import { QrCardFace } from "./QrCardFace";
import { CARD_91X55_LAYOUT, runSheetCapture, writeSheetPrintDoc, type SheetLayout } from "./sheetPrint";
import type { CardConfig, Letter } from "./types";

/**
 * オフスクリーン描画の幅。html2canvas の scale:3 と合わせて印刷に十分な解像度にする。
 * カード内の寸法はカード幅基準(cqw)なので、この幅は解像度だけを決め、
 * 文字や飾りの大きさ(=プレビューとの一致)には影響しない。
 */
const CAPTURE_WIDTH_PX = 640;
/** 1枚あたりの画像読み込みタイムアウト。壊れた写真URLで無限に固まるのを防ぐ。 */
const IMAGE_TIMEOUT_MS = 8000;

/**
 * 91×110mm(二つ折り、開くと91×55mm)を A4 1枚に 2列×2行(計4枚)、
 * 左右14mm・上下38.5mmの余白で敷き詰める(ちょうど 14+91*2+14=210mm /
 * 38.5+110*2+38.5=297mm)。tent-l(横に開く二つ折り)専用。
 */
const CARD_91X110_LAYOUT: SheetLayout = {
  pageWMm: 210,
  pageHMm: 297,
  marginXMm: 14,
  marginYMm: 38.5,
  cardWMm: 91,
  cardHMm: 110,
  cols: 2,
  rows: 2,
  cardsPerPage: 4,
};

async function captureOne(
  letter: Letter,
  cc: CardConfig,
  fontFamily: string,
  fallbackFootText: string,
  date: string,
  qrUrl: string
): Promise<string> {
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-99999px";
  host.style.top = "0";
  document.body.appendChild(host);
  const root = createRoot(host);
  const theme = THEMES[letter.theme];
  const g = geom(cc, theme.rule);

  try {
    await new Promise<void>((resolve) => {
      root.render(
        <QrCardFace
          width={`${CAPTURE_WIDTH_PX}px`}
          aspect={g.aspect}
          paper={theme.paper}
          accent={theme.accent}
          gold={theme.gold}
          ink={theme.ink}
          inkSoft={theme.inkSoft}
          font={fontFamily}
          frame={cc.frame}
          geometry={g}
          cardName={cardNameFor(letter, cc)}
          heading={cc.heading}
          note={cc.note}
          footText={cc.nameOverride.trim() || fallbackFootText}
          date={date}
          qrUrl={qrUrl}
          boxShadow="none"
        />
      );
      // レイアウト確定後にキャプチャしたい。rAF はバックグラウンドタブ(印刷用
      // タブにフォーカスが移った直後のこのタブ)では発火が止まるブラウザがある
      // ため使わず、setTimeout で 1 tick 待つ。
      setTimeout(resolve, 0);
    });

    const target = host.firstElementChild as HTMLElement;
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(target, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff",
      imageTimeout: IMAGE_TIMEOUT_MS,
    });
    return canvas.toDataURL("image/png");
  } finally {
    root.unmount();
    host.remove();
  }
}

export interface PrintAllCardsArgs {
  letters: Letter[];
  cardConf: CardConfig;
  fontFamily: string;
  fallbackFootText: string;
  date: string;
  qrUrlFor: (id: string) => string;
  onProgress?: (done: number, total: number) => void;
}

export interface PrintAllCardsResult {
  /** 印刷ウィンドウを開けた(=実行できた)かどうか。ポップアップブロック時は false。 */
  opened: boolean;
  /** 実際に印刷ページへ載った枚数。 */
  printed: number;
  /** 画像化に失敗して除外された枚数。 */
  failed: number;
}

/**
 * 全ゲストぶんの席札を A4 1枚にまとめて印刷する。91×55mm(横向き)と
 * 91×110mm(tent-l、二つ折り)はそのまま、55×91mm(縦向き)は 91×55mm の
 * マス目に90度回転して収める。横向き/縦向きは10枚/A4、tent-lは4枚/A4。
 * tent-p(縦に開く二つ折り)は対象外。
 */
export async function printAllCards({
  letters,
  cardConf,
  fontFamily,
  fallbackFootText,
  date,
  qrUrlFor,
  onProgress,
}: PrintAllCardsArgs): Promise<PrintAllCardsResult> {
  if (letters.length === 0) return { opened: false, printed: 0, failed: 0 };
  if (
    cardConf.orient !== "landscape" &&
    cardConf.orient !== "portrait" &&
    cardConf.orient !== "tent-l"
  ) {
    return { opened: false, printed: 0, failed: 0 };
  }
  const layout = cardConf.orient === "tent-l" ? CARD_91X110_LAYOUT : CARD_91X55_LAYOUT;
  const rotate = cardConf.orient === "portrait";

  const { opened, images, failed, w } = await runSheetCapture({
    items: letters,
    windowTitle: "席札一括印刷",
    loadingTitle: "席札を準備中です",
    loadingSub: "もうすこしで完成します",
    errorMessage: "時間をおいて、もう一度<br/>お試しください",
    capture: (letter) =>
      captureOne(letter, cardConf, fontFamily, fallbackFootText, date, qrUrlFor(letter.id)),
    onProgress,
  });
  if (!opened) return { opened: false, printed: images.length, failed };
  if (images.length === 0) return { opened: true, printed: 0, failed };

  writeSheetPrintDoc(w, "席札一括印刷", images, layout, rotate);
  return { opened: true, printed: images.length, failed };
}
