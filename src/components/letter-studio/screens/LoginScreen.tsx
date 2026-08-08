"use client";

import { BrandMark } from "../BrandMark";
import styles from "../letter-studio.module.css";
import { AuthForm } from "./AuthForm";
import { FONT_SIZE } from "@/lib/typography";
import { COLOR } from "@/lib/palette";

export function LoginScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        className={styles.fadeupSlow}
        style={{
          width: "min(400px,92vw)",
          background: COLOR.surface,
          borderRadius: 20,
          padding: "44px 26px 32px",
          boxShadow: "0 20px 60px rgba(150,110,130,0.2)",
          textAlign: "center",
        }}
      >
        <BrandMark size={116} />
        <h1
          style={{
            margin: "0 0 6px",
            fontFamily: "'Shippori Mincho', serif",
            fontSize: FONT_SIZE.display,
            fontWeight: 500,
            letterSpacing: "0.2em",
            color: COLOR.ink,
          }}
        >
          Hanayori
        </h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            justifyContent: "center",
            margin: "0 0 6px",
          }}
        >
          <span
            style={{
              flex: 1,
              maxWidth: 60,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${COLOR.accent})`,
            }}
          />
          <span aria-hidden="true" style={{ fontSize: FONT_SIZE.overline, color: COLOR.accent }}>
            ◈
          </span>
          <span
            style={{
              flex: 1,
              maxWidth: 60,
              height: 1,
              background: `linear-gradient(90deg, ${COLOR.accent}, transparent)`,
            }}
          />
        </div>
        <p style={{ margin: "0 0 4px", fontSize: FONT_SIZE.caption, letterSpacing: "0.32em", color: COLOR.accentInk }}>
          花嫁のお便り
        </p>
        <p
          style={{
            margin: "0 0 28px",
            fontSize: FONT_SIZE.bodySm,
            letterSpacing: "0.1em",
            color: COLOR.inkSoft,
            lineHeight: 1.8,
          }}
        >
          結婚式のお手紙を、大切なあの人へ。
        </p>

        <AuthForm />
      </div>
    </div>
  );
}
