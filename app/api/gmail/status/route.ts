import { NextResponse } from "next/server";
import { hasStoredTokens } from "@/lib/googleAuth";

export async function GET() {
  return NextResponse.json({ connected: hasStoredTokens() });
}
