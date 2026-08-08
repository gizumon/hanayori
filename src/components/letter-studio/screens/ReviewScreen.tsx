"use client";

import { useMemo, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { CircleAlert, CircleQuestionMark, Download, Lock, Pencil, Printer, X } from "lucide-react";
import { FONTS, HIDDEN_BODY_NOTE, THEMES } from "../constants";
import { EscortCardFace } from "../EscortCardFace";
import { cardNameFor, escortGeom, escortNameFor, geom, letterPhotosFor } from "../geometry";
import styles from "../letter-studio.module.css";
import { LetterPreviewFace } from "../LetterPreviewFace";
import { QrCardFace } from "../QrCardFace";
import type { EditorTab, EventTab, Letter, Project, SettingsTab } from "../types";
import { CREATOR_ALL, CreatorFilter, useCreatorFilter } from "./CreatorFilter";
import { EventHeader } from "./EventHeader";
import { ListToolbar, type SortOption } from "./ListToolbar";
import {
  LETTER_SEARCH_PLACEHOLDER,
  SearchField,
  matchesQuery,
  useSearchQuery,
} from "./SearchField";
import { useScrollLock } from "@/hooks/useScrollLock";
import { FONT_SIZE } from "@/lib/typography";
import { COLOR } from "@/lib/palette";

/** 1 度に描くカード数。QR の生成が重いので少しずつ増やす。 */
const PAGE_SIZE = 12;

interface ReviewScreenProps {
  project: Project;
  /**
   * 全ゲストぶん。伏せられたお手紙も並べる(「お手紙」では本文の位置がぼかしになり、
   * 席札・エスコートカードはこれまでどおり中身まで確認できる)。
   */
  letters: Letter[];
  /** ログイン中の uid。作成者フィルタで自分を「あなた」と表示するために使う。 */
  currentUid: string | null;
  loading: boolean;
  onBack: () => void;
  onSelectTab: (tab: EventTab) => void;
  /** 共通設定ドロワーを開く。タブ指定なしなら「基本」。 */
  onOpenSettings: (tab?: SettingsTab) => void;
  onEdit: (letter: Letter, tab: EditorTab) => void;
  letterUrl: (id: string) => string;
  /** 任意のカードDOMを画像として保存する(確認タブの各アイテムから使う)。 */
  saveCardImage: (ref: RefObject<HTMLDivElement | null>, filename: string) => void;
  /**
   * エスコートカードを A4 にまとめて印刷する(チケット風は4枚、カード風は10枚/A4)。
   * 作成者で絞り込んでいるときは、いま並んでいるぶんだけを渡す。
   */
  onPrintAllEscort: (letters: Letter[]) => void;
  printingAllEscort: boolean;
  /** 席札を A4 1枚に10枚ずつまとめて印刷する(横向き・縦向きのみ対応)。 */
  onPrintAllCards: (letters: Letter[]) => void;
  printingAllCards: boolean;
}

const KIND_LABEL: Record<EditorTab, string> = {
  letter: "お手紙",
  card: "席札",
  escort: "エスコートカード",
};

/**
 * 件数の前に置く呼び名。対象タブで「エスコート」と分かっているので、
 * 「エスコートカード 12 通」ではなく「カード 12 通」と短く数える。
 */
const KIND_COUNT_LABEL: Record<EditorTab, string> = {
  letter: "お手紙",
  card: "席札",
  escort: "カード",
};

/** 並び替えたときに「名前順」が指す呼び名。対象ごとに違う。 */
const KIND_NAME_LABEL: Record<EditorTab, string> = {
  letter: "宛名",
  card: "席札の氏名",
  escort: "エスコート名",
};

/** お手紙一覧・一括編集と同じ並び順。 */
type SortKey = "createdDesc" | "createdAsc" | "nameAsc";

/** その対象で「まだ埋まっていない」ものを一言で返す。空文字なら問題なし。 */
function warningOf(letter: Letter, kind: EditorTab): string {
  if (!letter.to.trim()) return "宛名が未入力";
  // 伏せられたお手紙は本文が手元に無いだけで、書かれているかは分からない。
  if (kind === "letter" && letter.hidden) return "";
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
  currentUid,
  loading,
  onBack,
  onSelectTab,
  onOpenSettings,
  onEdit,
  letterUrl,
  saveCardImage,
  onPrintAllEscort,
  printingAllEscort,
  onPrintAllCards,
  printingAllCards,
}: ReviewScreenProps) {
  const cardEnabled = project.cardConfig.enabled;
  const escortEnabled = project.escortConfig.enabled;
  const cardOrient = project.cardConfig.orient;

  const kinds: EditorTab[] = [
    "letter",
    ...(cardEnabled ? (["card"] as const) : []),
    ...(escortEnabled ? (["escort"] as const) : []),
  ];
  const [kind, setKind] = useState<EditorTab>("letter");
  const [sort, setSort] = useState<SortKey>("createdDesc");
  const search = useSearchQuery();
  const [shown, setShown] = useState(PAGE_SIZE);
  const [showPrintGuide, setShowPrintGuide] = useState(false);

  const curKind = kinds.includes(kind) ? kind : "letter";
  // どの対象でも全ゲストぶんを並べる。伏せられたお手紙は「お手紙」でも枚数に入り、
  // 本文の位置だけがぼかしになる(作成者フィルタのアイコンにも出る)。
  const base = letters;
  const creatorFilter = useCreatorFilter(base, currentUid, project.memberCount);

  // 「名前順」は確認している対象の名前で並べる。
  const nameOf = (l: Letter) =>
    curKind === "card"
      ? cardNameFor(l, project.cardConfig)
      : curKind === "escort"
        ? escortNameFor(l, project.escortConfig)
        : l.to;

  const target = useMemo(() => {
    const list = creatorFilter.apply(base).filter((l) =>
      matchesQuery(search.query, {
        to: l.to,
        cardName: cardNameFor(l, project.cardConfig),
        escortName: escortNameFor(l, project.escortConfig),
        tableNo: l.tableNo ?? "",
      })
    );
    switch (sort) {
      case "createdAsc":
        list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        break;
      case "nameAsc":
        list.sort((a, b) => nameOf(a).localeCompare(nameOf(b), "ja"));
        break;
      default:
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
    }
    return list;
    // creatorFilter.apply は creatorFilter.value に、nameOf は curKind と設定にしか依存しない。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, creatorFilter.value, search.query, sort, curKind, project.cardConfig, project.escortConfig]);

  const sortOptions = useMemo<SortOption<SortKey>[]>(
    () => [
      { value: "createdDesc", label: "追加が新しい順" },
      { value: "createdAsc", label: "追加が古い順" },
      { value: "nameAsc", label: `${KIND_NAME_LABEL[curKind]}順` },
    ],
    [curKind]
  );

  // 対象・作成者・検索・並び替えを変えたら先頭から数え直す(render 中の派生)。
  const listKey = `${kind}|${creatorFilter.value}|${search.query}|${sort}`;
  const [prevKey, setPrevKey] = useState(listKey);
  if (prevKey !== listKey) {
    setPrevKey(listKey);
    setShown(PAGE_SIZE);
  }

  const warned = target.filter((l) => warningOf(l, curKind)).length;
  const visible = target.slice(0, shown);

  // 一括印刷ボタン: エスコートカードはどちらのスタイルでも、席札は
  // 横向き/縦向き(91×55mm・55×91mm)と tent-l(91×110mm)のときだけ対応する
  // (tent-p は対象外)。
  const showEscortPrint = curKind === "escort" && escortEnabled && target.length > 0;
  const showCardPrint =
    curKind === "card" &&
    cardEnabled &&
    (cardOrient === "landscape" || cardOrient === "portrait" || cardOrient === "tent-l") &&
    target.length > 0;
  const guideVariant: GuideVariant =
    showEscortPrint && project.escortConfig.style === "ticket"
      ? "ticket"
      : showCardPrint && cardOrient === "tent-l"
        ? "card91x110"
        : "card91x55";
  const bulkPrintHandler = showEscortPrint ? onPrintAllEscort : onPrintAllCards;
  const bulkPrinting = showEscortPrint ? printingAllEscort : printingAllCards;

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

      {/* 確認する対象 */}
      {kinds.length > 1 && (
        <div
          style={{
            display: "inline-flex",
            gap: 4,
            background: "rgba(211,165,180,0.16)",
            borderRadius: 999,
            padding: 4,
            flexWrap: "wrap",
            marginBottom: 10,
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
                  background: active ? COLOR.surface : "transparent",
                  color: active ? COLOR.ink : COLOR.inkMuted,
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

      {showPrintGuide && (
        <PrintGuideModal variant={guideVariant} onClose={() => setShowPrintGuide(false)} />
      )}

      {/* 件数・作成者・並び替え。お手紙一覧・一括編集と同じツールバーを使う。 */}
      {!loading && base.length > 0 && (
        <ListToolbar
          totalCount={target.length}
          countPrefix={KIND_COUNT_LABEL[curKind]}
          countUnit="通"
          sortValue={sort}
          sortOptions={sortOptions}
          onSortChange={setSort}
          filter={
            creatorFilter.show ? (
              <CreatorFilter
                options={creatorFilter.options}
                value={creatorFilter.value}
                allValue={CREATOR_ALL}
                onChange={creatorFilter.setValue}
              />
            ) : undefined
          }
        />
      )}

      {!loading && base.length > 0 && (
        <SearchField
          search={search}
          placeholder={LETTER_SEARCH_PLACEHOLDER}
          ariaLabel="確認するお手紙を検索"
        />
      )}

      {/*
        検索欄のすぐ下の一行。左に未入力の件数、右に一括印刷。
        印刷ボタンは折り返しても右端に残るよう marginLeft:auto で押し出す。
      */}
      {!loading && (warned > 0 || showEscortPrint || showCardPrint) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            marginTop: 10,
          }}
        >
          {warned > 0 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 10px 3px 8px",
                borderRadius: 999,
                background: COLOR.warnBg,
                color: COLOR.warnInk,
                fontSize: FONT_SIZE.label,
                letterSpacing: "0.03em",
              }}
            >
              <CircleAlert size={13} strokeWidth={2} aria-hidden="true" style={{ flex: "none" }} />
              未入力
              <strong style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{warned}</strong>
            </span>
          )}
          {(showEscortPrint || showCardPrint) && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
              <button
                type="button"
                onClick={() => bulkPrintHandler(target)}
                disabled={bulkPrinting}
                className={styles.btnOutline}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "9px 20px",
                  borderRadius: 999,
                  border: `1px solid ${COLOR.border}`,
                  background: COLOR.surfaceRaised,
                  color: COLOR.ink,
                  fontSize: FONT_SIZE.bodySm,
                  letterSpacing: "0.06em",
                  cursor: bulkPrinting ? "default" : "pointer",
                  opacity: bulkPrinting ? 0.6 : 1,
                }}
              >
                <Printer size={14} strokeWidth={1.8} aria-hidden="true" style={{ flex: "none" }} />
                {bulkPrinting ? "準備しています…" : "印刷する"}
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
                  border: `1px solid ${COLOR.border}`,
                  background: COLOR.surfaceRaised,
                  color: COLOR.inkMuted,
                  cursor: "pointer",
                }}
              >
                <CircleQuestionMark size={15} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      )}

      {(loading || target.length === 0) && (
        <p
          style={{
            margin: "10px 0 18px",
            fontSize: FONT_SIZE.caption,
            color: COLOR.inkSoft,
            letterSpacing: "0.05em",
          }}
        >
          {loading
            ? "読み込んでいます…"
            : base.length > 0
              ? "条件に一致するお手紙が見つかりませんでした"
              : "まだお手紙がありません"}
        </p>
      )}

      <div
        style={{
          display: "grid",
          gap: 18,
          gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
          marginTop: 14,
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
            saveCardImage={saveCardImage}
          />
        ))}
      </div>

      {target.length > shown && (
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
            border: `1px solid ${COLOR.border}`,
            background: COLOR.surfaceRaised,
            color: COLOR.ink,
            fontSize: FONT_SIZE.bodySm,
            letterSpacing: "0.08em",
            cursor: "pointer",
          }}
        >
          さらに表示（残り {target.length - shown} 件）
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
  saveCardImage: (ref: RefObject<HTMLDivElement | null>, filename: string) => void;
}

