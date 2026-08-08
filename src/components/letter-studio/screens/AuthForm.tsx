"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRef, useState, type SubmitEvent } from "react";
import {
  authErrorMessage,
  sendPasswordReset,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/lib/firebase/auth";
import { fieldStyle } from "../controls";
import styles from "../letter-studio.module.css";
import { FONT_SIZE } from "@/lib/typography";
import { COLOR } from "@/lib/palette";

interface AuthFormProps {
  /** サインインが成功した直後(セッションクッキー発行まで完了)に呼ばれる。 */
  onSignedIn?: () => void;
}

/** Google ボタン。この画面の主役なので少し大きく太く。 */
const googlePillStyle = {
  padding: "14px 10px",
  borderRadius: 999,
  fontSize: FONT_SIZE.body,
  fontWeight: 700,
  letterSpacing: "0.02em",
  whiteSpace: "nowrap",
} as const;

/** 「アカウント作成 / ログイン」の 2 分割ボタン。狭い画面でも折り返さない字送りにする。 */
const splitPillStyle = {
  padding: "13px 10px",
  borderRadius: 999,
  fontSize: FONT_SIZE.bodySm,
  fontWeight: 600,
  letterSpacing: "0.02em",
  whiteSpace: "nowrap",
} as const;

const legalLinkStyle = {
  color: COLOR.accentInk,
  textDecoration: "underline",
  textUnderlineOffset: "0.2em",
} as const;

/**
 * Google / メールのサインイン UI。ログイン画面と招待受諾ページ(`/join/{token}`)
 * の両方から使うため、見出しやブランド表示は持たず入力部分だけを担う。
 * 新規登録とログインは同じフォームで、押したボタンで動作が決まる。
 */
export function AuthForm({ onSignedIn }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  // 送信ボタンの type="submit" を保ったまま(= 入力チェックを効かせたまま)
  // 新規登録とログインを切り替えるため、押されたボタンを onClick で控えておく。
  const intent = useRef<"signin" | "signup">("signin");

  const run = async (action: () => Promise<void>) => {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await action();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = () =>
    run(async () => {
      await signInWithGoogle();
      onSignedIn?.();
    });

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    const mode = intent.current;
    intent.current = "signin";
    return run(async () => {
      if (mode === "signup") {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      onSignedIn?.();
    });
  };

  const handleReset = () => {
    if (!email.trim()) {
      setNotice("");
      setError("メールアドレスを入力してから押してください");
      return;
    }
    return run(async () => {
      await sendPasswordReset(email.trim());
      setNotice("パスワード再設定のメールを送信しました");
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }}>
      <button
        type="button"
        onClick={handleGoogle}
        disabled={busy}
        className={styles.btnOutline}
        style={{
          ...googlePillStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          border: `1px solid ${COLOR.border}`,
          background: COLOR.surfaceRaised,
          color: COLOR.ink,
        }}
      >
        {/* eslint-disable no-restricted-syntax -- Google のブランドカラー */}
        <svg viewBox="0 0 24 24" style={{ width: 17, height: 17, flex: "none" }} aria-hidden="true">
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
        {/* eslint-enable no-restricted-syntax */}
        Googleアカウントでログイン
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ flex: 1, height: 1, background: COLOR.border }} />
        <span
          style={{
            fontSize: FONT_SIZE.caption,
            letterSpacing: "0.08em",
            color: COLOR.accentInk,
            whiteSpace: "nowrap",
          }}
        >
          またはメールアドレスで
        </span>
        <span style={{ flex: 1, height: 1, background: COLOR.border }} />
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.field}
          style={fieldStyle({ padding: "13px 15px", borderRadius: 12 })}
        />
        <div style={{ position: "relative", display: "flex" }}>
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            autoComplete="current-password"
            placeholder="パスワード（6文字以上）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.field}
            style={fieldStyle({ flex: 1, padding: "13px 44px 13px 15px", borderRadius: 12 })}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              padding: "0 14px",
              border: "none",
              background: "none",
              color: COLOR.accentInk,
              cursor: "pointer",
            }}
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>

        {/* Enter キーは「最初の submit ボタン」= ログインになるよう、
            DOM 順はログイン→作成のまま order で左右を入れ替えている。 */}
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button
            type="submit"
            disabled={busy}
            className={styles.btnSolid}
            style={{
              ...splitPillStyle,
              order: 2,
              flex: 1,
              border: "none",
              background: COLOR.accent,
              color: COLOR.onAccent,
            }}
          >
            ログイン
          </button>
          <button
            type="submit"
            onClick={() => {
              intent.current = "signup";
            }}
            disabled={busy}
            className={styles.btnOutline}
            style={{
              ...splitPillStyle,
              order: 1,
              flex: 1,
              border: `1px solid ${COLOR.border}`,
              background: COLOR.surfaceRaised,
              color: COLOR.ink,
            }}
          >
            アカウント作成
          </button>
        </div>

        {/* 入力途中の内容を失わないよう、規約類は別タブで開く。 */}
        <p
          style={{
            margin: "2px 0 0",
            fontSize: FONT_SIZE.caption,
            lineHeight: 1.7,
            letterSpacing: "0.01em",
            color: COLOR.inkSoft,
          }}
        >
          <Link href="/terms" target="_blank" rel="noopener noreferrer" style={legalLinkStyle}>
            利用規約
          </Link>
          ・
          <Link href="/privacy" target="_blank" rel="noopener noreferrer" style={legalLinkStyle}>
            プライバシーポリシー
          </Link>
          をご確認ください。
        </p>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={handleReset}
            disabled={busy}
            className={styles.linkBack}
            style={{
              border: "none",
              background: "none",
              padding: 0,
              fontSize: FONT_SIZE.caption,
              color: COLOR.accentInk,
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            パスワードを忘れた方
          </button>
        </div>
      </form>

      {(error || notice) && (
        <p
          style={{
            margin: 0,
            fontSize: FONT_SIZE.label,
            letterSpacing: "0.04em",
            color: error ? COLOR.danger : COLOR.success,
          }}
        >
          {error || notice}
        </p>
      )}
    </div>
  );
}
