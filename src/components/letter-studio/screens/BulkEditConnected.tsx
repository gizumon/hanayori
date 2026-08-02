"use client";

import { useStudio } from "../StudioContext";
import { BulkEditScreen } from "./BulkEditScreen";

export function BulkEditConnected() {
  const api = useStudio();
  const { state, curProject } = api;

  // 取得待ち / 不正 id はシェル側でリダイレクトされる。
  if (!curProject) return null;

  return (
    <BulkEditScreen
      project={curProject}
      letters={state.letters}
      loading={api.loadingLetters}
      saving={api.savingBulk}
      onBack={api.goHome}
      onSelectTab={api.selectEventTab}
      onOpenSettings={api.openSettings}
      onSave={api.bulkSaveLetters}
      cardNameFor={api.cardNameFor}
      escortNameFor={api.escortNameFor}
    />
  );
}
