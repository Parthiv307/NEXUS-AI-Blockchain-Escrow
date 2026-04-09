import { NextRequest, NextResponse } from "next/server";
import { getEscrow, updateEscrowStatus } from "@/lib/escrow-store";
import { generateDisputeResolution } from "@/lib/ai";
import type { EscrowStatus } from "@/lib/escrow-store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const escrow = getEscrow(id);
  if (!escrow) {
    return NextResponse.json({ error: "Escrow not found" }, { status: 404 });
  }
  return NextResponse.json({ escrow });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, disputeReason } = body;

    const escrow = getEscrow(id);
    if (!escrow) {
      return NextResponse.json({ error: "Escrow not found" }, { status: 404 });
    }

    if (status === "DISPUTED" && disputeReason) {
      const resolution = await generateDisputeResolution(
        id,
        escrow.service,
        escrow.amount,
        disputeReason
      );

      const updated = updateEscrowStatus(id, status as EscrowStatus, {
        disputeReason,
        disputeResolution: resolution,
      });

      return NextResponse.json({ escrow: updated, aiResolution: resolution });
    }

    const updated = updateEscrowStatus(id, status as EscrowStatus);
    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update escrow" },
        { status: 500 }
      );
    }

    return NextResponse.json({ escrow: updated });
  } catch (error) {
    console.error("Escrow update error:", error);
    return NextResponse.json(
      { error: "Protocol update failed" },
      { status: 500 }
    );
  }
}
