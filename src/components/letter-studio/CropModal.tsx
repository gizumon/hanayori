"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { PillButton } from "./controls";
import { useScrollLock } from "@/hooks/useScrollLock";
import { FONT_SIZE } from "@/lib/typography";
import { IMAGE_MAX_WIDTH, encodeCanvas } from "./imageEncode";
import { COLOR } from "@/lib/palette";

/** 切り取り枠の縦横比の選択肢 1 つ。 */
export interface CropAspectOption {
  /** ピルに出す文言。選択肢が 1 つのときはピルを出さないので要らない。 */
  label?: string;
  /** 幅 / 高さ。null = 元の写真と同じ比率(枠が写真全体に広がる)。 */
  value: number | null;
}

interface CropModalProps {
  /** 元画像の dataUrl */
  src: string;
  /**
   * 切り取り枠の縦横比。1 つだけ渡すとその比率に固定、複数渡すと画面で選べる
   * (先頭が初期値)。カードのように置き場所の形が決まっているところは固定、
   * お手紙のように形が自由なところは選ばせる。
   */
  aspects: CropAspectOption[];
  /** true = 枠を円で描く(エスコートカードの丸い写真用)。 */
  round?: boolean;
  onCancel: () => void;
  onApply: (dataUrl: string, ratio: number) => void;
}

interface Frame {
  x: number;
  y: number;
  w: number;
}

type DragMode = "move" | "nw" | "ne" | "sw" | "se";

const HANDLE_SIZE = 16;

/**
 * アップロードした写真の上に枠を重ね、枠のドラッグで位置、四隅ハンドルの
 * ドラッグで大きさを調整して切り取るモーダル。枠の縦横比は `aspects` で決まり、
 * 選択肢を複数渡したときだけ画面で選び直せる(選び直すと枠は中央の最大に戻る)。
 */
