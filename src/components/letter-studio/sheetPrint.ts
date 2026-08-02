"use client";

const SCENE_MARKUP = `<div class="scene">
    <div class="envelope"><svg width="38" height="25" viewBox="0 0 38 25" fill="none">
      <rect x="1" y="1" width="36" height="23" rx="3" fill="#FFFCF8" stroke="#D3A5B4" stroke-width="1.6"/>
      <path d="M2.5 3.5 19 15 35.5 3.5" stroke="#D3A5B4" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <g fill="#D3A5B4">
        <ellipse cx="19" cy="17.9" rx="1.4" ry="2.1"/>
        <ellipse cx="19" cy="17.9" rx="1.4" ry="2.1" transform="rotate(72 19 20.3)"/>
        <ellipse cx="19" cy="17.9" rx="1.4" ry="2.1" transform="rotate(144 19 20.3)"/>
        <ellipse cx="19" cy="17.9" rx="1.4" ry="2.1" transform="rotate(216 19 20.3)"/>
        <ellipse cx="19" cy="17.9" rx="1.4" ry="2.1" transform="rotate(288 19 20.3)"/>
      </g>
      <circle cx="19" cy="20.3" r="1.1" fill="#E3C293"/>
    </svg></div>
    <div class="mailbox"><svg width="84" height="72" viewBox="0 0 84 72" fill="none">
      <ellipse cx="42" cy="68" rx="21" ry="3.2" fill="#D3A5B4" opacity=".16"/>
      <rect x="38" y="48" width="8" height="18" rx="2.5" fill="#D8C4CB"/>
      <g class="flag">
        <rect x="60" y="5" width="3.6" height="17" rx="1.8" fill="#E3C293"/>
        <path d="M63.6 6.5h8.2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-8.2Z" fill="#EFD3A9"/>
      </g>
      <path d="M14 34C14 21.3 24.3 11 37 11h10c12.7 0 23 10.3 23 23v14a5 5 0 0 1-5 5H19a5 5 0 0 1-5-5V34Z" fill="#D3A5B4"/>
      <path d="M14 34C14 21.3 24.3 11 37 11h2v42H19a5 5 0 0 1-5-5V34Z" fill="#E7BFCB" opacity=".55"/>
      <rect x="27" y="19" width="30" height="6.5" rx="3.25" fill="#5C4A4A" opacity=".3"/>
      <rect x="27" y="25.2" width="30" height="1.6" rx=".8" fill="#FFFCF8" opacity=".35"/>
      <g fill="#FFFCF8" opacity=".9">
        <ellipse cx="42" cy="38.3" rx="3" ry="4.7"/>
        <ellipse cx="42" cy="38.3" rx="3" ry="4.7" transform="rotate(72 42 43)"/>
        <ellipse cx="42" cy="38.3" rx="3" ry="4.7" transform="rotate(144 42 43)"/>
        <ellipse cx="42" cy="38.3" rx="3" ry="4.7" transform="rotate(216 42 43)"/>
        <ellipse cx="42" cy="38.3" rx="3" ry="4.7" transform="rotate(288 42 43)"/>
      </g>
      <circle cx="42" cy="43" r="2.3" fill="#E3C293" opacity=".9"/>
    </svg></div>
  </div>`;

/**
 * 印刷用ポップアップの「準備中」画面(ポストに手紙を投函するアニメーション)。
 * total を渡すと進捗バー(#bar / #count)つきになる。単発印刷では省略する。
 */
