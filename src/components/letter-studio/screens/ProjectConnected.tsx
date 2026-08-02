"use client";

import { useStudio } from "../StudioContext";
import { ProjectScreen } from "./ProjectScreen";

export function ProjectConnected() {
  const api = useStudio();
  const { state, curProject } = api;

  // イベント一覧の取得待ち / 不正 id はシェル側でリダイレクトされる。
  if (!curProject) return null;

  return (
    <ProjectScreen
      project={curProject}
      // 一覧に並ぶのはお手紙そのものなので、伏せられた分は出さない。
      letters={state.visibleLetters}
      currentUid={state.userUid}
      loadingLetters={api.loadingLetters}
      onBack={api.goHome}
      onOpenSettings={api.openSettings}
      onSelectTab={api.selectEventTab}
      onBulkAdd={api.openBulkAdd}
      onNewLetter={api.newLetter}
      onEditLetter={(l) => api.openLetterDrawer(l.id)}
      onShowQr={(l) => api.setQrModal(l)}
      onShowEscort={(l) => api.setEscortModal(l)}
      onCopyLink={api.copyLink}
      onDeleteLetter={(l) => api.deleteLetter(l.id)}
      deletingLetter={api.deletingLetter}
      letterUrl={api.letterUrl}
      cardNameFor={api.cardNameFor}
      escortNameFor={api.escortNameFor}
    />
  );
}
