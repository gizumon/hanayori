"use client";

import { CheckCircle2, ListChecks, Mail } from "lucide-react";
import type { ComponentType } from "react";
import type { EventTab } from "../types";
import styles from "../letter-studio.module.css";
import { FONT_SIZE } from "@/lib/typography";
import { COLOR } from "@/lib/palette";

interface EventTabsProps {
  current: EventTab;
  onSelect: (tab: EventTab) => void;
}

const TABS: { key: EventTab; label: string; icon: ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
  { key: "list", label: "お手紙一覧", icon: Mail },
  { key: "bulk", label: "一括編集", icon: ListChecks },
  { key: "review", label: "確認", icon: CheckCircle2 },
];

/**
 * イベント配下のページナビゲーション(一覧 / 一括編集 / 確認)。
 * 実体は別ルートへの遷移なので、状態トグルのピルではなく下線タブの見た目にする。
 */
export function EventTabs({ current, onSelect }: EventTabsProps) {
  return (
    <nav
      aria-label="イベントの画面"
      className={styles.noScrollbar}
      style={{
        display: "flex",
        borderBottom: `1px solid ${COLOR.border}`,
        overflowX: "auto",
      }}
    >
      {TABS.map(({ key, label, icon: Icon }) => {
        const active = key === current;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            aria-current={active ? "page" : undefined}
            className={styles.tabItem}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              flex: "none",
              padding: "10px 4px 11px",
              marginRight: 24,
              border: "none",
              borderBottom: active ? `2px solid ${COLOR.accent}` : "2px solid transparent",
              background: "transparent",
              fontSize: FONT_SIZE.bodySm,
              fontWeight: active ? 600 : 400,
              letterSpacing: "0.08em",
              color: active ? COLOR.ink : COLOR.inkMuted,
              whiteSpace: "nowrap",
            }}
          >
            <Icon size={15} strokeWidth={1.8} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
