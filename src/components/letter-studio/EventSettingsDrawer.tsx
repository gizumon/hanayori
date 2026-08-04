"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog";
import { DatePicker } from "@/components/DatePicker";
import { FONTS, THEMES } from "./constants";
import { FontSelect, PillButton, Toggle, fieldStyle } from "./controls";
import { isoToJaDate, jaDateToIso } from "@/lib/date";
import { escortGeom, geom } from "./geometry";
import { EscortCardFace } from "./EscortCardFace";
import { CropModal } from "./CropModal";
import { MembersTab } from "./MembersTab";
import { useStudio } from "./StudioContext";
import { uploadIfDataUrl } from "./uploadImage";
import { QrCardFace } from "./QrCardFace";
import { withAlpha } from "@/lib/color";
import styles from "./letter-studio.module.css";
import type {
  CardConfig,
  CardFrame,
  CardOrient,
  EscortConfig,
  EscortStyle,
  EventSettingsPatch,
  FontKey,
  Honor,
  Project,
  SettingsTab,
} from "./types";
import type { EventMembersApi } from "./useEventMembers";
import { useUnsavedGuard } from "./useUnsavedGuard";
import { useScrollLock } from "@/hooks/useScrollLock";
import { FONT_SIZE } from "@/lib/typography";
import { COLOR } from "@/lib/palette";

interface EventSettingsForm {
  name: string;
  date: string | null;
  letterFont: FontKey;
  card: CardConfig;
  escort: EscortConfig;
}

function formOf(project: Project): EventSettingsForm {
  return {
    name: project.name,
    date: project.date,
    letterFont: project.letterConfig.font,
    card: { ...project.cardConfig },
    escort: { ...project.escortConfig },
  };
}

