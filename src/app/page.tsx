import { Landing } from "@/components/landing/Landing";

export default function Home() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Yomogi&family=Shippori+Mincho:wght@500;600&family=Zen+Kaku+Gothic+New&family=Zen+Maru+Gothic&display=swap"
        rel="stylesheet"
      />
      <Landing />
    </>
  );
}
