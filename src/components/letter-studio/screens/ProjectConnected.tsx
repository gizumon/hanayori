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
      letters={state.letters}
      loadingLetters={api.loadingLetters}
      onBack={api.goHome}
      onOpenSettings={() => api.openSettings("general")}
      onNewLetter={api.newLetter}
      onEditLetter={api.editLetter}
      onShowQr={(l) => api.setQrModal(l)}
      onShowEscort={(l) => api.setEscortModal(l)}
      onCopyLink={api.copyLink}
      onDeleteLetter={(l) => api.deleteLetter(l.id)}
      deletingLetter={api.deletingLetter}
      letterUrl={api.letterUrl}
      cardNameFor={api.cardNameFor}
    />
  );
}