const CARD_KIND_FILE_PREFIX: Record<EditorTab, string> = {
  letter: "letter",
  card: "qr-card",
  escort: "escort-card",
};

function ReviewCard({ letter, index, kind, project, warning, qrUrl, onEdit, saveCardImage }: ReviewCardProps) {
  const theme = THEMES[letter.theme];
  const cardConf = project.cardConfig;
  const escortConf = project.escortConfig;
  const faceRef = useRef<HTMLDivElement>(null);
  // 伏せられたお手紙の「お手紙」。中身が手元に無いので、画像保存も編集もできない。
  const locked = kind === "letter" && Boolean(letter.hidden);

  return (
    <article
      style={{
        background: COLOR.surface,
        border: `1px solid ${COLOR.divider}`,
        borderRadius: 16,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 11,
        boxShadow: "0 6px 20px rgba(150,110,130,0.1)",
      }}
    >
      {kind === "letter" && (
        <div ref={faceRef}>
          <LetterPreviewFace
            to={letter.to}
            body={letter.body}
            photos={letterPhotosFor(letter, project.letterConfig)}
            date={project.date}
            font={FONTS[project.letterConfig.font].family}
            theme={theme}
            padding="18px 14px"
            hiddenBody={locked}
          />
        </div>
      )}

      {kind === "card" && (
        <div style={stage(theme)}>
          <QrCardFace
            ref={faceRef}
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
            ref={faceRef}
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
            color: COLOR.inkFaint,
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
              color: COLOR.warnInk,
              background: COLOR.warnBg,
              borderRadius: 999,
              padding: "3px 9px",
            }}
          >
            {warning}
          </span>
        )}
        {locked ? (
          <span
            role="img"
            aria-label={HIDDEN_BODY_NOTE}
            title={HIDDEN_BODY_NOTE}
            style={{ ...iconBtnStyle, color: COLOR.inkMuted, cursor: "default" }}
          >
            <Lock size={14} strokeWidth={1.8} aria-hidden="true" />
          </span>
        ) : (
          <>
            <button
              type="button"
              onClick={() => saveCardImage(faceRef, `${CARD_KIND_FILE_PREFIX[kind]}-${index}.png`)}
              aria-label="画像として保存"
              title="画像として保存"
              className={styles.btnOutline}
              style={iconBtnStyle}
            >
              <Download size={14} strokeWidth={1.8} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onEdit}
              aria-label="編集"
              title="編集"
              className={styles.btnOutline}
              style={iconBtnStyle}
            >
              <Pencil size={14} strokeWidth={1.8} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </article>
  );
}

const iconBtnStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 32,
  height: 32,
  flex: "none",
  borderRadius: "50%",
  border: `1px solid ${COLOR.border}`,
  background: COLOR.surfaceRaised,
  color: COLOR.ink,
  cursor: "pointer",
} as const;

function stage(theme: (typeof THEMES)[keyof typeof THEMES]) {
  return {
    borderRadius: 12,
    background: `linear-gradient(175deg, ${theme.bg1} 0%, ${theme.g1} 55%, ${theme.g2} 100%)`,
    padding: "18px 14px",
    display: "flex",
    justifyContent: "center",
  } as const;
}

/**
 * 印刷ガイドの敷き詰めパターン。ticket = チケット風(4枚/A4)、
 * card91x55 = 91×55mm/55×91mm(10枚/A4)、card91x110 = tent-l 91×110mm(4枚/A4)。
 */
type GuideVariant = "ticket" | "card91x55" | "card91x110";

// A4(210×297mm)への敷き詰め方。SVG の viewBox をそのまま mm 単位として使い、実寸比率で描く。
const GUIDE_PAGE_W = 210;
const GUIDE_PAGE_H = 297;

// チケット風: 182×65mm を 14mm(左右) / 18.5mm(上下) の余白で1列4枚。
const TICKET_MARGIN_X = 14;
const TICKET_MARGIN_Y = 18.5;
const TICKET_CARD_W = 182;
const TICKET_CARD_H = 65;
const TICKET_TEAR_X = TICKET_MARGIN_X + 137;

