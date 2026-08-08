import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { socialMetadata } from "@/lib/seo";
import { getLetterForGuest } from "@/lib/server/letters";
import { LetterView } from "@/components/wedding-letter/LetterView";

interface LetterPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: LetterPageProps): Promise<Metadata> {
  const { id } = await params;
  const letter = await getLetterForGuest(id);
  // metadataBase(OG 画像の絶対 URL 用)と noindex はレイアウトから継承する。
  // タイトルは "%s | Hanayori" テンプレートで整う。
  if (!letter) return { title: "お手紙が見つかりません" };

  const title = `${letter.to} | Hanayori`;
  const description = "花嫁からのお手紙が届いています。タップして開いてみてください。";
  return {
    title: { absolute: title },
    description,
    ...socialMetadata({ title, description, type: "article" }),
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
      photos={letter.photos}
      date={letter.date}
      font={letter.font}
    />
  );
}
