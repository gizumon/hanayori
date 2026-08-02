"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Portal } from "@/components/Portal";
import { isDismissedRecently, saveDismiss, usePWAInstall } from "@/hooks/usePWAInstall";
import { FONT_SIZE } from "@/lib/typography";
import { COLOR } from "@/lib/palette";

const SHOW_DELAY_MS = 3000;

export function PWAInstallBanner() {
  const { isInstalled, platform, canPrompt, promptInstall } = usePWAInstall();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isInstalled || isDismissedRecently()) return;
    if (platform === "none" && !canPrompt) return;
    const t = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [isInstalled, platform, canPrompt]);

  if (!visible || isInstalled || (!canPrompt && platform !== "ios")) return null;

  const dismiss = () => {
    setVisible(false);
    saveDismiss();
  };

  const handleInstall = async () => {
    await promptInstall();
    dismiss();
  };

  return (
    <Portal>
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "0 12px calc(12px + env(safe-area-inset-bottom))",
          zIndex: 100,
          pointerEvents: "none",
        }}
      >
        <div
          className="animate-slide-up"
          style={{
            maxWidth: 440,
            margin: "0 auto",
            background: "white",
            borderRadius: 16,
            boxShadow: "0 4px 24px rgba(92,74,74,0.16)",
            border: `1px solid ${COLOR.border}`,
            pointerEvents: "auto",
          }}
        >
          {platform === "ios" ? (
            <IOSGuide onDismiss={dismiss} />
          ) : (
            <ChromiumPrompt onInstall={handleInstall} onDismiss={dismiss} />
          )}
        </div>
      </div>
    </Portal>
  );
}

function ChromiumPrompt({ onInstall, onDismiss }: { onInstall: () => void; onDismiss: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon-192.png" alt="" width={44} height={44} style={{ borderRadius: 10, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: FONT_SIZE.body, fontWeight: 700, color: COLOR.ink }}>Hanayori をインストール</div>
        <div style={{ fontSize: FONT_SIZE.overline, color: COLOR.inkSoft, marginTop: 2 }}>ホーム画面からすぐ開けます</div>
      </div>
      <button
        onClick={onDismiss}
        style={{ padding: 6, border: "none", background: "transparent", color: COLOR.inkFaint, cursor: "pointer", flexShrink: 0, display: "flex" }}
        aria-label="閉じる"
      >
        <X size={18} />
      </button>
      <button
        onClick={onInstall}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 14px",
          background: COLOR.accent,
          color: "white",
          border: "none",
          borderRadius: 20,
          fontSize: FONT_SIZE.bodySm,
          fontWeight: 700,
          cursor: "pointer",
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}
      >
        <Download size={14} />
        インストール
      </button>
    </div>
  );
}

function IOSGuide({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div style={{ padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="" width={36} height={36} style={{ borderRadius: 8, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: FONT_SIZE.body, fontWeight: 700, color: COLOR.ink }}>ホーム画面に追加できます</div>
            <div style={{ fontSize: FONT_SIZE.overline, color: COLOR.inkSoft, marginTop: 1 }}>アプリのようにすぐ開けます</div>
          </div>
        </div>
        <button
          onClick={onDismiss}
          style={{ padding: 6, border: "none", background: "transparent", color: COLOR.inkFaint, cursor: "pointer", display: "flex", flexShrink: 0 }}
          aria-label="閉じる"
        >
          <X size={18} />
        </button>
      </div>
      <div style={{ background: COLOR.bg, borderRadius: 10, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
        <InstallStep number={1}>
          Safari 下部の{" "}
          <span style={{ display: "inline-flex", verticalAlign: "middle", color: COLOR.accent }}>
            <Share size={13} />
          </span>{" "}
          <strong>共有</strong> をタップ
        </InstallStep>
        <InstallStep number={2}>
          「<strong>ホーム画面に追加</strong>」を選択
        </InstallStep>
      </div>
    </div>
  );
}

function InstallStep({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: FONT_SIZE.caption, color: COLOR.ink }}>
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: COLOR.accent,
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: FONT_SIZE.micro,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {number}
      </span>
      <span style={{ lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}
