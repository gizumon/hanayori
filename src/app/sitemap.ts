import type { MetadataRoute } from "next";
import { LEGAL_UPDATED_AT } from "@/lib/seo";
import { resolveMetadataBase } from "@/lib/server/metadata";

/**
 * 載せるのは誰でも見られる 3 ページだけ。
 * /events は要ログイン、/join と /letter は個人宛の URL なので noindex にしてあり、
 * sitemap にも入れない。
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await resolveMetadataBase();
  if (!base) return [];

  const url = (path: string) => new URL(path, base).toString();
  const legalUpdatedAt = new Date(`${LEGAL_UPDATED_AT}T00:00:00Z`);

  return [
    { url: url("/"), changeFrequency: "monthly", priority: 1 },
    { url: url("/terms"), lastModified: legalUpdatedAt, changeFrequency: "yearly", priority: 0.3 },
    { url: url("/privacy"), lastModified: legalUpdatedAt, changeFrequency: "yearly", priority: 0.3 },
  ];
}
