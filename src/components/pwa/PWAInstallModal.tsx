"use client";

import { Share, X } from "lucide-react";
import { Portal } from "@/components/Portal";
import { FONT_SIZE } from "@/lib/typography";
import { COLOR } from "@/lib/palette";

interface PWAInstallModalProps {
  onClose: () => void;
}

/** iOS Safari cannot trigger install programmatically — show the manual steps. */
export function PWAInstallModal({ onClose }: PWAInstallModalProps) {
  return (
    <Portal>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(92,74,74,0.4)", zIndex: 200 }}
      />
      <div
        className="animate-slide-up"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(90vw, 340px)",
          background: "white",
          borderRadius: 20,
          padding: 20,
          zIndex: 210,
          boxShadow: "0 8px 40px rgba(92,74,74,0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: FONT_SIZE.subheading, fontWeight: 700, color: COLOR.ink }}>ホーム画面に追加</div>
          <button
            onClick={onClose}
            style={{ padding: 6, border: "none", background: "transparent", color: COLOR.inkFaint, cursor: "pointer", display: "flex" }}
            aria-label="閉じる"
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ fontSize: FONT_SIZE.caption, color: COLOR.inkSoft, marginBottom: 14, lineHeight: 1.6 }}>
          Safari からホーム画面に追加すると、アプリのようにすぐ開けます。
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <ModalStep number={1}>
            Safari 下部の{" "}
            <span style={{ display: "inline-flex", verticalAlign: "middle", color: COLOR.accent, margin: "0 2px" }}>
              <Share size={13} />
            </span>{" "}
            <strong>共有</strong> をタップ
          </ModalStep>
          <ModalStep number={2}>
            「<strong>ホーム画面に追加</strong>」を選択
          </ModalStep>
          <ModalStep number={3}>
            右上の「<strong>追加</strong>」をタップ
          </ModalStep>
        </div>
      </div>
    </Portal>
  );
}

function ModalStep({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: FONT_SIZE.bodySm,
        color: COLOR.ink,
        background: COLOR.bg,
        borderRadius: 10,
        padding: "10px 12px",
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
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
