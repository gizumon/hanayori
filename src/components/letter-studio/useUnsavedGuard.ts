"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * dirty な間はブラウザの離脱(閉じる/リロード/他サイトへ移動)をネイティブの確認ダイアログで止める
 * (ブラウザの仕様上ここだけはポップアップを独自デザインにできない)。
 * アプリ内遷移は guard() 経由で止め、確認内容はアプリ内のポップアップ(pendingConfirm)で表示する。
 */
export function useUnsavedGuard(dirty: boolean) {
  const [pending, setPending] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const guard = useCallback(
    (action: () => void) => {
      if (dirty) {
        setPending(() => action);
      } else {
        action();
      }
    },
    [dirty]
  );

  const confirmLeave = useCallback(() => {
    setPending((current) => {
      current?.();
      return null;
    });
  }, []);

  const cancelLeave = useCallback(() => setPending(null), []);

  return { guard, pendingConfirm: pending !== null, confirmLeave, cancelLeave };
}
