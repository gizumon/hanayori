import { NextResponse } from "next/server";
import { HttpError } from "./http-error";

export function handleRouteError(err: unknown) {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
}
