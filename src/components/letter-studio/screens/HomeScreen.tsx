"use client";

import { CalendarDays, CalendarHeart, Mail } from "lucide-react";
import { useMemo, useState } from "react";
import styles from "../letter-studio.module.css";
import type { EventSummary } from "../types";
import { ListToolbar, type SortOption } from "./ListToolbar";
import { FONT_SIZE } from "@/lib/typography";

interface HomeScreenProps {
  projects: EventSummary[];
  loading: boolean;
  onOpen: (id: string) => void;
  onNew: () => void;
}

type SortKey = "createdDesc" | "createdAsc" | "nameAsc" | "dateAsc";

const SORT_OPTIONS: SortOption<SortKey>[] = [
  { value: "createdDesc", label: "追加が新しい順" },
  { value: "createdAsc", label: "追加が古い順" },
  { value: "nameAsc", label: "名前順" },
  { value: "dateAsc", label: "挙式日が近い順" },
];

const PAGE_SIZE = 9;

function sortProjects(projects: EventSummary[], sort: SortKey): EventSummary[] {
  const sorted = [...projects];
  switch (sort) {
    case "createdAsc":
      sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      break;
    case "nameAsc":
      sorted.sort((a, b) => a.name.localeCompare(b.name, "ja"));
      break;
    case "dateAsc":
      sorted.sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return a.date.localeCompare(b.date);
      });
      break;
    case "createdDesc":
    default:
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
  }
  return sorted;
}

export function HomeScreen({ projects, loading, onOpen, onNew }: HomeScreenProps) {
  const [sort, setSort] = useState<SortKey>("createdDesc");
  const [page, setPage] = useState(1);
  const [prevSort, setPrevSort] = useState(sort);
  if (prevSort !== sort) {
    setPrevSort(sort);
    setPage(1);
  }

  const sorted = useMemo(() => sortProjects(projects, sort), [projects, sort]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <main
      className={styles.fadeup}
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "36px clamp(16px,4vw,40px) 80px",
      }}
    >
      <h2 style={{ margin: "0 0 4px", fontSize: FONT_SIZE.title, fontWeight: 600, letterSpacing: "0.14em" }}>
        イベント
      </h2>
      <p style={{ margin: "0 0 24px", fontSize: FONT_SIZE.label, color: "#8C7676", letterSpacing: "0.05em" }}>
        イベントごとのお手紙をまとめて管理できます
      </p>

      <button
        type="button"
        onClick={onNew}
        className={styles.dashedAdd}
        style={{
          width: "100%",
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
          marginBottom: 20,
        }}
      >
        <span style={{ fontSize: FONT_SIZE.title, fontWeight: 300, lineHeight: 1 }}>+</span>
        新しいイベント
      </button>

      {!loading && projects.length > 0 && (
        <ListToolbar
          totalCount={projects.length}
          countUnit="件"
          sortValue={sort}
          sortOptions={SORT_OPTIONS}
          onSortChange={setSort}
          page={currentPage}
          pageCount={pageCount}
          onPageChange={setPage}
        />
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
          gap: 18,
        }}
      >
        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                background: "#FFFCF8",
                borderRadius: 16,
                padding: "24px 22px",
                boxShadow: "0 8px 28px rgba(150,110,130,0.14)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                className={styles.skeleton}
                style={{ height: 40, width: 40, borderRadius: 12, marginBottom: 4 }}
              />
              <div className={styles.skeleton} style={{ height: 18, width: "65%" }} />
              <div className={styles.skeleton} style={{ height: 12, width: "35%" }} />
              <div
                className={styles.skeleton}
                style={{ height: 12, width: "45%", marginTop: 12 }}
              />
            </div>
          ))}
        {!loading &&
          paged.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onOpen(p.id)}
              className={styles.cardTile}
              style={{
                textAlign: "left",
                background: "#FFFCF8",
                border: "none",
                borderRadius: 16,
                padding: "22px 22px 20px",
                boxShadow: "0 8px 28px rgba(150,110,130,0.14)",
                display: "flex",
                flexDirection: "column",
                gap: 7,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "linear-gradient(135deg,#FBEEF2,#F3D9E3)",
                    border: "1px solid #F0E2E7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "none",
                  }}
                >
                  <CalendarHeart size={20} strokeWidth={1.6} color="#B7899A" />
                </span>
                <span
                  style={{
                    fontSize: FONT_SIZE.micro,
                    fontWeight: 600,
                    letterSpacing: "0.24em",
                    color: "#C6A5B2",
                  }}
                >
                  EVENT
                </span>
              </div>
              <span
                style={{
                  fontSize: FONT_SIZE.heading,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  color: "#5C4A4A",
                }}
              >
                {p.name}
              </span>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: FONT_SIZE.caption,
                  color: "#8C7676",
                  letterSpacing: "0.08em",
                }}
              >
                <CalendarDays
                  size={13}
                  strokeWidth={1.7}
                  color="#B08A99"
                  aria-hidden="true"
                  style={{ flex: "none" }}
                />
                {p.date || "日付未定"}
              </span>
              <span
                style={{
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: FONT_SIZE.caption,
                  color: "#B08A99",
                  letterSpacing: "0.06em",
                  borderTop: "1px dashed #F0E2E7",
                  paddingTop: 10,
                  width: "100%",
                }}
              >
                <Mail size={13} strokeWidth={1.7} aria-hidden="true" style={{ flex: "none" }} />
                お手紙 {p.letterCount} 通
              </span>
            </button>
          ))}
      </div>
    </main>
  );
}
