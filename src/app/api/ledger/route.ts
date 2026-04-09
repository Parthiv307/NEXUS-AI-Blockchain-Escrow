import { NextResponse } from "next/server";
import { getLedger } from "@/lib/escrow-store";

export async function GET() {
  const entries = getLedger();
  return NextResponse.json({ entries });
}
