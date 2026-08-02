/**
 * スタジオのクライアントから `/api/*` を叩く共通ラッパー。
 * 非 2xx はサーバーが返す `{ error }` を Error のメッセージにして投げる。
 */
export async function api<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `${res.status} ${res.statusText}`);
  }
  return res.json();
}
