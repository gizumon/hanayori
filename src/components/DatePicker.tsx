"use client";

import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { isoToJaDate } from "@/lib/date";
import { FONT_SIZE } from "@/lib/typography";

const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"];

interface DatePickerProps {
  /** "yyyy-mm-dd", "" = 未設定 */
  value: string;
  onChange: (iso: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

function parseIso(iso: string): { y: number; m: number; d: number } | null {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]) - 1, d: Number(match[3]) };
}

function toIso(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** カレンダーの週グリッド。前後月の余白セルは null。 */
function buildWeeks(y: number, m: number): (number | null)[][] {
  const firstDow = new Date(y, m, 1).getDay();
  const total = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDow).fill(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** 軽量な日付ピッカー(依存追加なし)。値は input[type=date] と同じ ISO 文字列。 */
export function DatePicker({ value, onChange, disabled, placeholder = "日付を選択" }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const parsed = parseIso(value);
  const today = new Date();
  const [view, setView] = useState(() => ({
    y: parsed?.y ?? today.getFullYear(),
    m: parsed?.m ?? today.getMonth(),
  }));
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const p = parseIso(value);
    const t = new Date();
    setView({ y: p?.y ?? t.getFullYear(), m: p?.m ?? t.getMonth() });
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const weeks = buildWeeks(view.y, view.m);
  const isToday = (d: number) =>
    d === today.getDate() && view.m === today.getMonth() && view.y === today.getFullYear();
  const isSelected = (d: number) =>
    !!parsed && parsed.y === view.y && parsed.m === view.m && parsed.d === d;

  const changeMonth = (delta: number) => {
    setView((v) => {
      const m = v.m + delta;
      return { y: v.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 };
    });
  };

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 rounded-[10px] border px-3 py-[9px] text-left transition-colors ${
          disabled
            ? "cursor-default border-[#EBD9DF] bg-[#F2ECEC] text-[#B0A0A0]"
            : "cursor-pointer border-[#EBD9DF] bg-white text-[#5C4A4A] focus:border-[#D3A5B4]"
        }`}
        style={{ fontSize: FONT_SIZE.input, outline: "none" }}
      >
        <span className={value ? undefined : "text-[#B0A0A0]"}>
          {value ? isoToJaDate(value) : placeholder}
        </span>
        <span className="flex flex-none items-center gap-1">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange("");
                }
              }}
              aria-label="日付をクリア"
              className="flex h-5 w-5 items-center justify-center rounded-full text-[#B08A99] hover:bg-[#FBF1F4]"
            >
              <X size={13} />
            </span>
          )}
          <CalendarIcon size={16} className="text-[#B08A99]" aria-hidden="true" />
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="日付を選択"
          className="absolute left-0 z-20 mt-1.5 w-[272px] rounded-xl border border-[#EBD9DF] bg-white p-3 shadow-[0_12px_30px_rgba(80,50,60,0.18)]"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="前の月"
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#8C7676] hover:bg-[#FBF1F4]"
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: FONT_SIZE.label }} className="font-medium tracking-wide text-[#5C4A4A]">
              {view.y}年{view.m + 1}月
            </span>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="次の月"
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#8C7676] hover:bg-[#FBF1F4]"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {WEEKDAYS_JA.map((w, i) => (
              <span
                key={w}
                style={{ fontSize: FONT_SIZE.micro }}
                className={i === 0 ? "text-[#C97D89]" : i === 6 ? "text-[#7A93B0]" : "text-[#B08A99]"}
              >
                {w}
              </span>
            ))}
            {weeks.map((week, wi) =>
              week.map((d, di) => (
                <div key={`${wi}-${di}`} className="flex items-center justify-center py-0.5">
                  {d ? (
                    <button
                      type="button"
                      onClick={() => {
                        onChange(toIso(view.y, view.m, d));
                        setOpen(false);
                      }}
                      style={{ fontSize: FONT_SIZE.bodySm }}
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                        isSelected(d)
                          ? "bg-[#D3A5B4] text-[#FFF9F5]"
                          : isToday(d)
                            ? "border border-[#D3A5B4] text-[#5C4A4A] hover:bg-[#FBF1F4]"
                            : di === 0
                              ? "text-[#C97D89] hover:bg-[#FBF1F4]"
                              : di === 6
                                ? "text-[#7A93B0] hover:bg-[#FBF1F4]"
                                : "text-[#5C4A4A] hover:bg-[#FBF1F4]"
                      }`}
                    >
                      {d}
                    </button>
                  ) : (
                    <span className="h-8 w-8" />
                  )}
                </div>
              )),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
