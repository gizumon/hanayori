"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog";
import { FONTS, THEMES } from "./constants";
import { FontOptionRow, PillButton, Toggle, fieldStyle } from "./controls";
import { isoToJaDate, jaDateToIso } from "@/lib/date";
import { cardNameFor, geom } from "./geometry";
import { QrCardFace } from "./QrCardFace";
import styles from "./letter-studio.module.css";
import type {
  CardConfig,
  CardFrame,
  CardOrient,
  EventSettingsPatch,
  FontKey,
  Honor,
  Project,
  SettingsTab,
} from "./types";
import { useUnsavedGuard } from "./useUnsavedGuard";

interface EventSettingsForm {
  name: string;
  date: string | null;
  letterFont: FontKey;
  card: CardConfig;
}

function formOf(project: Project): EventSettingsForm {
  return {
    name: project.name,
    date: project.date,
    letterFont: project.letterConfig.font,
    card: { ...project.cardConfig },
  };
}

interface EventSettingsDrawerProps {
  project: Project;
  tab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  onClose: () => void;
  onSave: (patch: EventSettingsPatch) => Promise<boolean>;
}

const ORIENT_OPTS: { key: CardOrient; label: string }[] = [
  { key: "landscape", label: "横(91×55)" },
  { key: "portrait", label: "縦(55×91)" },
  { key: "tent-l", label: "二つ折り 横(91×110)" },
  { key: "tent-p", label: "二つ折り 縦(110×91)" },
];

const FRAME_OPTS: { key: CardFrame; label: string }[] = [
  { key: "line", label: "ライン" },
  { key: "frame", label: "フレーム" },
  { key: "minimal", label: "ミニマル" },
];

const HONOR_OPTS: { key: Honor; label: string }[] = [
  { key: "様", label: "様" },
  { key: "さん", label: "さん" },
  { key: "", label: "なし" },
];

const sectionLabel = {
  fontSize: 12,
  letterSpacing: "0.1em",
  color: "#8C7676",
} as const;

/**
 * イベント全体の共通設定(基本 + 席札/QRカード)。どの画面の上にも重ねて開ける。
 * 入力はローカルにバッファし「設定を保存」でまとめて 1 回だけ PATCH する。
 */
