"use client";

import { forwardRef } from "react";

export type LetterPhase = "closed" | "opening" | "leaving" | "gone";

interface EnvelopeSceneProps {
  phase: LetterPhase;
  toName: string;
  font: string;
  ink: string;
  paper: string;
  rule: string;
  accent: string;
}

export const EnvelopeScene = forwardRef<HTMLDivElement, EnvelopeSceneProps>(
  function EnvelopeScene({ phase, toName, font, ink, paper, rule, accent }, ref) {
    const opening = phase !== "closed";
    const leaving = phase === "leaving" || phase === "gone";

    const envAnim =
      phase === "closed"
        ? "wl-env-in 1.2s cubic-bezier(0.22,1,0.36,1) both, wl-bob 3.6s ease-in-out 1.2s infinite"
        : "none";
    const envT = leaving ? "translateY(72px) scale(0.92)" : "none";
    const envO = leaving ? 0 : 1;
    const flapT = opening ? "rotateX(178deg)" : "none";
    const flapZ = opening ? 0 : 3;
    const flapTr = opening
      // z-index はフラップが 90 度を越えて裏返る頃(≒1.25s)に落とす。
      // 便箋がせり上がり始める 1.35s より後だと、開いた三角が便箋に被さる。
      ? "transform 1.3s cubic-bezier(0.4,0,0.2,1) 0.65s, z-index 0s 1.25s"
      : "transform 0.7s cubic-bezier(0.45,0,0.2,1)";
    const peekT = opening ? "translateY(-56%)" : "none";
    const sealAnim = opening ? "wl-seal-off 1.3s cubic-bezier(0.35,0,0.55,1) forwards" : "none";

    return (
      <div
        ref={ref}
        style={{
          position: "relative",
          width: "min(320px,78vw)",
          aspectRatio: 1.5,
          perspective: 900,
          animation: envAnim,
          transform: envT,
          opacity: envO,
          transition: "transform 1.3s cubic-bezier(0.4,0,0.5,0.6), opacity 1.1s ease 0.15s",
          filter: "drop-shadow(0 18px 30px rgba(150,110,130,0.22))",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: "55%",
            zIndex: flapZ,
            background: "linear-gradient(180deg,#FDF7F3 0%,#F6E9E2 100%)",
            clipPath: "polygon(0 0, 100% 0, 50% 100%)",
            transformOrigin: "top center",
            transform: flapT,
            transition: flapTr,
            boxShadow: "inset 0 -1px 0 rgba(180,140,155,0.2)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(160deg,#FFFDFB 0%,#FBF3EE 100%)",
            borderRadius: 6,
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "7%",
              right: "7%",
              top: "9%",
              bottom: 0,
              background: paper,
              borderRadius: "4px 4px 0 0",
              boxShadow: "0 -2px 10px rgba(150,110,130,0.12)",
              backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 14px, ${rule} 14px 15px)`,
              transform: peekT,
              transition: "transform 1.7s cubic-bezier(0.25,1,0.4,1) 1.35s",
              zIndex: 1,
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 2,
              borderRadius: 6,
              background: "linear-gradient(160deg,#FFFDFB 0%,#F9EFE9 100%)",
              clipPath: "polygon(0 28%, 50% 62%, 100% 28%, 100% 100%, 0 100%)",
              boxShadow: "inset 0 0 0 1px rgba(180,140,155,0.18)",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "71%",
              zIndex: 3,
              textAlign: "center",
              fontFamily: font,
              fontSize: "clamp(17px,4.2vw,20px)",
              letterSpacing: "0.18em",
              color: ink,
              pointerEvents: "none",
            }}
          >
            {toName}
            <span
              style={{
                display: "block",
                width: "5.5em",
                margin: "4px auto 0",
                borderBottom: "1px solid rgba(180,140,155,0.4)",
              }}
            />
          </div>
        </div>
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%",
            top: "52%",
            zIndex: 4,
            width: 58,
            height: 58,
            transform: "translate(-50%,-50%) rotate(-3deg)",
            borderRadius: "46% 54% 51% 49% / 53% 47% 55% 45%",
            background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${accent} 62%, white), ${accent} 55%, color-mix(in srgb, ${accent} 78%, #5A3A48))`,
            boxShadow:
              "0 3px 8px rgba(140,100,115,0.35), inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(140,100,115,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: sealAnim,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 8,
              borderRadius: "50%",
              boxShadow:
                "inset 0 1px 3px rgba(140,100,115,0.4), inset 0 -1px 2px rgba(255,255,255,0.2)",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: -4,
              bottom: 8,
              width: 12,
              height: 10,
              background: `color-mix(in srgb, ${accent} 85%, #5A3A48)`,
              borderRadius: "40% 60% 55% 45% / 55% 45% 60% 40%",
            }}
          />
          {/* ロゴと同じ二枚花びらの刻印。下端(15,20.4)で重なるように左右へ倒している。 */}
          <svg
            viewBox="0 0 30 30"
            fill="#FFF6F0"
            stroke="#FFF6F0"
            strokeWidth="0.5"
            style={{ width: 30, height: 30, position: "relative", zIndex: 1 }}
          >
            {/* 花びらは上に寄った左右非対称の形なので、外接矩形が真ん中に来るよう寄せる。 */}
            <g transform="translate(-0.55 2.8)">
              <ellipse
                cx="15"
                cy="12.6"
                rx="4.3"
                ry="7.8"
                fillOpacity="0.5"
                transform="rotate(-17 15 20.4)"
              />
              <ellipse
                cx="15"
                cy="11.6"
                rx="4.8"
                ry="8.4"
                fillOpacity="0.78"
                transform="rotate(19 15 20.4)"
              />
            </g>
          </svg>
        </div>
      </div>
    );
  }
);
