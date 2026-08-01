"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { CircleQuestionMark, Printer, X } from "lucide-react";
import { FONTS, THEMES } from "../constants";
import { EscortCardFace } from "../EscortCardFace";
import { cardNameFor, escortGeom, escortNameFor, geom } from "../geometry";
import styles from "../letter-studio.module.css";
import { LetterPreviewFace } from "../LetterPreviewFace";
import { QrCardFace } from "../QrCardFace";
import type { EditorTab, EventTab, Letter, Project } from "../types";
import { EventHeader } from "./EventHeader";
import { useScrollLock } from "@/hooks/useScrollLock";
import { FONT_SIZE } from "@/lib/typography";

/** 1 度に描くカード数。QR の生成が重いので少しずつ増やす。 */
const PAGE_SIZE = 12;

interface ReviewScreenProps {
  project: Project;
  letters: Letter[];
  loading: boolean;
  onBack: () => void;
  onSelectTab: (tab: EventTab) => void;
  onOpenSettings: () => void;
  onEdit: (letter: Letter, tab: EditorTab) => void;
  letterUrl: (id: string) => string;
  /** エスコートカード(チケット風)を A4 1枚に4枚ずつまとめて印刷する。 */
  onPrintAllEscort: () => void;
  printingAllEscort: boolean;
}

const KIND_LABEL: Record<EditorTab, string> = {
  letter: "お手紙",
  card: "席札",
  escort: "エスコートカード",
};

/** その対象で「まだ埋まっていない」ものを一言で返す。空文字なら問題なし。 */
function warningOf(letter: Letter, kind: EditorTab): string {
  if (!letter.to.trim()) return "宛名が未入力";
  if (kind === "letter" && !letter.body.trim()) return "本文が未入力";
  if (kind === "escort" && !(letter.tableNo ?? "").trim()) return "卓番が未入力";
  return "";
}

/**
 * 確認タブ。ゲストの手元に届くもの(お手紙 / 席札 / エスコートカード)を
 * 実物のまま縦に並べて見返す画面。気になるものは「編集」でその場で直す。
 */
