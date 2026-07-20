"use client";

import { FONTS, THEMES } from "../constants";
import { FontOptionRow, Toggle, fieldStyle } from "../controls";
import styles from "../letter-studio.module.css";
import type { FontKey, Letter, Project, ProjectTab } from "../types";

interface ProjectScreenProps {
  project: Project;
  letters: Letter[];
  projTab: ProjectTab;
  onProjTabChange: (t: ProjectTab) => void;
  onBack: () => void;
  onNewLetter: () => void;
  onEditLetter: (letter: Letter) => void;
  onShowQr: (letter: Letter) => void;
  onCopyLink: (id: string) => void;
  onDeleteLetter: (letter: Letter) => void;
  deletingLetter: boolean;
  letterUrl: (id: string) => string;
  cardNameFor: (letter: Letter) => string;
  onChangeName: (name: string) => void;
  onChangeDate: (date: string) => void;
  onToggleHasDate: (hasDate: boolean) => void;
  onToggleCardEnabled: (enabled: boolean) => void;
  onSetFont: (font: FontKey) => void;
  onGoCardSettings: () => void;
}

export function ProjectScreen({
  project,
  letters,
  projTab,
  onProjTabChange,
  onBack,
  onNewLetter,
  onEditLetter,
  onShowQr,
  onCopyLink,
  onDeleteLetter,
  deletingLetter,
  letterUrl,
  cardNameFor,
  onChangeName,
  onChangeDate,
  onToggleHasDate,
  onToggleCardEnabled,
  onSetFont,
  onGoCardSettings,
}: ProjectScreenProps) {
  const cardEnabled = project.cardEnabled !== false;
  const hasDate = project.date !== null;
  const pFont = FONTS[project.font || "yomogi"].family;
  const cFont = FONTS[project.cardFont || "mincho"].family;

  return (
    <main
      className={styles.fadeup}
      style={{ maxWidth: 960, margin: "0 auto", padding: "28px clamp(16px,4vw,40px) 80px" }}
    >
      <button
        type="button"
        onClick={onBack}
        className={styles.linkBack}
        style={{
          border: "none",
          background: "none",
          color: "#B08A99",
          fontSize: 12.5,
          letterSpacing: "0.08em",
          padding: 0,
          marginBottom: 14,
        }}
      >
        ← イベント一覧
      </button>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 14,
          flexWrap: "wrap",
          marginBottom: 22,
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 600, letterSpacing: "0.12em" }}>
            {project.name}
          </h2>
          <p style={{ margin: 0, fontSize: 12.5, color: "#8C7676", letterSpacing: "0.08em" }}>
            {project.date}
          </p>
        </div>
        <button
          type="button"
          onClick={onNewLetter}
          className={styles.btnSolid}
          style={{
            padding: "11px 22px",
            borderRadius: 999,
            border: "none",
            background: "#D3A5B4",
            color: "#FFF9F5",
            fontSize: 13.5,
            letterSpacing: "0.08em",
            boxShadow: "0 6px 16px rgba(150,110,130,0.28)",
          }}
        >
          ＋ 新しいお手紙を書く
        </button>
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          borderBottom: "1px solid rgba(211,165,180,0.3)",
          marginBottom: 22,
        }}
      >
        {(
          [
            ["letters", `お手紙 (${letters.length})`],
            ["settings", "共通設定"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => onProjTabChange(k)}
            style={{
              padding: "10px 18px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: 13.5,
              letterSpacing: "0.1em",
              color: projTab === k ? "#5C4A4A" : "#B08A99",
              fontWeight: projTab === k ? 600 : 400,
              borderBottom: projTab === k ? "2px solid #D3A5B4" : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {projTab === "letters" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {letters.map((l) => (
            <div
              key={l.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: "#FFFCF8",
                borderRadius: 14,
                padding: "16px 20px",
                boxShadow: "0 6px 20px rgba(150,110,130,0.12)",
                flexWrap: "wrap",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "46% 54% 51% 49% / 53% 47% 55% 45%",
                  background: THEMES[l.theme].accent,
                  flex: "none",
                  boxShadow: "inset 0 1px 2px rgba(255,255,255,0.4)",
                }}
              />
              <div style={{ flex: 1, minWidth: 160 }}>
                <div
                  style={{
                    fontSize: 16.5,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    fontFamily: pFont,
                  }}
                >
                  {l.to}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#8C7676",
                    letterSpacing: "0.04em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: 420,
                    fontFamily: pFont,
                  }}
                >
                  {l.body.replace(/\n+/g, " ").slice(0, 40)}
                </div>
                {cardEnabled && (
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "#B08A99",
                      letterSpacing: "0.06em",
                      marginTop: 3,
                      fontFamily: cFont,
                    }}
                  >
                    席札: {cardNameFor(l)}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => onEditLetter(l)}
                  className={styles.btnOutline}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 999,
                    border: "1px solid #EBD9DF",
                    background: "#FFFFFF",
                    color: "#5C4A4A",
                    fontSize: 12.5,
                    letterSpacing: "0.06em",
                  }}
                >
                  編集
                </button>
                <button
                  type="button"
                  onClick={() => onShowQr(l)}
                  className={styles.btnOutline}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 999,
                    border: "1px solid #EBD9DF",
                    background: "#FFFFFF",
                    color: "#5C4A4A",
                    fontSize: 12.5,
                    letterSpacing: "0.06em",
                  }}
                >
                  QRカード
                </button>
                <button
                  type="button"
                  onClick={() => onCopyLink(l.id)}
                  title="お手紙のリンクをコピー"
                  className={styles.btnOutline}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 999,
                    border: "1px solid #EBD9DF",
                    background: "#FFFFFF",
                    color: "#5C4A4A",
                    fontSize: 12.5,
                    letterSpacing: "0.06em",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    style={{ width: 13, height: 13 }}
                  >
                    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
                    <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
                  </svg>
                  リンク
                </button>
                <a
                  href={letterUrl(l.id)}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.btnSolid}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 999,
                    border: "none",
                    background: "#D3A5B4",
                    color: "#FFF9F5",
                    fontSize: 12.5,
                    letterSpacing: "0.06em",
                    textDecoration: "none",
                  }}
                >
                  お手紙を開く
                </a>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`「${l.to}」を削除しますか？この操作は取り消せません。`)) {
                      onDeleteLetter(l);
                    }
                  }}
                  disabled={deletingLetter}
                  title="お手紙を削除"
                  className={styles.btnOutline}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 999,
                    border: "1px solid #EBD9DF",
                    background: "#FFFFFF",
                    color: "#B5555F",
                    fontSize: 12.5,
                    letterSpacing: "0.06em",
                    opacity: deletingLetter ? 0.6 : 1,
                    cursor: deletingLetter ? "default" : "pointer",
                  }}
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {projTab === "settings" && (
        <>
          <p style={{ margin: "0 0 14px", fontSize: 12, color: "#B4A2A2", letterSpacing: "0.05em" }}>
            イベント全体・すべてのお手紙とカードに適用される設定
          </p>
          <div
            style={{
              background: "#FFFCF8",
              borderRadius: 14,
              padding: 22,
              boxShadow: "0 6px 20px rgba(150,110,130,0.12)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              maxWidth: 520,
            }}
          >
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                fontSize: 12.5,
                letterSpacing: "0.1em",
                color: "#8C7676",
              }}
            >
              イベント名
              <input
                value={project.name}
                onChange={(e) => onChangeName(e.target.value)}
                className={styles.field}
                style={fieldStyle({ fontSize: 14.5, padding: "11px 13px" })}
              />
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12.5, letterSpacing: "0.1em", color: "#8C7676" }}>挙式日</span>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  value={project.date ?? ""}
                  onChange={(e) => onChangeDate(e.target.value)}
                  disabled={project.date === null}
                  placeholder="2026年10月24日(土)"
                  className={styles.field}
                  style={fieldStyle({
                    flex: 1,
                    minWidth: 180,
                    fontSize: 14.5,
                    background: project.date === null ? "#F2ECEC" : "#FFFFFF",
                  })}
                />
                <Toggle checked={hasDate} onChange={onToggleHasDate} label="日付を設定する" />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 12.5, letterSpacing: "0.1em", color: "#8C7676" }}>
                お手紙のフォント
              </span>
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
                    active={(project.font || "yomogi") === k}
                    onClick={() => onSetFont(k)}
                  />
                ))}
              </div>
            </div>
            <Toggle
              checked={cardEnabled}
              onChange={onToggleCardEnabled}
              label="席札を作成する(お手紙ごとに氏名・敬称を設定)"
            />
            <button
              type="button"
              onClick={onGoCardSettings}
              className={styles.btnGhost}
              style={{
                alignSelf: "flex-start",
                padding: "10px 20px",
                borderRadius: 999,
                border: "1px solid #D3A5B4",
                background: "transparent",
                color: "#B08A99",
                fontSize: 13,
                letterSpacing: "0.06em",
              }}
            >
              席札 / QRカードの設定を開く
            </button>
          </div>
          <h4
            style={{
              margin: "30px 0 4px",
              fontSize: 13.5,
              fontWeight: 600,
              letterSpacing: "0.12em",
              color: "#8C7676",
            }}
          >
            全手紙共通ページ
          </h4>
          <p style={{ margin: "0 0 14px", fontSize: 12, color: "#B4A2A2", letterSpacing: "0.05em" }}>
            お手紙の最後からリンクできる共通コンテンツ(近日公開)
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
              gap: 14,
              maxWidth: 680,
            }}
          >
            {["新郎新婦プロフィール", "座席表", "お料理メニュー"].map((label) => (
              <div
                key={label}
                style={{
                  background: "rgba(255,252,248,0.55)",
                  border: "1px dashed #E3CBD4",
                  borderRadius: 14,
                  padding: 18,
                  color: "#B4A2A2",
                }}
              >
                <div style={{ fontSize: 14, letterSpacing: "0.1em", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 11, letterSpacing: "0.08em" }}>Coming soon</div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
