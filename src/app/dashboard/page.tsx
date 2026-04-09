"use client";

import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/navbar";
import { OracleChat } from "@/components/oracle-chat";
import { EscrowCard } from "@/components/escrow-card";
import type { EscrowData } from "@/components/escrow-card";
import { LedgerTerminal } from "@/components/ledger-terminal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  LayoutDashboard,
  PlusCircle,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowRightLeft,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type EscrowStatus = string;

const statusFilters: { label: string; value: string; color: string }[] = [
  { label: "All", value: "ALL", color: "text-foreground" },
  { label: "Funded", value: "FUNDED", color: "text-blue-400" },
  { label: "In Progress", value: "IN_PROGRESS", color: "text-indigo-400" },
  { label: "Delivered", value: "DELIVERED", color: "text-cyan-400" },
  { label: "Released", value: "RELEASED", color: "text-emerald-400" },
  { label: "Disputed", value: "DISPUTED", color: "text-red-400" },
];

export default function DashboardPage() {
  const [escrows, setEscrows] = useState<EscrowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [aiResolution, setAiResolution] = useState("");

  const fetchEscrows = useCallback(async () => {
    try {
      const res = await fetch("/api/escrow");
      const data = await res.json();
      setEscrows(data.escrows || []);
    } catch {
      console.error("Failed to fetch escrows");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEscrows();
    const interval = setInterval(fetchEscrows, 15000);
    return () => clearInterval(interval);
  }, [fetchEscrows]);

  const filteredEscrows =
    filter === "ALL"
      ? escrows
      : escrows.filter((e) => e.status === filter);

  const totalLocked = escrows
    .filter((e) => !["RELEASED", "REFUNDED"].includes(e.status))
    .reduce((sum, e) => sum + e.amount, 0);

  const activeCount = escrows.filter((e) =>
    ["FUNDED", "IN_PROGRESS", "DELIVERED"].includes(e.status)
  ).length;

  const disputedCount = escrows.filter((e) => e.status === "DISPUTED").length;

  const updateStatus = async (id: string, status: EscrowStatus, extraBody?: Record<string, string>) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/escrow/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...extraBody }),
      });
      const data = await res.json();
      if (data.aiResolution) {
        setAiResolution(data.aiResolution);
      }
      if (data.escrow) {
        setSelectedEscrow(data.escrow);
      }
      await fetchEscrows();
    } catch {
      console.error("Update failed");
    }
    setUpdating(false);
  };

  const getNextActions = (status: string) => {
    const actions: { label: string; status: string; variant: "default" | "outline" | "destructive" }[] = [];
    switch (status) {
      case "FUNDED":
        actions.push({ label: "Start Work", status: "IN_PROGRESS", variant: "default" });
        break;
      case "IN_PROGRESS":
        actions.push({ label: "Mark Delivered", status: "DELIVERED", variant: "default" });
        actions.push({ label: "Dispute", status: "DISPUTED", variant: "destructive" });
        break;
      case "DELIVERED":
        actions.push({ label: "Release Funds", status: "RELEASED", variant: "default" });
        actions.push({ label: "Dispute", status: "DISPUTED", variant: "destructive" });
        break;
      case "DISPUTED":
        actions.push({ label: "Refund Buyer", status: "REFUNDED", variant: "outline" });
        actions.push({ label: "Release to Seller", status: "RELEASED", variant: "default" });
        break;
    }
    return actions;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">
                Command Center
              </h1>
              <p className="text-xs text-muted-foreground">
                AI Oracle + Escrow Management
              </p>
            </div>
          </div>
          <Link href="/escrow/create">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/80 gap-2">
              <PlusCircle className="w-4 h-4" />
              New Escrow
            </Button>
          </Link>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            {
              label: "Total Escrows",
              value: escrows.length,
              icon: Shield,
              color: "text-primary",
            },
            {
              label: "Active",
              value: activeCount,
              icon: ArrowRightLeft,
              color: "text-indigo-400",
            },
            {
              label: "Locked Value",
              value: `${totalLocked.toLocaleString()} µA`,
              icon: Shield,
              color: "text-emerald-400",
            },
            {
              label: "Disputed",
              value: disputedCount,
              icon: AlertTriangle,
              color: "text-red-400",
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={cn("w-3.5 h-3.5", stat.color)} />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </span>
                </div>
                <div className={cn("text-xl font-bold font-mono", stat.color)}>
                  {stat.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Grid: Chat Left | Escrows Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
          {/* AI Oracle Chat */}
          <div className="lg:col-span-5">
            <OracleChat className="h-[560px]" />
          </div>

          {/* Escrow Panel */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden h-[560px] flex flex-col">
              {/* Filter Tabs */}
              <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2 overflow-x-auto">
                {statusFilters.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0",
                      filter === f.value
                        ? "bg-primary/15 text-primary border border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    {f.label}
                    {f.value !== "ALL" && (
                      <span className="ml-1.5 text-[10px] opacity-60">
                        {escrows.filter((e) =>
                          f.value === "ALL" ? true : e.status === f.value
                        ).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Escrow Grid */}
              <ScrollArea className="flex-1 p-4">
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-[180px] rounded-xl" />
                    ))}
                  </div>
                ) : filteredEscrows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
                    <Shield className="w-10 h-10 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      No escrows match this filter
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredEscrows.map((escrow) => (
                      <EscrowCard
                        key={escrow.id}
                        escrow={escrow}
                        onClick={() => {
                          setSelectedEscrow(escrow);
                          setDetailOpen(true);
                          setAiResolution("");
                          setDisputeReason("");
                        }}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Live Ledger */}
        <LedgerTerminal />
      </div>

      {/* Escrow Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg bg-card border-border/50 backdrop-blur-xl">
          {selectedEscrow && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display tracking-wider flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  {selectedEscrow.service}
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="details" className="mt-2">
                <TabsList className="bg-secondary/50 w-full">
                  <TabsTrigger value="details" className="flex-1 text-xs">
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="milestones" className="flex-1 text-xs">
                    Milestones
                  </TabsTrigger>
                  <TabsTrigger value="actions" className="flex-1 text-xs">
                    Actions
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase block mb-1">
                        Status
                      </span>
                      <Badge variant="outline">{selectedEscrow.status}</Badge>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase block mb-1">
                        Amount
                      </span>
                      <span className="font-mono font-bold text-primary">
                        {selectedEscrow.amount.toLocaleString()} µALGO
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase block mb-1">
                        Platform Fee
                      </span>
                      <span className="font-mono text-muted-foreground">
                        {selectedEscrow.platformFee.toLocaleString()} µALGO
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase block mb-1">
                        Seller Payout
                      </span>
                      <span className="font-mono text-emerald-400">
                        {selectedEscrow.sellerPayout.toLocaleString()} µALGO
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-secondary/30 rounded-lg border border-border/30 font-mono text-[10px] text-muted-foreground space-y-1">
                    <div>
                      <span className="text-indigo-400">Buyer: </span>
                      {selectedEscrow.buyer.substring(0, 30)}...
                    </div>
                    <div>
                      <span className="text-emerald-400">Seller: </span>
                      {selectedEscrow.seller.substring(0, 30)}...
                    </div>
                    <div>
                      <span className="text-primary">TX: </span>
                      {selectedEscrow.txId.substring(0, 30)}...
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="milestones" className="mt-4">
                  <div className="space-y-2">
                    {selectedEscrow.milestones.map((m) => (
                      <div
                        key={m.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border",
                          m.completed
                            ? "bg-emerald-400/5 border-emerald-400/20"
                            : "bg-secondary/30 border-border/30"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {m.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-muted-foreground/30" />
                          )}
                          <span className="text-sm">{m.title}</span>
                        </div>
                        <span className="font-mono text-xs text-primary">
                          {m.amount.toLocaleString()} µA
                        </span>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="actions" className="mt-4 space-y-3">
                  {/* Dispute reason input */}
                  {(selectedEscrow.status === "IN_PROGRESS" ||
                    selectedEscrow.status === "DELIVERED") && (
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase block mb-1.5">
                        Dispute Reason (for AI mediation)
                      </label>
                      <Textarea
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        placeholder="Describe the issue for Oracle analysis..."
                        className="text-sm min-h-[60px] bg-secondary/30"
                      />
                    </div>
                  )}

                  {/* AI Resolution Display */}
                  {(aiResolution || selectedEscrow.disputeResolution) && (
                    <div className="p-3 bg-indigo-glow/5 border border-indigo-glow/20 rounded-lg">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-glow" />
                        <span className="text-[10px] text-indigo-glow font-semibold uppercase">
                          Oracle Resolution
                        </span>
                      </div>
                      <p className="text-xs text-foreground/70 leading-relaxed whitespace-pre-wrap">
                        {aiResolution || selectedEscrow.disputeResolution}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {getNextActions(selectedEscrow.status).map((action) => (
                      <Button
                        key={action.status}
                        variant={action.variant}
                        size="sm"
                        disabled={updating}
                        onClick={() => {
                          if (action.status === "DISPUTED" && disputeReason) {
                            updateStatus(selectedEscrow.id, action.status, {
                              disputeReason,
                            });
                          } else if (action.status !== "DISPUTED") {
                            updateStatus(selectedEscrow.id, action.status);
                          }
                        }}
                        className="gap-1.5 text-xs"
                      >
                        {updating && (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        )}
                        {action.label}
                      </Button>
                    ))}
                  </div>

                  {selectedEscrow.disputeReason && (
                    <div className="p-3 bg-red-400/5 border border-red-400/20 rounded-lg">
                      <span className="text-[10px] text-red-400 font-semibold uppercase block mb-1">
                        Dispute Reason
                      </span>
                      <p className="text-xs text-foreground/70">
                        {selectedEscrow.disputeReason}
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
