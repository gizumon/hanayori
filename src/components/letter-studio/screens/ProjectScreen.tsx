"use client";

import { Settings, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { FONTS } from "../constants";
import styles from "../letter-studio.module.css";
import type { Letter, Project } from "../types";
import { LetterRow } from "./LetterRow";
import { ListToolbar, type SortOption } from "./ListToolbar";
import { FONT_SIZE } from "@/lib/typography";

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
  onBulkEdit: () => void;
  onNewLetter: () => void;
  onEditLetter: (letter: Letter) => void;
  onShowQr: (letter: Letter) => void;
  onShowEscort: (letter: Letter) => void;
  onCopyLink: (id: string) => void;
  onDeleteLetter: (letter: Letter) => void;
  deletingLetter: boolean;
  letterUrl: (id: string) => string;
  cardNameFor: (letter: Letter) => string;
}

export function ProjectScreen({
  project,
  letters,
  loadingLetters,
  onBack,
  onOpenSettings,
  onBulkEdit,
  onNewLetter,
  onEditLetter,
  onShowQr,
  onShowEscort,
  onCopyLink,
  onDeleteLetter,
  deletingLetter,
  letterUrl,
  cardNameFor,
}: ProjectScreenProps) {
  const cardEnabled = project.cardConfig.enabled;
  const escortEnabled = project.escortConfig.enabled;
  const pFont = FONTS[project.letterConfig.font].family;
  const cFont = FONTS[project.cardConfig.font].family;

  const [sort, setSort] = useState<SortKey>("createdDesc");
  const [page, setPage] = useState(1);
  const [prevSort, setPrevSort] = useState(sort);
  if (prevSort !== sort) {
    setPrevSort(sort);
    setPage(1);
  }

  const sorted = useMemo(() => sortLetters(letters, sort), [letters, sort]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
          fontSize: FONT_SIZE.label,
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
          <h2 style={{ margin: "0 0 4px", fontSize: FONT_SIZE.title, fontWeight: 600, letterSpacing: "0.12em" }}>
            {project.name}
          </h2>
          <p style={{ margin: 0, fontSize: FONT_SIZE.label, color: "#8C7676", letterSpacing: "0.08em" }}>
            {project.date}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {letters.length > 0 && (
            <button
              type="button"
              onClick={onBulkEdit}
              className={styles.btnOutline}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "10px 20px",
                borderRadius: 999,
                border: "1px solid #EBD9DF",
                background: "#FFFFFF",
                color: "#5C4A4A",
                fontSize: FONT_SIZE.bodySm,
                letterSpacing: "0.08em",
              }}
            >
              <SlidersHorizontal
                size={14}
                strokeWidth={1.8}
                aria-hidden="true"
                style={{ flex: "none", color: "#B08A99" }}
              />
              一括編集
            </button>
          )}
          <button
            type="button"
            onClick={onOpenSettings}
            className={styles.btnOutline}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "10px 20px",
              borderRadius: 999,
              border: "1px solid #EBD9DF",
              background: "#FFFFFF",
              color: "#5C4A4A",
              fontSize: FONT_SIZE.bodySm,
              letterSpacing: "0.08em",
            }}
          >
            <Settings size={14} strokeWidth={1.8} aria-hidden="true" style={{ flex: "none", color: "#B08A99" }} />
            共通設定
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button
          type="button"
          onClick={onNewLetter}
          className={styles.dashedAdd}
          style={{
            background: "transparent",
            border: "1.5px dashed #D3A5B4",
            borderRadius: 14,
            color: "#B08A99",
            fontSize: FONT_SIZE.body,
            letterSpacing: "0.1em",
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: FONT_SIZE.title, fontWeight: 300, lineHeight: 1 }}>+</span>
          新しいお手紙を書く
        </button>
        {!loadingLetters && letters.length > 0 && (
          <ListToolbar
            totalCount={letters.length}
            countUnit="通"
            sortValue={sort}
            sortOptions={SORT_OPTIONS}
            onSortChange={setSort}
            page={currentPage}
            pageCount={pageCount}
            onPageChange={setPage}
          />
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
          paged.map((l) => (
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