export function printLoadingHtml({
  windowTitle,
  title,
  sub,
  total,
}: {
  windowTitle: string;
  title: string;
  sub: string;
  total?: number;
}) {
  return `<!doctype html><html><head><title>${windowTitle}</title><style>
*{box-sizing:border-box}
html,body{margin:0;min-height:100%;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(160deg,#FCF6F8 0%,#F7ECEF 45%,#F1E0E7 100%);
  font-family:"Hiragino Sans","Yu Gothic",sans-serif;color:#5C4A4A;overflow:hidden}
.petal{position:fixed;pointer-events:none;border-radius:58% 42% 62% 0;--r:0deg;
  animation:drift 7s ease-in-out infinite}
.petal.p1{width:26px;height:26px;background:#EDD8E1;opacity:.65;top:14%;left:10%;--r:24deg}
.petal.p2{width:18px;height:18px;background:#D3A5B4;opacity:.35;top:66%;left:16%;--r:130deg;animation-delay:1.4s}
.petal.p3{width:22px;height:22px;background:#F1D9E1;opacity:.7;top:18%;right:12%;--r:210deg;animation-delay:.7s}
.petal.p4{width:15px;height:15px;background:#E7BFCB;opacity:.5;bottom:15%;right:18%;--r:80deg;animation-delay:2.1s}
.dot{position:fixed;border-radius:50%;background:#E3C293;pointer-events:none;animation:drift 7s ease-in-out infinite}
.dot.g1{width:7px;height:7px;opacity:.5;top:38%;left:20%;animation-delay:.9s}
.dot.g2{width:5px;height:5px;opacity:.55;bottom:30%;right:24%;animation-delay:2.6s}
@keyframes drift{0%,100%{transform:translateY(0) rotate(var(--r,0deg))}
  50%{transform:translateY(-16px) rotate(calc(var(--r,0deg) + 12deg))}}
.box{position:relative;z-index:1;text-align:center;background:#FFFCF8;border-radius:28px;
  padding:36px 44px 34px;border:1px solid rgba(211,165,180,.28);
  box-shadow:0 24px 60px rgba(150,110,130,.22),0 2px 8px rgba(150,110,130,.08);width:min(300px,84vw)}
.scene{position:relative;width:88px;height:80px;margin:0 auto 18px}
.mailbox{position:absolute;left:50%;bottom:0;width:84px;margin-left:-42px;z-index:2;
  transform-origin:50% 100%;animation:thud 3s ease-in-out infinite}
.mailbox svg{display:block}
.flag{transform-box:fill-box;transform-origin:15% 95%;animation:wave 3s ease-in-out infinite}
.envelope{position:absolute;left:50%;top:6px;width:38px;margin-left:-19px;z-index:3;
  animation:post 3s infinite}
.envelope svg{display:block;filter:drop-shadow(0 3px 5px rgba(150,110,130,.28))}
@keyframes post{
  0%{transform:translateY(46px) scale(.9);opacity:0;animation-timing-function:cubic-bezier(.2,.7,.3,1)}
  10%{opacity:1}
  42%{transform:translateY(-3px) scale(1);opacity:1;animation-timing-function:ease-in-out}
  52%{transform:translateY(0) scale(1);opacity:1;animation-timing-function:cubic-bezier(.5,0,.8,.4)}
  64%{transform:translateY(7px) scale(.5);opacity:0}
  100%{transform:translateY(46px) scale(.9);opacity:0}
}
@keyframes thud{
  0%,62%{transform:scale(1)}
  68%{transform:scale(1.04,.94)}
  76%{transform:scale(.99,1.02)}
  84%,100%{transform:scale(1)}
}
@keyframes wave{
  0%,64%{transform:rotate(0deg)}
  72%{transform:rotate(-12deg)}
  80%{transform:rotate(7deg)}
  88%,100%{transform:rotate(0deg)}
}
.title{font-size:15px;font-weight:600;letter-spacing:.08em;margin:0 0 6px}
.sub{font-size:12px;color:#A38A93;letter-spacing:.05em;margin:0 0 20px}
.track{width:100%;height:8px;border-radius:999px;background:#F5E6EC;overflow:hidden;margin-bottom:10px;
  box-shadow:inset 0 1px 2px rgba(150,110,130,.14)}
.bar{height:100%;border-radius:999px;width:0%;
  background:linear-gradient(90deg,#E3C293,#D3A5B4 55%,#E3C293);background-size:200% 100%;
  animation:sheen 2.6s linear infinite;transition:width .45s cubic-bezier(.3,.7,.3,1)}
@keyframes sheen{0%{background-position:0% 0}100%{background-position:-200% 0}}
.count{font-size:11px;color:#B79AA3;letter-spacing:.06em;font-variant-numeric:tabular-nums}
</style></head><body>
<div class="petal p1"></div><div class="petal p2"></div><div class="petal p3"></div><div class="petal p4"></div>
<div class="dot g1"></div><div class="dot g2"></div>
<div class="box">
  ${SCENE_MARKUP}
  <p class="title">${title}</p>
  <p class="sub" id="sub">${sub}</p>
  ${
    total === undefined
      ? ""
      : `<div class="track"><div class="bar" id="bar"></div></div>
  <div class="count" id="count">0 / ${total}</div>`
  }
</div>
</body></html>`;
}

