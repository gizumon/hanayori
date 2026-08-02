import type { MetadataRoute } from "next";
import { COLOR } from "@/lib/palette";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hanayori | 花嫁のお便り",
    short_name: "Hanayori",
    description:
      "結婚式のゲストひとりひとりに宛てた、デジタルのお手紙をつくれるサービス。",
    start_url: "/events",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "ja",
    theme_color: COLOR.accent,
    background_color: COLOR.bg,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
