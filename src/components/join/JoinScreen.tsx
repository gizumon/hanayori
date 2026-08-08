"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarHeart, LinkIcon, TimerOff } from "lucide-react";
import { BrandMark } from "@/components/letter-studio/BrandMark";
import styles from "@/components/letter-studio/letter-studio.module.css";
import { AuthForm } from "@/components/letter-studio/screens/AuthForm";
import { getFirebaseAuth, onAuthStateChanged } from "@/lib/firebase/auth";
import { FONT_SIZE } from "@/lib/typography";
import { COLOR } from "@/lib/palette";

export type JoinStatus = "active" | "expired" | "accepted" | "invalid";

interface JoinScreenProps {
  token: string;
  status: JoinStatus;
  eventName: string | null;
  eventId: string | null;
  /** サーバーのセッションクッキーから見た初期ログイン状態。 */
  signedIn: boolean;
  alreadyMember: boolean;
}

const card = {
  width: "min(420px,92vw)",
  background: COLOR.surface,
  borderRadius: 20,
  padding: "40px 26px 32px",
  boxShadow: "0 20px 60px rgba(150,110,130,0.2)",
  textAlign: "center",
} as const;

const lead = {
  margin: 0,
  fontSize: FONT_SIZE.bodySm,
  lineHeight: 1.9,
  letterSpacing: "0.06em",
  color: COLOR.inkSoft,
} as const;

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.root}>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div className={styles.fadeupSlow} style={card}>
          {children}
        </div>
      </div>
    </div>
  );
}

/** 受け取れない招待(無効・使用済み・期限切れ)の共通表示。 */
function DeadEnd({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <Frame>
      <span
        aria-hidden="true"
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          margin: "0 auto 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg,${COLOR.tintRose},${COLOR.tintRoseDeep})`,
          border: `1px solid ${COLOR.borderSoft}`,
        }}
      >
        {icon}
      </span>
      <h1
        style={{
          margin: "0 0 10px",
          fontSize: FONT_SIZE.title,
          fontWeight: 600,
          letterSpacing: "0.1em",
          color: COLOR.ink,
        }}
      >
        {title}
      </h1>
      <p style={lead}>{body}</p>
    </Frame>
  );
}

/**
 * 招待リンクの受諾ページ。
 *
 * トークンの消費は「参加する」ボタンからの POST だけで起こる。表示(GET)では
 * 何も消費しない — 使い切りのリンクがリンクプレビューや prefetch で潰れるため。
 */
export function JoinScreen({
  token,
  status,
  eventName,
  eventId,
  signedIn,
  alreadyMember,
}: JoinScreenProps) {
  const router = useRouter();
  // サーバー描画後にこのページ上でログインされることがあるので、クライアント側でも追う。
  const [authed, setAuthed] = useState(signedIn);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), (user) => setAuthed(Boolean(user)));
  }, []);

  const handleJoin = async () => {
    setError("");
    setJoining(true);
    try {
      const res = await fetch(`/api/invites/${token}/accept`, { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error || "参加できませんでした");
      }
      router.replace(`/events/${body.eventId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "参加できませんでした");
      setJoining(false);
    }
  };

  if (status === "invalid") {
    return (
      <DeadEnd
        icon={<LinkIcon size={22} strokeWidth={1.6} color={COLOR.accentInk} aria-hidden="true" />}
        title="この招待リンクは無効です"
        body="リンクが取り消されたか、URL が正しくない可能性があります。招待した方に、新しいリンクを発行してもらってください。"
      />
    );
  }

  if (status === "accepted") {
    return (
      <DeadEnd
        icon={<LinkIcon size={22} strokeWidth={1.6} color={COLOR.accentInk} aria-hidden="true" />}
        title="この招待リンクは使用済みです"
        body="招待リンクは 1 人ぶんだけ有効です。招待した方に、あなた用のリンクをもう一度発行してもらってください。"
      />
    );
  }

  if (status === "expired") {
    return (
      <DeadEnd
        icon={<TimerOff size={22} strokeWidth={1.6} color={COLOR.accentInk} aria-hidden="true" />}
        title="招待リンクの有効期限が切れました"
        body="招待リンクは発行から 7 日で失効します。招待した方に、新しいリンクを発行してもらってください。"
      />
    );
  }

  if (alreadyMember && eventId) {
    return (
      <Frame>
        <BrandMark size={104} />
        <h1
          style={{
            margin: "0 0 10px",
            fontSize: FONT_SIZE.title,
            fontWeight: 600,
            letterSpacing: "0.1em",
            color: COLOR.ink,
          }}
        >
          すでに参加しています
        </h1>
        <p style={{ ...lead, marginBottom: 24 }}>
          「{eventName}」はもうあなたのイベント一覧にあります。
        </p>
        <button
          type="button"
          onClick={() => router.replace(`/events/${eventId}`)}
          className={styles.btnSolid}
          style={primaryBtn}
        >
          イベントを開く
        </button>
      </Frame>
    );
  }

  return (
    <Frame>
      <span
        aria-hidden="true"
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          margin: "0 auto 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg,${COLOR.tintRose},${COLOR.tintRoseDeep})`,
          border: `1px solid ${COLOR.borderSoft}`,
        }}
      >
        <CalendarHeart size={26} strokeWidth={1.5} color={COLOR.accentInk} />
      </span>
      <p
        style={{
          margin: "0 0 6px",
          fontSize: FONT_SIZE.overline,
          letterSpacing: "0.28em",
          color: COLOR.accentInk,
        }}
      >
        INVITATION
      </p>
      <h1
        style={{
          margin: "0 0 10px",
          fontFamily: "'Shippori Mincho', serif",
          fontSize: FONT_SIZE.title,
          fontWeight: 600,
          letterSpacing: "0.08em",
          color: COLOR.ink,
        }}
      >
        {eventName}
      </h1>
      <p style={{ ...lead, marginBottom: 26 }}>
        このイベントの共同編集に招待されています。
        <br />
        参加すると、お手紙や席札を一緒に作れます。
      </p>

      {authed ? (
        <button
          type="button"
          onClick={handleJoin}
          disabled={joining}
          className={styles.btnSolid}
          style={primaryBtn}
        >
          {joining ? "参加しています…" : "参加する"}
        </button>
      ) : (
        <>
          <p
            style={{
              margin: "0 0 14px",
              fontSize: FONT_SIZE.caption,
              letterSpacing: "0.06em",
              color: COLOR.accentInk,
            }}
          >
            参加するにはログインしてください
          </p>
          <AuthForm />
        </>
      )}

      {error && (
        <p
          style={{
            margin: "16px 0 0",
            fontSize: FONT_SIZE.label,
            color: COLOR.danger,
            letterSpacing: "0.04em",
          }}
        >
          {error}
        </p>
      )}
    </Frame>
  );
}

const primaryBtn = {
  width: "100%",
  padding: "13px 18px",
  borderRadius: 999,
  border: "none",
  background: COLOR.accent,
  color: COLOR.onAccent,
  fontSize: FONT_SIZE.body,
  letterSpacing: "0.08em",
  cursor: "pointer",
} as const;
