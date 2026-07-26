"use client";

import { THEMES } from "../constants";
import { useStudio } from "../StudioContext";
import { EditorScreen } from "./EditorScreen";

export function EditorConnected() {
  const api = useStudio();
  const { state, curProject, cardConf, escortConf } = api;

  const geometry = cardConf
    ? api.geom(cardConf, THEMES[state.draft.theme || "rose"].rule)
    : null;

  // 取得待ち / 不正 id はシェル側でリダイレクトされる。
  if (!curProject || !cardConf || !escortConf || !geometry) return null;

  return (
    <EditorScreen
      project={curProject}
      draft={state.draft}
      edTab={state.edTab}
      cardConf={cardConf}
      escortConf={escortConf}
      geometry={geometry}
      escortGeometry={api.escortGeom(escortConf.style)}
      cardName={api.cardNameFor(state.draft)}
      escortName={api.escortNameFor(state.draft)}
      qrUrl={state.draft.id ? api.letterUrl(state.draft.id) : ""}
      onBack={api.backToProject}
      onEdTabChange={api.setEdTab}
      onChangeTo={(to) => api.setDraft({ to })}
      onChangeBody={(body) => api.setDraft({ body })}
      onChangeCardName={(cardName) => api.setDraft({ cardName })}
      onSetHonor={(honor) => api.setDraft({ honor })}
      onChangeTableNo={(tableNo) => api.setDraft({ tableNo })}
      onChangeEscortName={(escortName) => api.setDraft({ escortName })}
      onChangeEscortMessage={(escortMessage) => api.setDraft({ escortMessage })}
      onSetEscortHonor={(escortHonor) => api.setDraft({ escortHonor })}
      onUploadEscortPhoto={api.upEscortPhoto}
      onRemoveEscortPhoto={() =>
        api.setDraft({ escortPhoto: null, escortPhotoRatio: undefined })
      }
      onSetTheme={(theme) => api.setDraft({ theme })}
      onOpenSettings={() => api.openSettings("general")}
      onOpenCardSettings={() => api.openSettings("card")}
      onOpenEscortSettings={() => api.openSettings("escort")}
      onSave={api.saveLetter}
      saving={api.savingLetter}
      letterUrl={state.draft.id ? api.letterUrl(state.draft.id) : "#"}
    />
  );
}
