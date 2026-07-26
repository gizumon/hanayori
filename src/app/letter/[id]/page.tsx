import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getLetterForGuest } from "@/lib/server/letters";
import { LetterView } from "@/components/wedding-letter/LetterView";

interface LetterPageProps {
  params: Promise<{ id: string }>;
}

/** OGP 画像を絶対 URL で配信するためのベース URL(Cloud Run のホストから解決)。 */
async function resolveMetadataBase(): Promise<URL | undefined> {
  const h = await headers();
  const host = h.get("host");
  if (!host) return undefined;
  const proto = h.get("x-forwarded-proto") ?? "https";
  return new URL(`${proto}://${host}`);
}

export async function generateMetadata({ params }: LetterPageProps): Promise<Metadata> {
  const { id } = await params;
  const letter = await getLetterForGuest(id);
  const metadataBase = await resolveMetadataBase();
  if (!letter) return { metadataBase, title: "お手紙が見つかりません | Hanayori" };

  const title = `${letter.to} | Hanayori`;
  const description = "花嫁からのお手紙が届いています。タップして開いてみてください。";
  return {
    metadataBase,
    title,
    description,
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function LetterPage({ params }: LetterPageProps) {
  const { id } = await params;
  const letter = await getLetterForGuest(id);
  if (!letter) notFound();

  return (
    <LetterView
      to={letter.to}
      body={letter.body}
      theme={letter.theme}
      photo={letter.photo}
      photoRatio={letter.photoRatio}
      date={letter.date}
      font={letter.font}
    />
  );
}
