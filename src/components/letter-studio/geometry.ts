import type {
  CardConfig,
  Draft,
  EscortConfig,
  EscortStyle,
  Letter,
  LetterConfig,
  LetterPhoto,
} from "./types";

/**
 * カード内の寸法は「カード幅に対する比率」(cqw)で指定する。
 *
 * プレビューは置き場所ごとに幅がまちまち(確認タブのサムネイル〜モーダルの
 * 数百px)で、一括印刷は 640px のオフスクリーンで描いて画像化する。px や vw で
 * 書くと同じ 32px でもカード幅に対する比率が変わり、印刷だけ文字が小さくなる。
 * cqw ならどの幅で描いても同じ縮尺の相似形になり、プレビュー=保存画像=印刷が揃う。
 *
 * refWidthPx は各カードのデザイン基準幅。この幅で描いたときに、元の px 指定と
 * ちょうど同じ見た目になる。
 */
export function cardUnit(refWidthPx: number): (px: number) => string {
  return (px) => `${Number(((px / refWidthPx) * 100).toFixed(4))}cqw`;
}

export interface CardGeometry {
  /** デザイン基準幅(px)。カード内の寸法を cqw に換算する分母。 */
  refW: number;
  aspect: string;
  flexDir: "row" | "column";
  nameAlign: string;
  textAlign: "left" | "center";
  namePad: string;
  barW: string;
  barH: string;
  contentInset: string;
  footLeft: string;
  footRight: string;
  isTent: boolean;
  namePanelInset: string;
  namePanelRotate: string;
  qrPanelInset: string;
  qrPanelRotate: string;
  foldInset: string;
  foldBT: string;
  foldBL: string;
  sizeLabel: string;
  printDims: string;
}

export function geom(cc: CardConfig, rule: string): CardGeometry {
  const o = (["landscape", "portrait", "tent-l", "tent-p"] as const).includes(
    cc.orient
  )
    ? cc.orient
    : "landscape";
  const land = o === "landscape" || o === "tent-l";
  const tent = o === "tent-l" || o === "tent-p";
  const refW =
    o === "landscape" ? 546 : o === "portrait" ? 330 : o === "tent-l" ? 420 : 520;
  const u = cardUnit(refW);
  return {
    refW,
    aspect:
      o === "landscape"
        ? "91 / 55"
        : o === "portrait"
          ? "55 / 91"
          : o === "tent-l"
            ? "91 / 110"
            : "110 / 91",
    flexDir: land ? "row" : "column",
    nameAlign: land ? "flex-start" : "center",
    textAlign: land ? "left" : "center",
    namePad: land ? "3% 2% 12% 6%" : "9% 6% 0",
    barW: land ? u(7) : "100%",
    barH: land ? "100%" : u(7),
    contentInset:
      o === "landscape"
        ? "0"
        : o === "portrait"
          ? "0 0 15% 0"
          : o === "tent-l"
            ? "50% 0 0 0"
            : "0 0 12% 50%",
    footLeft: o === "tent-p" ? "54%" : land ? "7%" : "8%",
    footRight: land ? "44%" : "8%",
    isTent: tent,
    namePanelInset: o === "tent-l" ? "50% 0 0 0" : "0 50% 0 0",
    namePanelRotate: "0deg",
    qrPanelInset: o === "tent-l" ? "0 0 50% 0" : "0 0 0 50%",
    qrPanelRotate: o === "tent-l" ? "180deg" : "0deg",
    foldInset: o === "tent-l" ? "50% 0 auto 0" : "0 auto 0 50%",
    foldBT: o === "tent-l" ? `${u(1.5)} dashed ${rule}` : "none",
    foldBL: o === "tent-p" ? `${u(1.5)} dashed ${rule}` : "none",
    sizeLabel:
      o === "landscape"
        ? "91×55mm"
        : o === "portrait"
          ? "55×91mm"
          : o === "tent-l"
            ? "91×110mm(二つ折りで91×55)"
            : "110×91mm(二つ折りで55×91)",
    printDims:
      o === "landscape"
        ? "width:91mm;height:55mm"
        : o === "portrait"
          ? "width:55mm;height:91mm"
          : o === "tent-l"
            ? "width:91mm;height:110mm"
            : "width:110mm;height:91mm",
  };
}

/**
 * そのお手紙に実際に出す写真。優先順は
 * **お手紙の写真 > 「出さない」 > イベント既定の写真**(サーバー側の
 * `resolvePhotos` と同じ規則)。プレビューはこれを通して描く。
 */
export function letterPhotosFor(
  letter: Draft | Letter | null | undefined,
  lc: LetterConfig
): LetterPhoto[] {
  const own = letter?.photos ?? [];
  if (own.length > 0) return own;
  return letter?.hidePhotos ? [] : lc.defaultPhotos;
}

export function cardNameFor(
  letter: Draft | Letter | null | undefined,
  cc: CardConfig
): string {
  const base =
    letter?.cardName ||
    (letter?.to ? letter.to.replace(/(さん)?へ$/, "") : "") ||
    "お名前";
  const honor = letter?.honor ?? cc.honor;
  return honor === "" ? base : `${base} ${honor}`;
}

export interface EscortGeometry {
  /** デザイン基準幅(px)。カード内の寸法を cqw に換算する分母。 */
  refW: number;
  aspect: string;
  sizeLabel: string;
  printDims: string;
}

/** エスコートカードの寸法。ticket = 横長チケット、card = 縦長カード。 */
export function escortGeom(style: EscortStyle): EscortGeometry {
  if (style === "card") {
    return {
      refW: 300,
      aspect: "55 / 91",
      sizeLabel: "55×91mm",
      printDims: "width:55mm;height:91mm",
    };
  }
  return {
    refW: 560,
    aspect: "182 / 65",
    sizeLabel: "182×65mm",
    printDims: "width:182mm;height:65mm",
  };
}

/** エスコートカードに表示する名前(敬称適用済み)。 */
export function escortNameFor(
  letter: Draft | Letter | null | undefined,
  ec: EscortConfig
): string {
  const base =
    letter?.escortName ||
    letter?.cardName ||
    (letter?.to ? letter.to.replace(/(さん)?へ$/, "") : "") ||
    "お名前";
  const honor = letter?.escortHonor ?? ec.honor;
  return honor === "" ? base : `${base} ${honor}`;
}
