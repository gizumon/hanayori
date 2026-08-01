"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog";
import { FONTS, THEMES } from "./constants";
import { CropModal } from "./CropModal";
import { CardFields, EscortFields, LetterFields } from "./EditorFields";
import { EscortCardFace } from "./EscortCardFace";
import { cardNameFor, escortGeom, escortNameFor, geom } from "./geometry";
import styles from "./letter-studio.module.css";
import { LetterPreviewFace } from "./LetterPreviewFace";
import { QrCardFace } from "./QrCardFace";
import type { BulkLetterPatch, CardConfig, EditorTab, EscortConfig, Letter, Project } from "./types";
import { useUnsavedGuard } from "./useUnsavedGuard";
import { useScrollLock } from "@/hooks/useScrollLock";
import { FONT_SIZE } from "@/lib/typography";

/** ドロワーで編集できるフィールド。「新規作成」画面と揃えている(本文写真は未実装)。 */
const EDITABLE = [
  "to",
  "body",
  "theme",
  "cardName",
  "honor",
  "tableNo",
  "escortName",
  "escortMessage",
  "escortHonor",
  "escortPhoto",
  "escortPhotoRatio",
] as const;

interface LetterEditDrawerProps {
  letter: Letter;
  /** 前後移動の順序。確認タブ・一覧の並びをそのまま渡す。 */
  letters: Letter[];
  project: Project;
  cardConf: CardConfig;
  escortConf: EscortConfig;
  tab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
  onSelectLetter: (id: string) => void;
  onClose: () => void;
  onSave: (patches: BulkLetterPatch[]) => Promise<boolean>;
  saving: boolean;
  letterUrl: (id: string) => string;
}

/**
 * 1 通ぶんをその場で直すドロワー。確認タブやお手紙一覧から、見ていた対象
 * (お手紙 / 席札 / エスコート)のタブが選ばれた状態で開く。編集画面へ遷移せずに
 * プレビューを見ながら直し、「保存して次へ」で連続処理できる。
 */