// 91×55mm: 14mm(左右) / 11mm(上下) の余白で2列5行(計10枚)、隙間なし。
const CARD_MARGIN_X = 14;
const CARD_MARGIN_Y = 11;
const CARD_W = 91;
const CARD_H = 55;
const CARD_COLS = 2;
const CARD_ROWS = 5;

// tent-l 91×110mm(二つ折り、開くと91×55mm): 14mm(左右) / 38.5mm(上下) の余白で2列2行(計4枚)。
const TENT_MARGIN_X = 14;
const TENT_MARGIN_Y = 38.5;
const TENT_CARD_W = 91;
const TENT_CARD_H = 110;
const TENT_COLS = 2;
const TENT_ROWS = 2;

// 寸法線を引くための余白(左・上)。左側は "18.5" が入る幅を確保する。
const GUIDE_DIM_PAD_L = 32;
const GUIDE_DIM_PAD_T = 18;

/*
 * 印刷ガイド図の作図色。UI ではなく「印刷物の見え方をなぞる図」なので、
 * COLOR トークンとは別に、ここだけで完結させる。
 */
/* eslint-disable no-restricted-syntax -- 印刷ガイド図の作図色 */
const GUIDE_COLOR = {
  /** 用紙の外形 */
  page: "#D8C4CB",
  /** カードの面 */
  cardFill: "#FBF0EE",
  /** カードの外形 */
  cardEdge: "#E3C9CE",
  /** 切り取り線・カットガイド */
  cut: "#C98A9C",
  /** 折り線 */
  fold: "#B78A9B",
  /** 寸法線 */
  dimLine: "#B79AA3",
};
/* eslint-enable no-restricted-syntax */

