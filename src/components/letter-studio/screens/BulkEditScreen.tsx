"use client";

import { useEffect, useMemo, useState } from "react";
import { THEMES } from "../constants";
import { encodeImageFile } from "../imageEncode";
import styles from "../letter-studio.module.css";
import type { BulkLetterPatch, EventTab, Honor, Letter, Project } from "../types";
import { EventHeader } from "./EventHeader";
import { FONT_SIZE } from "@/lib/typography";

type CellType = "text" | "theme" | "honor" | "photo";
type BulkField =
  | "to"
  | "theme"
  | "photo"
  | "cardName"
  | "honor"
  | "tableNo"
  | "escortName"
  | "escortMessage"
  | "escortHonor"
  | "escortPhoto";

interface FieldDef {
  key: BulkField;
  label: string;
  type: CellType;
  desc: string;
  placeholder?: string;
  /** テキスト欄の自動生成プレースホルダ(空欄時に実際に使われる値)。 */
  auto?: (l: Letter) => string;
  /** 写真欄が書き戻す縦横比フィールド。 */
  ratioKey?: "photoRatio" | "escortPhotoRatio";
  /** 敬称欄の「既定」が指すイベント既定値。 */
  honorDefault?: Honor;
}

interface CategoryDef {
  key: string;
  label: string;
  fields: FieldDef[];
}

interface BulkEditScreenProps {
  project: Project;
  letters: Letter[];
  loading: boolean;
  saving: boolean;
  onBack: () => void;
  onSelectTab: (tab: EventTab) => void;
  onOpenSettings: () => void;
  onSave: (patches: BulkLetterPatch[]) => Promise<boolean>;
  cardNameFor: (l: Letter) => string;
  escortNameFor: (l: Letter) => string;
}

const CHANGED = "#C98A3F";
const ACCENT = "#D3A5B4";
const BORDER = "#EBD9DF";
const INK = "#5C4A4A";
const MUTED = "#8C7676";
const FAINT = "#B4A2A2";
const SURFACE = "#FFFCF8";

const HONOR_OPTIONS = (def: Honor): { value: Honor | null; label: string }[] => [
  { value: null, label: `既定(${def || "なし"})` },
  { value: "様", label: "様" },
  { value: "さん", label: "さん" },
  { value: "", label: "なし" },
];