export function ReviewScreen({
  project,
  letters,
  loading,
  onBack,
  onSelectTab,
  onOpenSettings,
  onEdit,
  letterUrl,
  onPrintAllEscort,
  printingAllEscort,
}: ReviewScreenProps) {
  const cardEnabled = project.cardConfig.enabled;
  const escortEnabled = project.escortConfig.enabled;

  const kinds: EditorTab[] = [
    "letter",
    ...(cardEnabled ? (["card"] as const) : []),
    ...(escortEnabled ? (["escort"] as const) : []),
  ];
  const [kind, setKind] = useState<EditorTab>("letter");
  const [shown, setShown] = useState(PAGE_SIZE);
  const [showPrintGuide, setShowPrintGuide] = useState(false);
  // 対象を切り替えたら先頭から数え直す(render 中の派生)。
  const [prevKind, setPrevKind] = useState(kind);
  if (prevKind !== kind) {
    setPrevKind(kind);
    setShown(PAGE_SIZE);
  }

  const curKind = kinds.includes(kind) ? kind : "letter";
  const warned = letters.filter((l) => warningOf(l, curKind)).length;
  const visible = letters.slice(0, shown);

  return (
    <main
      className={styles.fadeup}
      style={{ maxWidth: 1040, margin: "0 auto", padding: "28px clamp(16px,4vw,40px) 80px" }}
    >
      <EventHeader
        project={project}
        currentTab="review"
        onBack={onBack}
        onSelectTab={onSelectTab}
        onOpenSettings={onOpenSettings}
      />

      {/* 確認する対象 / エスコートカードのみ一括印刷ボタンを添える */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 10,
        }}
      >
        {kinds.length > 1 && (
          <div
            style={{
              display: "inline-flex",
              gap: 4,
              background: "rgba(211,165,180,0.16)",
              borderRadius: 999,
              padding: 4,
              flexWrap: "wrap",
            }}
          >
            {kinds.map((k) => {
              const active = k === curKind;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  aria-pressed={active}
                  style={{
                    padding: "9px 20px",
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
                  {k === "escort" ? "エスコート" : KIND_LABEL[k]}
                </button>
              );
            })}
          </div>
        )}

        {curKind === "escort" && escortEnabled && project.escortConfig.style === "ticket" && letters.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
            <button
              type="button"
              onClick={onPrintAllEscort}
              disabled={printingAllEscort}
              className={styles.btnOutline}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "9px 20px",
                borderRadius: 999,
                border: "1px solid #EBD9DF",
                background: "#FFFFFF",
                color: "#5C4A4A",
                fontSize: FONT_SIZE.bodySm,
                letterSpacing: "0.06em",
                cursor: printingAllEscort ? "default" : "pointer",
                opacity: printingAllEscort ? 0.6 : 1,
              }}
            >
              <Printer size={14} strokeWidth={1.8} aria-hidden="true" style={{ flex: "none" }} />
              {printingAllEscort ? "準備しています…" : "印刷する"}
            </button>
            <button
              type="button"
              onClick={() => setShowPrintGuide(true)}
              aria-label="A4用紙への印刷のされ方と切り方を見る"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 30,
                height: 30,
                flex: "none",
                borderRadius: "50%",
                border: "1px solid #EBD9DF",
                background: "#FFFFFF",
                color: "#A38A93",
                cursor: "pointer",
              }}
            >
              <CircleQuestionMark size={15} strokeWidth={1.8} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {showPrintGuide && <PrintGuideModal onClose={() => setShowPrintGuide(false)} />}

      <p
        style={{
          margin: "0 0 18px",
          fontSize: FONT_SIZE.caption,
          color: "#8C7676",
          letterSpacing: "0.05em",
        }}
      >
        {loading
          ? "読み込んでいます…"
          : letters.length === 0
            ? "まだお手紙がありません"
            : warned > 0
              ? `${KIND_LABEL[curKind]} ${letters.length}通 — ${warned}通に未入力があります`
              : `${KIND_LABEL[curKind]} ${letters.length}通 — すべてそろっています`}
      </p>

      <div
        style={{
          display: "grid",
          gap: 18,
          gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
        }}
      >
        {visible.map((letter, i) => (
          <ReviewCard
            key={letter.id}
            letter={letter}
            index={i + 1}
            kind={curKind}
            project={project}
            warning={warningOf(letter, curKind)}
            qrUrl={letterUrl(letter.id)}
            onEdit={() => onEdit(letter, curKind)}
          />
        ))}
      </div>

      {letters.length > shown && (
        <button
          type="button"
          onClick={() => setShown((n) => n + PAGE_SIZE)}
          className={styles.btnOutline}
          style={{
            display: "block",
            width: "100%",
            marginTop: 18,
            padding: "13px 20px",
            borderRadius: 999,
            border: "1px solid #EBD9DF",
            background: "#FFFFFF",
            color: "#5C4A4A",
            fontSize: FONT_SIZE.bodySm,
            letterSpacing: "0.08em",
            cursor: "pointer",
          }}
        >
          さらに表示（残り {letters.length - shown} 件）
        </button>
      )}
    </main>
  );
}

interface ReviewCardProps {
  letter: Letter;
  index: number;
  kind: EditorTab;
  project: Project;
  warning: string;
  qrUrl: string;
  onEdit: () => void;
}