const DIM_LINE_COLOR = GUIDE_COLOR.dimLine;
const DIM_TEXT_COLOR = COLOR.inkSoft;

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

/** チケット風(4枚/A4)の寸法線とカード配置。 */
function TicketGuideSvg() {
  return (
    <>
      <HDim
        x={0}
        y={-8}
        segments={[
          { w: TICKET_MARGIN_X, label: "14" },
          { w: 137, label: "137" },
          { w: TICKET_CARD_W - 137, label: "45" },
          { w: TICKET_MARGIN_X, label: "14" },
        ]}
      />
      <VDim
        x={-10}
        y={0}
        segments={[
          { h: TICKET_MARGIN_Y, label: "18.5" },
          { h: TICKET_CARD_H, label: "65" },
          { h: TICKET_CARD_H, label: "65" },
          { h: TICKET_CARD_H, label: "65" },
          { h: TICKET_CARD_H, label: "65" },
          { h: TICKET_MARGIN_Y, label: "18.5" },
        ]}
      />
      {[0, 1, 2, 3].map((i) => {
        const y = TICKET_MARGIN_Y + i * TICKET_CARD_H;
        return (
          <g key={i}>
            {i > 0 && (
              <line x1={0} y1={y} x2={210} y2={y} stroke={GUIDE_COLOR.cut} strokeWidth="1" strokeDasharray="4 3" />
            )}
            <rect
              x={TICKET_MARGIN_X}
              y={y}
              width={TICKET_CARD_W}
              height={TICKET_CARD_H}
              fill={GUIDE_COLOR.cardFill}
              stroke={GUIDE_COLOR.cardEdge}
              strokeWidth="0.75"
            />
            <line
              x1={TICKET_TEAR_X}
              y1={y}
              x2={TICKET_TEAR_X}
              y2={y + TICKET_CARD_H}
              stroke={GUIDE_COLOR.fold}
              strokeWidth="1"
              strokeDasharray="2.5 2"
            />
          </g>
        );
      })}
    </>
  );
}

/** 91×55mm(10枚/A4、2列×5行)の寸法線とカード配置。カード同士に隙間はない。 */
function Card91x55GuideSvg() {
  return (
    <>
      <HDim
        x={0}
        y={-8}
        segments={[
          { w: CARD_MARGIN_X, label: "14" },
          { w: CARD_W, label: "91" },
          { w: CARD_W, label: "91" },
          { w: CARD_MARGIN_X, label: "14" },
        ]}
      />
      <VDim
        x={-10}
        y={0}
        segments={[
          { h: CARD_MARGIN_Y, label: "11" },
          { h: CARD_H, label: "55" },
          { h: CARD_H, label: "55" },
          { h: CARD_H, label: "55" },
          { h: CARD_H, label: "55" },
          { h: CARD_H, label: "55" },
          { h: CARD_MARGIN_Y, label: "11" },
        ]}
      />
      {Array.from({ length: CARD_ROWS }, (_, r) =>
        Array.from({ length: CARD_COLS }, (_, c) => {
          const x = CARD_MARGIN_X + c * CARD_W;
          const y = CARD_MARGIN_Y + r * CARD_H;
          return (
            <g key={`${r}-${c}`}>
              {r > 0 && c === 0 && (
                <line
                  x1={0}
                  y1={y}
                  x2={GUIDE_PAGE_W}
                  y2={y}
                  stroke={GUIDE_COLOR.cut}
                  strokeWidth="1"
                  strokeDasharray="4 3"
                />
              )}
              {c > 0 && r === 0 && (
                <line
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={GUIDE_PAGE_H}
                  stroke={GUIDE_COLOR.cut}
                  strokeWidth="1"
                  strokeDasharray="4 3"
                />
              )}
              <rect x={x} y={y} width={CARD_W} height={CARD_H} fill={GUIDE_COLOR.cardFill} stroke={GUIDE_COLOR.cardEdge} strokeWidth="0.75" />
            </g>
          );
        })
      )}
    </>
  );
}

