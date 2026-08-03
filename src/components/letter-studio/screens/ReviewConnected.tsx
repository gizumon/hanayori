"use client";

import { useStudio } from "../StudioContext";
import { ReviewScreen } from "./ReviewScreen";

export function ReviewConnected() {
  const api = useStudio();
  const { state, curProject } = api;

  // 取得待ち / 不正 id はシェル側でリダイレクトされる。
  if (!curProject) return null;

  return (
    <ReviewScreen
      project={curProject}
      letters={state.letters}
      visibleLetters={state.visibleLetters}
      currentUid={state.userUid}
      loading={api.loadingLetters}
      onBack={api.goHome}
      onSelectTab={api.selectEventTab}
      onOpenSettings={api.openSettings}
      onEdit={(letter, tab) => api.openLetterDrawer(letter.id, tab)}
      letterUrl={api.letterUrl}
      saveCardImage={api.saveCardImage}
      // 絞り込み中は、画面に並んでいるぶんだけを印刷する。
      onPrintAllEscort={(letters) => api.printAllEscortCards(letters)}
      printingAllEscort={api.printingAllEscort}
      onPrintAllCards={(letters) => api.printAllCards(letters)}
      printingAllCards={api.printingAllCards}
    />
  );
}
