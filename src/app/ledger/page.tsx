"use client";

import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ScrollText,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Activity,
  Sparkles,
  ExternalLink,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

const actionColors: Record<string, { text: string; bg: string }> = {
  ESCROW_CREATED: { text: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
  ESCROW_FUNDED: { text: "text-cyan-400", bg: "bg-cyan-400/10 border-cyan-400/20" },
  STATUS_IN_PROGRESS: { text: "text-indigo-400", bg: "bg-indigo-400/10 border-indigo-400/20" },
  STATUS_DELIVERED: { text: "text-teal-400", bg: "bg-teal-400/10 border-teal-400/20" },
  STATUS_RELEASED: { text: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" },
  ESCROW_RELEASED: { text: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" },
  STATUS_DISPUTED: { text: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
  DISPUTE_FILED: { text: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
  STATUS_REFUNDED: { text: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/20" },
  MILESTONE_COMPLETED: { text: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
};

const actionFilters = [
  { label: "All", value: "ALL" },
  { label: "Created", value: "ESCROW_CREATED" },
  { label: "Funded", value: "ESCROW_FUNDED" },
  { label: "Milestones", value: "MILESTONE_COMPLETED" },
  { label: "Released", value: "ESCROW_RELEASED" },
  { label: "Disputed", value: "DISPUTE_FILED" },
];

export default function LedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedTx, setCopiedTx] = useState<string | null>(null);
  const [aiExplaining, setAiExplaining] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<Record<string, string>>({});

  const fetchLedger = useCallback(async () => {
    try {
      const res = await fetch("/api/ledger");
      const data = await res.json();
      setEntries(data.entries || []);
    } catch {
      console.error("Ledger fetch failed");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLedger();
    const interval = setInterval(fetchLedger, 10000);
    return () => clearInterval(interval);
  }, [fetchLedger]);

  const filteredEntries = entries.filter((e) => {
    const matchesSearch =
      !search ||
      e.service.toLowerCase().includes(search.toLowerCase()) ||
      e.escrowId.toLowerCase().includes(search.toLowerCase()) ||
      e.txId.toLowerCase().includes(search.toLowerCase());
    const matchesAction =
      actionFilter === "ALL" || e.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const totalVolume = entries.reduce((sum, e) => sum + e.amount, 0);

  const copyTx = (txId: string) => {
    navigator.clipboard.writeText(txId);
    setCopiedTx(txId);
    setTimeout(() => setCopiedTx(null), 2000);
  };

  const explainWithAI = async (entry: LedgerEntry) => {
    if (aiExplanation[entry.id]) return;
    setAiExplaining(entry.id);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Explain this blockchain transaction in simple terms for a non-technical user:\n\nAction: ${entry.action}\nService: ${entry.service}\nAmount: ${entry.amount} µALGO\nEscrow ID: ${entry.escrowId}\nTimestamp: ${entry.timestamp}\n\nProvide a brief, clear explanation (2-3 sentences) of what happened and why it matters.`,
            },
          ],
          systemPrompt:
            "You are a blockchain transaction explainer. Explain transactions in simple, clear language. Be concise (2-3 sentences max). No jargon.",
        }),
      });
      const data = await res.json();
      setAiExplanation((prev) => ({
        ...prev,
        [entry.id]: data.reply || "Could not generate explanation.",
      }));
    } catch {
      setAiExplanation((prev) => ({
        ...prev,
        [entry.id]: "Oracle connection interrupted.",
      }));
    }
    setAiExplaining(null);
  };

  const formatDateTime = (ts: string) => {
    const d = new Date(ts);
    return {
      date: d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      time: d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
    };
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-glow/20 border border-indigo-glow/30 flex items-center justify-center">
              <ScrollText className="w-5 h-5 text-indigo-glow" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">
                Ledger Explorer
              </h1>
              <p className="text-xs text-muted-foreground">
                Full blockchain transaction history with AI summaries
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-glow animate-pulse" />
              <span className="text-[10px] font-mono text-emerald-glow">
                LIVE SYNC
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            {
              label: "Total Transactions",
              value: entries.length,
              color: "text-indigo-glow",
            },
            {
              label: "Total Volume",
              value: `${totalVolume.toLocaleString()} µA`,
              color: "text-primary",
            },
            {
              label: "Unique Escrows",
              value: new Set(entries.map((e) => e.escrowId)).size,
              color: "text-cyan-400",
            },
            {
              label: "Latest Block",
              value: entries.length > 0
                ? formatDateTime(entries[0].timestamp).time
                : "—",
              color: "text-emerald-glow",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-3"
            >
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                {stat.label}
              </span>
              <span className={cn("text-lg font-bold font-mono", stat.color)}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by service, escrow ID, or TX hash..."
              className="pl-10 bg-card/50 border-border/50 text-sm"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            {actionFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setActionFilter(f.value)}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all shrink-0 border",
                  actionFilter === f.value
                    ? "bg-indigo-glow/15 text-indigo-glow border-indigo-glow/20"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary/50"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger Table */}
        <div className="rounded-xl border border-border/50 bg-void/60 backdrop-blur-sm overflow-hidden font-mono">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 text-[10px] text-muted-foreground/60 border-b border-border/20 uppercase tracking-wider">
            <span className="col-span-2">Timestamp</span>
            <span className="col-span-2">Action</span>
            <span className="col-span-2">Escrow ID</span>
            <span className="col-span-3">Service</span>
            <span className="col-span-1 text-right">Amount</span>
            <span className="col-span-2 text-right">TX Hash</span>
          </div>

          {/* Entries */}
          <ScrollArea className="max-h-[600px]">
            {loading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="p-12 text-center">
                <Activity className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {search || actionFilter !== "ALL"
                    ? "No transactions match your filters"
                    : "No transactions recorded yet"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/10">
                {filteredEntries.map((entry) => {
                  const { date, time } = formatDateTime(entry.timestamp);
                  const colors = actionColors[entry.action] || {
                    text: "text-gray-400",
                    bg: "bg-gray-400/10 border-gray-400/20",
                  };
                  const isExpanded = expandedId === entry.id;

                  return (
                    <div key={entry.id}>
                      <button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : entry.id)
                        }
                        className={cn(
                          "w-full grid grid-cols-12 gap-2 px-4 py-3 text-xs items-center transition-colors text-left",
                          "hover:bg-indigo-glow/5",
                          isExpanded && "bg-indigo-glow/5"
                        )}
                      >
                        <div className="col-span-2">
                          <span className="block text-muted-foreground/80">
                            {date}
                          </span>
                          <span className="text-[10px] text-muted-foreground/50">
                            {time}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] font-mono border",
                              colors.bg,
                              colors.text
                            )}
                          >
                            {entry.action.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <span className="col-span-2 text-foreground/60 truncate">
                          {entry.escrowId}
                        </span>
                        <span className="col-span-3 text-foreground/80 truncate">
                          {entry.service}
                        </span>
                        <span className="col-span-1 text-right text-primary font-semibold">
                          {entry.amount.toLocaleString()}
                        </span>
                        <div className="col-span-2 text-right flex items-center justify-end gap-1">
                          <span className="text-emerald-glow/60 truncate">
                            {entry.txId.substring(0, 10)}...
                          </span>
                          <ChevronRight
                            className={cn(
                              "w-3 h-3 text-muted-foreground/40 transition-transform shrink-0",
                              isExpanded && "rotate-90"
                            )}
                          />
                        </div>
                      </button>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 space-y-3">
                          {/* AI Summary */}
                          {entry.aiSummary && (
                            <div className="bg-indigo-glow/5 border border-indigo-glow/10 rounded-lg p-3">
                              <span className="text-[10px] text-indigo-glow font-semibold block mb-1">
                                AI SUMMARY
                              </span>
                              <p className="text-xs text-foreground/70 leading-relaxed">
                                {entry.aiSummary}
                              </p>
                            </div>
                          )}

                          {/* AI Explain */}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => explainWithAI(entry)}
                              disabled={
                                aiExplaining === entry.id ||
                                !!aiExplanation[entry.id]
                              }
                              className="text-[10px] h-7 gap-1 border-indigo-glow/30 text-indigo-glow hover:bg-indigo-glow/10"
                            >
                              <Sparkles className="w-3 h-3" />
                              {aiExplaining === entry.id
                                ? "Analyzing..."
                                : aiExplanation[entry.id]
                                ? "Explained"
                                : "Explain with AI"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyTx(entry.txId)}
                              className="text-[10px] h-7 gap-1"
                            >
                              {copiedTx === entry.txId ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              {copiedTx === entry.txId
                                ? "Copied!"
                                : "Copy TX"}
                            </Button>
                          </div>

                          {/* AI Explanation */}
                          {aiExplanation[entry.id] && (
                            <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                              <span className="text-[10px] text-primary font-semibold block mb-1">
                                AI EXPLANATION
                              </span>
                              <div className="prose prose-invert prose-sm max-w-none text-xs [&_p]:mb-1">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {aiExplanation[entry.id]}
                                </ReactMarkdown>
                              </div>
                            </div>
                          )}

                          {/* Full Details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px]">
                            <div className="bg-secondary/20 rounded-lg p-2.5 space-y-1.5">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground/50">
                                  Full TX Hash
                                </span>
                                <ExternalLink className="w-3 h-3 text-muted-foreground/30" />
                              </div>
                              <span className="text-emerald-glow/70 break-all block">
                                {entry.txId}
                              </span>
                            </div>
                            <div className="bg-secondary/20 rounded-lg p-2.5 space-y-1.5">
                              <div>
                                <span className="text-indigo-400">Buyer: </span>
                                <span className="text-foreground/50 break-all">
                                  {entry.buyer}
                                </span>
                              </div>
                              <div>
                                <span className="text-emerald-400">
                                  Seller:{" "}
                                </span>
                                <span className="text-foreground/50 break-all">
                                  {entry.seller}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
