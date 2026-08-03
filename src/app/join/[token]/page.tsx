import type { Metadata } from "next";
import { JoinScreen } from "@/components/join/JoinScreen";
import { getInvitePreview } from "@/lib/server/invites";
import { isEventMember } from "@/lib/server/members";
import { getSessionUid } from "@/lib/server/session";

/**
 * リンクプレビュー用のメタデータ。ここでもトークンは消費しない（GET は読むだけ）。
 * 画像は同ディレクトリの opengraph-image.tsx が生成する。
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const preview = await getInvitePreview(token).catch(() => ({
    status: "invalid" as const,
    eventName: null,
  }));

  const title =
    preview.status === "active" && preview.eventName
      ? `${preview.eventName} への招待 | Hanayori`
      : "イベントへの招待 | Hanayori";
  const description =
    preview.status === "active"
      ? "Hanayori のお手紙づくりに招待されています。リンクを開いて参加してください。"
      : "この招待リンクは使えません。招待した方に新しいリンクをお願いしてください。";

  return {
    title,
    description,
    openGraph: { title, description, type: "website", siteName: "Hanayori", locale: "ja_JP" },
    twitter: { card: "summary_large_image", title, description },
  };
}

/**
 * 招待リンクの受諾ページ。
 *
 * ここ(GET)ではトークンの状態を読むだけで**消費しない**。実際の受諾は
 * `POST /api/invites/{token}/accept` だけが行う。使い切りのリンクが SNS の
 * リンクプレビューやブラウザの prefetch で潰れるのを防ぐため。
 *
 * 未ログインでもイベント名は表示する。トークンを持っている人にしか見えない
 * 情報なので、「何に招待されたのか分からないままログインさせる」のを避ける。
 */
export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [preview, uid] = await Promise.all([getInvitePreview(token), getSessionUid()]);
  const alreadyMember =
    uid && preview.eventId ? await isEventMember(uid, preview.eventId) : false;

  return (
    <JoinScreen
      token={token}
      status={preview.status}
      eventName={preview.eventName}
      eventId={preview.eventId}
      signedIn={Boolean(uid)}
      alreadyMember={alreadyMember}
    />
  );
}
