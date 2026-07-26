"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FONTS, THEMES } from "@/components/letter-studio/constants";
import type { FontKey, ThemeKey } from "@/components/letter-studio/types";
import { withAlpha } from "@/lib/color";
import { EnvelopeScene, type LetterPhase } from "./EnvelopeScene";
import { Petals } from "./Petals";
import styles from "./wedding-letter.module.css";

interface LetterViewProps {
  to: string;
  body: string;
  theme: ThemeKey;
  photo: string | null;
  photoRatio?: number;
  date: string | null;
  font: FontKey;
}

export function LetterView({ to, body, theme: themeKey, photo, photoRatio, date, font: fontKey }: LetterViewProps) {
  const [phase, setPhase] = useState<LetterPhase>("closed");
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [overlayImg, setOverlayImg] = useState<string | null>(null);

  const captureRef = useRef<HTMLDivElement | null>(null);
  const envelopeRef = useRef<HTMLDivElement | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const theme = THEMES[themeKey] ?? THEMES.rose;
  const fontFamily = FONTS[fontKey]?.family ?? FONTS.yomogi.family;

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(""), 2600);
  }, []);

  const burst = useCallback(() => {
    const env = envelopeRef.current;
    if (!env) return;
    const rect = env.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * 0.25;
    for (let i = 0; i < 9; i++) {
      const p = document.createElement("div");
      p.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:8px;height:10px;background:${
        i % 2 ? "#EBD3A6" : theme.gold
      };border-radius:60% 40% 55% 45% / 50% 55% 45% 50%;pointer-events:none;z-index:45`;
      document.body.appendChild(p);
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.9;
      const dist = 60 + Math.random() * 90;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist + 40;
      const anim = p.animate(
        [
          { transform: "translate(0,0) rotate(0deg) scale(1)", opacity: 0.9 },
          {
            transform: `translate(${dx * 0.7}px, ${Math.sin(angle) * dist * 0.9}px) rotate(${
              120 + Math.random() * 120
            }deg)`,
            opacity: 0.85,
            offset: 0.45,
          },
          {
            transform: `translate(${dx}px, ${dy}px) rotate(${260 + Math.random() * 160}deg) scale(0.7)`,
            opacity: 0,
          },
        ],
        { duration: 1400 + Math.random() * 500, easing: "cubic-bezier(0.2,0.6,0.4,1)", fill: "forwards" }
      );
      anim.onfinish = () => p.remove();
    }
  }, [theme.gold]);

  const open = useCallback(() => {
    setPhase((p) => {
      if (p !== "closed") return p;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return "gone";
      }
      const schedule = (fn: () => void, ms: number) => {
        timers.current.push(setTimeout(fn, ms));
      };
      schedule(burst, 1350);
      schedule(() => setPhase("leaving"), 2100);
      schedule(() => setPhase("gone"), 3000);
      return "opening";
    });
  }, [burst]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", onKey);
    const pendingTimers = timers.current;
    return () => {
      window.removeEventListener("keydown", onKey);
      pendingTimers.forEach(clearTimeout);
    };
  }, [open]);

  const saveImage = useCallback(async () => {
    if (!captureRef.current) return;
    setSaving(true);
    toast("画像を作成しています…");
    try {
      const { default: html2canvas } = await import("html2canvas");
      if (document.fonts?.ready) await document.fonts.ready;
      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: theme.bg1,
      });
      setOverlayImg(canvas.toDataURL("image/png"));
    } catch (err) {
      console.error(err);
      toast("保存に失敗しました。もう一度お試しください");
    }
    setSaving(false);
  }, [theme.bg1, toast]);

  const leaving = phase === "leaving" || phase === "gone";
  const sceneVisible = phase !== "gone";
  const saveShown = phase === "gone";

  const lines = body.split("\n").map((s, i) => ({
    text: s === "" ? " " : s,
    delay: `${0.5 + Math.min(i, 18) * 0.12}s`,
  }));

  return (
    <>
      <div
        ref={captureRef}
        className="wedding-letter-root"
        style={{
          fontFamily,
          position: "relative",
          minHeight: "100vh",
          overflow: "hidden",
          color: theme.ink,
          background: `radial-gradient(ellipse 120% 60% at 50% -10%, ${theme.bg2} 0%, transparent 60%), linear-gradient(175deg, ${theme.bg1} 0%, ${theme.g1} 55%, ${theme.g2} 100%)`,
        }}
      >
        <Petals color={theme.gold} />
        <main
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: 660,
            margin: "0 auto",
            padding: "clamp(40px,8vh,84px) 18px clamp(70px,10vh,110px)",
            opacity: leaving ? 1 : 0,
            transform: `translateY(${leaving ? "0px" : "26px"})`,
            transition: "opacity 1s ease, transform 1s cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <div
            style={{
              position: "relative",
              background: theme.paper,
              padding: "clamp(56px,10vw,84px) clamp(28px,7vw,64px) clamp(48px,8vw,68px)",
              boxShadow:
                "0 1px 2px rgba(120,90,100,0.08), 0 12px 40px rgba(140,105,120,0.18), 0 30px 70px rgba(140,105,120,0.12)",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 12,
                border: `1px solid ${withAlpha(theme.accent, 38)}`,
                pointerEvents: "none",
              }}
            />
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 16,
                border: `1px solid ${withAlpha(theme.accent, 18)}`,
                pointerEvents: "none",
              }}
            />
            <div aria-hidden="true" style={{ display: "flex", justifyContent: "center", margin: "0 0 1.8em" }}>
              <svg
                viewBox="0 0 120 28"
                fill="none"
                stroke={theme.gold}
                strokeWidth="1.1"
                strokeLinecap="round"
                style={{ width: 120, height: 28, opacity: 0.9 }}
              >
                <path d="M14 15 H44 M76 15 H106" />
                <path
                  d="M60 7.5 C56.8 11 56.8 17.5 60 21.5 C63.2 17.5 63.2 7.5 60 7.5 Z"
                  fill={theme.gold}
                  stroke="none"
                  opacity="0.8"
                />
                <path d="M50 15 C53 13 55.5 13 58 14.2 M70 15 C67 13 64.5 13 62 14.2" />
                <circle cx="48" cy="15" r="1.3" fill={theme.gold} stroke="none" />
                <circle cx="72" cy="15" r="1.3" fill={theme.gold} stroke="none" />
              </svg>
            </div>
            <h1
              style={{
                fontFamily,
                fontWeight: 400,
                fontSize: "clamp(23px,5vw,28px)",
                letterSpacing: "0.16em",
                margin: "0 0 1.4em",
                textAlign: "center",
                display: "block",
              }}
            >
              {to}
            </h1>
            <div style={{ fontSize: "clamp(15px,3.6vw,16.5px)", lineHeight: "2.4em", letterSpacing: "0.06em" }}>
              {lines.map((line, i) => (
                <div
                  key={i}
                  style={{
                    minHeight: "2.4em",
                    opacity: leaving ? 1 : 0,
                    transform: `translateY(${leaving ? "0px" : "6px"})`,
                    transition: `opacity 0.8s ease ${line.delay}, transform 0.8s ease ${line.delay}`,
                  }}
                >
                  {line.text}
                </div>
              ))}
            </div>
            {photo && (
              <div
                style={{
                  margin: "2.8em auto 0",
                  width: "min(78%,330px)",
                  background: "#FFFFFF",
                  padding: "9px 9px 24px",
                  boxShadow: "0 4px 18px rgba(140,105,120,0.16)",
                  transform: "rotate(-0.8deg)",
                }}
              >
                <div
                  role="img"
                  aria-label="思い出の写真"
                  style={{
                    width: "100%",
                    aspectRatio: photoRatio || 1.3333,
                    backgroundImage: `url('${photo}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              </div>
            )}
            <div aria-hidden="true" style={{ display: "flex", justifyContent: "center", gap: 7, marginTop: "2.1em" }}>
              <span
                style={{
                  width: 6,
                  height: 8,
                  background: theme.gold,
                  borderRadius: "60% 40% 55% 45% / 50% 55% 45% 50%",
                  opacity: 0.75,
                }}
              />
              <span
                style={{
                  width: 6,
                  height: 8,
                  background: theme.gold,
                  borderRadius: "60% 40% 55% 45% / 50% 55% 45% 50%",
                  transform: "rotate(40deg) translateY(-2px)",
                  opacity: 0.55,
                }}
              />
              <span
                style={{
                  width: 6,
                  height: 8,
                  background: theme.gold,
                  borderRadius: "60% 40% 55% 45% / 50% 55% 45% 50%",
                  transform: "rotate(-35deg)",
                  opacity: 0.65,
                }}
              />
            </div>
            <p
              style={{
                fontFamily,
                fontSize: "clamp(13.5px,3.2vw,15px)",
                letterSpacing: "0.2em",
                color: theme.inkSoft,
                textAlign: "center",
                margin: "2.6em 0 0",
              }}
            >
              {date}
            </p>
          </div>
        </main>
      </div>

      {sceneVisible && (
        <div
          role="button"
          tabIndex={0}
          aria-label="封筒を開けて手紙を読む"
          onClick={open}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 34,
            cursor: "pointer",
            background: `radial-gradient(ellipse 120% 60% at 50% -10%, ${theme.bg2} 0%, transparent 60%), linear-gradient(175deg, ${theme.bg1} 0%, ${theme.g1} 55%, ${theme.g2} 100%)`,
            opacity: leaving ? 0 : 1,
            pointerEvents: leaving ? "none" : "auto",
            transition: "opacity 0.9s ease 0.15s",
          }}
        >
          <EnvelopeScene
            ref={envelopeRef}
            phase={phase}
            toName={to}
            font={fontFamily}
            ink={theme.ink}
            paper={theme.paper}
            rule={theme.rule}
            accent={theme.accent}
          />
          <p
            style={{
              fontFamily: "'Shippori Mincho', serif",
              fontSize: 13,
              letterSpacing: "0.35em",
              color: theme.inkSoft,
              margin: 0,
              animation: phase === "closed" ? "wl-hint-fade 2.6s ease-in-out infinite" : "none",
              opacity: phase === "closed" ? 1 : 0,
              transition: "opacity 0.4s ease",
            }}
          >
            タップして開く
          </p>
        </div>
      )}

      {saveShown && (
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: "fixed",
            left: "50%",
            bottom: 12,
            transform: "translateX(-50%)",
            zIndex: 30,
            fontFamily: "'Shippori Mincho', serif",
            fontSize: 11,
            letterSpacing: "0.1em",
            color: theme.inkSoft,
            opacity: 0.45,
            textDecoration: "none",
          }}
        >
          Hanayori
        </a>
      )}

      {saveShown && (
        <button
          type="button"
          onClick={saveImage}
          disabled={saving}
          aria-label="手紙を画像として保存"
          className={styles.saveButton}
          style={{
            position: "fixed",
            right: 20,
            bottom: 20,
            zIndex: 50,
            width: 56,
            height: 56,
            border: "none",
            borderRadius: "50%",
            background: theme.accent,
            color: "#FFF9F5",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 6px 18px rgba(150,110,130,0.35)",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ width: 22, height: 22 }}
          >
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M5 21h14" />
          </svg>
        </button>
      )}

      {toastMsg && (
        <div
          role="status"
          style={{
            position: "fixed",
            right: 20,
            bottom: 86,
            zIndex: 50,
            background: "rgba(92,74,74,0.92)",
            color: "#FFF9F5",
            fontSize: 12.5,
            letterSpacing: "0.08em",
            padding: "8px 14px",
            borderRadius: 8,
            pointerEvents: "none",
          }}
        >
          {toastMsg}
        </div>
      )}

      {overlayImg && (
        <div
          role="dialog"
          aria-label="画像の保存"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            padding: "24px 16px",
            background: "rgba(60,42,46,0.82)",
            backdropFilter: "blur(4px)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- dynamically generated data URL, not an optimizable static asset */}
          <img
            src={overlayImg}
            alt="手紙のキャプチャ画像"
            style={{
              maxWidth: "min(86vw,420px)",
              maxHeight: "62vh",
              objectFit: "contain",
              borderRadius: 6,
              boxShadow: "0 16px 50px rgba(0,0,0,0.4)",
              background: theme.bg1,
            }}
          />
          <p style={{ color: "#FFF6F0", fontSize: 13.5, letterSpacing: "0.08em", textAlign: "center", lineHeight: 1.7, margin: 0 }}>
            画像を長押しすると保存できます
            <br />
            (下のボタンからも保存できます)
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <a
              href={overlayImg}
              download="wedding-letter.png"
              style={{
                fontFamily: "inherit",
                fontSize: 13.5,
                letterSpacing: "0.06em",
                padding: "10px 20px",
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                textDecoration: "none",
                background: theme.accent,
                color: "#FFF9F5",
              }}
            >
              画像を保存
            </a>
            <button
              type="button"
              onClick={() => setOverlayImg(null)}
              style={{
                fontFamily: "inherit",
                fontSize: 13.5,
                letterSpacing: "0.06em",
                padding: "10px 20px",
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                background: "rgba(255,249,245,0.16)",
                color: "#FFF6F0",
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  );
}
