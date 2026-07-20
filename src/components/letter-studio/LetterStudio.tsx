"use client";

import { FONTS, THEMES } from "./constants";
import styles from "./letter-studio.module.css";
import { NewEventModal } from "./NewEventModal";
import { QrModal } from "./QrModal";
import { AppHeader } from "./screens/AppHeader";
import { CardScreen } from "./screens/CardScreen";
import { EditorScreen } from "./screens/EditorScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { ProjectScreen } from "./screens/ProjectScreen";
import { Toast } from "./Toast";
import { useLetterStudio } from "./useLetterStudio";

export function LetterStudio() {
  const api = useLetterStudio();
  const { state, hydrated, curProject, cardConf } = api;

  if (!hydrated) {
    return <div className={styles.root} />;
  }

  const geometry = cardConf
    ? api.geom(cardConf, THEMES[state.draft.theme || "rose"].rule)
    : null;

  return (
    <div className={styles.root}>
      {state.screen === "login" && <LoginScreen />}

      {state.screen !== "login" && (
        <>
          <AppHeader
            userName={state.userName}
            onLogout={() => api.logout()}
            onUpdateName={api.updateNickname}
          />

          {state.screen === "home" && (
            <HomeScreen
              projects={state.projects}
              onOpen={(id) => api.openProject(id)}
              onNew={() => api.setModalShown(true)}
            />
          )}

          {state.screen === "project" && curProject && (
            <ProjectScreen
              project={curProject}
              letters={state.letters}
              projTab={state.projTab}
              onProjTabChange={api.setProjTab}
              onBack={api.goHome}
              onNewLetter={api.newLetter}
              onEditLetter={api.editLetter}
              onShowQr={(l) => api.setQrModal(l)}
              onCopyLink={api.copyLink}
              onDeleteLetter={(l) => api.deleteLetter(l.id)}
              deletingLetter={api.deletingLetter}
              letterUrl={api.letterUrl}
              cardNameFor={api.cardNameFor}
              onChangeName={(name) => api.updateProject({ name })}
              onChangeDate={(date) => api.updateProject({ date })}
              onToggleHasDate={(hasDate) => api.updateProject({ date: hasDate ? curProject.date || "" : null })}
              onToggleCardEnabled={(enabled) => api.updateProject({ cardEnabled: enabled })}
              onSetFont={(font) => api.updateProject({ font })}
              onGoCardSettings={api.goCardSettings}
            />
          )}

          {state.screen === "editor" && curProject && cardConf && geometry && (
            <EditorScreen
              project={curProject}
              draft={state.draft}
              edTab={state.edTab}
              cardConf={cardConf}
              geometry={geometry}
              cardEnabled={curProject.cardEnabled !== false}
              cardName={api.cardNameFor(state.draft)}
              qrUrl={state.draft.id ? api.letterUrl(state.draft.id) : ""}
              onBack={() => api.go("project")}
              onEdTabChange={api.setEdTab}
              onChangeTo={(to) => api.setDraft({ to })}
              onChangeBody={(body) => api.setDraft({ body })}
              onChangeCardName={(cardName) => api.setDraft({ cardName })}
              onSetHonor={(honor) => api.setDraft({ honor })}
              onSetTheme={(theme) => api.setDraft({ theme })}
              onGoCard={() => api.go("card")}
              onSave={api.saveLetter}
              saving={api.savingLetter}
              letterUrl={state.draft.id ? api.letterUrl(state.draft.id) : "#"}
            />
          )}

          {state.screen === "card" && curProject && cardConf && geometry && (
            <CardScreen
              project={curProject}
              draft={state.draft}
              cardConf={cardConf}
              geometry={geometry}
              cardName={api.cardNameFor(state.draft)}
              qrUrl={state.draft.id ? api.letterUrl(state.draft.id) : ""}
              cardRef={api.cardRef}
              onBack={() => api.go("editor")}
              onSetOrient={(orient) => api.setCard({ orient })}
              onSetFrame={(frame) => api.setCard({ frame })}
              onSetHonor={(honor) => api.setCard({ honor })}
              onSetCardFont={(cardFont) => api.updateProject({ cardFont })}
              onChangeHeading={(heading) => api.setCard({ heading })}
              onChangeNote={(note) => api.setCard({ note })}
              onSave={api.saveCard}
              onPrint={api.printCard}
            />
          )}
        </>
      )}

      {state.modalShown && (
        <NewEventModal
          name={state.newName}
          date={state.newDate}
          onChangeName={api.setNewName}
          onChangeDate={api.setNewDate}
          onCancel={() => api.setModalShown(false)}
          onCreate={api.createProject}
          creating={api.creatingProject}
        />
      )}

      {state.qrModal && curProject && cardConf && (
        <QrModal
          paper={THEMES[state.qrModal.theme].paper}
          accent={THEMES[state.qrModal.theme].accent}
          gold={THEMES[state.qrModal.theme].gold}
          ink={THEMES[state.qrModal.theme].ink}
          inkSoft={THEMES[state.qrModal.theme].inkSoft}
          font={FONTS[curProject.cardFont || "mincho"].family}
          frame={cardConf.frame}
          geometry={api.geom(cardConf, THEMES[state.qrModal.theme].rule)}
          cardName={api.cardNameFor(state.qrModal)}
          heading={cardConf.heading}
          note={cardConf.note}
          footText={curProject.name + (curProject.date ? ` ・ ${curProject.date}` : "")}
          qrUrl={api.letterUrl(state.qrModal.id)}
          onClose={() => api.setQrModal(null)}
        />
      )}

      {state.toastMsg && <Toast message={state.toastMsg} />}
    </div>
  );
}
