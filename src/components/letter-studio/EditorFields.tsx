"use client";

import { useState } from "react";
import { LETTER_PHOTO_ASPECTS, MAX_LETTER_PHOTOS, THEMES } from "./constants";
import { fieldStyle } from "./controls";
import { CropModal } from "./CropModal";
import { cardNameFor, escortNameFor, escortPhotoFor } from "./geometry";
import { readImageFile } from "./imageEncode";
import styles from "./letter-studio.module.css";
import { PhotoPicker } from "./PhotoPicker";
import type {
  CardConfig,
  Draft,
  EscortConfig,
  Honor,
  Letter,
  LetterConfig,
  LetterPhoto,
} from "./types";
import { FONT_SIZE } from "@/lib/typography";
import { COLOR } from "@/lib/palette";

type FieldChange = (patch: Partial<Letter>) => void;

export const FIELD_LABEL = {
  fontSize: FONT_SIZE.label,
  letterSpacing: "0.1em",
  color: COLOR.inkSoft,
} as const;

export const fieldWrap = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
} as const;

export const hintStyle = {
  fontSize: FONT_SIZE.caption,
  color: COLOR.inkFaint,
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
                background: active ? COLOR.accent : COLOR.surfaceRaised,
                color: active ? COLOR.onAccent : COLOR.ink,
                border: active ? `1px solid ${COLOR.accent}` : `1px solid ${COLOR.border}`,
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
        border: `1px dashed ${COLOR.borderDash}`,
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <span style={{ fontSize: FONT_SIZE.caption, color: COLOR.inkSoft, letterSpacing: "0.06em", lineHeight: 1.7 }}>
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
          border: `1px solid ${COLOR.accent}`,
          background: "transparent",
          color: COLOR.accentInk,
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
  letterConf: LetterConfig;
  font: string;
  /** イベントの挙式日。渡すと「日付は〜が使われます」の案内を出す。 */
  date?: string | null;
  bodyRows?: number;
}

/** お手紙タブ: 宛名 / 本文 / 色 / 写真。「新規作成」と「1通ぶんの編集」で共用する。 */
export function LetterFields({ value, onChange, letterConf, font, date, bodyRows = 9 }: LetterFieldsProps) {
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
                border: (value.theme || "rose") === k ? `3px solid ${COLOR.ink}` : `3px solid ${COLOR.surfaceRaised}`,
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
      {/* 対象が変わったら選びかけの状態は持ち越さない */}
      <LetterPhotoField key={value.id ?? "new"} value={value} onChange={onChange} letterConf={letterConf} />
    </>
  );
}

/**
 * お手紙の写真。枠には**実際に出る写真**が入っていて、共通設定の既定写真から
 * 来ているときは「共通設定」の印が付く。枠を押せばこのお手紙の写真に差し替え、
 * × で外し、外したあとは「共通設定の写真を使う」で戻せる。
 *
 * 選んだ写真は CropModal で切り取ってから入る(便箋には切り取った形のまま載る)。
 *
 * 枠は `MAX_LETTER_PHOTOS` ぶん並べる(いまは 1 枠)。データは何枚でも持てるので、
 * 枠に収まらない分はそのまま残して触らない。
 */
