"use client";

import { ChevronDown, Plus, Search, SquarePen, UserPlus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FONTS } from "../constants";
import { fieldStyle } from "../controls";
import styles from "../letter-studio.module.css";
import type { EventTab, Letter, Project } from "../types";
import { EventHeader } from "./EventHeader";
import { LetterRow } from "./LetterRow";
import { ListToolbar, type SortOption } from "./ListToolbar";
import { FONT_SIZE } from "@/lib/typography";

const addMenuItemStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  width: "100%",
  padding: "10px 12px",
  border: "none",
  background: "none",
  textAlign: "left" as const,
  borderRadius: 10,
  cursor: "pointer",
};

const addMenuIconStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 30,
  height: 30,
  borderRadius: 9,
  background: "#F6E9ED",
  flex: "none",
  marginTop: 1,
};

const addMenuTitleStyle = {
  fontSize: FONT_SIZE.bodySm,
  fontWeight: 600,
  letterSpacing: "0.04em",
  color: "#5C4A4A",
};

const addMenuCaptionStyle = {
  fontSize: FONT_SIZE.caption,
  letterSpacing: "0.03em",
  color: "#8C7676",
  lineHeight: 1.5,
  marginTop: 2,
};

type SortKey = "createdDesc" | "createdAsc" | "nameAsc";

const SORT_OPTIONS: SortOption<SortKey>[] = [
  { value: "createdDesc", label: "追加が新しい順" },
  { value: "createdAsc", label: "追加が古い順" },
  { value: "nameAsc", label: "宛名順" },
];

const PAGE_SIZE = 8;

function sortLetters(letters: Letter[], sort: SortKey): Letter[] {
  const sorted = [...letters];
  switch (sort) {
    case "createdAsc":
      sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      break;
    case "nameAsc":
      sorted.sort((a, b) => a.to.localeCompare(b.to, "ja"));
      break;
    case "createdDesc":
    default:
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
  }
  return sorted;
}

interface ProjectScreenProps {
  project: Project;
  letters: Letter[];
  loadingLetters: boolean;
  onBack: () => void;
  onOpenSettings: () => void;
  onSelectTab: (tab: EventTab) => void;
  onBulkAdd: () => void;
  onNewLetter: () => void;
  onEditLetter: (letter: Letter) => void;
  onShowQr: (letter: Letter) => void;
  onShowEscort: (letter: Letter) => void;
  onCopyLink: (id: string) => void;
  onDeleteLetter: (letter: Letter) => void;
  deletingLetter: boolean;
  letterUrl: (id: string) => string;
  cardNameFor: (letter: Letter) => string;
  escortNameFor: (letter: Letter) => string;
}

