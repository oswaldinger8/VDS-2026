import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code") ?? "";
  const clean = code.replace(/\D/g, "").slice(0, 4);
  if (clean.length === 0) {
    redirect("/tv");
  }
  redirect(`/tv/${clean}`);
}
