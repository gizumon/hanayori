"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { FONTS, THEMES } from "@/components/letter-studio/constants";
import type { FontKey, ThemeKey } from "@/components/letter-studio/types";
import { Petals } from "@/components/wedding-letter/Petals";
import styles from "./landing.module.css";
import { FONT_SIZE } from "@/lib/typography";

const FEATURES = [
  {
    title: "ひとりひとりに、お手紙を",
    body: "宛名・本文・お写真・便箋の色を、ゲストごとに設定。手書きのようなあたたかいフォントも選べます。",
    icon: (
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    ),
  },
  {
    title: "席札が、QRコードに",
    body: "お手紙は名刺サイズの席札カードに。二つ折りタイプにも対応し、画像保存・実寸印刷ができます。",
    icon: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 14h3v3h-3zM20 14h1M14 20h1M20 20h1M17 17v4" />
      </>
    ),
  },
  {
    title: "封筒がひらく、特別な体験",
    body: "QRを読み取ると、封蝋つきの封筒がふわりとひらく開封アニメーション。お手紙は画像として保存できます。",
    icon: (
      <>
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="m3 8 9 6 9-6" />
      </>
    ),
  },
];

const STEPS = [
  { n: "01", title: "イベントをつくる", body: "「ふたりの結婚式」など、イベント単位でお手紙をまとめて管理。" },
  { n: "02", title: "お手紙を書く", body: "宛名と本文を書いて、便箋の色・書体・お写真を選びます。" },
  { n: "03", title: "席札を印刷する", body: "QRコード入りの席札カードを画像保存または実寸で印刷。" },
  { n: "04", title: "当日、想いが届く", body: "ゲストがQRを読み取ると、封筒がひらいてお手紙が届きます。" },
];

const THEME_ORDER: ThemeKey[] = ["rose", "blue", "sage", "kinari"];
const THEME_FONT: Record<ThemeKey, FontKey> = {
  rose: "yomogi",
  blue: "mincho",
  sage: "gothic",
  kinari: "maru",
};
const THEME_GREETING: Record<ThemeKey, string> = {
  rose: "さくらへ",
  blue: "かえでへ",
  sage: "みどりへ",
  kinari: "ひなたへ",
};

function MockQr() {
  return (
    <svg viewBox="0 0 21 21" style={{ width: "100%", height: "100%" }} aria-hidden="true">
      <path
        fill="#5C4A4A"
        d="M1 1h5v5H1zM15 1h5v5h-5zM1 15h5v5H1zM8 1h1v2H8zM11 1h2v1h-2zM8 4h2v1H8zM12 3h1v3h-1zM8 8h1v1H8zM10 8h2v1h-2zM14 8h1v2h-1zM16 8h1v1h-1zM19 8h1v1h-1zM1 8h2v1H1zM4 8h1v1H4zM2 11h1v1H2zM4 11h2v1H4zM8 11h1v2H8zM10 12h2v1h-2zM8 15h1v1H8zM10 15h1v2h-1zM12 15h1v1h-1zM15 15h2v2h-2zM18 15h2v1h-2zM8 18h2v2H8zM12 18h1v2h-1zM15 19h3v1h-3zM19 18h1v2h-1zM2 2.5h3v2H2zM16 2.5h3v2H16zM2 16.5h3v2H2z"
      />
    </svg>
  );
}

