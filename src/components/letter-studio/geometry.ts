import type { CardConfig, Draft, Letter } from "./types";

export interface CardGeometry {
  w: string;
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
  return {
    w:
      o === "landscape"
        ? "min(546px,100%)"
        : o === "portrait"
          ? "min(330px,100%)"
          : o === "tent-l"
            ? "min(420px,100%)"
            : "min(520px,100%)",
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
    barW: land ? "7px" : "100%",
    barH: land ? "100%" : "7px",
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
    foldBT: o === "tent-l" ? `1.5px dashed ${rule}` : "none",
    foldBL: o === "tent-p" ? `1.5px dashed ${rule}` : "none",
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