function ReviewCard({ letter, index, kind, project, warning, qrUrl, onEdit }: ReviewCardProps) {
  const theme = THEMES[letter.theme];
  const cardConf = project.cardConfig;
  const escortConf = project.escortConfig;

  return (
    <article
      style={{
        background: "#FFFCF8",
        border: "1px solid #F2E6EB",
        borderRadius: 16,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 11,
        boxShadow: "0 6px 20px rgba(150,110,130,0.1)",
      }}
    >
      {kind === "letter" && (
        <LetterPreviewFace
          to={letter.to}
          body={letter.body}
          photo={letter.photo}
          photoRatio={letter.photoRatio}
          date={project.date}
          font={FONTS[project.letterConfig.font].family}
          theme={theme}
          padding="18px 14px"
        />
      )}

      {kind === "card" && (
        <div style={stage(theme)}>
          <QrCardFace
            width="100%"
            aspect={geom(cardConf, theme.rule).aspect}
            paper={theme.paper}
            accent={theme.accent}
            gold={theme.gold}
            ink={theme.ink}
            inkSoft={theme.inkSoft}
            font={FONTS[cardConf.font].family}
            frame={cardConf.frame}
            geometry={geom(cardConf, theme.rule)}
            cardName={cardNameFor(letter, cardConf)}
            heading={cardConf.heading}
            note={cardConf.note}
            footText={cardConf.nameOverride.trim() || project.name}
            date={project.date || ""}
            qrUrl={qrUrl}
            boxShadow="0 10px 28px rgba(150,110,130,0.2)"
          />
        </div>
      )}

      {kind === "escort" && (
        <div style={stage(theme)}>
          <EscortCardFace
            style={escortConf.style}
            width="100%"
            aspect={escortGeom(escortConf.style).aspect}
            paper={theme.paper}
            accent={theme.accent}
            gold={theme.gold}
            ink={theme.ink}
            inkSoft={theme.inkSoft}
            font={FONTS[escortConf.font].family}
            name={escortNameFor(letter, escortConf)}
            tableNo={letter.tableNo || ""}
            tableLabel={escortConf.tableLabel}
            heading={escortConf.heading}
            message={letter.escortMessage || ""}
            photo={letter.escortPhoto || escortConf.defaultPhoto || ""}
            footText={escortConf.nameOverride.trim() || project.name}
            boxShadow="0 10px 28px rgba(150,110,130,0.2)"
          />
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span
          style={{
            fontSize: FONT_SIZE.micro,
            color: "#B4A2A2",
            fontVariantNumeric: "tabular-nums",
            flex: "none",
          }}
        >
          {index}
        </span>
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: FONT_SIZE.body,
            letterSpacing: "0.05em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {letter.to.trim() || "(宛名未設定)"}
        </span>
        {warning && (
          <span
            style={{
              flex: "none",
              fontSize: FONT_SIZE.micro,
              letterSpacing: "0.05em",
              color: "#9A7B4A",
              background: "#F8ECD7",
              borderRadius: 999,
              padding: "3px 9px",
            }}
          >
            {warning}
          </span>
        )}
        <button
          type="button"
          onClick={onEdit}
          className={styles.btnOutline}
          style={{
            flex: "none",
            padding: "7px 14px",
            borderRadius: 999,
            border: "1px solid #EBD9DF",
            background: "#FFFFFF",
            color: "#5C4A4A",
            fontSize: FONT_SIZE.label,
            letterSpacing: "0.06em",
            cursor: "pointer",
          }}
        >
          編集
        </button>
      </div>
    </article>
  );
}

function stage(theme: (typeof THEMES)[keyof typeof THEMES]) {
  return {
    borderRadius: 12,
    background: `linear-gradient(175deg, ${theme.bg1} 0%, ${theme.g1} 55%, ${theme.g2} 100%)`,
    padding: "18px 14px",
    display: "flex",
    justifyContent: "center",
  } as const;
}

// A4(210×297mm)に 182×65mm のチケットを 14mm(左右) / 18.5mm(上下) の余白で
// 4枚並べる。SVG の viewBox をそのまま mm 単位として使い、実寸比率で描く。
const GUIDE_PAGE_W = 210;
const GUIDE_PAGE_H = 297;
const GUIDE_MARGIN_X = 14;
const GUIDE_MARGIN_Y = 18.5;
const GUIDE_CARD_W = 182;
const GUIDE_CARD_H = 65;
const GUIDE_TEAR_X = GUIDE_MARGIN_X + 137;
// 寸法線を引くための余白(左・上)。左側は "18.5" が入る幅を確保する。
const GUIDE_DIM_PAD_L = 32;
const GUIDE_DIM_PAD_T = 18;

const DIM_LINE_COLOR = "#B79AA3";
const DIM_TEXT_COLOR = "#8C7676";

/** 横方向の寸法線。x を起点に segments を右へ積み上げ、区切りごとに目盛りと数値を描く。 */
function HDim({
  x,
  y,
  segments,
}: {
  x: number;
  y: number;
  segments: { w: number; label: string }[];
}) {
  const ticks = [x];
  segments.forEach((s) => ticks.push(ticks[ticks.length - 1] + s.w));
  return (
    <g>
      <line x1={x} y1={y} x2={ticks[ticks.length - 1]} y2={y} stroke={DIM_LINE_COLOR} strokeWidth="0.6" />
      {ticks.map((tx, i) => (
        <line key={i} x1={tx} y1={y - 2.5} x2={tx} y2={y + 2.5} stroke={DIM_LINE_COLOR} strokeWidth="0.6" />
      ))}
      {segments.map((s, i) => (
        <text
          key={i}
          x={(ticks[i] + ticks[i + 1]) / 2}
          y={y - 3.5}
          textAnchor="middle"
          fontSize="7.5"
          fill={DIM_TEXT_COLOR}
        >
          {s.label}
        </text>
      ))}
    </g>
  );
}

/** 縦方向の寸法線。y を起点に segments を下へ積み上げ、区切りごとに目盛りと数値を描く。 */
function VDim({
  x,
  y,
  segments,
}: {
  x: number;
  y: number;
  segments: { h: number; label: string }[];
}) {
  const ticks = [y];
  segments.forEach((s) => ticks.push(ticks[ticks.length - 1] + s.h));
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={ticks[ticks.length - 1]} stroke={DIM_LINE_COLOR} strokeWidth="0.6" />
      {ticks.map((ty, i) => (
        <line key={i} x1={x - 2.5} y1={ty} x2={x + 2.5} y2={ty} stroke={DIM_LINE_COLOR} strokeWidth="0.6" />
      ))}
      {segments.map((s, i) => (
        <text
          key={i}
          x={x - 4}
          y={(ticks[i] + ticks[i + 1]) / 2}
          textAnchor="end"
          dominantBaseline="middle"
          fontSize="7.5"
          fill={DIM_TEXT_COLOR}
        >
          {s.label}
        </text>
      ))}
    </g>
  );
}

/**
 * 「印刷する」の隣のヘルプアイコンから開く、A4への配置と切り方の説明。
 * <main> は fadeup アニメーション由来で computed transform が none に戻らず
 * position:fixed の containing block になってしまうため、body 直下へ portal する。
 */
function PrintGuideModal({ onClose }: { onClose: () => void }) {
  useScrollLock();
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 65,
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
          width: "min(400px,92vw)",
          maxHeight: "88vh",
          overflowY: "auto",
          background: "#FFFCF8",
          borderRadius: 18,
          padding: "22px 24px 26px",
          boxShadow: "0 24px 70px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3
            style={{
              margin: 0,
              fontSize: FONT_SIZE.heading,
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: "#5C4A4A",
            }}
          >
            A4用紙への印刷について
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              flex: "none",
              borderRadius: "50%",
              border: "none",
              background: "transparent",
              color: "#A38A93",
              cursor: "pointer",
            }}
          >
            <X size={17} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>

        <svg
          viewBox={`${-GUIDE_DIM_PAD_L} ${-GUIDE_DIM_PAD_T} ${GUIDE_PAGE_W + GUIDE_DIM_PAD_L + 6} ${
            GUIDE_PAGE_H + GUIDE_DIM_PAD_T + 6
          }`}
          width="190"
          style={{ display: "block", margin: "0 auto", flex: "none" }}
          role="img"
          aria-label="A4用紙にエスコートカードを4枚配置し、各部の寸法(単位mm)を示した図"
        >
          <rect x="0" y="0" width="210" height="297" fill="#FFFFFF" stroke="#D8C4CB" strokeWidth="1.5" />
          <HDim
            x={0}
            y={-8}
            segments={[
              { w: GUIDE_MARGIN_X, label: "14" },
              { w: 137, label: "137" },
              { w: 45, label: "45" },
              { w: GUIDE_MARGIN_X, label: "14" },
            ]}
          />
          <VDim
            x={-10}
            y={0}
            segments={[
              { h: GUIDE_MARGIN_Y, label: "18.5" },
              { h: GUIDE_CARD_H, label: "65" },
              { h: GUIDE_CARD_H, label: "65" },
              { h: GUIDE_CARD_H, label: "65" },
              { h: GUIDE_CARD_H, label: "65" },
              { h: GUIDE_MARGIN_Y, label: "18.5" },
            ]}
          />
          {[0, 1, 2, 3].map((i) => {
            const y = GUIDE_MARGIN_Y + i * GUIDE_CARD_H;
            return (
              <g key={i}>
                {i > 0 && (
                  <line
                    x1={0}
                    y1={y}
                    x2={210}
                    y2={y}
                    stroke="#C98A9C"
                    strokeWidth="1"
                    strokeDasharray="4 3"
                  />
                )}
                <rect
                  x={GUIDE_MARGIN_X}
                  y={y}
                  width={GUIDE_CARD_W}
                  height={GUIDE_CARD_H}
                  fill="#FBF0EE"
                  stroke="#E3C9CE"
                  strokeWidth="0.75"
                />
                <line
                  x1={GUIDE_TEAR_X}
                  y1={y}
                  x2={GUIDE_TEAR_X}
                  y2={y + GUIDE_CARD_H}
                  stroke="#B78A9B"
                  strokeWidth="1"
                  strokeDasharray="2.5 2"
                />
              </g>
            );
          })}
        </svg>
        <p
          style={{
            margin: "-6px 0 0",
            textAlign: "center",
            fontSize: FONT_SIZE.micro,
            color: "#B4A2A2",
            letterSpacing: "0.04em",
          }}
        >
          単位: mm
        </p>

        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            fontSize: FONT_SIZE.caption,
            color: "#7C6868",
            lineHeight: 1.7,
            letterSpacing: "0.03em",
          }}
        >
          <li>・横のピンクの点線 = 1枚ずつの切り分け線</li>
          <li>・中央の点線 = お名前側と半券を切り離すミシン目</li>
        </ul>
      </div>
    </div>,
    document.body
  );
}