export function CropModal({ src, aspects, round, onCancel, onApply }: CropModalProps) {
  useScrollLock();
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [disp, setDisp] = useState<{ w: number; h: number } | null>(null);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [applying, setApplying] = useState(false);
  const [pick, setPick] = useState(0);
  // 「元のまま」(null)は写真を読み込むまで比率が分からないので natural から決める。
  const picked = aspects[pick]?.value ?? null;
  const aspect = picked ?? (natural ? natural.w / natural.h : 1);
  const dragRef = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    f: Frame;
  } | null>(null);

  const stop = (e: ReactMouseEvent) => e.stopPropagation();

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const maxW = Math.min(420, window.innerWidth * 0.86);
      const maxH = window.innerHeight * 0.52;
      const scale = Math.min(maxW / img.width, maxH / img.height, 1);
      const w = img.width * scale;
      const h = img.height * scale;
      setNatural({ w: img.width, h: img.height });
      setDisp({ w, h });
      // 収まる最大の枠を中央に置く(比率を選び直したときもここへ戻す)
      const a = picked ?? img.width / img.height;
      const fw = Math.min(w, h * a);
      setFrame({ x: (w - fw) / 2, y: (h - fw / a) / 2, w: fw });
    };
    img.src = src;
  }, [src, picked]);

  const maxFrameW = disp ? Math.min(disp.w, disp.h * aspect) : 0;
  const minFrameW = maxFrameW * 0.15;

  const clampMove = useCallback(
    (f: Frame): Frame => {
      if (!disp) return f;
      const h = f.w / aspect;
      return {
        w: f.w,
        x: Math.min(Math.max(f.x, 0), disp.w - f.w),
        y: Math.min(Math.max(f.y, 0), disp.h - h),
      };
    },
    [disp, aspect]
  );

  /** 四隅ドラッグ: mode の対角を固定点にして幅を変える */
  const resizeFromCorner = useCallback(
    (mode: Exclude<DragMode, "move">, dx: number, dy: number, f: Frame): Frame => {
      if (!disp) return f;
      const fh = f.w / aspect;
      // 対角(固定点)
      const ax = mode === "nw" || mode === "sw" ? f.x + f.w : f.x;
      const ay = mode === "nw" || mode === "ne" ? f.y + fh : f.y;
      // ポインタ移動量を枠の対角方向に射影して幅の増分にする
      const sx = mode === "ne" || mode === "se" ? 1 : -1;
      const sy = mode === "sw" || mode === "se" ? 1 : -1;
      const delta = (sx * dx + sy * dy * aspect) / 2;
      // 画像内に収まる最大幅(固定点からポインタ側の余白)
      const roomW = sx === 1 ? disp.w - ax : ax;
      const roomH = sy === 1 ? disp.h - ay : ay;
      const w = Math.min(Math.max(f.w + delta, minFrameW), roomW, roomH * aspect);
      const h = w / aspect;
      return {
        w,
        x: sx === 1 ? ax : ax - w,
        y: sy === 1 ? ay : ay - h,
      };
    },
    [disp, aspect, minFrameW]
  );

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!frame) return;
    e.stopPropagation();
    const mode = (e.currentTarget.dataset.mode ?? "move") as DragMode;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { mode, startX: e.clientX, startY: e.clientY, f: frame };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (d.mode === "move") {
      setFrame(clampMove({ ...d.f, x: d.f.x + dx, y: d.f.y + dy }));
    } else {
      setFrame(resizeFromCorner(d.mode, dx, dy, d.f));
    }
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const apply = () => {
    if (!frame || !disp || !natural || applying) return;
    setApplying(true);
    const img = new Image();
    img.onload = () => {
      const scale = natural.w / disp.w;
      const sx = frame.x * scale;
      const sy = frame.y * scale;
      const sw = frame.w * scale;
      const sh = sw / aspect;
      const outW = Math.min(IMAGE_MAX_WIDTH, Math.round(sw));
      const outH = Math.round(outW / aspect);
      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
      onApply(encodeCanvas(canvas), +aspect.toFixed(4));
    };
    img.src = src;
  };

  const frameH = frame ? frame.w / aspect : 0;

  const handleStyle = (mode: Exclude<DragMode, "move">) => {
    const half = HANDLE_SIZE / 2;
    return {
      position: "absolute" as const,
      width: HANDLE_SIZE,
      height: HANDLE_SIZE,
      borderRadius: "50%",
      background: COLOR.surfaceRaised,
      border: `2px solid ${COLOR.accent}`,
      boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
      left: mode === "nw" || mode === "sw" ? -half : undefined,
      right: mode === "ne" || mode === "se" ? -half : undefined,
      top: mode === "nw" || mode === "ne" ? -half : undefined,
      bottom: mode === "sw" || mode === "se" ? -half : undefined,
      cursor: mode === "nw" || mode === "se" ? "nwse-resize" : "nesw-resize",
      touchAction: "none" as const,
    };
  };

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(60,42,46,0.55)",
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        onClick={stop}
        style={{
          background: COLOR.surface,
          borderRadius: 18,
          padding: "20px 22px",
          boxShadow: "0 22px 60px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          maxWidth: "min(480px,92vw)",
        }}
      >
        <div style={{ fontSize: FONT_SIZE.body, fontWeight: 600, letterSpacing: "0.1em", color: COLOR.ink }}>
          写真を切り取る
        </div>
        <div style={{ fontSize: FONT_SIZE.caption, color: COLOR.inkSoft, letterSpacing: "0.05em", marginTop: -6 }}>
          枠をドラッグして位置を、四隅をドラッグして大きさを調整してください
        </div>
        {aspects.length > 1 && (
          <div
            role="group"
            aria-label="切り取る形"
            style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
          >
            {aspects.map((a, i) => (
              <PillButton
                key={a.label ?? i}
                label={a.label ?? ""}
                size="sm"
                active={i === pick}
                onClick={() => setPick(i)}
              />
            ))}
          </div>
        )}
        {disp && frame ? (
          <div
            style={{
              position: "relative",
              width: disp.w,
              height: disp.h,
              alignSelf: "center",
              borderRadius: 8,
              touchAction: "none",
              userSelect: "none",
            }}
          >
            {/* dataUrl のローカルプレビューなので next/image は使わない */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              draggable={false}
              style={{ width: "100%", height: "100%", display: "block", borderRadius: 8 }}
            />
            {/* 枠の外を暗くするオーバーレイ(ハンドルが枠の外に出るので clip は親と分ける) */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 8,
                overflow: "hidden",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: frame.x,
                  top: frame.y,
                  width: frame.w,
                  height: frameH,
                  borderRadius: round ? "50%" : 4,
                  boxShadow: "0 0 0 9999px rgba(60,42,46,0.55)",
                }}
              />
            </div>
            <div
              data-mode="move"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              style={{
                position: "absolute",
                left: frame.x,
                top: frame.y,
                width: frame.w,
                height: frameH,
                border: `2px solid ${COLOR.surfaceRaised}`,
                borderRadius: round ? "50%" : 4,
                cursor: "move",
                touchAction: "none",
              }}
            >
              {(["nw", "ne", "sw", "se"] as const).map((m) => (
                <div
                  key={m}
                  data-mode={m}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  style={handleStyle(m)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div style={{ padding: 40, textAlign: "center", color: COLOR.inkFaint, fontSize: FONT_SIZE.label }}>
            読み込み中…
          </div>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "10px 20px",
              borderRadius: 999,
              border: `1px solid ${COLOR.border}`,
              background: COLOR.surfaceRaised,
              color: COLOR.ink,
              fontSize: FONT_SIZE.label,
              letterSpacing: "0.06em",
              cursor: "pointer",
            }}
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={!frame || applying}
            style={{
              padding: "10px 24px",
              borderRadius: 999,
              border: "none",
              background: COLOR.accent,
              color: COLOR.onAccent,
              fontSize: FONT_SIZE.label,
              letterSpacing: "0.06em",
              cursor: applying ? "default" : "pointer",
              opacity: applying ? 0.6 : 1,
            }}
          >
            {applying ? "切り取り中…" : "切り取る"}
          </button>
        </div>
      </div>
    </div>
  );
}
