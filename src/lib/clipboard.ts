/**
 * テキストをクリップボードへコピーする。
 * navigator.clipboard は HTTPS/権限付きコンテキストでしか使えないため、
 * 失敗したら非表示の textarea + execCommand にフォールバックする。
 * @returns コピーできたら true
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}