/** 印刷用ポップアップの失敗画面。 */
export function printErrorHtml({ windowTitle, message }: { windowTitle: string; message: string }) {
  return `<!doctype html><html><head><title>${windowTitle}</title><style>
*{box-sizing:border-box}
html,body{margin:0;min-height:100%;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(160deg,#FCF6F8 0%,#F7ECEF 45%,#F1E0E7 100%);
  font-family:"Hiragino Sans","Yu Gothic",sans-serif;color:#5C4A4A;overflow:hidden}
.petal{position:fixed;pointer-events:none;border-radius:58% 42% 62% 0;--r:0deg;
  animation:drift 7s ease-in-out infinite}
.petal.p1{width:26px;height:26px;background:#EDD8E1;opacity:.65;top:14%;left:10%;--r:24deg}
.petal.p2{width:18px;height:18px;background:#D3A5B4;opacity:.35;top:66%;left:16%;--r:130deg;animation-delay:1.4s}
.petal.p3{width:22px;height:22px;background:#F1D9E1;opacity:.7;top:18%;right:12%;--r:210deg;animation-delay:.7s}
.petal.p4{width:15px;height:15px;background:#E7BFCB;opacity:.5;bottom:15%;right:18%;--r:80deg;animation-delay:2.1s}
@keyframes drift{0%,100%{transform:translateY(0) rotate(var(--r,0deg))}
  50%{transform:translateY(-16px) rotate(calc(var(--r,0deg) + 12deg))}}
.box{position:relative;z-index:1;text-align:center;background:#FFFCF8;border-radius:28px;
  padding:38px 44px;border:1px solid rgba(211,165,180,.28);
  box-shadow:0 24px 60px rgba(150,110,130,.22),0 2px 8px rgba(150,110,130,.08);width:min(300px,84vw)}
.icon{position:relative;width:58px;height:58px;margin:0 auto 18px;display:flex;align-items:center;justify-content:center;
  border-radius:50%;background:linear-gradient(145deg,#F6E3E9,#F1D3DC)}
.icon::after{content:"";position:absolute;top:4px;right:2px;width:9px;height:9px;border-radius:50%;
  background:#E3C293;box-shadow:0 0 0 2.5px #FFFCF8}
.title{font-size:15px;font-weight:600;letter-spacing:.08em;margin:0 0 8px}
.sub{font-size:12.5px;color:#A38A93;letter-spacing:.04em;line-height:1.8;margin:0}
</style></head><body>
<div class="petal p1"></div><div class="petal p2"></div><div class="petal p3"></div><div class="petal p4"></div>
<div class="box">
  <div class="icon"><svg width="28" height="20" viewBox="0 0 28 20" fill="none">
    <rect x="1" y="1" width="26" height="18" rx="3" stroke="#C98A9C" stroke-width="1.7"/>
    <path d="M2.5 3.5 14 11.5 25.5 3.5" stroke="#C98A9C" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
  </svg></div>
  <p class="title">うまく準備できませんでした</p>
  <p class="sub">${message}</p>
</div>
</body></html>`;
}

function setProgress(w: Window, done: number, total: number, failed: number) {
  const bar = w.document.getElementById("bar");
  if (bar) bar.style.width = `${total === 0 ? 0 : (done / total) * 100}%`;
  const count = w.document.getElementById("count");
  if (count) count.textContent = `${done} / ${total}${failed > 0 ? ` ・失敗 ${failed}` : ""}`;
  // 全件そろったら、印刷画面へ切り替わるまでのあいだサブテキストをそっと差し替える。
  if (total > 0 && done >= total) {
    const sub = w.document.getElementById("sub");
    if (sub) sub.textContent = "まもなく印刷画面がひらきます";
  }
}

/** A4 1枚に複数枚のカードを敷き詰めて印刷するときの寸法(単位mm)。 */
export interface SheetLayout {
  pageWMm: number;
  pageHMm: number;
  marginXMm: number;
  marginYMm: number;
  cardWMm: number;
  cardHMm: number;
  cols: number;
  rows: number;
  cardsPerPage: number;
}

/**
 * 91×55mm のカードを A4 1枚に 2列×5行(計10枚)、左右14mm・上下11mmの
 * 余白で敷き詰める(隙間なしでちょうど 14+91*2+14=210mm / 11+55*5+11=297mm)。
 * 席札(横向き)と、回転して敷くエスコートカード(カード風)の両方で使う共通レイアウト。
 */
export const CARD_91X55_LAYOUT: SheetLayout = {
  pageWMm: 210,
  pageHMm: 297,
  marginXMm: 14,
  marginYMm: 11,
  cardWMm: 91,
  cardHMm: 55,
  cols: 2,
  rows: 5,
  cardsPerPage: 10,
};

