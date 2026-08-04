"use client";

import { Plus, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import {
  availableColumns,
  columnOf,
  parseBulkAddText,
  samplePlaceholder,
  TO_COLUMN,
  type BulkAddField,
} from "./bulkAdd";
import { fieldStyle } from "./controls";
import styles from "./letter-studio.module.css";
import type { BulkCreateLetter } from "./types";
import { FONT_SIZE } from "@/lib/typography";
import { COLOR } from "@/lib/palette";

interface BulkAddModalProps {
  onCancel: () => void;
  onCreate: (rows: BulkCreateLetter[]) => Promise<number>;
  creating: boolean;
  /** 席札を使うイベントか。使わないなら席札の項目は選べない。 */
  cardEnabled: boolean;
  /** エスコートカードを使うイベントか。 */
  escortEnabled: boolean;
}

/**
 * まとめて追加で選んだ項目を並べるチップ入力。1 列目の宛名は外せない固定チップ、
 * 2 列目以降が選んだぶん。入力欄にフォーカスすると候補が下に開き、
 * 打った文字で候補を絞れる。
 */
function ColumnPicker({
  fields,
  onChange,
  cardEnabled,
  escortEnabled,
}: {
  fields: BulkAddField[];
  onChange: (fields: BulkAddField[]) => void;
  cardEnabled: boolean;
  escortEnabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const options = useMemo(
    () => availableColumns(cardEnabled, escortEnabled).filter((c) => !fields.includes(c.key)),
    [cardEnabled, escortEnabled, fields]
  );
  const q = query.trim();
  const shown = q ? options.filter((c) => c.label.includes(q)) : options;

  const add = (key: BulkAddField) => {
    onChange([...fields, key]);
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div
      onFocus={() => setOpen(true)}
      // チップや候補ボタンへフォーカスが移るあいだは開けたままにする。
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
      // 候補は入力欄に重ねて出すので、開いても下の入力欄は動かない。
      style={{ position: "relative" }}
    >
      <div
        onClick={() => inputRef.current?.focus()}
        className={styles.field}
        style={fieldStyle({
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 6,
          padding: "7px 8px",
          cursor: "text",
          borderColor: open ? COLOR.accent : COLOR.border,
        })}
      >
        <Chip label={TO_COLUMN.label} fixed />
        {fields.map((key) => (
          <Chip
            key={key}
            label={columnOf(key).label}
            onRemove={() => onChange(fields.filter((f) => f !== key))}
          />
        ))}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && shown.length > 0) {
              e.preventDefault();
              add(shown[0].key);
            } else if (e.key === "Backspace" && !query && fields.length > 0) {
              onChange(fields.slice(0, -1));
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={fields.length === 0 ? "席札の氏名・卓番など" : ""}
          aria-label="入力する項目を追加"
          style={{
            flex: 1,
            minWidth: 90,
            padding: "3px 2px",
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: FONT_SIZE.body,
            color: COLOR.ink,
          }}
        />
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 2,
            maxHeight: 168,
            overflowY: "auto",
            display: "flex",
            flexWrap: "wrap",
            alignContent: "flex-start",
            gap: 6,
            padding: "10px 12px",
            borderRadius: 12,
            border: `1px solid ${COLOR.borderSoft}`,
            background: COLOR.surface,
            boxShadow: "0 14px 34px rgba(60,42,46,0.16)",
          }}
        >
          {shown.length === 0 ? (
            <span style={{ fontSize: FONT_SIZE.caption, color: COLOR.inkMuted }}>
              {options.length === 0
                ? "選べる項目はすべて追加しました"
                : "その名前の項目はありません"}
            </span>
          ) : (
            shown.map((col) => (
              <button
                key={col.key}
                type="button"
                // クリックで入力欄のフォーカスを外さない(Safari は押しても
                // ボタンにフォーカスが移らず、候補が閉じてしまうため)。
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => add(col.key)}
                className={styles.btnOutline}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: `1px solid ${COLOR.border}`,
                  background: COLOR.surfaceRaised,
                  color: COLOR.ink,
                  fontSize: FONT_SIZE.caption,
                  letterSpacing: "0.04em",
                  cursor: "pointer",
                }}
              >
                <Plus size={12} strokeWidth={2} aria-hidden="true" />
                {col.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/** 選択済みの項目チップ。宛名だけは外せないので × を出さない。 */
function Chip({
  label,
  fixed,
  onRemove,
}: {
  label: string;
  fixed?: boolean;
  onRemove?: () => void;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: fixed ? "4px 10px" : "4px 4px 4px 10px",
        borderRadius: 999,
        background: fixed ? COLOR.accentOff : COLOR.tintRose,
        color: fixed ? COLOR.ink : COLOR.accentDeep,
        fontSize: FONT_SIZE.caption,
        letterSpacing: "0.04em",
      }}
    >
      {label}
      {!fixed && onRemove && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onRemove}
          aria-label={`${label}を外す`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 18,
            height: 18,
            borderRadius: "50%",
            border: "none",
            background: "transparent",
            color: COLOR.accentInk,
            cursor: "pointer",
          }}
        >
          <X size={12} strokeWidth={2} aria-hidden="true" />
        </button>
      )}
    </span>
  );
}

