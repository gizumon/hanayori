import Link from "next/link";
import type { ReactNode } from "react";
import { THEMES } from "@/components/letter-studio/constants";
import { FONT_SIZE } from "@/lib/typography";
import { COLOR } from "@/lib/palette";

/** 規約・ポリシーのお問い合わせ窓口。 */
export const CONTACT_EMAIL = "hanayomeno.otayori.official@gmail.com";


const MINCHO = "'Shippori Mincho', serif";

interface LegalPageProps {
  /** ページ見出し。「利用規約」など。 */
  title: string;
  /** 「最終更新日」に表示する日付。 */
  updatedAt: string;
  /** フッターに並べる、もう一方の法務ページ。 */
  sibling: { href: string; label: string };
  children: ReactNode;
}

/**
 * 利用規約 / プライバシーポリシーの共通シェル。
 * 中身は各ページが `Section` を並べて組み立てる。
 */
export function LegalPage({ title, updatedAt, sibling, children }: LegalPageProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          `radial-gradient(ellipse 120% 45% at 50% -10%, ${THEMES.rose.bg1} 0%, transparent 70%), ${COLOR.bg}`,
        fontFamily: "'Zen Kaku Gothic New', sans-serif",
        color: COLOR.ink,
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(28px, 5vw, 56px) clamp(18px, 4vw, 32px) 72px" }}>
        <header style={{ marginBottom: "clamp(28px, 5vw, 44px)" }}>
          <Link
            href="/"
            style={{
              fontSize: FONT_SIZE.bodySm,
              letterSpacing: "0.06em",
              color: COLOR.inkSoft,
              textDecoration: "none",
            }}
          >
            ← トップへ戻る
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "22px 0 0" }}>
            <span style={{ fontFamily: MINCHO, fontSize: FONT_SIZE.heading, fontWeight: 600, letterSpacing: "0.12em" }}>
              Hanayori
            </span>
            <span style={{ fontSize: FONT_SIZE.overline, letterSpacing: "0.22em", color: COLOR.accentInk }}>花嫁のお便り</span>
          </div>
        </header>

        <h1
          style={{
            margin: "0 0 10px",
            fontFamily: MINCHO,
            fontSize: FONT_SIZE.title,
            fontWeight: 600,
            letterSpacing: "0.14em",
          }}
        >
          {title}
        </h1>
        <p style={{ margin: "0 0 clamp(34px, 6vw, 52px)", fontSize: FONT_SIZE.caption, letterSpacing: "0.05em", color: COLOR.inkSoft }}>
          最終更新日：{updatedAt}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(28px, 5vw, 40px)" }}>{children}</div>

        <footer
          style={{
            marginTop: "clamp(44px, 7vw, 72px)",
            paddingTop: 26,
            borderTop: `1px solid ${COLOR.borderSoft}`,
            textAlign: "center",
            fontSize: FONT_SIZE.caption,
            letterSpacing: "0.1em",
            color: COLOR.inkSoft,
          }}
        >
          <Link href={sibling.href} style={{ color: COLOR.inkSoft, textDecoration: "none" }}>
            {sibling.label}
          </Link>
          <span style={{ margin: "0 12px", color: COLOR.borderSoft }}>|</span>
          <Link href="/" style={{ color: COLOR.inkSoft, textDecoration: "none" }}>
            Hanayori トップ
          </Link>
        </footer>
      </div>
    </div>
  );
}

interface SectionProps {
  /** 条見出し。前文など見出しを持たない節では省く。 */
  heading?: string;
  children: ReactNode;
}

export function Section({ heading, children }: SectionProps) {
  return (
    <section>
      {heading ? (
        <h2
          style={{
            margin: "0 0 12px",
            fontFamily: MINCHO,
            fontSize: FONT_SIZE.subheading,
            fontWeight: 600,
            letterSpacing: "0.1em",
          }}
        >
          {heading}
        </h2>
      ) : null}
      <div style={{ fontSize: FONT_SIZE.body, lineHeight: 2, letterSpacing: "0.04em", color: COLOR.inkSoft }}>{children}</div>
    </section>
  );
}

/** 節のなかの段落。`Section` の本文サイズをそのまま継ぐ。 */
export function P({ children }: { children: ReactNode }) {
  return <p style={{ margin: "0 0 10px" }}>{children}</p>;
}

interface ListProps {
  /** true で番号付き（「第◯条 1.」のような列挙）。 */
  ordered?: boolean;
  items: ReactNode[];
}

export function List({ ordered = false, items }: ListProps) {
  const style = { margin: 0, padding: "0 0 0 1.3em", listStyleType: ordered ? "decimal" : "disc" } as const;
  const children = items.map((item, i) => (
    // 規約の各項は並び順が意味を持つ固定の配列で、差し替えも起きないため index を key にする。
    <li key={i} style={{ marginBottom: 6 }}>
      {item}
    </li>
  ));
  return ordered ? <ol style={style}>{children}</ol> : <ul style={style}>{children}</ul>;
}

/** 列挙のなかの用語ラベル（「アカウント情報：」など）。 */
export function Term({ children }: { children: ReactNode }) {
  return <strong style={{ fontWeight: 600, color: COLOR.ink }}>{children}</strong>;
}

/** お問い合わせ先のメールリンク。 */
export function ContactLink() {
  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      style={{ color: COLOR.accentInk, textDecoration: "underline", textUnderlineOffset: "0.2em", wordBreak: "break-all" }}
    >
      {CONTACT_EMAIL}
    </a>
  );
}