export function Landing() {
  return (
    <div className={styles.root}>
      <div className={styles.heroWrap}>
        <Petals color="#E3C293" />
        <header
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            maxWidth: 1080,
            margin: "0 auto",
            padding: "22px clamp(18px, 4vw, 40px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span aria-hidden="true" className={styles.logoMark} />
            <span style={{ fontSize: FONT_SIZE.heading, fontWeight: 600, letterSpacing: "0.12em" }}>Hanayori</span>
            <span style={{ fontSize: FONT_SIZE.overline, letterSpacing: "0.22em", color: "#B08A99" }}>花嫁のお便り</span>
          </div>
          <Link href="/events" className={styles.navCta}>
            はじめる
          </Link>
        </header>

        <section
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: 1080,
            margin: "0 auto",
            padding: "clamp(40px, 7vw, 80px) clamp(18px, 4vw, 40px) clamp(60px, 8vw, 100px)",
            display: "flex",
            alignItems: "center",
            gap: "clamp(28px, 5vw, 64px)",
            flexWrap: "wrap",
          }}
        >
          <div className={styles.heroCopy} style={{ flex: 1.2, minWidth: 290 }}>
            <p style={{ margin: "0 0 14px", fontSize: FONT_SIZE.caption, letterSpacing: "0.34em", color: "#B08A99" }}>
              花嫁のお便り — WEDDING LETTER SERVICE
            </p>
            <h1
              style={{
                margin: "0 0 22px",
                fontSize: "clamp(30px, 5.4vw, 46px)",
                fontWeight: 600,
                letterSpacing: "0.1em",
                lineHeight: 1.6,
              }}
            >
              大切なあの人へ、
              <br />
              結婚式の日に届く
              <br />
              一通のお手紙を。
            </h1>
            <p
              style={{
                margin: "0 0 30px",
                fontSize: "clamp(14px, 2vw, 15.5px)",
                lineHeight: 2.1,
                letterSpacing: "0.06em",
                color: "#8C7676",
              }}
            >
              Hanayori（はなより）は、「花嫁のお便り」から生まれた、
              <br />
              結婚式のゲストひとりひとりに宛てた
              <br />
              デジタルのお手紙をつくれるサービスです。
              <br />
              席札のQRコードを読み取ると、封筒がひらいて、
              <br />
              あなたの言葉がそっと届きます。
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/events" className={styles.ctaPrimary}>
                無料でお手紙をつくる
              </Link>
              <a href="#letter-styles" className={styles.ctaSecondary}>
                お手紙のサンプルを見る
              </a>
            </div>
          </div>
          <div className={styles.heroArt} style={{ flex: 1, minWidth: 270, display: "flex", justifyContent: "center" }}>
            <div aria-hidden="true" className={styles.envelope}>
              <div className={styles.envelopeFlap} />
              <div className={styles.envelopeBody}>
                <div className={styles.envelopePaper}>
                  <svg
                    viewBox="0 0 120 28"
                    fill="none"
                    stroke="#E3C293"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                    className={styles.lineIn}
                    style={{ width: 84, height: 20, display: "block", margin: "0 auto 6px", opacity: 0.9, animationDelay: "3.4s" }}
                  >
                    <path d="M14 15 H44 M76 15 H106" />
                    <path
                      d="M60 7.5 C56.8 11 56.8 17.5 60 21.5 C63.2 17.5 63.2 7.5 60 7.5 Z"
                      fill="#E3C293"
                      stroke="none"
                      opacity="0.8"
                    />
                    <path d="M50 15 C53 13 55.5 13 58 14.2 M70 15 C67 13 64.5 13 62 14.2" />
                  </svg>
                  <div
                    className={styles.lineIn}
                    style={{
                      fontFamily: "'Yomogi', sans-serif",
                      fontSize: 16,
                      letterSpacing: "0.16em",
                      color: "#5C4A4A",
                      textAlign: "center",
                      marginBottom: 8,
                      animationDelay: "3.7s",
                    }}
                  >
                    あなたへ
                  </div>
                  <div
                    style={{
                      fontFamily: "'Yomogi', sans-serif",
                      fontSize: 12,
                      lineHeight: 2.15,
                      letterSpacing: "0.05em",
                      color: "#5C4A4A",
                      textAlign: "center",
                    }}
                  >
                    <div className={styles.lineIn} style={{ animationDelay: "4.2s" }}>いつも ありがとう。</div>
                    <div className={styles.lineIn} style={{ animationDelay: "4.8s" }}>伝えきれなかった想いを、</div>
                    <div className={styles.lineIn} style={{ animationDelay: "5.4s" }}>一通のお手紙にのせて。</div>
                  </div>
                  <div
                    className={styles.lineIn}
                    style={{
                      fontFamily: "'Yomogi', sans-serif",
                      fontSize: 10.5,
                      letterSpacing: "0.2em",
                      color: "#8C7676",
                      textAlign: "center",
                      marginTop: 10,
                      animationDelay: "6s",
                    }}
                  >
                    — Hanayori
                  </div>
                </div>
                <div className={styles.envelopeFront} />
              </div>
            </div>
          </div>
        </section>
      </div>

      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "clamp(50px, 7vw, 90px) clamp(18px, 4vw, 40px)" }}>
        <p style={{ margin: "0 0 10px", textAlign: "center", fontSize: FONT_SIZE.caption, letterSpacing: "0.34em", color: "#B08A99" }}>
          FEATURES
        </p>
        <h2
          style={{
            margin: "0 0 40px",
            textAlign: "center",
            fontSize: "clamp(21px, 3.4vw, 27px)",
            fontWeight: 600,
            letterSpacing: "0.14em",
          }}
        >
          Hanayori でできること
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {FEATURES.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#B08A99"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ width: 22, height: 22 }}
                >
                  {f.icon}
                </svg>
              </div>
              <h3 style={{ margin: "0 0 10px", fontSize: FONT_SIZE.heading, fontWeight: 600, letterSpacing: "0.1em" }}>{f.title}</h3>
              <p style={{ margin: 0, fontSize: FONT_SIZE.body, lineHeight: 2, letterSpacing: "0.04em", color: "#8C7676" }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: "#FFFCF8", padding: "clamp(50px, 7vw, 90px) clamp(18px, 4vw, 40px)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <p style={{ margin: "0 0 10px", textAlign: "center", fontSize: FONT_SIZE.caption, letterSpacing: "0.34em", color: "#B08A99" }}>
            HOW IT WORKS
          </p>
          <h2
            style={{
              margin: "0 0 40px",
              textAlign: "center",
              fontSize: "clamp(21px, 3.4vw, 27px)",
              fontWeight: 600,
              letterSpacing: "0.14em",
            }}
          >
            お手紙が届くまで
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 18 }}>
            {STEPS.map((st) => (
              <div key={st.n} style={{ textAlign: "center", padding: "10px 12px" }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    margin: "0 auto 14px",
                    borderRadius: "50%",
                    border: "1px solid #D3A5B4",
                    color: "#B08A99",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: FONT_SIZE.body,
                    letterSpacing: "0.05em",
                  }}
                >
                  {st.n}
                </div>
                <h3 style={{ margin: "0 0 8px", fontSize: FONT_SIZE.subheading, fontWeight: 600, letterSpacing: "0.1em" }}>{st.title}</h3>
                <p style={{ margin: 0, fontSize: FONT_SIZE.bodySm, lineHeight: 1.95, letterSpacing: "0.04em", color: "#8C7676" }}>
                  {st.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="letter-styles"
        style={{ maxWidth: 1080, margin: "0 auto", padding: "clamp(50px, 7vw, 90px) clamp(18px, 4vw, 40px)" }}
      >
        <p style={{ margin: "0 0 10px", textAlign: "center", fontSize: FONT_SIZE.caption, letterSpacing: "0.34em", color: "#B08A99" }}>
          LETTER STYLES
        </p>
        <h2
          style={{
            margin: "0 0 12px",
            textAlign: "center",
            fontSize: "clamp(21px, 3.4vw, 27px)",
            fontWeight: 600,
            letterSpacing: "0.14em",
          }}
        >
          選べる便箋と書体
        </h2>
        <p style={{ margin: "0 0 36px", textAlign: "center", fontSize: FONT_SIZE.body, letterSpacing: "0.06em", color: "#8C7676" }}>
          4色の便箋と、5つの書体。おふたりらしい組み合わせを。
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 18 }}>
          {THEME_ORDER.map((key) => {
            const theme = THEMES[key];
            const font = FONTS[THEME_FONT[key]];
            return (
              <div
                key={key}
                className={styles.themeCard}
                style={{ background: `linear-gradient(175deg, ${theme.bg1}, ${theme.g2})` }}
              >
                <div
                  className={styles.themeCardPaper}
                  style={{ background: theme.paper, "--rule-color": theme.rule } as CSSProperties}
                >
                  <div
                    style={{
                      fontFamily: font.family,
                      fontSize: 13,
                      letterSpacing: "0.12em",
                      color: theme.ink,
                      textAlign: "center",
                      marginBottom: 6,
                    }}
                  >
                    {THEME_GREETING[key]}
                  </div>
                  <div
                    style={{
                      fontFamily: font.family,
                      fontSize: 11.5,
                      lineHeight: 2.1,
                      letterSpacing: "0.04em",
                      color: theme.ink,
                      textAlign: "center",
                    }}
                  >
                    今日は来てくれて
                    <br />
                    本当にありがとう。
                  </div>
                </div>
                <div style={{ marginTop: 12, textAlign: "center", fontSize: FONT_SIZE.caption, letterSpacing: "0.14em", color: theme.inkSoft }}>
                  {theme.label}
                </div>
                <div
                  style={{
                    marginTop: 2,
                    textAlign: "center",
                    fontSize: FONT_SIZE.micro,
                    letterSpacing: "0.1em",
                    color: theme.inkSoft,
                    opacity: 0.75,
                  }}
                >
                  {font.label}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ background: "#FFFCF8", padding: "clamp(50px, 7vw, 90px) clamp(18px, 4vw, 40px)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <p style={{ margin: "0 0 10px", textAlign: "center", fontSize: FONT_SIZE.caption, letterSpacing: "0.34em", color: "#B08A99" }}>
            PLACE CARDS
          </p>
          <h2
            style={{
              margin: "0 0 12px",
              textAlign: "center",
              fontSize: "clamp(21px, 3.4vw, 27px)",
              fontWeight: 600,
              letterSpacing: "0.14em",
            }}
          >
            席札が、お手紙の入り口に
          </h2>
          <p style={{ margin: "0 0 40px", textAlign: "center", fontSize: FONT_SIZE.body, letterSpacing: "0.06em", color: "#8C7676" }}>
            名刺サイズから二つ折りまで。QRコードを読み取ると、その方宛のお手紙がひらきます。
          </p>
          <div style={{ display: "flex", gap: "clamp(20px, 4vw, 40px)", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div
                aria-hidden="true"
                className={styles.placeCard}
                style={{ width: "min(320px, 86vw)", aspectRatio: "91 / 55" }}
              >
                <div style={{ position: "absolute", left: 0, top: 0, width: 5, height: "100%", background: "#D3A5B4" }} />
                <div style={{ position: "absolute", right: 12, top: 10, display: "flex", gap: 4 }}>
                  <span
                    style={{
                      width: 6,
                      height: 8,
                      background: "#E3C293",
                      borderRadius: "60% 40% 55% 45% / 50% 55% 45% 50%",
                      opacity: 0.8,
                    }}
                  />
                  <span
                    style={{
                      width: 5,
                      height: 7,
                      background: "#E3C293",
                      borderRadius: "60% 40% 55% 45% / 50% 55% 45% 50%",
                      transform: "rotate(40deg)",
                      opacity: 0.55,
                    }}
                  />
                </div>
                <div style={{ position: "absolute", inset: 0, display: "flex", padding: "5%" }}>
                  <div style={{ flex: 1.4, display: "flex", flexDirection: "column", justifyContent: "center", gap: 5, padding: "3% 2% 12% 7%" }}>
                    <div style={{ fontSize: 8.5, letterSpacing: "0.3em", color: "#8C7676" }}>WEDDING RECEPTION</div>
                    <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: "0.14em", color: "#5C4A4A" }}>山田花子 様</div>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5 }}>
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        background: "#FFFFFF",
                        borderRadius: 9,
                        padding: 6,
                        boxShadow: "0 3px 10px rgba(150,110,130,0.16)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MockQr />
                    </div>
                    <div style={{ fontSize: 8, letterSpacing: "0.08em", color: "#8C7676", textAlign: "center", lineHeight: 1.6 }}>
                      スマホで読み取ると
                      <br />
                      お手紙が届きます
                    </div>
                  </div>
                </div>
                <div style={{ position: "absolute", left: "7%", right: "44%", bottom: "6%", fontSize: 8.5, letterSpacing: "0.12em", color: "#8C7676" }}>
                  ゆい &amp; 蓮 の結婚式 ・ 2026年10月24日(土)
                </div>
              </div>
              <div style={{ fontSize: FONT_SIZE.caption, letterSpacing: "0.14em", color: "#9D6F83" }}>名刺サイズ 91×55mm</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div
                aria-hidden="true"
                className={styles.placeCard}
                style={{ width: "min(230px, 60vw)", aspectRatio: "91 / 110" }}
              >
                <div style={{ position: "absolute", left: 0, right: 0, top: "50%", borderTop: "1.5px dashed #E8D5DC" }} />
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: "50%",
                    transform: "rotate(180deg)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "5%",
                  }}
                >
                  <div style={{ width: 54, height: 54, background: "#FFFFFF", borderRadius: 8, padding: 5, boxShadow: "0 3px 10px rgba(150,110,130,0.16)" }}>
                    <MockQr />
                  </div>
                  <div style={{ fontSize: 8, letterSpacing: "0.08em", color: "#8C7676", textAlign: "center", lineHeight: 1.6 }}>
                    スマホで読み取ると
                    <br />
                    お手紙が届きます
                  </div>
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: "50%",
                    bottom: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    textAlign: "center",
                    padding: "5%",
                  }}
                >
                  <div style={{ fontSize: 8.5, letterSpacing: "0.3em", color: "#8C7676" }}>WEDDING RECEPTION</div>
                  <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: "0.14em", color: "#5C4A4A" }}>山田花子 様</div>
                  <div style={{ fontSize: 7.5, letterSpacing: "0.1em", color: "#8C7676" }}>ゆい &amp; 蓮 の結婚式 ・ 2026年10月24日(土)</div>
                </div>
              </div>
              <div style={{ fontSize: FONT_SIZE.caption, letterSpacing: "0.14em", color: "#9D6F83" }}>二つ折りタイプ 91×110mm</div>
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          background: "linear-gradient(175deg, #F1E0E7 0%, #EDD8E1 100%)",
          padding: "clamp(56px, 8vw, 100px) clamp(18px, 4vw, 40px)",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            margin: "0 0 16px",
            fontSize: "clamp(22px, 3.8vw, 30px)",
            fontWeight: 600,
            letterSpacing: "0.14em",
            lineHeight: 1.7,
          }}
        >
          言葉にできなかった気持ちを、
          <br />
          お手紙にのせて。
        </h2>
        <p style={{ margin: "0 0 30px", fontSize: FONT_SIZE.body, letterSpacing: "0.08em", color: "#8C7676" }}>
          登録は無料。今日から書きはじめられます。
        </p>
        <Link href="/events" className={styles.ctaFinal}>
          無料でお手紙をつくる
        </Link>
      </section>

      <footer style={{ background: "#5C4A4A", color: "#D9C6CB", padding: "26px clamp(18px, 4vw, 40px)", textAlign: "center", fontSize: FONT_SIZE.caption, letterSpacing: "0.14em" }}>
        Hanayori — 花嫁のお便り、結婚式のお手紙サービス
      </footer>
    </div>
  );
}
