"use client";

import { createRoot } from "react-dom/client";
import { THEMES } from "./constants";
import { EscortCardFace } from "./EscortCardFace";
import { escortGeom, escortNameFor } from "./geometry";
import {
  CARD_91X55_LAYOUT,
  runSheetCapture,
  writeSheetPrintDoc,
  type SheetLayout,
} from "./sheetPrint";
import type { EscortConfig, Letter } from "./types";

// A4 1枚に 182×65mm のチケットを 4 枚(左右14mm・上下18.5mmの余白で
// ちょうど 18.5+65*4+18.5=297mm / 14+182+14=210mm)敷き詰める。
const TICKET_LAYOUT: SheetLayout = {
  pageWMm: 210,
  pageHMm: 297,
  marginXMm: 14,
  marginYMm: 18.5,
  cardWMm: 182,
  cardHMm: 65,
  cols: 1,
  rows: 4,
  cardsPerPage: 4,
};

/** オフスクリーン描画の基準幅。html2canvas の scale:3 と合わせて印刷に十分な解像度にする。 */
const CAPTURE_WIDTH_PX = 640;
/** 1枚あたりの画像読み込みタイムアウト。壊れた写真URLで無限に固まるのを防ぐ。 */
const IMAGE_TIMEOUT_MS = 8000;

async function captureOne(
  letter: Letter,
  ec: EscortConfig,
  fontFamily: string,
  fallbackFootText: string
): Promise<string> {
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-99999px";
  host.style.top = "0";
  document.body.appendChild(host);
  const root = createRoot(host);
  const theme = THEMES[letter.theme];

  try {
    await new Promise<void>((resolve) => {
      root.render(
        <EscortCardFace
          style={ec.style}
          width={`${CAPTURE_WIDTH_PX}px`}
          aspect={escortGeom(ec.style).aspect}
          paper={theme.paper}
          accent={theme.accent}
          gold={theme.gold}
          ink={theme.ink}
          inkSoft={theme.inkSoft}
          font={fontFamily}
          name={escortNameFor(letter, ec)}
          tableNo={letter.tableNo || ""}
          tableLabel={ec.tableLabel}
          heading={ec.heading}
          message={letter.escortMessage || ""}
          photo={letter.escortPhoto || ec.defaultPhoto || ""}
          footText={ec.nameOverride.trim() || fallbackFootText}
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

export interface PrintAllEscortCardsArgs {
  letters: Letter[];
  escortConf: EscortConfig;
  fontFamily: string;
  fallbackFootText: string;
  onProgress?: (done: number, total: number) => void;
}

export interface PrintAllEscortCardsResult {
  /** 印刷ウィンドウを開けた(=実行できた)かどうか。ポップアップブロック時は false。 */
  opened: boolean;
  /** 実際に印刷ページへ載った枚数。 */
  printed: number;
  /** 画像化に失敗して除外された枚数。 */
  failed: number;
}

/**
 * 全ゲストぶんのエスコートカードを実寸のまま A4 にまとめて印刷する。
 * 「チケット風」(182×65mm)は 4枚/A4、「カード風」(55×91mm)は 91×55mm の
 * マス目に90度回転して収め 10枚/A4 で敷き詰める。1枚の画像化に失敗しても
 * (壊れた写真URLなど)、残りは続行して印刷する。
 */
export async function printAllEscortCards({
  letters,
  escortConf,
  fontFamily,
  fallbackFootText,
  onProgress,
}: PrintAllEscortCardsArgs): Promise<PrintAllEscortCardsResult> {
  if (letters.length === 0) return { opened: false, printed: 0, failed: 0 };

  const layout = escortConf.style === "card" ? CARD_91X55_LAYOUT : TICKET_LAYOUT;
  const rotate = escortConf.style === "card";

  const { opened, images, failed, w } = await runSheetCapture({
    items: letters,
    windowTitle: "エスコートカード一括印刷",
    loadingTitle: "エスコートカードを準備中です",
    loadingSub: "もうすこしで完成します",
    errorMessage: "時間をおいて、もう一度<br/>お試しください",
    capture: (letter) => captureOne(letter, escortConf, fontFamily, fallbackFootText),
    onProgress,
  });
  if (!opened) return { opened: false, printed: images.length, failed };
  if (images.length === 0) return { opened: true, printed: 0, failed };

  writeSheetPrintDoc(w, "エスコートカード一括印刷", images, layout, rotate);
  return { opened: true, printed: images.length, failed };
}
