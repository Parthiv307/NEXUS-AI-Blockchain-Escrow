"use client";

import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Activity, ChevronRight } from "lucide-react";

interface LedgerEntry {
  id: string;
  escrowId: string;
  service: string;
  action: string;
  amount: number;
  txId: string;
  timestamp: string;
  aiSummary?: string;
  buyer: string;
  seller: string;
}

interface LedgerTerminalProps {
  className?: string;
  compact?: boolean;
  maxEntries?: number;
}

const actionColors: Record<string, string> = {
  ESCROW_CREATED: "text-blue-400",
  ESCROW_FUNDED: "text-cyan-400",
  STATUS_IN_PROGRESS: "text-indigo-400",
  STATUS_DELIVERED: "text-teal-400",
  STATUS_RELEASED: "text-emerald-400",
  STATUS_DISPUTED: "text-red-400",
  STATUS_REFUNDED: "text-orange-400",
  MILESTONE_COMPLETED: "text-green-400",
};

export function LedgerTerminal({
  className,
  compact = false,
  maxEntries = 20,
}: LedgerTerminalProps) {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLedger();
    const interval = setInterval(fetchLedger, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchLedger = async () => {
    try {
      const res = await fetch("/api/ledger");
      const data = await res.json();
      setEntries(data.entries?.slice(0, maxEntries) || []);
    } catch {
      console.error("Ledger fetch failed");
    }
    setLoading(false);
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (ts: string) => {
    return new Date(ts).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border/50 overflow-hidden",
        "bg-void/80 backdrop-blur-sm font-mono",
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-indigo-glow" />
          <span className="text-xs font-bold tracking-widest text-indigo-glow uppercase">
            Secure Ledger
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-glow animate-pulse" />
          <span className="text-[10px] text-emerald-glow">LIVE</span>
        </div>
      </div>

      {/* Column Headers */}
      {!compact && (
        <div className="grid grid-cols-12 gap-2 px-4 py-1.5 text-[10px] text-muted-foreground/60 border-b border-border/20 uppercase tracking-wider">
          <span className="col-span-2">Time</span>
          <span className="col-span-2">Action</span>
          <span className="col-span-3">Service</span>
          <span className="col-span-2 text-right">Amount</span>
          <span className="col-span-3 text-right">TX Hash</span>
        </div>
      )}

      {/* Entries */}
      <ScrollArea className={cn(compact ? "h-[200px]" : "h-[300px]")}>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground/50 text-xs">
            Syncing with network...
          </div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground/50 text-xs italic">
            Awaiting network blocks...
          </div>
        ) : (
          <div className="divide-y divide-border/10">
            {entries.map((entry) => (
              <div key={entry.id}>
                <button
                  onClick={() =>
                    setExpandedId(expandedId === entry.id ? null : entry.id)
                  }
                  className={cn(
                    "w-full grid grid-cols-12 gap-2 px-4 py-2 text-xs items-center transition-colors",
                    "hover:bg-indigo-glow/5",
                    expandedId === entry.id && "bg-indigo-glow/5"
                  )}
                >
                  <span className="col-span-2 text-muted-foreground/70">
                    <span className="block">{formatDate(entry.timestamp)}</span>
                    <span className="text-[10px]">
                      {formatTime(entry.timestamp)}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "col-span-2 font-semibold text-[10px]",
                      actionColors[entry.action] || "text-gray-400"
                    )}
                  >
                    {entry.action.replace(/_/g, " ")}
                  </span>
                  <span className="col-span-3 text-foreground/70 truncate text-left">
                    {entry.service}
                  </span>
                  <span className="col-span-2 text-right text-primary font-semibold">
                    {entry.amount.toLocaleString()}
                  </span>
                  <span className="col-span-3 text-right text-emerald-glow/70 flex items-center justify-end gap-1">
                    <span className="truncate">
                      {entry.txId.substring(0, 12)}...
                    </span>
                    <ChevronRight
                      className={cn(
                        "w-3 h-3 transition-transform shrink-0",
                        expandedId === entry.id && "rotate-90"
                      )}
                    />
                  </span>
                </button>

                {/* Expanded: AI Summary */}
                {expandedId === entry.id && entry.aiSummary && (
                  <div className="px-4 pb-3 pt-1">
                    <div className="bg-indigo-glow/5 border border-indigo-glow/10 rounded-lg p-3 text-xs text-foreground/70 leading-relaxed">
                      <span className="text-[10px] text-indigo-glow font-semibold block mb-1">
                        AI SUMMARY
                      </span>
                      {entry.aiSummary}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-muted-foreground/50">Buyer:</span>
                        <span className="text-foreground/50 ml-1 break-all">
                          {entry.buyer.substring(0, 20)}...
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground/50">
                          Seller:
                        </span>
                        <span className="text-foreground/50 ml-1 break-all">
                          {entry.seller.substring(0, 20)}...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
