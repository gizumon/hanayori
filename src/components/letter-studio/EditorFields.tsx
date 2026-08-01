"use client";

import { THEMES } from "./constants";
import { fieldStyle } from "./controls";
import { cardNameFor, escortNameFor } from "./geometry";
import styles from "./letter-studio.module.css";
import type { CardConfig, Draft, EscortConfig, Honor, Letter } from "./types";
import { FONT_SIZE } from "@/lib/typography";

type FieldChange = (patch: Partial<Letter>) => void;

export const FIELD_LABEL = {
  fontSize: FONT_SIZE.label,
  letterSpacing: "0.1em",
  color: "#8C7676",
} as const;

export const fieldWrap = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
} as const;

export const hintStyle = {
  fontSize: FONT_SIZE.caption,
  color: "#B4A2A2",
  letterSpacing: "0.04em",
} as const;

const HONOR_OPTIONS = (def: Honor): { value: Honor | null; label: string }[] => [
  { value: null, label: `既定(${def || "なし"})` },
  { value: "様", label: "様" },
  { value: "さん", label: "さん" },
  { value: "", label: "なし" },
];

/** 敬称の選択ピル。「既定に従う / 様 / さん / なし」を席札・エスコートで共用する。 */
export function HonorField({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value: Honor | null;
  fallback: Honor;
  onChange: (h: Honor | null) => void;
}) {
  return (
    <div style={fieldWrap}>
      <span style={FIELD_LABEL}>{label}</span>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {HONOR_OPTIONS(fallback).map(({ value: v, label: l }) => {
          const active = value === v;
          return (
            <button
              key={l}
              type="button"
              onClick={() => onChange(v)}
              className={styles.btnOutline}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                fontSize: FONT_SIZE.caption,
                letterSpacing: "0.05em",
                cursor: "pointer",
                background: active ? "#D3A5B4" : "#FFFFFF",
                color: active ? "#FFF9F5" : "#5C4A4A",
                border: active ? "1px solid #D3A5B4" : "1px solid #EBD9DF",
              }}
            >
              {l}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** 「共通設定を開く」への導線ボックス。イベント全体の設定に触れる箇所であることを示す。 */
function SettingsShortcut({
  note,
  buttonLabel,
  onOpen,
}: {
  note: string;
  buttonLabel: string;
  onOpen: () => void;
}) {
  return (
    <div
      style={{
        background: "rgba(255,252,248,0.7)",
        border: "1px dashed #E3CBD4",
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <span style={{ fontSize: FONT_SIZE.caption, color: "#8C7676", letterSpacing: "0.06em", lineHeight: 1.7 }}>
        {note}
      </span>
      <button
        type="button"
        onClick={onOpen}
        className={styles.btnGhost}
        style={{
          alignSelf: "flex-start",
          padding: "9px 18px",
          borderRadius: 999,
          border: "1px solid #D3A5B4",
          background: "transparent",
          color: "#B08A99",
          fontSize: FONT_SIZE.label,
          letterSpacing: "0.06em",
        }}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

interface LetterFieldsProps {
  value: Draft;
  onChange: FieldChange;
  font: string;
  /** イベントの挙式日。渡すと「日付は〜が使われます」の案内を出す。 */
  date?: string | null;
  bodyRows?: number;
}

/** お手紙タブ: 宛名 / 本文 / 色。「新規作成」と「1通ぶんの編集」で共用する。 */
export function LetterFields({ value, onChange, font, date, bodyRows = 9 }: LetterFieldsProps) {
  return (
    <>
      <label style={fieldWrap}>
        <span style={FIELD_LABEL}>宛名</span>
        <input
          value={value.to ?? ""}
          onChange={(e) => onChange({ to: e.target.value })}
          placeholder="はなこへ"
          className={styles.field}
          style={fieldStyle({ padding: "11px 13px", letterSpacing: "0.05em" })}
        />
      </label>
      {date !== undefined && (
        <div style={hintStyle}>日付はイベントの挙式日({date ?? ""})が使われます</div>
      )}
      <div style={fieldWrap}>
        <span style={FIELD_LABEL}>お手紙の色</span>
        <div style={{ display: "flex", gap: 10 }}>
          {(Object.keys(THEMES) as (keyof typeof THEMES)[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => onChange({ theme: k })}
              aria-label={THEMES[k].label}
              title={THEMES[k].label}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                cursor: "pointer",
                padding: 0,
                background: `linear-gradient(135deg, ${THEMES[k].bg1} 40%, ${THEMES[k].accent} 130%)`,
                border: (value.theme || "rose") === k ? "3px solid #5C4A4A" : "3px solid #FFFFFF",
                boxShadow: "0 3px 10px rgba(150,110,130,0.18)",
              }}
            />
          ))}
        </div>
      </div>
      <label style={fieldWrap}>
        <span style={FIELD_LABEL}>本文</span>
        <textarea
          value={value.body ?? ""}
          onChange={(e) => onChange({ body: e.target.value })}
          rows={bodyRows}
          placeholder="今日は来てくれてありがとう…"
          className={styles.field}
          style={fieldStyle({
            padding: 13,
            lineHeight: 1.9,
            letterSpacing: "0.04em",
            resize: "vertical",
            fontFamily: font,
          })}
        />
      </label>
      <div style={fieldWrap}>
        <span style={FIELD_LABEL}>写真(本文のあとに1枚)</span>
        <div
          style={{
            background: "rgba(255,252,248,0.55)",
            border: "1px dashed #E3CBD4",
            borderRadius: 14,
            padding: "14px 18px",
            color: "#B4A2A2",
            maxWidth: 260,
          }}
        >
          <div style={{ fontSize: FONT_SIZE.bodySm, letterSpacing: "0.08em" }}>Coming soon</div>
        </div>
      </div>
    </>
  );
}

interface CardFieldsProps {
  value: Draft;
  onChange: FieldChange;
  cardConf: CardConfig;
  /** 渡したときだけ「席札 / QRカードの設定を開く」の導線を出す。 */
  onOpenSettings?: () => void;
}

/** 席札タブ: 氏名 / 敬称。 */
export function CardFields({ value, onChange, cardConf, onOpenSettings }: CardFieldsProps) {
  return (
    <>
      <label style={fieldWrap}>
        <span style={FIELD_LABEL}>席札の氏名</span>
        <input
          value={value.cardName ?? ""}
          onChange={(e) => onChange({ cardName: e.target.value })}
          placeholder={cardNameFor(value, cardConf)}
          className={styles.field}
          style={fieldStyle({ padding: "11px 13px", letterSpacing: "0.05em" })}
        />
        <span style={hintStyle}>空欄なら宛名から自動で作られます</span>
      </label>
      <HonorField
        label="敬称"
        value={value.honor ?? null}
        fallback={cardConf.honor}
        onChange={(honor) => onChange({ honor })}
      />
      {onOpenSettings && (
        <SettingsShortcut
          note="向き・デザイン・フォント・見出しはイベント共通の設定です"
          buttonLabel="席札 / QRカードの設定を開く"
          onOpen={onOpenSettings}
        />
      )}
    </>
  );
}

interface EscortFieldsProps {
  value: Draft;
  onChange: FieldChange;
  escortConf: EscortConfig;
  onUploadPhoto: (file: File) => void;
  onRemovePhoto: () => void;
  /** 渡したときだけ「エスコートカードの設定を開く」の導線を出す。 */
  onOpenSettings?: () => void;
}

/** エスコートタブ: 卓番 / 名前 / 一言 / 写真 / 敬称。 */
export function EscortFields({
  value,
  onChange,
  escortConf,
  onUploadPhoto,
  onRemovePhoto,
  onOpenSettings,
}: EscortFieldsProps) {
  return (
    <>
      <label style={fieldWrap}>
        <span style={FIELD_LABEL}>エスコートカードの名前</span>
        <input
          value={value.escortName ?? ""}
          onChange={(e) => onChange({ escortName: e.target.value })}
          placeholder={escortNameFor(value, escortConf)}
          className={styles.field}
          style={fieldStyle({ padding: "11px 13px", letterSpacing: "0.05em" })}
        />
        <span style={hintStyle}>空欄なら席札の氏名・宛名から自動で作られます</span>
      </label>
      <HonorField
        label="敬称"
        value={value.escortHonor ?? null}
        fallback={escortConf.honor}
        onChange={(escortHonor) => onChange({ escortHonor })}
      />
      <label style={fieldWrap}>
        <span style={FIELD_LABEL}>卓番</span>
        <input
          value={value.tableNo ?? ""}
          onChange={(e) => onChange({ tableNo: e.target.value })}
          placeholder="A / 1 / さくら"
          className={styles.field}
          style={fieldStyle({ padding: "11px 13px", letterSpacing: "0.05em" })}
        />
      </label>
      <label style={fieldWrap}>
        <span style={FIELD_LABEL}>一言(任意)</span>
        <input
          value={value.escortMessage ?? ""}
          onChange={(e) => onChange({ escortMessage: e.target.value })}
          placeholder="今日はよろしくね"
          className={styles.field}
          style={fieldStyle({ padding: "11px 13px", letterSpacing: "0.05em" })}
        />
      </label>
      <EscortPhotoField photo={value.escortPhoto} onUpload={onUploadPhoto} onRemove={onRemovePhoto} />
      {onOpenSettings && (
        <SettingsShortcut
          note="スタイル・QR・フォント・見出しはイベント共通の設定です"
          buttonLabel="エスコートカードの設定を開く"
          onOpen={onOpenSettings}
        />
      )}
    </>
  );
}

/** エスコート写真: 選択 / 変更 / 削除。切り取りは呼び出し側が CropModal で行う。 */
export function EscortPhotoField({
  photo,
  onUpload,
  onRemove,
}: {
  photo: string | null | undefined;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={FIELD_LABEL}>写真(任意)</span>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {photo && (
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 10,
              backgroundImage: `url('${photo}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              flex: "none",
              boxShadow: "0 3px 10px rgba(150,110,130,0.18)",
            }}
          />
        )}
        <label
          className={styles.btnOutline}
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "9px 18px",
            borderRadius: 999,
            border: "1px solid #EBD9DF",
            background: "#FFFFFF",
            color: "#5C4A4A",
            fontSize: FONT_SIZE.label,
            letterSpacing: "0.06em",
            cursor: "pointer",
          }}
        >
          {photo ? "写真を変更" : "写真を選ぶ"}
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.target.value = "";
            }}
          />
        </label>
        {photo && (
          <button
            type="button"
            onClick={onRemove}
            className={styles.btnGhost}
            style={{
              padding: "9px 14px",
              borderRadius: 999,
              border: "none",
              background: "transparent",
              color: "#B5555F",
              fontSize: FONT_SIZE.label,
              letterSpacing: "0.06em",
            }}
          >
            削除
          </button>
        )}
      </div>
      <div style={{ fontSize: FONT_SIZE.overline, color: "#B4A2A2", letterSpacing: "0.05em" }}>
        アップロード時に切り取り位置を選べます。やり直す場合は再度アップロードしてください。
      </div>
    </div>
  );
}