export interface RunSheetCaptureArgs<T> {
  items: T[];
  windowTitle: string;
  loadingTitle: string;
  loadingSub: string;
  errorMessage: string;
  capture: (item: T) => Promise<string>;
  onProgress?: (done: number, total: number) => void;
}

export type RunSheetCaptureResult =
  | { opened: true; images: string[]; failed: number; w: Window }
  | { opened: false; images: string[]; failed: number; w: null };

/**
 * 複数枚を dataURL 画像にキャプチャする共通処理。印刷ウィンドウを確保して
 * 進捗ポップアップを表示し、1枚の失敗があっても残りは続行する。
 * 実際の印刷用HTML(敷き詰めレイアウト)の組み立ては呼び出し側に委ねる。
 */
export async function runSheetCapture<T>({
  items,
  windowTitle,
  loadingTitle,
  loadingSub,
  errorMessage,
  capture,
  onProgress,
}: RunSheetCaptureArgs<T>): Promise<RunSheetCaptureResult> {
  if (items.length === 0) return { opened: false, images: [], failed: 0, w: null };

  // キャプチャに数秒〜数十秒かかるため、後から window.open するとポップアップ
  // ブロックされやすい。クリック直後に確保し、進捗はそのウィンドウ内に表示する。
  const w = window.open("", "_blank");
  if (!w) return { opened: false, images: [], failed: 0, w: null };
  w.document.write(
    printLoadingHtml({ windowTitle, title: loadingTitle, sub: loadingSub, total: items.length })
  );
  w.document.close();
  // window.open で開いた新規タブは通常フォーカスを奪う。実際にカードを描画・
  // キャプチャするのはこの(元の)タブなので、バックグラウンド化による rAF 停止
  // やタイマー抑制を避けるためフォーカスを戻しておく。
  window.focus();

  const images: string[] = [];
  let failed = 0;
  for (let i = 0; i < items.length; i++) {
    if (w.closed) return { opened: false, images, failed, w: null };
    try {
      images.push(await capture(items[i]));
    } catch (err) {
      failed++;
      console.error("card capture failed", i, err);
    }
    onProgress?.(i + 1, items.length);
    if (!w.closed) setProgress(w, i + 1, items.length, failed);
  }
  if (w.closed) return { opened: false, images, failed, w: null };

  if (images.length === 0) {
    w.document.open();
    w.document.write(printErrorHtml({ windowTitle, message: errorMessage }));
    w.document.close();
  }
  return { opened: true, images, failed, w };
}

/**
 * キャプチャ済みの画像を敷き詰めレイアウトで A4 に流し込み、印刷ダイアログを開く。
 * rotate=true のときは画像を(縦横入れ替えて)90度回転して敷く
 * (例: 55×91mm のカードを 91×55mm のマス目に回転して収める)。
 */
export function writeSheetPrintDoc(
  w: Window,
  windowTitle: string,
  images: string[],
  layout: SheetLayout,
  rotate: boolean
) {
  const pages: string[] = [];
  for (let i = 0; i < images.length; i += layout.cardsPerPage) {
    const cardsHtml = images
      .slice(i, i + layout.cardsPerPage)
      .map((src) => `<div class="cell"><img class="card" src="${src}" /></div>`)
      .join("");
    pages.push(`<div class="page">${cardsHtml}</div>`);
  }

  const cardCss = rotate
    ? `position:absolute;top:50%;left:50%;width:${layout.cardHMm}mm;height:${layout.cardWMm}mm;transform:translate(-50%,-50%) rotate(90deg);`
    : `display:block;width:${layout.cardWMm}mm;height:${layout.cardHMm}mm;`;

  w.document.open();
  w.document.write(`<!doctype html><html><head><title>${windowTitle}</title><style>
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
.page {
  width: ${layout.pageWMm}mm;
  height: ${layout.pageHMm}mm;
  padding: ${layout.marginYMm}mm ${layout.marginXMm}mm;
  display: grid;
  grid-template-columns: repeat(${layout.cols}, ${layout.cardWMm}mm);
  grid-template-rows: repeat(${layout.rows}, ${layout.cardHMm}mm);
  page-break-after: always;
}
.page:last-child { page-break-after: auto; }
.cell {
  width: ${layout.cardWMm}mm;
  height: ${layout.cardHMm}mm;
  overflow: hidden;
  position: relative;
}
.card { ${cardCss} }
</style></head><body>${pages.join("")}<script>
window.onload = function () { setTimeout(function () { window.print(); }, 300); };
</script></body></html>`);
  w.document.close();
}
