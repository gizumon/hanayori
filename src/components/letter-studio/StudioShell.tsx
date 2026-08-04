"use client";

import type { ReactNode } from "react";
import { BulkAddModal } from "./BulkAddModal";
import { FONTS, THEMES } from "./constants";
import { LetterEditDrawer } from "./LetterEditDrawer";
import { EscortModal } from "./EscortModal";
import { EventSettingsDrawer } from "./EventSettingsDrawer";
import styles from "./letter-studio.module.css";
import { NewEventModal } from "./NewEventModal";
import { QrModal } from "./QrModal";
import { AppHeader } from "./screens/AppHeader";
import { LoginScreen } from "./screens/LoginScreen";
import { StudioProvider } from "./StudioContext";
import { Toast } from "./Toast";
import { useEventMembers } from "./useEventMembers";
import { useLetterStudio } from "./useLetterStudio";

/**
 * /events 配下の共有シェル。LetterStudio の state を1回だけ生成して Context で
 * 配り、画面をまたぐ chrome(ヘッダー・各モーダル・設定ドロワー・トースト)を
 * 一元描画する。個々の画面(Home/Project/Editor)は各ルートの `children`。
 */
export function StudioShell({ children }: { children: ReactNode }) {
  const api = useLetterStudio();
  const { state, hydrated, curProject, cardConf, escortConf } = api;
  // ドロワーはタブを切り替えても閉じてもアンマウントされるので、メンバー情報は
  // ここで保持する。開いた時点(既定は「基本」タブ)で先読みしておき、
  // 「メンバー」を押したときには出来上がっている状態にする。
  const members = useEventMembers(curProject?.id ?? null, state.settingsTab !== null);

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
              userPhoto={state.userPhoto}
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
                members={members}
                onLeaveEvent={() => {
                  api.closeSettings();
                  api.goHome();
                }}
              />
            )}

            {curProject && state.addModal && (
              <BulkAddModal
                onCancel={api.closeBulkAdd}
                onCreate={api.createLettersBulk}
                creating={api.creatingBulk}
                cardEnabled={!!cardConf?.enabled}
                escortEnabled={!!escortConf?.enabled}
              />
            )}

            {/* 確認タブ・一覧から開く 1 通ぶんの編集、および「お手紙を作る」の新規作成。
                同じドロワーを使い、新規作成モードはヘッダー表示だけが変わる。
                中身が伏せられたお手紙は、直せる対象(席札・エスコート)が残っている
                ときだけ開ける。 */}
            {curProject &&
              cardConf &&
              escortConf &&
              (state.editLetter || state.creatingLetter) &&
              (!state.editLetter?.hidden || cardConf.enabled || escortConf.enabled) && (
                <LetterEditDrawer
                  letter={state.editLetter}
                  // 前後移動の対象。席札・エスコートのどちらかが有効なら伏せられた
                  // お手紙も開けるので全件、どちらも無効なら開ける分だけに絞る。
                  letters={
                    cardConf.enabled || escortConf.enabled ? state.letters : state.visibleLetters
                  }
                  project={curProject}
                  cardConf={cardConf}
                  escortConf={escortConf}
                  tab={state.edTab}
                  onTabChange={api.setEdTab}
                  onSelectLetter={(id) => api.openLetterDrawer(id, state.edTab)}
                  onClose={api.closeLetterDrawer}
                  onSave={api.bulkSaveLetters}
                  onCreate={api.createLetterFromDrawer}
                  saving={api.savingBulk}
                  letterUrl={api.letterUrl}
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
            footText={cardConf.nameOverride.trim() || curProject.name}
            date={curProject.date || ""}
            qrUrl={api.letterUrl(state.qrModal.id)}
            cardRef={api.cardRef}
            onSaveImage={api.saveCard}
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
            photo={state.escortModal.escortPhoto || escortConf.defaultPhoto || ""}
            footText={escortConf.nameOverride.trim() || curProject.name}
            cardRef={api.escortCardRef}
            onSaveImage={api.saveEscortCard}
            onClose={() => api.setEscortModal(null)}
          />
        )}

        {state.toastMsg && <Toast message={state.toastMsg} />}
      </div>
    </StudioProvider>
  );
}