interface EventSettingsDrawerProps {
  project: Project;
  tab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  onClose: () => void;
  onSave: (patch: EventSettingsPatch) => Promise<boolean>;
  /** メンバータブの中身。ドロワーより上(StudioShell)で保持して先読みしてある。 */
  members: EventMembersApi;
  /** メンバータブで自分が退出したとき。ドロワーを閉じてイベント一覧へ戻す。 */
  onLeaveEvent: () => void;
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

const ESCORT_STYLE_OPTS: { key: EscortStyle; label: string }[] = [
  { key: "ticket", label: "チケット風" },
  { key: "card", label: "カード風" },
];

const sectionLabel = {
  fontSize: FONT_SIZE.caption,
  letterSpacing: "0.1em",
  color: COLOR.inkSoft,
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
  members,
  onLeaveEvent,
}: EventSettingsDrawerProps) {
  const { toast } = useStudio();
  const [local, setLocal] = useState<EventSettingsForm>(() => formOf(project));
  const [saved, setSaved] = useState<EventSettingsForm>(() => formOf(project));
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(local) !== JSON.stringify(saved);
  const { guard, pendingConfirm, confirmLeave, cancelLeave } = useUnsavedGuard(dirty);
  useScrollLock();

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

  const setEscort = (patch: Partial<EscortConfig>) =>
    setLocal((s) => ({ ...s, escort: { ...s.escort, ...patch } }));

  // 既定写真: アップロードしたらまずクロップし、確定でドラフト(data URL)に入れて
  // プレビューする。実際の Storage アップロードは手紙と同様「設定を保存」時に行う。
  const [escortCropSrc, setEscortCropSrc] = useState<string | null>(null);

  const pickEscortDefaultPhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setEscortCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const applyEscortDefaultCrop = (dataUrl: string, ratio: number) => {
    setEscort({ defaultPhoto: dataUrl, defaultPhotoRatio: ratio });
    setEscortCropSrc(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 既定写真が data URL(未アップロード)なら Storage に上げて URL 化する。
      const defaultPhoto = await uploadIfDataUrl(local.escort.defaultPhoto);
      const escort = { ...local.escort, defaultPhoto };
      const ok = await onSave({
        name: local.name,
        date: local.date,
        letterConfig: { font: local.letterFont },
        cardConfig: local.card,
        escortConfig: escort,
      });
      // 保存が通ったら、確定した URL をローカルにも反映して dirty を解消する。
      if (ok) {
        const next = { ...local, escort };
        setLocal(next);
        setSaved(next);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "保存に失敗しました");
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
  const previewName = "Hanako Yamada";
  const escortPreviewGeom = escortGeom(local.escort.style);
  const escortPreviewName = "Hanako Yamada";

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
            padding: "14px 22px 0",
          }}
        >
          <h2 style={{ margin: 0, fontSize: FONT_SIZE.heading, fontWeight: 600, letterSpacing: "0.14em" }}>
            共通設定
          </h2>
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
              border: `1px solid ${COLOR.border}`,
              background: COLOR.surfaceRaised,
              color: COLOR.inkSoft,
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
          className={styles.noScrollbar}
          style={{
            display: "flex",
            flexWrap: "nowrap",
            gap: 4,
            overflowX: "auto",
            // 横帯の上では縦に動かさない(指の縦ぶれでドロワーごと動くのを防ぐ)
            overflowY: "hidden",
            touchAction: "pan-x",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
            borderBottom: "1px solid rgba(211,165,180,0.3)",
            padding: "8px 22px 0",
          }}
        >
          {/* ラベルは 4 つが狭い画面でも同時に見えるよう短く保つ
              (「メンバー」が隠れると、あることに気づけない) */}
          {(
            [
              ["general", "基本"],
              ["card", "席札・QR"],
              ["escort", "エスコート"],
              ["members", "メンバー"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => onTabChange(k)}
              style={{
                padding: "8px 10px",
                border: "none",
                background: "none",
                cursor: "pointer",
                fontSize: FONT_SIZE.bodySm,
                letterSpacing: "0.08em",
                color: tab === k ? COLOR.ink : COLOR.accentInk,
                fontWeight: tab === k ? 600 : 400,
                borderBottom: tab === k ? `2px solid ${COLOR.accent}` : "2px solid transparent",
                marginBottom: -1,
                whiteSpace: "nowrap",
                flexShrink: 0,
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
            padding: "16px 22px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
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
                  style={fieldStyle({ fontSize: FONT_SIZE.input })}
                />
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={sectionLabel}>挙式日</span>
                <div style={{ maxWidth: 260 }}>
                  <DatePicker
                    value={jaDateToIso(local.date)}
                    onChange={(iso) => setLocal((s) => ({ ...s, date: iso ? isoToJaDate(iso) : null }))}
                  />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={sectionLabel}>お手紙のフォント</span>
                <FontSelect
                  value={local.letterFont}
                  onChange={(letterFont) => setLocal((s) => ({ ...s, letterFont }))}
                  sample="今日は来てくれてありがとう"
                />
              </div>
              {/* プレビューはどのタブでも一番下(タブを切り替えても位置が動かない) */}
              <div
                style={{
                  borderRadius: 14,
                  overflow: "hidden",
                  background: `linear-gradient(175deg, ${theme.bg1} 0%, ${theme.g1} 55%, ${theme.g2} 100%)`,
                  padding: "18px 14px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: "min(280px,100%)",
                    background: theme.paper,
                    padding: "34px 24px 26px",
                    boxShadow: "0 10px 30px rgba(150,110,130,0.22)",
                    position: "relative",
                  }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      inset: 8,
                      border: `1px solid ${withAlpha(theme.accent, 38)}`,
                      pointerEvents: "none",
                    }}
                  />
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      inset: 11,
                      border: `1px solid ${withAlpha(theme.accent, 18)}`,
                      pointerEvents: "none",
                    }}
                  />
                  <div aria-hidden="true" style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                    <svg
                      viewBox="0 0 120 28"
                      fill="none"
                      stroke={theme.gold}
                      strokeWidth="1.1"
                      strokeLinecap="round"
                      style={{ width: 96, height: 22, opacity: 0.9 }}
                    >
                      <path d="M14 15 H44 M76 15 H106" />
                      <path
                        d="M60 7.5 C56.8 11 56.8 17.5 60 21.5 C63.2 17.5 63.2 7.5 60 7.5 Z"
                        fill={theme.gold}
                        stroke="none"
                        opacity="0.8"
                      />
                      <path d="M50 15 C53 13 55.5 13 58 14.2 M70 15 C67 13 64.5 13 62 14.2" />
                      <circle cx="48" cy="15" r="1.3" fill={theme.gold} stroke="none" />
                      <circle cx="72" cy="15" r="1.3" fill={theme.gold} stroke="none" />
                    </svg>
                  </div>
                  <div
                    style={{
                      fontFamily: FONTS[local.letterFont].family,
                      fontSize: FONT_SIZE.title,
                      letterSpacing: "0.16em",
                      color: theme.ink,
                      textAlign: "center",
                      marginBottom: 14,
                    }}
                  >
                    はなこへ
                  </div>
                  <div
                    style={{
                      fontFamily: FONTS[local.letterFont].family,
                      fontSize: FONT_SIZE.body,
                      lineHeight: "2.3em",
                      letterSpacing: "0.06em",
                      color: theme.ink,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    今日は来てくれてありがとう。
                    {"\n"}おかげさまで、とても幸せな一日になりました。
                  </div>
                  <div
                    style={{
                      fontFamily: FONTS[local.letterFont].family,
                      fontSize: FONT_SIZE.label,
                      letterSpacing: "0.18em",
                      color: theme.inkSoft,
                      textAlign: "center",
                      marginTop: 16,
                    }}
                  >
                    {local.date || "2025年10月10日"}
                  </div>
                </div>
                <span style={{ fontSize: FONT_SIZE.micro, color: COLOR.inkMuted, letterSpacing: "0.05em" }}>
                  プレビュー(本文はお手紙ごとに入ります)
                </span>
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
                  <label style={{ display: "flex", flexDirection: "column", gap: 6, ...sectionLabel }}>
                    イベント名(空欄でイベント名を使用)
                    <input
                      value={local.card.nameOverride}
                      onChange={(e) => setCard({ nameOverride: e.target.value })}
                      placeholder={local.name}
                      className={styles.field}
                      style={fieldStyle()}
                    />
                  </label>
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
                    <FontSelect
                      value={local.card.font}
                      onChange={(font) => setCard({ font })}
                      sample="Hanako Yamada"
                    />
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
                      style={fieldStyle({ fontSize: FONT_SIZE.input, lineHeight: 1.7, resize: "vertical" })}
                    />
                  </label>
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
                      footText={local.card.nameOverride.trim() || local.name}
                      date={local.date || ""}
                      qrUrl=""
                      boxShadow="0 10px 30px rgba(150,110,130,0.22)"
                    />
                    <span style={{ fontSize: FONT_SIZE.micro, color: COLOR.inkMuted, letterSpacing: "0.05em" }}>
                      プレビュー(名前はお手紙ごとに入ります) ・ 実寸 {previewGeom.sizeLabel}
                    </span>
                  </div>
                </>
              )}
            </>
          )}

          {tab === "escort" && (
            <>
              <Toggle
                checked={local.escort.enabled}
                onChange={(enabled) => setEscort({ enabled })}
                label="エスコートカードを作成する"
              />
              {local.escort.enabled && (
                <>
                  <label style={{ display: "flex", flexDirection: "column", gap: 6, ...sectionLabel }}>
                    イベント名(空欄でイベント名を使用)
                    <input
                      value={local.escort.nameOverride}
                      onChange={(e) => setEscort({ nameOverride: e.target.value })}
                      placeholder={local.name}
                      className={styles.field}
                      style={fieldStyle()}
                    />
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span style={sectionLabel}>スタイル</span>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {ESCORT_STYLE_OPTS.map((o) => (
                        <PillButton
                          key={o.key}
                          label={o.label}
                          size="sm"
                          active={local.escort.style === o.key}
                          onClick={() => setEscort({ style: o.key })}
                        />
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span style={sectionLabel}>既定の写真(お手紙ごとに変更できます)</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <label
                        className={styles.btnOutline}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "9px 18px",
                          borderRadius: 999,
                          border: `1px solid ${COLOR.border}`,
                          background: COLOR.surfaceRaised,
                          color: COLOR.ink,
                          fontSize: FONT_SIZE.label,
                          letterSpacing: "0.06em",
                          cursor: "pointer",
                        }}
                      >
                        {local.escort.defaultPhoto ? "写真を変更" : "写真を選ぶ"}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) pickEscortDefaultPhoto(file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      {local.escort.defaultPhoto && (
                        <button
                          type="button"
                          onClick={() => setEscort({ defaultPhoto: null, defaultPhotoRatio: null })}
                          className={styles.btnGhost}
                          style={{
                            padding: "9px 14px",
                            borderRadius: 999,
                            border: "none",
                            background: "transparent",
                            color: COLOR.danger,
                            fontSize: FONT_SIZE.label,
                            letterSpacing: "0.06em",
                            cursor: "pointer",
                          }}
                        >
                          削除
                        </button>
                      )}
                    </div>
                    <span style={{ fontSize: FONT_SIZE.overline, color: COLOR.inkFaint, letterSpacing: "0.05em" }}>
                      アップロード時に切り取り位置を選べます。お手紙で個別に写真を設定するとそちらが優先されます。
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span style={sectionLabel}>敬称(お手紙ごとに変更できます)</span>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {HONOR_OPTS.map((o) => (
                        <PillButton
                          key={o.key}
                          label={o.label}
                          size="sm"
                          active={local.escort.honor === o.key}
                          onClick={() => setEscort({ honor: o.key })}
                        />
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span style={sectionLabel}>エスコートカードのフォント</span>
                    <FontSelect
                      value={local.escort.font}
                      onChange={(font) => setEscort({ font })}
                      sample="Yamada Hanako"
                    />
                  </div>
                  <label style={{ display: "flex", flexDirection: "column", gap: 6, ...sectionLabel }}>
                    見出し(チケット風で表示)
                    <input
                      value={local.escort.heading}
                      onChange={(e) => setEscort({ heading: e.target.value })}
                      placeholder="WELCOME TO OUR WEDDING"
                      className={styles.field}
                      style={fieldStyle()}
                    />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 6, ...sectionLabel }}>
                    卓番ラベル
                    <input
                      value={local.escort.tableLabel}
                      onChange={(e) => setEscort({ tableLabel: e.target.value })}
                      placeholder="TABLE"
                      className={styles.field}
                      style={fieldStyle()}
                    />
                  </label>
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
                    <EscortCardFace
                      style={local.escort.style}
                      width={`min(${local.escort.style === "card" ? 220 : 360}px,100%)`}
                      aspect={escortPreviewGeom.aspect}
                      paper={theme.paper}
                      accent={theme.accent}
                      gold={theme.gold}
                      ink={theme.ink}
                      inkSoft={theme.inkSoft}
                      font={FONTS[local.escort.font].family}
                      name={escortPreviewName}
                      tableNo="A"
                      tableLabel={local.escort.tableLabel}
                      heading={local.escort.heading}
                      message=""
                      photo={local.escort.defaultPhoto || ""}
                      footText={local.escort.nameOverride.trim() || local.name}
                      boxShadow="0 10px 30px rgba(150,110,130,0.22)"
                    />
                    <span style={{ fontSize: FONT_SIZE.micro, color: COLOR.inkMuted, letterSpacing: "0.05em" }}>
                      プレビュー(卓番・名前はお手紙ごとに入ります) ・ 実寸 {escortPreviewGeom.sizeLabel}
                    </span>
                  </div>
                </>
              )}
            </>
          )}

          {tab === "members" && (
            <MembersTab project={project} members={members} onLeaveEvent={onLeaveEvent} />
          )}
        </div>

        {/* メンバータブの操作は即時反映なので保存バーは出さない。ただし他タブに
            未保存の変更が残っている場合だけは、見失わないように出したままにする。 */}
        {(tab !== "members" || dirty) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            padding: "8px 22px calc(9px + env(safe-area-inset-bottom))",
            borderTop: "1px solid rgba(211,165,180,0.3)",
            background: COLOR.surface,
          }}
        >
          {/* 主ボタンは右端。他のモーダル・ドロワーと同じ並びに揃えている。 */}
          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: FONT_SIZE.caption,
              color: COLOR.danger,
              letterSpacing: "0.05em",
            }}
          >
            {dirty && "未保存の変更があります"}
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            className={styles.btnSolid}
            style={{
              flex: "none",
              padding: "9px 26px",
              borderRadius: 999,
              border: "none",
              background: dirty ? COLOR.accent : COLOR.accentOff,
              color: COLOR.onAccent,
              fontSize: FONT_SIZE.bodySm,
              letterSpacing: "0.08em",
              cursor: dirty && !saving ? "pointer" : "default",
            }}
          >
            {saving ? "保存中…" : "設定を保存"}
          </button>
        </div>
        )}
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
      {escortCropSrc && (
        <CropModal
          src={escortCropSrc}
          // チケット風は写真帯(半券45mmを除いた137mmの31% × 全高65mm = 42.5×65mm)、カード風は正円用に 1:1
          aspect={local.escort.style === "card" ? 1 : 0.653}
          onCancel={() => setEscortCropSrc(null)}
          onApply={applyEscortDefaultCrop}
        />
      )}
    </>
  );
}
