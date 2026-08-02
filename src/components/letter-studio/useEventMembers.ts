"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./apiClient";
import type { EventInvite, EventMember } from "./types";

interface MembersResponse {
  members: EventMember[];
  invites: EventInvite[];
  currentUid: string;
}

/** 招待リンクの共有 URL。`/join/{token}` はログイン不要で開ける受諾ページ。 */
export function inviteUrl(token: string): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/join/${token}`;
}

/**
 * イベントのメンバー・招待リンクの取得と操作。
 *
 * イベント一覧(`GET /api/events`)には載せず、共通設定の「メンバー」タブを
 * 開いたときにこのフックが 1 回だけ取得する。ホーム画面で N+1 になるのを避け、
 * 952 行ある useLetterStudio をこれ以上膨らませないための分離でもある。
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

  const apply = useCallback((data: MembersResponse) => {
    setMembers(data.members);
    setInvites(data.invites);
    setCurrentUid(data.currentUid);
  }, []);

  const reload = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      apply(await api<MembersResponse>(`/api/events/${eventId}/members`));
      setLoadedFor(eventId);
    } finally {
      setLoading(false);
    }
  }, [apply, eventId]);

  // タブを開いている間、そのイベントぶんを一度だけ取得する。loading は
  // 依存に入れない(入れると自分の setLoading で effect が張り直され、最初の
  // 取得結果が active=false で捨てられる)。useLetterStudio の手紙取得と同型。
  useEffect(() => {
    if (!enabled || !eventId || loadedFor === eventId) return;
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const data = await api<MembersResponse>(`/api/events/${eventId}/members`);
        if (!active) return;
        apply(data);
        setLoadedFor(eventId);
      } catch {
        // 失敗時は loadedFor を進めないので、タブを開き直せば再試行される。
      } finally {
        if (active) setLoading(false);
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
    reload,
    createInvite,
    revokeInvite,
    removeMember,
  };
}