export function EventSettingsDrawer({
  project,
  tab,
  onTabChange,
  onClose,
  onSave,
}: EventSettingsDrawerProps) {
  const [local, setLocal] = useState<EventSettingsForm>(() => formOf(project));
  const [saved, setSaved] = useState<EventSettingsForm>(() => formOf(project));
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(local) !== JSON.stringify(saved);
  const { guard, pendingConfirm, confirmLeave, cancelLeave } = useUnsavedGuard(dirty);

  const requestClose = () => guard(onClose);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  });

  const setCard = (patch: Partial<CardConfig>) =>
    setLocal((s) => ({ ...s, card: { ...s.card, ...patch } }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const ok = await onSave({
        name: local.name,
        date: local.date,
        letterConfig: { font: local.letterFont },
        cardConfig: local.card,
      });
      if (ok) setSaved(local);
    } finally {
      setSaving(false);
    }
  };

  const handleLeave = () => {
    // 破棄を選んだので閉じる前に保存済みの状態へ戻す(次に開いたとき用の見た目も揃う)
    setLocal(saved);
    confirmLeave();
  };

  const theme = THEMES.rose;
  const previewGeom = geom(local.card, theme.rule);
  const previewName = cardNameFor(null, local.card);
  const hasDate = local.date !== null;

  return (
    <>
      <div className={styles.drawerBackdrop} onClick={requestClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="共通設定"
        className={styles.drawerPanel}
      >
        <div className={styles.drawerGrabber} aria-hidden="true" />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "18px 22px 0",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, letterSpacing: "0.14em" }}>
              共通設定
            </h2>
            <p style={{ margin: "3px 0 0", fontSize: 11, color: "#B4A2A2", letterSpacing: "0.06em" }}>
              「{project.name}」全体・すべてのお手紙とカードに適用されます
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label="閉じる"
            className={styles.btnOutline}
            style={{
              flex: "none",
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "1px solid #EBD9DF",
              background: "#FFFFFF",
              color: "#8C7676",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            <X size={15} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            borderBottom: "1px solid rgba(211,165,180,0.3)",
            padding: "10px 22px 0",
          }}
        >
          {(
            [
              ["general", "基本"],
              ["card", "席札 / QRカード"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => onTabChange(k)}
              style={{
                padding: "10px 14px",
                border: "none",
                background: "none",
                cursor: "pointer",
                fontSize: 13,
                letterSpacing: "0.08em",
                color: tab === k ? "#5C4A4A" : "#B08A99",
                fontWeight: tab === k ? 600 : 400,
                borderBottom: tab === k ? "2px solid #D3A5B4" : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 22px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {tab === "general" && (
            <>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, ...sectionLabel }}>
                イベント名
                <input
                  value={local.name}
                  onChange={(e) => setLocal((s) => ({ ...s, name: e.target.value }))}
                  className={styles.field}
                  style={fieldStyle({ fontSize: 16 })}
                />
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={sectionLabel}>挙式日</span>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <input
                    type="date"
                    value={jaDateToIso(local.date)}
                    onChange={(e) =>
                      setLocal((s) => ({ ...s, date: isoToJaDate(e.target.value) }))
                    }
                    disabled={!hasDate}
                    className={styles.field}
                    style={fieldStyle({
                      flex: 1,
                      minWidth: 160,
                      fontSize: 16,
                      background: hasDate ? "#FFFFFF" : "#F2ECEC",
                    })}
                  />
                  <Toggle
                    checked={hasDate}
                    onChange={(v) => setLocal((s) => ({ ...s, date: v ? s.date ?? "" : null }))}
                    label="日付を設定する"
                  />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={sectionLabel}>お手紙のフォント</span>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    border: "1px solid #EBD9DF",
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "#FFFFFF",
                  }}
                >
                  {(Object.keys(FONTS) as FontKey[]).map((k) => (
                    <FontOptionRow
                      key={k}
                      label={FONTS[k].label}
                      family={FONTS[k].family}
                      sample="今日は来てくれてありがとう"
                      active={local.letterFont === k}
                      onClick={() => setLocal((s) => ({ ...s, letterFont: k }))}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === "card" && (
            <>
              <Toggle
                checked={local.card.enabled}
                onChange={(enabled) => setCard({ enabled })}
                label="席札 / QRカードを作成する"
              />
              {local.card.enabled && (
                <>
                  <div
                    style={{
                      borderRadius: 14,
                      background: `linear-gradient(175deg, ${theme.bg1} 0%, ${theme.g1} 55%, ${theme.g2} 100%)`,
                      padding: "18px 14px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <QrCardFace
                      width={`min(${previewGeom.flexDir === "row" ? 380 : 250}px,100%)`}
                      aspect={previewGeom.aspect}
                      paper={theme.paper}
                      accent={theme.accent}
                      gold={theme.gold}
                      ink={theme.ink}
                      inkSoft={theme.inkSoft}
                      font={FONTS[local.card.font].family}
                      frame={local.card.frame}
                      geometry={previewGeom}
                      cardName={previewName}
                      heading={local.card.heading}
                      note={local.card.note}
                      footText={local.name + (local.date ? ` ・ ${local.date}` : "")}
                      qrUrl=""
                      boxShadow="0 10px 30px rgba(150,110,130,0.22)"
                    />
                    <span style={{ fontSize: 10.5, color: "#A38A93", letterSpacing: "0.05em" }}>
                      プレビュー(名前はお手紙ごとに入ります) ・ 実寸 {previewGeom.sizeLabel}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span style={sectionLabel}>向き</span>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {ORIENT_OPTS.map((o) => (
                        <PillButton
                          key={o.key}
                          label={o.label}
                          size="sm"
                          active={local.card.orient === o.key}
                          onClick={() => setCard({ orient: o.key })}
                        />
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span style={sectionLabel}>デザイン</span>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {FRAME_OPTS.map((o) => (
                        <PillButton
                          key={o.key}
                          label={o.label}
                          size="sm"
                          active={local.card.frame === o.key}
                          onClick={() => setCard({ frame: o.key })}
                        />
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span style={sectionLabel}>敬称(お手紙ごとに変更できます)</span>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {HONOR_OPTS.map((o) => (
                        <PillButton
                          key={o.key}
                          label={o.label}
                          size="sm"
                          active={local.card.honor === o.key}
                          onClick={() => setCard({ honor: o.key })}
                        />
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span style={sectionLabel}>席札のフォント</span>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        border: "1px solid #EBD9DF",
                        borderRadius: 12,
                        overflow: "hidden",
                        background: "#FFFFFF",
                      }}
                    >
                      {(Object.keys(FONTS) as FontKey[]).map((k) => (
                        <FontOptionRow
                          key={k}
                          label={FONTS[k].label}
                          family={FONTS[k].family}
                          sample="さくら 様"
                          active={local.card.font === k}
                          onClick={() => setCard({ font: k })}
                          compact
                        />
                      ))}
                    </div>
                  </div>
                  <label style={{ display: "flex", flexDirection: "column", gap: 6, ...sectionLabel }}>
                    見出し
                    <input
                      value={local.card.heading}
                      onChange={(e) => setCard({ heading: e.target.value })}
                      placeholder="WEDDING RECEPTION"
                      className={styles.field}
                      style={fieldStyle()}
                    />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 6, ...sectionLabel }}>
                    案内文
                    <textarea
                      value={local.card.note}
                      onChange={(e) => setCard({ note: e.target.value })}
                      rows={2}
                      className={styles.field}
                      style={fieldStyle({ fontSize: 16, lineHeight: 1.7, resize: "vertical" })}
                    />
                  </label>
                </>
              )}
            </>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            padding: "14px 22px calc(16px + env(safe-area-inset-bottom))",
            borderTop: "1px solid rgba(211,165,180,0.3)",
            background: "#FFFCF8",
          }}
        >
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            className={styles.btnSolid}
            style={{
              padding: "11px 26px",
              borderRadius: 999,
              border: "none",
              background: dirty ? "#D3A5B4" : "#E3D2D8",
              color: "#FFF9F5",
              fontSize: 13,
              letterSpacing: "0.08em",
              cursor: dirty && !saving ? "pointer" : "default",
            }}
          >
            {saving ? "保存中…" : "設定を保存"}
          </button>
          {dirty && (
            <span style={{ fontSize: 11.5, color: "#B5555F", letterSpacing: "0.05em" }}>
              未保存の変更があります
            </span>
          )}
        </div>
      </aside>
      {pendingConfirm && (
        <ConfirmDialog
          message="保存されていない変更があります。このまま閉じると、変更内容は破棄されます。"
          stayLabel="編集を続ける"
          leaveLabel="保存せずに閉じる"
          onStay={cancelLeave}
          onLeave={handleLeave}
        />
      )}
    </>
  );
}
