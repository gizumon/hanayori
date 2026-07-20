"use client";

import { BrandMark } from "../BrandMark";
import styles from "../letter-studio.module.css";

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
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
          background: "#FFFCF8",
          borderRadius: 20,
          padding: "44px 34px 34px",
          boxShadow: "0 20px 60px rgba(150,110,130,0.2)",
          textAlign: "center",
        }}
      >
        <BrandMark size={140} />
        <h1
          style={{
            margin: "0 0 6px",
            fontFamily: "'Shippori Mincho', serif",
            fontSize: 30,
            fontWeight: 500,
            letterSpacing: "0.2em",
            color: "#5C4A4A",
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
              background: "linear-gradient(90deg, transparent, #D3A5B4)",
            }}
          />
          <span aria-hidden="true" style={{ fontSize: 11, color: "#D3A5B4" }}>
            ◈
          </span>
          <span
            style={{
              flex: 1,
              maxWidth: 60,
              height: 1,
              background: "linear-gradient(90deg, #D3A5B4, transparent)",
            }}
          />
        </div>
        <p style={{ margin: "0 0 4px", fontSize: 12, letterSpacing: "0.32em", color: "#B08A99" }}>
          花嫁のお便り
        </p>
        <p
          style={{
            margin: "0 0 28px",
            fontSize: 13,
            letterSpacing: "0.1em",
            color: "#8C7676",
            lineHeight: 1.8,
          }}
        >
          結婚式のお手紙を、
          <br />
          大切なあの人へ。
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            type="button"
            onClick={onLogin}
            className={styles.btnOutline}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: "13px 18px",
              borderRadius: 999,
              border: "1px solid #EBD9DF",
              background: "#FFFFFF",
              color: "#5C4A4A",
              fontSize: 14,
              letterSpacing: "0.06em",
            }}
          >
            <svg viewBox="0 0 24 24" style={{ width: 18, height: 18 }} aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.1 3.7-8.6z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-6-2.2-6.9-5.1l-3.9 3C3.2 21.2 7.3 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.1 14.3c-.3-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3l-3.9-3C.4 8.3 0 10.1 0 12s.4 3.7 1.2 5.3l3.9-3z"
              />
              <path
                fill="#EA4335"
                d="M12 4.7c2.3 0 3.8 1 4.7 1.8l3.3-3.2C18 1.3 15.2 0 12 0 7.3 0 3.2 2.8 1.2 6.7l3.9 3c.9-2.9 3.7-5 6.9-5z"
              />
            </svg>
            Google でログイン
          </button>
          <button
            type="button"
            onClick={onLogin}
            className={styles.btnSolid}
            style={{
              padding: "13px 18px",
              borderRadius: 999,
              border: "none",
              background: "#D3A5B4",
              color: "#FFF9F5",
              fontSize: 14,
              letterSpacing: "0.06em",
            }}
          >
            メールアドレスでログイン
          </button>
        </div>
        <p style={{ margin: "22px 0 0", fontSize: 11, color: "#B4A2A2", letterSpacing: "0.06em" }}>
          プロトタイプのため実際の認証は行いません
        </p>
      </div>
    </div>
  );
}