export function BulkEditScreen({
  project,
  letters,
  loading,
  saving,
  onBack,
  onSelectTab,
  onOpenSettings,
  onSave,
  cardNameFor,
  escortNameFor,
}: BulkEditScreenProps) {
  const categories = useMemo<CategoryDef[]>(() => {
    const cats: CategoryDef[] = [
      {
        key: "letter",
        label: "お手紙",
        fields: [
          {
            key: "to",
            label: "宛名",
            type: "text",
            placeholder: "はなこへ",
            desc: "お手紙の宛名。席札・エスコート名の自動生成にも使われます。",
          },
          { key: "theme", label: "色", type: "theme", desc: "お手紙の配色テーマを選びます。" },
          {
            key: "photo",
            label: "写真",
            type: "photo",
            ratioKey: "photoRatio",
            desc: "本文のあとに載せる写真(任意)。",
          },
        ],
      },
    ];
    if (project.cardConfig.enabled) {
      cats.push({
        key: "card",
        label: "席札",
        fields: [
          {
            key: "cardName",
            label: "席札の氏名",
            type: "text",
            placeholder: "(宛名から自動)",
            auto: cardNameFor,
            desc: "空欄なら宛名から自動で作られます。",
          },
          {
            key: "honor",
            label: "敬称",
            type: "honor",
            honorDefault: project.cardConfig.honor,
            desc: "席札に付ける敬称。「既定」はイベント共通設定に従います。",
          },
        ],
      });
    }
    if (project.escortConfig.enabled) {
      cats.push({
        key: "escort",
        label: "エスコート",
        fields: [
          {
            key: "tableNo",
            label: "卓番",
            type: "text",
            placeholder: "A / 1 / はなこ",
            desc: "エスコートカードに表示する卓番号・卓名。",
          },
          {
            key: "escortName",
            label: "エスコート名",
            type: "text",
            placeholder: "(自動)",
            auto: escortNameFor,
            desc: "空欄なら席札の氏名・宛名から自動で作られます。",
          },
          {
            key: "escortMessage",
            label: "一言",
            type: "text",
            placeholder: "今日はよろしくね",
            desc: "エスコートカードに載せる一言メッセージ(任意)。",
          },
          {
            key: "escortHonor",
            label: "敬称",
            type: "honor",
            honorDefault: project.escortConfig.honor,
            desc: "エスコートカードに付ける敬称。",
          },
          {
            key: "escortPhoto",
            label: "写真",
            type: "photo",
            ratioKey: "escortPhotoRatio",
            desc: "エスコートカードに載せる写真(任意)。空欄ならイベント既定写真。",
          },
        ],
      });
    }
    return cats;
  }, [project, cardNameFor, escortNameFor]);

  // スマホ幅では行を縦積みにする(識別名の下にコントロールを全幅表示)。
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const [catKey, setCatKey] = useState("letter");
  const [fieldKey, setFieldKey] = useState<BulkField>("to");

  const category = categories.find((c) => c.key === catKey) ?? categories[0];
  const field = category.fields.find((f) => f.key === fieldKey) ?? category.fields[0];

  // --- 作業コピー。編集時は行を丸ごと差し替えるので prop の Letter は不変。---
  const [rows, setRows] = useState<Letter[]>(letters);
  const [changed, setChanged] = useState<Set<string>>(() => new Set());
  // 未保存の変更が無いときだけ、letters の更新(取得・保存反映)を rows に取り込む。
  // ref ではなく state で前回値を持ち、render 中に比較して派生する
  // (useLetterStudio の seedKey / HomeScreen の prevSort と同じパターン)。
  const [seeded, setSeeded] = useState(letters);
  if (seeded !== letters && changed.size === 0) {
    setSeeded(letters);
    setRows(letters);
  }

  const baseline = useMemo(() => new Map(letters.map((l) => [l.id, l])), [letters]);

  const cellKey = (id: string, f: BulkField) => `${id}:${f}`;
  const changedForField = (f: BulkField) =>
    [...changed].filter((k) => k.endsWith(`:${f}`)).length;
  const changedForCat = (c: CategoryDef) =>
    c.fields.reduce((sum, f) => sum + changedForField(f.key), 0);

  // 敬称の「なし」("")と「既定」(null)は別物なので "" は畳まない。
  // Letter の任意フィールドは undefined になり得るので null に正規化して比較する。
  const norm = (v: unknown) => (v === undefined ? null : v);

  // どの手紙かが分かるよう、行には常に識別名を出す。
  // お手紙の宛名 → 席札の名前 → エスコートカードの名前 の順で最初にある値。
  const identityFor = (l: Letter) =>
    l.to.trim() ||
    (l.cardName ?? "").trim() ||
    (l.escortName ?? "").trim() ||
    "(名前未設定)";

  function setField(id: string, f: BulkField, value: unknown, ratio?: number, ratioKey?: FieldDef["ratioKey"]) {
    setRows((rs) =>
      rs.map((r) =>
        r.id === id
          ? { ...r, [f]: value, ...(ratioKey ? { [ratioKey]: ratio } : null) }
          : r
      )
    );
    setChanged((c) => {
      const next = new Set(c);
      const base = baseline.get(id) as Record<string, unknown> | undefined;
      const k = cellKey(id, f);
      if (base && norm(base[f]) === norm(value)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  async function onPickPhoto(id: string, f: BulkField, ratioKey: FieldDef["ratioKey"], file: File) {
    try {
      const { dataUrl, ratio } = await encodeImageFile(file);
      setField(id, f, dataUrl, ratio, ratioKey);
    } catch {
      /* エンコード失敗時は何もしない(トーストは保存時にまとめて出る) */
    }
  }

  function selectCategory(key: string) {
    const cat = categories.find((c) => c.key === key);
    if (!cat) return;
    setCatKey(key);
    setFieldKey(cat.fields[0].key);
  }

  async function handleSave() {
    const byLetter = new Map<string, Set<BulkField>>();
    changed.forEach((k) => {
      const idx = k.lastIndexOf(":");
      const id = k.slice(0, idx);
      const f = k.slice(idx + 1) as BulkField;
      (byLetter.get(id) ?? byLetter.set(id, new Set()).get(id)!).add(f);
    });
    const rowMap = new Map(rows.map((r) => [r.id, r]));
    const patches: BulkLetterPatch[] = [];
    byLetter.forEach((fields, id) => {
      const row = rowMap.get(id);
      if (!row) return;
      const rr = row as unknown as Record<string, unknown>;
      const p: Record<string, unknown> = { id };
      fields.forEach((f) => {
        p[f] = rr[f] ?? null;
        if (f === "photo") p.photoRatio = row.photoRatio;
        if (f === "escortPhoto") p.escortPhotoRatio = row.escortPhotoRatio;
      });
      patches.push(p as BulkLetterPatch);
    });
    const ok = await onSave(patches);
    if (ok) setChanged(new Set());
  }

  function handleRevert() {
    setRows(letters);
    setChanged(new Set());
  }

  const changedCount = changed.size;

  return (
    <main
      className={styles.fadeup}
      style={{ maxWidth: 1040, margin: "0 auto", padding: "28px clamp(16px,4vw,40px) 120px" }}
    >
      <EventHeader
        project={project}
        currentTab="bulk"
        onBack={onBack}
        onSelectTab={onSelectTab}
        onOpenSettings={onOpenSettings}
      />

      {/* 2 段ピッカー: 対象 → 項目 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: 16,
          background: "#FFF7F1",
          border: `1px solid #F2E6EB`,
          borderRadius: 14,
          marginBottom: 16,
        }}
      >
        {/* お手紙をつくる画面(EditorScreen)と同じタブ。 */}
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
          {categories.map((c) => {
            const active = c.key === category.key;
            const n = changedForCat(c);
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => selectCategory(c.key)}
                style={{
                  position: "relative",
                  padding: "9px 22px",
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
                {c.label}
                {n > 0 && <Badge value={n} floating />}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {category.fields.map((f) => {
            const active = f.key === field.key;
            const n = changedForField(f.key);
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFieldKey(f.key)}
                style={{
                  border: active ? `1px solid ${ACCENT}` : `1px solid ${BORDER}`,
                  background: active ? ACCENT : SURFACE,
                  color: active ? "#FFF9F5" : INK,
                  fontWeight: active ? 600 : 400,
                  cursor: "pointer",
                  padding: "8px 15px",
                  borderRadius: 999,
                  fontSize: FONT_SIZE.bodySm,
                  letterSpacing: "0.04em",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  boxShadow: active ? "0 3px 10px rgba(211,165,180,0.4)" : "none",
                }}
              >
                {f.label}
                {n > 0 && <Badge value={n} onAccent={active} />}
              </button>
            );
          })}
        </div>
      </div>

      <p style={{ margin: "0 0 14px", fontSize: FONT_SIZE.caption, color: FAINT, letterSpacing: "0.03em" }}>
        {field.desc}
      </p>

      {loading && rows.length === 0 ? (
        <p style={{ fontSize: FONT_SIZE.bodySm, color: MUTED }}>読み込んでいます…</p>
      ) : rows.length === 0 ? (
        <p style={{ fontSize: FONT_SIZE.bodySm, color: MUTED }}>まだお手紙がありません。</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((row) => (
            <Row
              key={row.id}
              row={row}
              field={field}
              identity={identityFor(row)}
              showTable={project.escortConfig.enabled}
              narrow={narrow}
              changed={changed.has(cellKey(row.id, field.key))}
              onText={(v) => setField(row.id, field.key, v)}
              onTheme={(v) => setField(row.id, field.key, v)}
              onHonor={(v) => setField(row.id, field.key, v)}
              onPickPhoto={(file) => onPickPhoto(row.id, field.key, field.ratioKey, file)}
              onRemovePhoto={() => setField(row.id, field.key, null, undefined, field.ratioKey)}
            />
          ))}
        </div>
      )}

      {/* 保存バー */}
      <div style={{ position: "sticky", bottom: 0, marginTop: 16, pointerEvents: "none" }}>
        <div
          style={{
            pointerEvents: "auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            padding: "12px 16px",
            boxShadow: "0 14px 40px rgba(150,110,130,0.2)",
          }}
        >
          <span
            style={{
              flex: narrow ? "1 1 100%" : 1,
              minWidth: 0,
              fontSize: FONT_SIZE.bodySm,
              color: MUTED,
              letterSpacing: "0.02em",
            }}
          >
            {changedCount > 0 ? (
              <>
                <b style={{ color: CHANGED, fontVariantNumeric: "tabular-nums" }}>{changedCount}</b>{" "}
                件のセルを変更中 — 保存するとまとめて反映します
              </>
            ) : (
              "変更はありません"
            )}
          </span>
          <button
            type="button"
            onClick={handleRevert}
            disabled={changedCount === 0 || saving}
            className={styles.btnOutline}
            style={{
              flex: narrow ? "1 1 0" : undefined,
              padding: "10px 18px",
              borderRadius: 999,
              border: `1px solid ${BORDER}`,
              background: "transparent",
              color: MUTED,
              fontSize: FONT_SIZE.label,
              letterSpacing: "0.06em",
              opacity: changedCount === 0 || saving ? 0.45 : 1,
              cursor: changedCount === 0 || saving ? "default" : "pointer",
            }}
          >
            取り消す
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={changedCount === 0 || saving}
            className={styles.btnSolid}
            style={{
              flex: narrow ? "2 1 0" : undefined,
              padding: "11px 24px",
              borderRadius: 999,
              border: "none",
              background: ACCENT,
              color: "#FFF9F5",
              fontSize: FONT_SIZE.body,
              letterSpacing: "0.06em",
              boxShadow: "0 6px 16px rgba(211,165,180,0.4)",
              opacity: changedCount === 0 || saving ? 0.45 : 1,
              cursor: changedCount === 0 || saving ? "default" : "pointer",
            }}
          >
            {saving ? "保存中…" : "まとめて保存"}
          </button>
        </div>
      </div>
    </main>
  );
}

function Badge({ value, floating, onAccent }: { value: number; floating?: boolean; onAccent?: boolean }) {
  return (
    <span
      style={{
        ...(floating
          ? { position: "absolute", top: -5, right: -3 }
          : { position: "static" }),
        minWidth: 16,
        height: 16,
        padding: "0 4px",
        borderRadius: 999,
        background: onAccent ? "#FFFFFF" : CHANGED,
        color: onAccent ? "#B08A99" : "#FFFFFF",
        fontSize: FONT_SIZE.micro,
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
      }}
    >
      {value}
    </span>
  );
}

interface RowProps {
  row: Letter;
  field: FieldDef;
  /** 行の識別名(宛名 → 席札名 → エスコート名)。どの手紙か分かるよう常に表示。 */
  identity: string;
  showTable: boolean;
  narrow: boolean;
  changed: boolean;
  onText: (v: string) => void;
  onTheme: (v: Letter["theme"]) => void;
  onHonor: (v: Honor | null) => void;
  onPickPhoto: (file: File) => void;
  onRemovePhoto: () => void;
}

function Row({
  row,
  field,
  identity,
  showTable,
  narrow,
  changed,
  onText,
  onTheme,
  onHonor,
  onPickPhoto,
  onRemovePhoto,
}: RowProps) {
  const accent = THEMES[row.theme].accent;
  const initial = /^[(（]/.test(identity) ? "?" : identity.charAt(0) || "?";

  return (
    <div
      style={{
        display: "flex",
        // スマホは縦積み(識別名 → コントロール全幅)、PC は横並び。
        flexDirection: narrow ? "column" : "row",
        alignItems: narrow ? "stretch" : "center",
        gap: narrow ? 10 : 14,
        background: "#FFF7F1",
        border: "1px solid #F2E6EB",
        borderLeft: changed ? `3px solid ${CHANGED}` : "1px solid #F2E6EB",
        borderRadius: 12,
        padding: "11px 14px",
      }}
    >
      {/* 識別名(常時表示)。編集中の項目が宛名でも消えない。 */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
        <span
          aria-hidden="true"
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            background: accent,
            color: "#FFFFFF",
            fontSize: FONT_SIZE.label,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "none",
          }}
        >
          {initial}
        </span>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: FONT_SIZE.body,
              fontWeight: 600,
              color: INK,
              letterSpacing: "0.03em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {identity}
          </div>
          {showTable && (
            <div style={{ fontSize: FONT_SIZE.micro, color: FAINT, letterSpacing: "0.02em" }}>
              卓 {row.tableNo || "—"}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          flex: narrow ? "none" : "0 1 auto",
          minWidth: 0,
          display: "flex",
          justifyContent: narrow ? "flex-start" : "flex-end",
        }}
      >
        <Control
          row={row}
          field={field}
          narrow={narrow}
          onText={onText}
          onTheme={onTheme}
          onHonor={onHonor}
          onPickPhoto={onPickPhoto}
          onRemovePhoto={onRemovePhoto}
        />
      </div>
    </div>
  );
}

interface ControlProps {
  row: Letter;
  field: FieldDef;
  narrow: boolean;
  onText: (v: string) => void;
  onTheme: (v: Letter["theme"]) => void;
  onHonor: (v: Honor | null) => void;
  onPickPhoto: (file: File) => void;
  onRemovePhoto: () => void;
}

function Control({ row, field, narrow, onText, onTheme, onHonor, onPickPhoto, onRemovePhoto }: ControlProps) {
  // スマホでは全幅、PC では右側に固定幅。
  const align = narrow ? "flex-start" : "flex-end";
  const inputStyle = {
    width: narrow ? "100%" : 320,
    fontSize: FONT_SIZE.input,
    color: INK,
    background: SURFACE,
    border: `1px solid ${BORDER}`,
    borderRadius: 9,
    padding: "9px 11px",
    letterSpacing: "0.02em",
    outline: "none" as const,
  };

  if (field.type === "text") {
    const value = (row[field.key] as string | null) ?? "";
    return (
      <input
        value={value}
        placeholder={field.auto ? field.auto(row) : field.placeholder}
        onChange={(e) => onText(e.target.value)}
        className={styles.field}
        style={inputStyle}
      />
    );
  }

  if (field.type === "theme") {
    return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(Object.keys(THEMES) as (keyof typeof THEMES)[]).map((k) => {
          const selected = row.theme === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => onTheme(k)}
              aria-label={THEMES[k].label}
              title={THEMES[k].label}
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                cursor: "pointer",
                padding: 0,
                background: THEMES[k].accent,
                border: selected ? `3px solid ${INK}` : "3px solid #FFFFFF",
                boxShadow: `0 0 0 1px ${BORDER}, 0 2px 6px rgba(150,110,130,0.18)`,
              }}
            />
          );
        })}
      </div>
    );
  }

  if (field.type === "honor") {
    const current = (row[field.key] as Honor | null | undefined) ?? null;
    return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: align }}>
        {HONOR_OPTIONS(field.honorDefault ?? "").map(({ value, label }) => {
          const selected = current === value;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onHonor(value)}
              className={styles.btnOutline}
              style={{
                padding: "7px 13px",
                borderRadius: 999,
                fontSize: FONT_SIZE.caption,
                letterSpacing: "0.04em",
                background: selected ? ACCENT : "#FFFFFF",
                color: selected ? "#FFF9F5" : INK,
                border: selected ? `1px solid ${ACCENT}` : `1px solid ${BORDER}`,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  // photo
  const photo = row[field.key] as string | null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: align }}>
      {photo ? (
        <span
          aria-hidden="true"
          style={{
            width: 46,
            height: 46,
            borderRadius: 10,
            flex: "none",
            backgroundImage: `url('${photo}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            border: `1px solid ${BORDER}`,
            boxShadow: "0 3px 10px rgba(150,110,130,0.2)",
          }}
        />
      ) : (
        <span
          style={{
            width: 46,
            height: 46,
            borderRadius: 10,
            flex: "none",
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: FONT_SIZE.micro,
            color: FAINT,
          }}
        >
          なし
        </span>
      )}
      <label
        className={styles.btnOutline}
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "8px 15px",
          borderRadius: 999,
          border: `1px solid ${BORDER}`,
          background: "#FFFFFF",
          color: INK,
          fontSize: FONT_SIZE.label,
          letterSpacing: "0.04em",
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
            if (file) onPickPhoto(file);
            e.target.value = "";
          }}
        />
      </label>
      {photo && (
        <button
          type="button"
          onClick={onRemovePhoto}
          className={styles.btnGhost}
          style={{
            padding: "8px 10px",
            borderRadius: 999,
            border: "none",
            background: "transparent",
            color: "#B5555F",
            fontSize: FONT_SIZE.label,
            letterSpacing: "0.04em",
          }}
        >
          削除
        </button>
      )}
    </div>
  );
}