function LetterPhotoField({
  value,
  onChange,
  letterConf,
}: {
  value: Draft;
  onChange: FieldChange;
  letterConf: LetterConfig;
}) {
  // 切り取り待ちの写真。{ 枠の番号, 元画像の dataUrl }。null = 切り取り中でない。
  const [cropping, setCropping] = useState<{ index: number; src: string } | null>(null);
  const [error, setError] = useState("");
  const photos = value.photos ?? [];
  const slots = photos.slice(0, MAX_LETTER_PHOTOS);
  const rest = photos.slice(MAX_LETTER_PHOTOS);
  const defaults = letterConf.defaultPhotos;
  // 自分の写真が無ければ共通設定の既定が入って見える(「なし」にしたときを除く)。
  const inherited = slots.length === 0 && !value.hidePhotos;

  /** 枠 i の写真を差し替える(next が null なら「なし」にする)。 */
  const setAt = (i: number, next: LetterPhoto | null) => {
    if (!next) {
      onChange({ photos: slots.filter((_, j) => j !== i).concat(rest), hidePhotos: true });
      return;
    }
    onChange({ photos: [...slots.slice(0, i), next, ...slots.slice(i + 1), ...rest], hidePhotos: false });
  };

  /** 選んだファイルを切り取りモーダルへ渡す。 */
  async function pick(i: number, file: File) {
    setError("");
    try {
      setCropping({ index: i, src: await readImageFile(file) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "画像の読み込みに失敗しました");
    }
  }

  /** 切り取りを確定してドラフトに入れる(保存時に uploadIfDataUrl が Storage へ上げる)。 */
  function applyCrop(dataUrl: string, ratio: number) {
    if (!cropping) return;
    setAt(cropping.index, { id: slots[cropping.index]?.id ?? "", url: dataUrl, ratio });
    setCropping(null);
  }

  return (
    <div style={fieldWrap}>
      <span style={FIELD_LABEL}>写真</span>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {Array.from({ length: MAX_LETTER_PHOTOS }, (_, i) => {
          const shown = inherited ? defaults[i] : slots[i];
          return (
            <PhotoPicker
              key={shown?.id || i}
              photo={shown?.url ?? null}
              onPick={(file) => void pick(i, file)}
              onRemove={() => setAt(i, null)}
              size={104}
              label="写真を選ぶ"
              badge={inherited ? "共通設定" : null}
              onUseDefault={
                // 共通設定に写真があり、いまそれを使っていないときだけ戻せる。
                defaults[i] && !inherited ? () => onChange({ photos: [], hidePhotos: false }) : undefined
              }
              ariaLabel="お手紙の写真"
            />
          );
        })}
      </div>
      {/* 見え方はプレビューで分かるので、説明は出さない。エラーのときだけ理由を伝える。 */}
      {error && <span style={{ ...hintStyle, color: COLOR.danger }}>{error}</span>}
      {cropping && (
        <CropModal
          src={cropping.src}
          aspects={LETTER_PHOTO_ASPECTS}
          onCancel={() => setCropping(null)}
          onApply={applyCrop}
        />
      )}
    </div>
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
  /** 渡したときだけ「エスコートカードの設定を開く」の導線を出す。 */
  onOpenSettings?: () => void;
}

/** エスコートタブ: 卓番 / 名前 / 一言 / 写真 / 敬称。 */
export function EscortFields({
  value,
  onChange,
  escortConf,
  onUploadPhoto,
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
      <EscortPhotoField value={value} onChange={onChange} escortConf={escortConf} onUpload={onUploadPhoto} />
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

/**
 * エスコートカードの写真。お手紙の写真と同じ操作で、枠には**実際に出る写真**が
 * 入る(共通設定の既定から来ているときは「共通設定」の印が付く)。
 * 切り取りは呼び出し側が CropModal で行う。
 */
export function EscortPhotoField({
  value,
  onChange,
  escortConf,
  onUpload,
}: {
  value: Draft;
  onChange: FieldChange;
  escortConf: EscortConfig;
  onUpload: (file: File) => void;
}) {
  const inherited = !value.escortPhoto && !value.hideEscortPhoto;
  const shown = escortPhotoFor(value, escortConf);
  return (
    <div style={fieldWrap}>
      <span style={FIELD_LABEL}>写真(任意)</span>
      <PhotoPicker
        photo={shown || null}
        onPick={onUpload}
        badge={inherited ? "共通設定" : null}
        onUseDefault={
          // 共通設定に写真があり、いまそれを使っていないときだけ戻せる。
          escortConf.defaultPhoto && !inherited
            ? () => onChange({ escortPhoto: null, escortPhotoRatio: undefined, hideEscortPhoto: false })
            : undefined
        }
        onRemove={() => onChange({ escortPhoto: null, escortPhotoRatio: undefined, hideEscortPhoto: true })}
        size={104}
        label="写真を選ぶ"
        ariaLabel="エスコートカードの写真"
      />
    </div>
  );
}
