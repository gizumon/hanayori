"use client";

import { useState } from "react";
import { fieldStyle } from "./controls";
import styles from "./letter-studio.module.css";
import { FONT_SIZE } from "@/lib/typography";

interface BulkAddModalProps {
  onCancel: () => void;
  onCreate: (names: string[]) => Promise<number>;
  creating: boolean;
}

/** 貼り付けたテキストを 1 行 1 名の宛名として読む。空行は捨てる。 */
function parseNames(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * 宛名だけの手紙をまとめて作るモーダル。100 通規模の下準備を 1 回で終わらせる
 * ための入口で、本文や卓番はあとから一括編集・個別編集で埋める。
 */
export function BulkAddModal({ onCancel, onCreate, creating }: BulkAddModalProps) {
  const [text, setText] = useState("");
  const names = parseNames(text);

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
          width: "min(460px,94vw)",
          maxHeight: "calc(100vh - 60px)",
          overflow: "auto",
          background: "#FFFCF8",
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
            color: "#8C7676",
            lineHeight: 1.75,
            letterSpacing: "0.03em",
          }}
        >
          宛名を1行に1名ずつ入力してください。まとめてお手紙が作られます。本文はあとから書けます。
        </p>
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            fontSize: FONT_SIZE.label,
            letterSpacing: "0.1em",
            color: "#8C7676",
          }}
        >
          宛名のリスト
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={9}
            spellCheck={false}
            placeholder={"山田花子へ\n佐藤太郎へ\n鈴木一郎へ"}
            className={styles.field}
            style={fieldStyle({
              padding: "12px 14px",
              fontSize: FONT_SIZE.input,
              lineHeight: 1.9,
              letterSpacing: "0.04em",
              resize: "vertical",
            })}
            autoFocus
          />
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span
            style={{
              flex: 1,
              minWidth: 120,
              fontSize: FONT_SIZE.caption,
              color: names.length > 0 ? "#8C7676" : "#B4A2A2",
              letterSpacing: "0.04em",
            }}
          >
            {names.length > 0 ? `${names.length}名を追加します` : "まだ入力されていません"}
          </span>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              border: "1px solid #EBD9DF",
              background: "transparent",
              color: "#8C7676",
              fontSize: FONT_SIZE.bodySm,
              cursor: "pointer",
            }}
          >
            やめる
          </button>
          <button
            type="button"
            onClick={() => void onCreate(names)}
            disabled={names.length === 0 || creating}
            className={styles.btnSolid}
            style={{
              padding: "10px 22px",
              borderRadius: 999,
              border: "none",
              background: "#D3A5B4",
              color: "#FFF9F5",
              fontSize: FONT_SIZE.bodySm,
              letterSpacing: "0.06em",
              opacity: names.length === 0 || creating ? 0.5 : 1,
              cursor: names.length === 0 || creating ? "default" : "pointer",
            }}
          >
            {creating ? "追加中…" : "追加する"}
          </button>
        </div>
      </div>
    </div>
  );
}
