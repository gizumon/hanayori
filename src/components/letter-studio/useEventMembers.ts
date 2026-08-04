"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./apiClient";
import type { EventInvite, EventMember } from "./types";

interface MembersResponse {
  members: EventMember[];
  invites: EventInvite[];
  currentUid: string;
}

/** メンバーの表示名。名前未設定ならメールのローカル部で代用する。 */
export function memberDisplayName(member: EventMember): string {
  return member.displayName?.trim() || member.email?.split("@")[0] || "名前未設定";
}

/** 招待リンクの共有 URL。`/join/{token}` はログイン不要で開ける受諾ページ。 */
export function inviteUrl(token: string): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/join/${token}`;
}

/**
 * 取得済みデータを作り直しに行くまでの猶予。
 * メンバーと招待リンクはめったに変わらないので、ドロワーを開き直すたびに
 * 往復するほどの鮮度は要らない。この間隔を過ぎていたら裏で入れ替える。
 */
const STALE_MS = 60_000;

/**
 * イベントのメンバー・招待リンクの取得と操作。
 *
 * イベント一覧(`GET /api/events`)には載せず、共通設定ドロワーを開いたときに
 * 取得する。ホーム画面で N+1 になるのを避け、952 行ある useLetterStudio を
 * これ以上膨らませないための分離でもある。
 *
 * **呼び出しは StudioShell から**(ドロワーや MembersTab の中ではない)。
 * ドロワーもタブも閉じるとアンマウントされるので、中で持つと開くたびに state ごと
 * 消えて毎回取り直しになる。上に置いてイベント単位でキャッシュし、`enabled` は
 * 「メンバータブを見ている」ではなく「ドロワーが開いている」で渡す — 既定の
 * 「基本」タブにいるあいだに先読みが終わり、タブを押した時点では出来ている。
 *
 * 設定ドロワーの他タブと違って「保存」でまとめて送る形にはしない — 発行・取消・
 * 削除はどれも即時に効く操作で、下書き状態を持つと「発行したのに保存していない」
 * という誤解を生むため。
 */
export function useEventMembers(eventId: string | null, enabled: boolean) {
  const [members, setMembers] = useState<EventMember[]>([]);
  const [invites, setInvites] = useState<EventInvite[]>([]);
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /** 最後に取得できた時刻。state にすると自分で effect を張り直すので ref。 */
  const loadedAt = useRef(0);

  const apply = useCallback((data: MembersResponse) => {
    setMembers(data.members);
    setInvites(data.invites);
    setCurrentUid(data.currentUid);
  }, []);

  // ドロワーが開いたら取得する。手持ちが新しければ何もせず、古いだけなら
  // スケルトンに戻さず裏で入れ替える(開き直すたびに読み込み表示へ戻らない)。
  // loading は依存に入れない(入れると自分の setLoading で effect が張り直され、
  // 最初の取得結果が active=false で捨てられる)。useLetterStudio の手紙取得と同型。
  useEffect(() => {
    if (!enabled || !eventId) return;
    const cached = loadedFor === eventId;
    if (cached && Date.now() - loadedAt.current < STALE_MS) return;
    let active = true;
    (async () => {
      if (!cached) setLoading(true);
      try {
        const data = await api<MembersResponse>(`/api/events/${eventId}/members`);
        if (!active) return;
        apply(data);
        loadedAt.current = Date.now();
        setLoadedFor(eventId);
      } catch {
        // 失敗時は loadedAt を進めないので、開き直せば再試行される。
      } finally {
        if (active && !cached) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [enabled, eventId, loadedFor, apply]);

  /** 招待リンクを 1 本発行して、その URL を返す(コピー/共有にそのまま渡せる)。 */
  const createInvite = useCallback(async (): Promise<string> => {
    if (!eventId) throw new Error("イベントが選択されていません");
    setBusy(true);
    try {
      const { invite } = await api<{ invite: EventInvite }>(
        `/api/events/${eventId}/invites`,
        { method: "POST" }
      );
      setInvites((prev) => [invite, ...prev]);
      return inviteUrl(invite.token);
    } finally {
      setBusy(false);
    }
  }, [eventId]);

  const revokeInvite = useCallback(
    async (token: string) => {
      if (!eventId) return;
      setBusy(true);
      try {
        await api(`/api/events/${eventId}/invites/${token}`, { method: "DELETE" });
        setInvites((prev) => prev.filter((i) => i.token !== token));
      } finally {
        setBusy(false);
      }
    },
    [eventId]
  );

  /** メンバーを外す(自分自身なら退出)。退出した場合は true を返す。 */
  const removeMember = useCallback(
    async (uid: string): Promise<boolean> => {
      if (!eventId) return false;
      setBusy(true);
      try {
        const { selfRemoved } = await api<{ selfRemoved: boolean }>(
          `/api/events/${eventId}/members/${uid}`,
          { method: "DELETE" }
        );
        if (!selfRemoved) setMembers((prev) => prev.filter((m) => m.uid !== uid));
        return selfRemoved;
      } finally {
        setBusy(false);
      }
    },
    [eventId]
  );

  return {
    members,
    invites,
    currentUid,
    loading: loading && loadedFor !== eventId,
    busy,
    createInvite,
    revokeInvite,
    removeMember,
  };
}

export type EventMembersApi = ReturnType<typeof useEventMembers>;
