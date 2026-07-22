"use client";

import { FONTS, THEMES } from "./constants";
import { EventSettingsDrawer } from "./EventSettingsDrawer";
import styles from "./letter-studio.module.css";
import { NewEventModal } from "./NewEventModal";
import { QrModal } from "./QrModal";
import { AppHeader } from "./screens/AppHeader";
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
            onGoHome={api.goHome}
          />

          {state.screen === "home" && (
            <HomeScreen
              projects={state.projects}
              loading={api.loadingEvents}
              onOpen={(id) => api.openProject(id)}
              onNew={() => api.setModalShown(true)}
            />
          )}

          {state.screen === "project" && curProject && (
            <ProjectScreen
              project={curProject}
              letters={state.letters}
              loadingLetters={api.loadingLetters}
              onBack={api.goHome}
              onOpenSettings={() => api.openSettings("general")}
              onNewLetter={api.newLetter}
              onEditLetter={api.editLetter}
              onShowQr={(l) => api.setQrModal(l)}
              onCopyLink={api.copyLink}
              onDeleteLetter={(l) => api.deleteLetter(l.id)}
              deletingLetter={api.deletingLetter}
              letterUrl={api.letterUrl}
              cardNameFor={api.cardNameFor}
            />
          )}

          {state.screen === "editor" && curProject && cardConf && geometry && (
            <EditorScreen
              project={curProject}
              draft={state.draft}
              edTab={state.edTab}
              cardConf={cardConf}
              geometry={geometry}
              cardName={api.cardNameFor(state.draft)}
              qrUrl={state.draft.id ? api.letterUrl(state.draft.id) : ""}
              onBack={() => api.go("project")}
              onEdTabChange={api.setEdTab}
              onChangeTo={(to) => api.setDraft({ to })}
              onChangeBody={(body) => api.setDraft({ body })}
              onChangeCardName={(cardName) => api.setDraft({ cardName })}
              onSetHonor={(honor) => api.setDraft({ honor })}
              onSetTheme={(theme) => api.setDraft({ theme })}
              onOpenSettings={() => api.openSettings("general")}
              onOpenCardSettings={() => api.openSettings("card")}
              onSave={api.saveLetter}
              saving={api.savingLetter}
              letterUrl={state.draft.id ? api.letterUrl(state.draft.id) : "#"}
            />
          )}

          {curProject && state.settingsTab && (
            <EventSettingsDrawer
              project={curProject}
              tab={state.settingsTab}
              onTabChange={api.setSettingsTab}
              onClose={api.closeSettings}
              onSave={api.saveSettings}
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
          font={FONTS[cardConf.font].family}
          frame={cardConf.frame}
          geometry={api.geom(cardConf, THEMES[state.qrModal.theme].rule)}
          cardName={api.cardNameFor(state.qrModal)}
          heading={cardConf.heading}
          note={cardConf.note}
          footText={curProject.name + (curProject.date ? ` ・ ${curProject.date}` : "")}
          qrUrl={api.letterUrl(state.qrModal.id)}
          cardRef={api.cardRef}
          onSaveImage={api.saveCard}
          onPrint={api.printCard}
          onClose={() => api.setQrModal(null)}
        />
      )}

      {state.toastMsg && <Toast message={state.toastMsg} />}
    </div>
  );
}
