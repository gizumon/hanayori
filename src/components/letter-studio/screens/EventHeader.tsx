"use client";

import { Settings, Users } from "lucide-react";
import type { EventTab, Project, SettingsTab } from "../types";
import styles from "../letter-studio.module.css";
import { EventTabs } from "./EventTabs";
import { FONT_SIZE } from "@/lib/typography";
import { COLOR } from "@/lib/palette";

interface EventHeaderProps {
  project: Project;
  currentTab: EventTab;
  onBack: () => void;
  onSelectTab: (tab: EventTab) => void;
  /** 共通設定ドロワーを開く。タブ指定なしなら「基本」。 */
  onOpenSettings: (tab?: SettingsTab) => void;
}

const pillButton = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  borderRadius: 999,
  border: `1px solid ${COLOR.border}`,
  background: COLOR.surfaceRaised,
  color: COLOR.ink,
  fontSize: FONT_SIZE.label,
  letterSpacing: "0.06em",
  flex: "none",
} as const;

/**
 * 一覧・一括編集・確認の3画面で共通のヘッダー(戻る・タイトル・共通設定・タブ)。
 * 3画面とも見た目と挙動を完全に揃えるため、画面ごとに実装しない。
 */
export function EventHeader({ project, currentTab, onBack, onSelectTab, onOpenSettings }: EventHeaderProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      <button
        type="button"
        onClick={onBack}
        className={styles.linkBack}
        style={{
          border: "none",
          background: "none",
          color: COLOR.accentInk,
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
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 14,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: FONT_SIZE.title, fontWeight: 600, letterSpacing: "0.12em" }}>
            {project.name}
          </h2>
          <p style={{ margin: 0, fontSize: FONT_SIZE.label, color: COLOR.inkSoft, letterSpacing: "0.08em" }}>
            {project.date}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
          {/* 共同編集はドロワーの奥(メンバータブ)にあって気づけないので、
              入口をヘッダーにも出す。人数はイベント取得ぶんで足りる。 */}
          <button
            type="button"
            onClick={() => onOpenSettings("members")}
            className={styles.btnOutline}
            style={pillButton}
          >
            <Users size={14} strokeWidth={1.8} aria-hidden="true" style={{ flex: "none", color: COLOR.accentInk }} />
            メンバー
            <span style={{ color: COLOR.inkSoft, fontVariantNumeric: "tabular-nums" }}>
              {project.memberCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onOpenSettings("general")}
            className={styles.btnOutline}
            style={pillButton}
          >
            <Settings size={14} strokeWidth={1.8} aria-hidden="true" style={{ flex: "none", color: COLOR.accentInk }} />
            共通設定
          </button>
        </div>
      </div>

      <EventTabs current={currentTab} onSelect={onSelectTab} />
    </div>
  );
}
