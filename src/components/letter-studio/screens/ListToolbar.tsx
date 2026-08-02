"use client";

import { ArrowUpDown, Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "../letter-studio.module.css";
import { FONT_SIZE } from "@/lib/typography";
import { COLOR } from "@/lib/palette";

export interface SortOption<T extends string> {
  value: T;
  label: string;
}

/** 並び替えの左に置く任意の絞り込み(作成者フィルタなど)。 */
export interface ToolbarFilter {
  value: string;
  options: SortOption<string>[];
  onChange: (value: string) => void;
  icon: ReactNode;
  ariaLabel: string;
}

interface ListToolbarProps<T extends string> {
  totalCount: number;
  countUnit: string;
  sortValue: T;
  sortOptions: SortOption<T>[];
  onSortChange: (value: T) => void;
  filter?: ToolbarFilter;
  page?: number;
  pageCount?: number;
  onPageChange?: (page: number) => void;
}

export function ListToolbar<T extends string>({
  totalCount,
  countUnit,
  sortValue,
  sortOptions,
  onSortChange,
  filter,
  page,
  pageCount,
  onPageChange,
}: ListToolbarProps<T>) {
  const pageBtnStyle = (disabled: boolean) => ({
    width: 28,
    height: 28,
    borderRadius: 999,
    border: `1px solid ${COLOR.border}`,
    background: COLOR.surfaceRaised,
    color: COLOR.ink,
    fontSize: FONT_SIZE.bodySm,
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
      <span
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 4,
          fontSize: FONT_SIZE.caption,
          color: COLOR.inkSoft,
          letterSpacing: "0.06em",
        }}
      >
        全
        <strong
          style={{
            fontSize: FONT_SIZE.subheading,
            fontWeight: 700,
            color: COLOR.ink,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {totalCount}
        </strong>
        {countUnit}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {filter && (
          <SelectMenu
            value={filter.value}
            options={filter.options}
            onChange={filter.onChange}
            icon={filter.icon}
            ariaLabel={filter.ariaLabel}
          />
        )}
        <SelectMenu
          value={sortValue}
          options={sortOptions}
          onChange={onSortChange}
          icon={
            <ArrowUpDown
              size={13}
              strokeWidth={1.8}
              color={COLOR.accentInk}
              aria-hidden="true"
              style={{ flex: "none" }}
            />
          }
          ariaLabel="並び替え"
        />
        {onPageChange && pageCount !== undefined && page !== undefined && pageCount > 1 && (
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
                fontSize: FONT_SIZE.caption,
                color: COLOR.inkSoft,
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

interface SelectMenuProps<T extends string> {
  value: T;
  options: SortOption<T>[];
  onChange: (value: T) => void;
  icon: ReactNode;
  ariaLabel: string;
}

/**
 * ピル型のドロップダウン。並び替えと絞り込みで共用する。
 * ブラウザ標準の select は見た目を揃えられないため、独自のポップアップにする。
 */
function SelectMenu<T extends string>({
  value,
  options,
  onChange,
  icon,
  ariaLabel,
}: SelectMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const current = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={styles.btnOutline}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "7px 14px 7px 12px",
          borderRadius: 999,
          border: `1px solid ${COLOR.border}`,
          background: COLOR.surfaceRaised,
          color: COLOR.ink,
          fontSize: FONT_SIZE.label,
          letterSpacing: "0.04em",
          cursor: "pointer",
        }}
      >
        {icon}
        {current?.label ?? ""}
        <ChevronDown
          size={14}
          strokeWidth={2}
          aria-hidden="true"
          style={{
            flex: "none",
            color: COLOR.accentInk,
            transform: open ? "rotate(180deg)" : undefined,
            transition: "transform 0.15s ease",
          }}
        />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 10,
            minWidth: 190,
            background: COLOR.surfaceRaised,
            border: `1px solid ${COLOR.border}`,
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(150,110,130,0.22)",
            padding: 6,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={styles.optionRow}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  width: "100%",
                  padding: "9px 12px",
                  border: "none",
                  borderRadius: 8,
                  background: active ? COLOR.tint : "transparent",
                  textAlign: "left",
                  fontSize: FONT_SIZE.bodySm,
                  letterSpacing: "0.04em",
                  color: active ? COLOR.accentDeep : COLOR.ink,
                  fontWeight: active ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                {opt.label}
                {active && (
                  <Check size={13} strokeWidth={2.2} aria-hidden="true" style={{ flex: "none" }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