export function ProjectScreen({
  project,
  letters,
  loadingLetters,
  onBack,
  onOpenSettings,
  onSelectTab,
  onBulkAdd,
  onNewLetter,
  onEditLetter,
  onShowQr,
  onShowEscort,
  onCopyLink,
  onDeleteLetter,
  deletingLetter,
  letterUrl,
  cardNameFor,
  escortNameFor,
}: ProjectScreenProps) {
  const cardEnabled = project.cardConfig.enabled;
  const escortEnabled = project.escortConfig.enabled;
  const pFont = FONTS[project.letterConfig.font].family;
  const cFont = FONTS[project.cardConfig.font].family;

  const [sort, setSort] = useState<SortKey>("createdDesc");
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE_SIZE);

  // 入力から300ms経ってから絞り込みに反映する(打鍵のたびに再計算しない)。
  useEffect(() => {
    const timer = setTimeout(() => setQuery(queryInput), 300);
    return () => clearTimeout(timer);
  }, [queryInput]);
  // 並び替え/検索を変えたら先頭から数え直す(render 中の派生)。
  const [prevSort, setPrevSort] = useState(sort);
  const [prevQuery, setPrevQuery] = useState(query);
  if (prevSort !== sort || prevQuery !== query) {
    setPrevSort(sort);
    setPrevQuery(query);
    setShown(PAGE_SIZE);
  }

  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!addMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setAddMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAddMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [addMenuOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return letters;
    return letters.filter((l) => {
      const to = l.to.toLowerCase();
      const card = cardNameFor(l).toLowerCase();
      const escort = escortNameFor(l).toLowerCase();
      const table = (l.tableNo ?? "").toLowerCase();
      return to.includes(q) || card.includes(q) || escort.includes(q) || table.includes(q);
    });
  }, [letters, query, cardNameFor, escortNameFor]);
  const sorted = useMemo(() => sortLetters(filtered, sort), [filtered, sort]);
  const visible = sorted.slice(0, shown);

  return (
    <main
      className={styles.fadeup}
      style={{ maxWidth: 960, margin: "0 auto", padding: "28px clamp(16px,4vw,40px) 80px" }}
    >
      <EventHeader
        project={project}
        currentTab="list"
        onBack={onBack}
        onSelectTab={onSelectTab}
        onOpenSettings={onOpenSettings}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div ref={addMenuRef} style={{ position: "relative", display: "inline-block" }}>
          <button
            type="button"
            onClick={() => setAddMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={addMenuOpen}
            className={styles.btnSolid}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 18px 12px 22px",
              borderRadius: 999,
              border: "none",
              background: "#D3A5B4",
              color: "#FFF9F5",
              fontSize: FONT_SIZE.body,
              fontWeight: 600,
              letterSpacing: "0.06em",
              boxShadow: "0 6px 16px rgba(211,165,180,0.35)",
            }}
          >
            <Plus size={17} strokeWidth={2} aria-hidden="true" style={{ flex: "none" }} />
            お手紙を追加
            <ChevronDown
              size={15}
              strokeWidth={2}
              aria-hidden="true"
              style={{
                flex: "none",
                marginLeft: 2,
                transform: addMenuOpen ? "rotate(180deg)" : undefined,
                transition: "transform 0.15s ease",
              }}
            />
          </button>
          {addMenuOpen && (
            <div
              role="menu"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                zIndex: 10,
                width: "min(300px,88vw)",
                background: "#FFFFFF",
                border: "1px solid #EBD9DF",
                borderRadius: 14,
                boxShadow: "0 14px 38px rgba(150,110,130,0.24)",
                padding: 6,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setAddMenuOpen(false);
                  onNewLetter();
                }}
                className={styles.optionRow}
                style={addMenuItemStyle}
              >
                <span style={addMenuIconStyle}>
                  <SquarePen size={15} strokeWidth={1.8} color="#B08A99" aria-hidden="true" />
                </span>
                <span style={{ display: "flex", flexDirection: "column" }}>
                  <span style={addMenuTitleStyle}>1通ずつ書く</span>
                  <span style={addMenuCaptionStyle}>宛名から本文まで、その場で仕上げます</span>
                </span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setAddMenuOpen(false);
                  onBulkAdd();
                }}
                className={styles.optionRow}
                style={addMenuItemStyle}
              >
                <span style={addMenuIconStyle}>
                  <UserPlus size={15} strokeWidth={1.8} color="#B08A99" aria-hidden="true" />
                </span>
                <span style={{ display: "flex", flexDirection: "column" }}>
                  <span style={addMenuTitleStyle}>名前をまとめて追加</span>
                  <span style={addMenuCaptionStyle}>宛名だけ一気に登録。本文はあとで書けます</span>
                </span>
              </button>
            </div>
          )}
        </div>
        {!loadingLetters && letters.length > 0 && (
          <ListToolbar
            totalCount={sorted.length}
            countUnit="通"
            sortValue={sort}
            sortOptions={SORT_OPTIONS}
            onSortChange={setSort}
          />
        )}
        {!loadingLetters && letters.length > 0 && (
          <div style={{ position: "relative", maxWidth: 360, marginBottom: 4 }}>
            <Search
              size={15}
              strokeWidth={1.8}
              aria-hidden="true"
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#B08A99",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="宛名・席札・エスコートカード名・テーブル名で検索"
              aria-label="お手紙を検索"
              className={styles.field}
              style={fieldStyle({ width: "100%", padding: "9px 34px 9px 34px" })}
            />
            {queryInput && (
              <button
                type="button"
                onClick={() => {
                  setQueryInput("");
                  setQuery("");
                }}
                aria-label="検索をクリア"
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  border: "none",
                  background: "transparent",
                  color: "#B08A99",
                  cursor: "pointer",
                }}
              >
                <X size={14} strokeWidth={1.8} aria-hidden="true" />
              </button>
            )}
          </div>
        )}
        {!loadingLetters && letters.length === 0 && (
          <p
            style={{
              margin: "2px 0 4px",
              fontSize: FONT_SIZE.bodySm,
              color: "#B4A2A2",
              letterSpacing: "0.04em",
            }}
          >
            まだお手紙がありません。上のボタンから最初の1通を追加しましょう。
          </p>
        )}
        {!loadingLetters && letters.length > 0 && sorted.length === 0 && (
          <p
            style={{
              margin: "2px 0 4px",
              fontSize: FONT_SIZE.bodySm,
              color: "#B4A2A2",
              letterSpacing: "0.04em",
            }}
          >
            検索条件に一致するお手紙が見つかりませんでした。
          </p>
        )}
        {loadingLetters &&
          Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: "#FFFCF8",
                borderRadius: 14,
                padding: "16px 20px",
                boxShadow: "0 6px 20px rgba(150,110,130,0.12)",
              }}
            >
              <div
                className={styles.skeleton}
                style={{ width: 42, height: 42, borderRadius: 12, flex: "none" }}
              />
              <div style={{ flex: 1, minWidth: 160, display: "flex", flexDirection: "column", gap: 8 }}>
                <div className={styles.skeleton} style={{ height: 16, width: "30%" }} />
                <div className={styles.skeleton} style={{ height: 12, width: "55%" }} />
              </div>
            </div>
          ))}
        {!loadingLetters &&
          visible.map((l) => (
            <LetterRow
              key={l.id}
              letter={l}
              cardEnabled={cardEnabled}
              escortEnabled={escortEnabled}
              pFont={pFont}
              cFont={cFont}
              cardName={cardNameFor(l)}
              letterUrl={letterUrl(l.id)}
              deletingLetter={deletingLetter}
              onEdit={() => onEditLetter(l)}
              onShowQr={() => onShowQr(l)}
              onShowEscort={() => onShowEscort(l)}
              onCopyLink={() => onCopyLink(l.id)}
              onDelete={() => onDeleteLetter(l)}
            />
          ))}
        {!loadingLetters && sorted.length > shown && (
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE_SIZE)}
            className={styles.btnOutline}
            style={{
              display: "block",
              width: "100%",
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
            さらに表示（残り {sorted.length - shown} 件）
          </button>
        )}
      </div>

      <h4
        style={{
          margin: "36px 0 4px",
          fontSize: FONT_SIZE.body,
          fontWeight: 600,
          letterSpacing: "0.12em",
          color: "#8C7676",
        }}
      >
        全手紙共通ページ
      </h4>
      <p style={{ margin: "0 0 14px", fontSize: FONT_SIZE.caption, color: "#B4A2A2", letterSpacing: "0.05em" }}>
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
            <div style={{ fontSize: FONT_SIZE.body, letterSpacing: "0.1em", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: FONT_SIZE.overline, letterSpacing: "0.08em" }}>Coming soon</div>
          </div>
        ))}
      </div>
    </main>
  );
}
