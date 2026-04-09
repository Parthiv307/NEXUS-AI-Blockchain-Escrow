import { NextRequest, NextResponse } from "next/server";
import { getEscrows, createEscrow } from "@/lib/escrow-store";
import { generateEscrowAdvice, generateCounterOffer, generateTxSummary } from "@/lib/ai";

export async function GET() {
  const escrows = getEscrows();
  return NextResponse.json({ escrows });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "advise") {
      const { service, budget } = body;
      const advice = await generateEscrowAdvice(service, budget);
      return NextResponse.json({ advice });
    }

    if (action === "counter-offer") {
      const { service, budget, marketRate } = body;
      const result = await generateCounterOffer(
        service,
        budget,
        marketRate || budget * 1.5
      );
      return NextResponse.json({
        status: "counter_offer",
        suggestedPrice: result.suggestedPrice,
        message: result.message,
      });
    }

    if (action === "create") {
      const { service, description, amount, milestones } = body;
      if (!service || !amount) {
        return NextResponse.json(
          { error: "Service and amount are required" },
          { status: 400 }
        );
      }

      const escrow = createEscrow({
        service,
        description: description || service,
        amount,
        milestones: milestones || [
          { title: "Initial Delivery", amount: Math.round(amount * 0.5) },
          { title: "Final Completion", amount: Math.round(amount * 0.5) },
        ],
      });

      const summary = await generateTxSummary("ESCROW_CREATED", service, amount);

      return NextResponse.json({
        status: "success",
        escrow,
        txSummary: summary,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Escrow API error:", error);
    return NextResponse.json(
      { error: "Escrow protocol error" },
      { status: 500 }
    );
  }
}