/**
 * 宛名をまとめて追加するモーダル。100 通規模の下準備を 1 回で終わらせるための
 * 入口で、1 列目の宛名に加えて、席札の氏名・卓番など選んだ項目をカンマ区切りで
 * 一緒に入れられる。本文や写真はあとから一括編集・個別編集で埋める。
 */
export function BulkAddModal({
  onCancel,
  onCreate,
  creating,
  cardEnabled,
  escortEnabled,
}: BulkAddModalProps) {
  const [text, setText] = useState("");
  const [fields, setFields] = useState<BulkAddField[]>([]);
  const { rows, errors, warnings } = useMemo(
    () => parseBulkAddText(text, fields),
    [text, fields]
  );
  const pickable = availableColumns(cardEnabled, escortEnabled).length > 0;
  const columnLabels = [TO_COLUMN.label, ...fields.map((f) => columnOf(f).label)];
  const blocked = rows.length === 0 || errors.length > 0 || creating;

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(60,42,46,0.5)",
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(520px,94vw)",
          maxHeight: "calc(100vh - 60px)",
          overflow: "auto",
          background: COLOR.surface,
          borderRadius: 18,
          padding: "28px 26px",
          boxShadow: "0 24px 70px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <h3 style={{ margin: 0, fontSize: FONT_SIZE.heading, fontWeight: 600, letterSpacing: "0.12em" }}>
          名前をまとめて追加
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: FONT_SIZE.bodySm,
            color: COLOR.inkSoft,
            lineHeight: 1.75,
            letterSpacing: "0.03em",
          }}
        >
          1行に1名ずつ入力すると、まとめてお手紙が作られます。本文はあとから書けます。
        </p>

        {pickable && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              fontSize: FONT_SIZE.label,
              letterSpacing: "0.1em",
              color: COLOR.inkSoft,
            }}
          >
            入力する項目
            <ColumnPicker
              fields={fields}
              onChange={setFields}
              cardEnabled={cardEnabled}
              escortEnabled={escortEnabled}
            />
          </div>
        )}

        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            fontSize: FONT_SIZE.label,
            letterSpacing: "0.1em",
            color: COLOR.inkSoft,
          }}
        >
          {fields.length === 0 ? "宛名のリスト" : `リスト(${columnLabels.join(", ")})`}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={9}
            spellCheck={false}
            placeholder={samplePlaceholder(fields)}
            className={styles.field}
            style={fieldStyle({
              padding: "12px 14px",
              fontSize: FONT_SIZE.input,
              lineHeight: 1.9,
              letterSpacing: "0.04em",
              resize: "vertical",
              whiteSpace: fields.length === 0 ? "pre-wrap" : "pre",
              overflowX: fields.length === 0 ? "hidden" : "auto",
            })}
            autoFocus
          />
        </label>

        {fields.length > 0 && (
          <p
            style={{
              margin: 0,
              fontSize: FONT_SIZE.caption,
              color: COLOR.inkMuted,
              lineHeight: 1.7,
              letterSpacing: "0.03em",
            }}
          >
            空欄は未設定のまま。値にカンマを含めるときは &quot;山田, 花子&quot; と囲みます。
          </p>
        )}

        {errors.length > 0 && (
          <ul
            style={{
              margin: 0,
              // Tailwind の preflight が ul の記号と字下げを消すので、ここで戻す。
              listStyle: "disc",
              padding: "10px 14px 10px 30px",
              borderRadius: 12,
              background: COLOR.tint,
              border: `1px solid ${COLOR.border}`,
              color: COLOR.danger,
              fontSize: FONT_SIZE.caption,
              lineHeight: 1.9,
              letterSpacing: "0.03em",
            }}
          >
            {errors.slice(0, 5).map((issue, i) => (
              <li key={i}>
                {issue.line > 0 && `${issue.line}行目: `}
                {issue.message}
              </li>
            ))}
            {errors.length > 5 && <li>ほか{errors.length - 5}件</li>}
          </ul>
        )}

        {errors.length === 0 &&
          warnings.map((warning) => (
            <p
              key={warning}
              style={{
                margin: 0,
                fontSize: FONT_SIZE.caption,
                color: COLOR.warnInk,
                letterSpacing: "0.03em",
              }}
            >
              {warning}
            </p>
          ))}

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span
            style={{
              flex: 1,
              minWidth: 120,
              fontSize: FONT_SIZE.caption,
              color: rows.length > 0 ? COLOR.inkSoft : COLOR.inkFaint,
              letterSpacing: "0.04em",
            }}
          >
            {errors.length > 0
              ? "入力を直すと追加できます"
              : rows.length > 0
                ? `${rows.length}名を追加します`
                : "まだ入力されていません"}
          </span>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              border: `1px solid ${COLOR.border}`,
              background: "transparent",
              color: COLOR.inkSoft,
              fontSize: FONT_SIZE.bodySm,
              cursor: "pointer",
            }}
          >
            やめる
          </button>
          <button
            type="button"
            onClick={() => void onCreate(rows)}
            disabled={blocked}
            className={styles.btnSolid}
            style={{
              padding: "10px 22px",
              borderRadius: 999,
              border: "none",
              background: COLOR.accent,
              color: COLOR.onAccent,
              fontSize: FONT_SIZE.bodySm,
              letterSpacing: "0.06em",
              opacity: blocked ? 0.5 : 1,
              cursor: blocked ? "default" : "pointer",
            }}
          >
            {creating ? "追加中…" : "追加する"}
          </button>
        </div>
      </div>
    </div>
  );
}
