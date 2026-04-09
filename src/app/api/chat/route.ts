import { NextRequest, NextResponse } from "next/server";
import { chatWithOracle } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, systemPrompt } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const reply = await chatWithOracle(messages, systemPrompt);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Oracle connection interrupted" },
      { status: 500 }
    );
  }
}
