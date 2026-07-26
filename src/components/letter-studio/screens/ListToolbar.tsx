"use client";

import styles from "../letter-studio.module.css";
import { fieldStyle } from "../controls";

export interface SortOption<T extends string> {
  value: T;
  label: string;
}

interface ListToolbarProps<T extends string> {
  totalCount: number;
  countUnit: string;
  sortValue: T;
  sortOptions: SortOption<T>[];
  onSortChange: (value: T) => void;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

export function ListToolbar<T extends string>({
  totalCount,
  countUnit,
  sortValue,
  sortOptions,
  onSortChange,
  page,
  pageCount,
  onPageChange,
}: ListToolbarProps<T>) {
  const pageBtnStyle = (disabled: boolean) => ({
    width: 28,
    height: 28,
    borderRadius: 999,
    border: "1px solid #EBD9DF",
    background: "#FFFFFF",
    color: "#5C4A4A",
    fontSize: 13,
    lineHeight: "1",
    opacity: disabled ? 0.4 : 1,
    cursor: disabled ? "default" : "pointer",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
        margin: "2px 0 16px",
      }}
    >
      <span style={{ fontSize: 12, color: "#8C7676", letterSpacing: "0.06em" }}>
        全 {totalCount} {countUnit}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <select
          value={sortValue}
          onChange={(e) => onSortChange(e.target.value as T)}
          aria-label="並び替え"
          className={styles.field}
          style={fieldStyle({
            padding: "7px 12px",
            fontSize: 12.5,
            borderRadius: 999,
            width: "auto",
          })}
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {pageCount > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className={styles.btnOutline}
              style={pageBtnStyle(page <= 1)}
              aria-label="前のページ"
            >
              ‹
            </button>
            <span
              style={{
                fontSize: 12,
                color: "#8C7676",
                letterSpacing: "0.04em",
                minWidth: 40,
                textAlign: "center",
              }}
            >
              {page} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= pageCount}
              className={styles.btnOutline}
              style={pageBtnStyle(page >= pageCount)}
              aria-label="次のページ"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
