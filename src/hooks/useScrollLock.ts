"use client";

import { useEffect } from "react";

let lockCount = 0;
let previousOverflow = "";

/** マウント中(enabled 中)は背面ページのスクロールを止める。ドロワー/モーダルの多重表示にも参照カウントで対応。 */
export function useScrollLock(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;
    if (lockCount === 0) previousOverflow = document.body.style.overflow;
    lockCount++;
    document.body.style.overflow = "hidden";
    return () => {
      lockCount--;
      if (lockCount === 0) document.body.style.overflow = previousOverflow;
    };
  }, [enabled]);
}