/** tent-l 91×110mm(4枚/A4、2列×2行)の寸法線とカード配置。カード同士に隙間はない。 */
function Card91x110GuideSvg() {
  return (
    <>
      <HDim
        x={0}
        y={-8}
        segments={[
          { w: TENT_MARGIN_X, label: "14" },
          { w: TENT_CARD_W, label: "91" },
          { w: TENT_CARD_W, label: "91" },
          { w: TENT_MARGIN_X, label: "14" },
        ]}
      />
      <VDim
        x={-10}
        y={0}
        segments={[
          { h: TENT_MARGIN_Y, label: "38.5" },
          { h: TENT_CARD_H, label: "110" },
          { h: TENT_CARD_H, label: "110" },
          { h: TENT_MARGIN_Y, label: "38.5" },
        ]}
      />
      {Array.from({ length: TENT_ROWS }, (_, r) =>
        Array.from({ length: TENT_COLS }, (_, c) => {
          const x = TENT_MARGIN_X + c * TENT_CARD_W;
          const y = TENT_MARGIN_Y + r * TENT_CARD_H;
          return (
            <g key={`${r}-${c}`}>
              {r > 0 && c === 0 && (
                <line
                  x1={0}
                  y1={y}
                  x2={GUIDE_PAGE_W}
                  y2={y}
                  stroke={GUIDE_COLOR.cut}
                  strokeWidth="1"
                  strokeDasharray="4 3"
                />
              )}
              {c > 0 && r === 0 && (
                <line
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={GUIDE_PAGE_H}
                  stroke={GUIDE_COLOR.cut}
                  strokeWidth="1"
                  strokeDasharray="4 3"
                />
              )}
              <rect
                x={x}
                y={y}
                width={TENT_CARD_W}
                height={TENT_CARD_H}
                fill={GUIDE_COLOR.cardFill}
                stroke={GUIDE_COLOR.cardEdge}
                strokeWidth="0.75"
              />
              <line
                x1={x}
                y1={y + TENT_CARD_H / 2}
                x2={x + TENT_CARD_W}
                y2={y + TENT_CARD_H / 2}
                stroke={GUIDE_COLOR.fold}
                strokeWidth="1"
                strokeDasharray="2.5 2"
              />
            </g>
          );
        })
      )}
    </>
  );
}

/**
 * 「印刷する」の隣のヘルプアイコンから開く、A4への配置と切り方の説明。
 * <main> は fadeup アニメーション由来で computed transform が none に戻らず
 * position:fixed の containing block になってしまうため、body 直下へ portal する。
 */
function PrintGuideModal({ variant, onClose }: { variant: GuideVariant; onClose: () => void }) {
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
          background: COLOR.surface,
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
              color: COLOR.ink,
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
              color: COLOR.inkMuted,
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
          aria-label={
            variant === "ticket"
              ? "A4用紙にエスコートカードを4枚配置し、各部の寸法(単位mm)を示した図"
              : variant === "card91x110"
                ? "A4用紙にカードを4枚配置し、各部の寸法(単位mm)を示した図"
                : "A4用紙にカードを10枚配置し、各部の寸法(単位mm)を示した図"
          }
        >
          <rect x="0" y="0" width={GUIDE_PAGE_W} height={GUIDE_PAGE_H} fill={COLOR.surfaceRaised} stroke={GUIDE_COLOR.page} strokeWidth="1.5" />
          {variant === "ticket" ? (
            <TicketGuideSvg />
          ) : variant === "card91x110" ? (
            <Card91x110GuideSvg />
          ) : (
            <Card91x55GuideSvg />
          )}
        </svg>
        <p
          style={{
            margin: "-6px 0 0",
            textAlign: "center",
            fontSize: FONT_SIZE.micro,
            color: COLOR.inkFaint,
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
            color: COLOR.inkSoft,
            lineHeight: 1.7,
            letterSpacing: "0.03em",
          }}
        >
          {variant === "ticket" ? (
            <>
              <li>・横のピンクの点線 = 1枚ずつの切り分け線</li>
              <li>・中央の点線 = お名前側と半券を切り離すミシン目</li>
            </>
          ) : variant === "card91x110" ? (
            <>
              <li>・ピンクの点線 = 1枚ずつの切り分け線(隙間なく並びます)</li>
              <li>・中央の点線 = 山折りにする折り線(91×55mmの二つ折りになります)</li>
            </>
          ) : (
            <li>・ピンクの点線 = 1枚ずつの切り分け線(隙間なく並びます)</li>
          )}
        </ul>
      </div>
    </div>,
    document.body
  );
}
