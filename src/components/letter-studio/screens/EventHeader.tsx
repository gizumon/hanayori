"use client";

import { Settings } from "lucide-react";
import { MemberAvatars } from "../MemberAvatars";
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
      {/* 戻る導線と同じ段の右端に共通設定を置く。イベント名まわりは
          「このイベントが何か」だけにして、設定はページの操作として離す。 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
        }}
      >
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
          }}
        >
          ← イベント一覧
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

      <div style={{ marginBottom: 16 }}>
        <h2
          style={{
            margin: "0 0 6px",
            fontSize: FONT_SIZE.title,
            fontWeight: 600,
            letterSpacing: "0.12em",
          }}
        >
          {project.name}
        </h2>

        {/* 共同編集はドロワーの奥(メンバータブ)にあって気づけないので、
            入口を日付の隣にも出す。顔が並ぶだけで「誰と作っているか」は伝わる。 */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {project.date && (
            <p style={{ margin: 0, fontSize: FONT_SIZE.label, color: COLOR.inkSoft, letterSpacing: "0.08em" }}>
              {project.date}
            </p>
          )}
          <MemberAvatars members={project.members} onOpen={() => onOpenSettings("members")} />
        </div>
      </div>

      <EventTabs current={currentTab} onSelect={onSelectTab} />
    </div>
  );
}
