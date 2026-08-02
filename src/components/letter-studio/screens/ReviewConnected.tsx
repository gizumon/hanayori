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
      loading={api.loadingLetters}
      onBack={api.goHome}
      onSelectTab={api.selectEventTab}
      onOpenSettings={api.openSettings}
      onEdit={(letter, tab) => api.openLetterDrawer(letter.id, tab)}
      letterUrl={api.letterUrl}
      saveCardImage={api.saveCardImage}
      onPrintAllEscort={() => api.printAllEscortCards(state.letters)}
      printingAllEscort={api.printingAllEscort}
      onPrintAllCards={() => api.printAllCards(state.letters)}
      printingAllCards={api.printingAllCards}
    />
  );
}
