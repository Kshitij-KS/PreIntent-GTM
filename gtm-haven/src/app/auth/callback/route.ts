import { NextResponse } from "next/server";

export function GET(request: Request) {
  const requestUrl = new URL(request.url);
  return NextResponse.redirect(
    new URL(`/api/auth/callback${requestUrl.search}`, requestUrl.origin),
  );
}
