"use client";

import type { ReactNode } from "react";
import { FONTS, THEMES } from "./constants";
import { CropModal } from "./CropModal";
import { EscortModal } from "./EscortModal";
import { EventSettingsDrawer } from "./EventSettingsDrawer";
import styles from "./letter-studio.module.css";
import { NewEventModal } from "./NewEventModal";
import { QrModal } from "./QrModal";
import { AppHeader } from "./screens/AppHeader";
import { LoginScreen } from "./screens/LoginScreen";
import { StudioProvider } from "./StudioContext";
import { Toast } from "./Toast";
import { useLetterStudio } from "./useLetterStudio";

/**
 * /events 配下の共有シェル。LetterStudio の state を1回だけ生成して Context で
 * 配り、画面をまたぐ chrome(ヘッダー・各モーダル・設定ドロワー・トースト)を
 * 一元描画する。個々の画面(Home/Project/Editor)は各ルートの `children`。
 */
export function StudioShell({ children }: { children: ReactNode }) {
  const api = useLetterStudio();
  const { state, hydrated, curProject, cardConf, escortConf } = api;

  if (!hydrated) {
    return <div className={styles.root} />;
  }

  return (
    <StudioProvider value={api}>
      <div className={styles.root}>
        {state.screen === "login" ? (
          <LoginScreen />
        ) : (
          <>
            <AppHeader
              userName={state.userName}
              onLogout={() => api.logout()}
              onUpdateName={api.updateNickname}
              onGoHome={api.goHome}
            />

            {children}

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

        {state.escortModal && curProject && escortConf && (
          <EscortModal
            style={escortConf.style}
            geometry={api.escortGeom(escortConf.style)}
            paper={THEMES[state.escortModal.theme].paper}
            accent={THEMES[state.escortModal.theme].accent}
            gold={THEMES[state.escortModal.theme].gold}
            ink={THEMES[state.escortModal.theme].ink}
            inkSoft={THEMES[state.escortModal.theme].inkSoft}
            font={FONTS[escortConf.font].family}
            name={api.escortNameFor(state.escortModal)}
            tableNo={state.escortModal.tableNo || ""}
            tableLabel={escortConf.tableLabel}
            heading={escortConf.heading}
            message={state.escortModal.escortMessage || ""}
            photo={state.escortModal.escortPhoto || ""}
            footText={curProject.name + (curProject.date ? ` ・ ${curProject.date}` : "")}
            showQr={escortConf.qr}
            qrUrl={api.letterUrl(state.escortModal.id)}
            cardRef={api.escortCardRef}
            onSaveImage={api.saveEscortCard}
            onPrint={api.printEscortCard}
            onClose={() => api.setEscortModal(null)}
          />
        )}

        {state.escortCropSrc && escortConf && (
          <CropModal
            src={state.escortCropSrc}
            // チケット風は写真帯(31% × 全高 = 55.8×80mm)、カード風は正円用に 1:1
            aspect={escortConf.style === "card" ? 1 : 0.6975}
            onCancel={api.cancelEscortCrop}
            onApply={api.applyEscortCrop}
          />
        )}

        {state.toastMsg && <Toast message={state.toastMsg} />}
      </div>
    </StudioProvider>
  );
}