export function LetterEditDrawer({
  letter,
  letters,
  project,
  cardConf,
  escortConf,
  tab,
  onTabChange,
  onSelectLetter,
  onClose,
  onSave,
  saving,
  letterUrl,
}: LetterEditDrawerProps) {
  const [local, setLocal] = useState<Letter>(letter);
  const [saved, setSaved] = useState<Letter>(letter);
  // 対象が変わったら作業コピーを差し替える(render 中の派生。effect は不要)。
  const [seedId, setSeedId] = useState(letter.id);
  if (seedId !== letter.id) {
    setSeedId(letter.id);
    setLocal(letter);
    setSaved(letter);
  }

  const changed = EDITABLE.filter((k) => (local[k] ?? null) !== (saved[k] ?? null));
  const dirty = changed.length > 0;
  const { guard, pendingConfirm, confirmLeave, cancelLeave } = useUnsavedGuard(dirty);
  useScrollLock();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") guard(onClose);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  });

  const set = (patch: Partial<Letter>) => setLocal((l) => ({ ...l, ...patch }));

  // エスコート写真: アップロードしたらまずクロップし、確定でその場のドラフト(local)に入れる。
  // 実際の Storage アップロードは「新規作成」画面と同じく保存時に行う(persist -> onSave)。
  const [escortCropSrc, setEscortCropSrc] = useState<string | null>(null);
  const pickEscortPhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setEscortCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  };
  const applyEscortCrop = (dataUrl: string, ratio: number) => {
    set({ escortPhoto: dataUrl, escortPhotoRatio: ratio });
    setEscortCropSrc(null);
  };

  const index = letters.findIndex((l) => l.id === letter.id);
  const prev = index > 0 ? letters[index - 1] : null;
  const next = index >= 0 && index < letters.length - 1 ? letters[index + 1] : null;

  const theme = THEMES[local.theme];
  const cardEnabled = cardConf.enabled;
  const escortEnabled = escortConf.enabled;
  const tabs: { key: EditorTab; label: string }[] = [
    { key: "letter", label: "お手紙" },
    ...(cardEnabled ? [{ key: "card" as const, label: "席札" }] : []),
    ...(escortEnabled ? [{ key: "escort" as const, label: "エスコート" }] : []),
  ];
  // 無効化された対象のタブが URL に残っていても、お手紙にフォールバックする。
  const curTab = tabs.some((t) => t.key === tab) ? tab : "letter";

  /** 変更のあったフィールドだけをパッチにする。 */
  async function persist(): Promise<boolean> {
    if (!dirty) return true;
    const patch: Record<string, unknown> = { id: local.id };
    changed.forEach((k) => {
      patch[k] = local[k] ?? null;
    });
    const ok = await onSave([patch as BulkLetterPatch]);
    if (ok) setSaved(local);
    return ok;
  }

  async function saveAndNext() {
    const ok = await persist();
    if (!ok) return;
    if (next) onSelectLetter(next.id);
    else onClose();
  }

  function goto(target: Letter | null) {
    if (!target) return;
    guard(() => onSelectLetter(target.id));
  }

  return (
    <>
      <div className={styles.drawerBackdrop} onClick={() => guard(onClose)} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="お手紙を直す"
        className={styles.drawerPanel}
      >
        <span aria-hidden="true" className={styles.drawerGrabber} />
        {/* ヘッダー: 対象名 + 前後移動 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "13px 16px",
            borderBottom: "1px solid #F2E6EB",
            flex: "none",
          }}
        >
          <button
            type="button"
            onClick={() => guard(onClose)}
            aria-label="閉じる"
            className={styles.btnOutline}
            style={iconBtn}
          >
            <X size={15} strokeWidth={1.8} aria-hidden="true" />
          </button>
          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: FONT_SIZE.heading,
              fontWeight: 600,
              letterSpacing: "0.08em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {local.to.trim() || "(宛名未設定)"}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "none" }}>
            <button
              type="button"
              onClick={() => goto(prev)}
              disabled={!prev}
              aria-label="前のお手紙"
              className={styles.btnOutline}
              style={{ ...iconBtn, opacity: prev ? 1 : 0.35, cursor: prev ? "pointer" : "default" }}
            >
              ‹
            </button>
            <span
              style={{
                fontSize: FONT_SIZE.caption,
                color: "#8C7676",
                fontVariantNumeric: "tabular-nums",
                minWidth: 52,
                textAlign: "center",
              }}
            >
              {index + 1} / {letters.length}
            </span>
            <button
              type="button"
              onClick={() => goto(next)}
              disabled={!next}
              aria-label="次のお手紙"
              className={styles.btnOutline}
              style={{ ...iconBtn, opacity: next ? 1 : 0.35, cursor: next ? "pointer" : "default" }}
            >
              ›
            </button>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* 対象タブ(編集画面と同じ並び) */}
          {tabs.length > 1 && (
            <div
              style={{
                display: "flex",
                gap: 4,
                background: "rgba(211,165,180,0.16)",
                borderRadius: 999,
                padding: 4,
                alignSelf: "flex-start",
                flexWrap: "wrap",
              }}
            >
              {tabs.map((t) => {
                const active = t.key === curTab;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => onTabChange(t.key)}
                    aria-pressed={active}
                    style={{
                      padding: "8px 18px",
                      borderRadius: 999,
                      border: "none",
                      cursor: "pointer",
                      fontSize: FONT_SIZE.bodySm,
                      letterSpacing: "0.08em",
                      background: active ? "#FFFCF8" : "transparent",
                      color: active ? "#5C4A4A" : "#A38A93",
                      fontWeight: active ? 600 : 400,
                      boxShadow: active ? "0 2px 8px rgba(150,110,130,0.18)" : "none",
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* プレビュー */}
          {curTab === "letter" && (
            <LetterPreviewFace
              to={local.to}
              body={local.body}
              photo={local.photo}
              photoRatio={local.photoRatio}
              date={project.date}
              font={FONTS[project.letterConfig.font].family}
              theme={theme}
              padding="20px 16px"
            />
          )}
          {curTab === "card" && (
            <div style={previewStage(theme)}>
              <QrCardFace
                width="min(340px,100%)"
                aspect={geom(cardConf, theme.rule).aspect}
                paper={theme.paper}
                accent={theme.accent}
                gold={theme.gold}
                ink={theme.ink}
                inkSoft={theme.inkSoft}
                font={FONTS[cardConf.font].family}
                frame={cardConf.frame}
                geometry={geom(cardConf, theme.rule)}
                cardName={cardNameFor(local, cardConf)}
                heading={cardConf.heading}
                note={cardConf.note}
                footText={cardConf.nameOverride.trim() || project.name}
                date={project.date || ""}
                qrUrl={letterUrl(local.id)}
                boxShadow="0 14px 40px rgba(150,110,130,0.22)"
              />
            </div>
          )}
          {curTab === "escort" && (
            <div style={previewStage(theme)}>
              <EscortCardFace
                style={escortConf.style}
                width={escortConf.style === "card" ? "min(280px,100%)" : "min(420px,100%)"}
                aspect={escortGeom(escortConf.style).aspect}
                paper={theme.paper}
                accent={theme.accent}
                gold={theme.gold}
                ink={theme.ink}
                inkSoft={theme.inkSoft}
                font={FONTS[escortConf.font].family}
                name={escortNameFor(local, escortConf)}
                tableNo={local.tableNo || ""}
                tableLabel={escortConf.tableLabel}
                heading={escortConf.heading}
                message={local.escortMessage || ""}
                photo={local.escortPhoto || escortConf.defaultPhoto || ""}
                footText={escortConf.nameOverride.trim() || project.name}
                boxShadow="0 14px 40px rgba(150,110,130,0.22)"
              />
            </div>
          )}

          {/* 入力欄(「新規作成」画面と共通のフィールド) */}
          {curTab === "letter" && (
            <LetterFields value={local} onChange={set} font={FONTS[project.letterConfig.font].family} bodyRows={9} />
          )}

          {curTab === "card" && <CardFields value={local} onChange={set} cardConf={cardConf} />}

          {curTab === "escort" && (
            <EscortFields
              value={local}
              onChange={set}
              escortConf={escortConf}
              onUploadPhoto={pickEscortPhoto}
              onRemovePhoto={() => set({ escortPhoto: null, escortPhotoRatio: undefined })}
            />
          )}
        </div>

        {/* フッター */}
        <div
          style={{
            flex: "none",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
            borderTop: "1px solid #F2E6EB",
          }}
        >
          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: FONT_SIZE.caption,
              color: dirty ? "#C98A3F" : "#B4A2A2",
              letterSpacing: "0.04em",
            }}
          >
            {dirty ? "未保存の変更があります" : "変更はありません"}
          </span>
          <button
            type="button"
            onClick={() => void saveAndNext()}
            disabled={saving}
            className={styles.btnSolid}
            style={{
              padding: "11px 22px",
              borderRadius: 999,
              border: "none",
              background: "#D3A5B4",
              color: "#FFF9F5",
              fontSize: FONT_SIZE.bodySm,
              letterSpacing: "0.06em",
              boxShadow: "0 6px 16px rgba(211,165,180,0.4)",
              opacity: saving ? 0.6 : 1,
              cursor: saving ? "default" : "pointer",
            }}
          >
            {saving ? "保存中…" : next ? "保存して次へ →" : "保存して閉じる"}
          </button>
        </div>
      </aside>

      {pendingConfirm && (
        <ConfirmDialog
          message="保存していない変更があります。このまま移動すると、直した内容は失われます。"
          onStay={cancelLeave}
          onLeave={confirmLeave}
        />
      )}

      {escortCropSrc && (
        <CropModal
          src={escortCropSrc}
          // チケット風は写真帯(半券45mmを除いた137mmの31% × 全高65mm = 42.5×65mm)、カード風は正円用に 1:1
          aspect={escortConf.style === "card" ? 1 : 0.653}
          onCancel={() => setEscortCropSrc(null)}
          onApply={applyEscortCrop}
        />
      )}
    </>
  );
}

const iconBtn = {
  width: 32,
  height: 32,
  borderRadius: "50%",
  border: "1px solid #EBD9DF",
  background: "#FFFFFF",
  color: "#5C4A4A",
  fontSize: FONT_SIZE.bodySm,
  lineHeight: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  flex: "none",
} as const;

function previewStage(theme: (typeof THEMES)[keyof typeof THEMES]) {
  return {
    borderRadius: 16,
    background: `linear-gradient(175deg, ${theme.bg1} 0%, ${theme.g1} 55%, ${theme.g2} 100%)`,
    padding: "22px 16px",
    display: "flex",
    justifyContent: "center",
  } as const;
}
