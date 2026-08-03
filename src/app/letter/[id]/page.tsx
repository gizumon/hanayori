import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLetterForGuest } from "@/lib/server/letters";
import { LetterView } from "@/components/wedding-letter/LetterView";

interface LetterPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: LetterPageProps): Promise<Metadata> {
  const { id } = await params;
  const letter = await getLetterForGuest(id);
  // metadataBase(OG 画像の絶対 URL 用)はルートレイアウトから継承する。
  if (!letter) return { title: "お手紙が見つかりません | Hanayori" };

  const title = `${letter.to} | Hanayori`;
  const description = "花嫁からのお手紙が届いています。タップして開いてみてください。";
  return {
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
