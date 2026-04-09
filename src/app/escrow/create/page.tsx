"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  Sparkles,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  Shield,
  Zap,
  Upload,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Milestone {
  title: string;
  amount: number;
}

export default function CreateEscrowPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState("");
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [created, setCreated] = useState(false);
  const [createdEscrow, setCreatedEscrow] = useState<{
    id: string;
    txId: string;
    amount: number;
    service: string;
  } | null>(null);

  // Form state
  const [service, setService] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [milestones, setMilestones] = useState<Milestone[]>([
    { title: "Initial Delivery", amount: 0 },
    { title: "Final Completion", amount: 0 },
  ]);
  const [file, setFile] = useState<File | null>(null);

  // Counter offer
  const [counterOffer, setCounterOffer] = useState<{
    suggestedPrice: number;
    message: string;
  } | null>(null);

  const totalMilestone = milestones.reduce((s, m) => s + m.amount, 0);
  const parsedAmount = parseInt(amount) || 0;

  const distributeMilestones = (total: number) => {
    if (milestones.length === 0) return;
    const perMilestone = Math.floor(total / milestones.length);
    const remainder = total - perMilestone * milestones.length;
    setMilestones(
      milestones.map((m, i) => ({
        ...m,
        amount: perMilestone + (i === milestones.length - 1 ? remainder : 0),
      }))
    );
  };

  const addMilestone = () => {
    setMilestones([...milestones, { title: "", amount: 0 }]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length <= 1) return;
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const getAiAdvice = async () => {
    if (!service || !parsedAmount) return;
    setAdviceLoading(true);
    setAiAdvice("");
    try {
      const res = await fetch("/api/escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "advise",
          service,
          budget: parsedAmount,
        }),
      });
      const data = await res.json();
      setAiAdvice(data.advice || "Oracle could not provide advice.");
    } catch {
      setAiAdvice("Oracle connection interrupted. Please try again.");
    }
    setAdviceLoading(false);
  };

  const checkCounterOffer = async () => {
    if (!service || parsedAmount < 1000) return;
    try {
      const res = await fetch("/api/escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "counter-offer",
          service,
          budget: parsedAmount,
          marketRate: parsedAmount * 1.5,
        }),
      });
      const data = await res.json();
      if (data.status === "counter_offer") {
        setCounterOffer({
          suggestedPrice: data.suggestedPrice,
          message: data.message,
        });
      }
    } catch {
      console.error("Counter offer check failed");
    }
  };

  const acceptCounterOffer = () => {
    if (counterOffer) {
      setAmount(String(counterOffer.suggestedPrice));
      distributeMilestones(counterOffer.suggestedPrice);
      setCounterOffer(null);
    }
  };

  const createEscrow = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          service,
          description: description || service,
          amount: parsedAmount,
          milestones: milestones.map((m) => ({
            title: m.title,
            amount: m.amount,
          })),
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setCreated(true);
        setCreatedEscrow({
          id: data.escrow.id,
          txId: data.escrow.txId,
          amount: data.escrow.amount,
          service: data.escrow.service,
        });
      }
    } catch {
      console.error("Create failed");
    }
    setLoading(false);
  };

  // Success State
  if (created && createdEscrow) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 pt-28 pb-12">
          <div className="bg-card/50 backdrop-blur-sm border border-emerald-400/30 rounded-2xl p-8 text-center shadow-xl shadow-emerald-400/5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight mb-2">
              Pact Sealed
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              Your escrow contract has been deployed to the blockchain.
            </p>

            <div className="bg-secondary/30 rounded-xl p-4 mb-6 text-left space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service</span>
                <span className="text-foreground font-medium">
                  {createdEscrow.service}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Escrow ID</span>
                <span className="text-primary">{createdEscrow.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="text-emerald-400 font-bold">
                  {createdEscrow.amount.toLocaleString()} µALGO
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TX Hash</span>
                <span className="text-emerald-400/70 truncate max-w-[200px]">
                  {createdEscrow.txId.substring(0, 24)}...
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => router.push("/dashboard")}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/80 gap-2"
              >
                View Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCreated(false);
                  setCreatedEscrow(null);
                  setStep(1);
                  setService("");
                  setDescription("");
                  setAmount("");
                  setMilestones([
                    { title: "Initial Delivery", amount: 0 },
                    { title: "Final Completion", amount: 0 },
                  ]);
                  setAiAdvice("");
                  setCounterOffer(null);
                }}
                className="flex-1"
              >
                Create Another
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <PlusCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Create Escrow
            </h1>
            <p className="text-xs text-muted-foreground">
              AI-assisted escrow contract creation
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all",
                  step >= s
                    ? "bg-primary/20 border-primary/30 text-primary"
                    : "bg-secondary/30 border-border/30 text-muted-foreground"
                )}
              >
                {step > s ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  s
                )}
              </div>
              {s < 3 && (
                <div
                  className={cn(
                    "flex-1 h-px transition-colors",
                    step > s ? "bg-primary/30" : "bg-border/30"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Service Details */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 space-y-5">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                  Service / Project Name
                </Label>
                <Input
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  placeholder="e.g., Smart Contract Audit, DApp Frontend Development"
                  className="bg-secondary/30 border-border/50"
                />
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                  Description
                </Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the service requirements, deliverables, and expectations..."
                  className="bg-secondary/30 border-border/50 min-h-[100px]"
                />
              </div>

              {/* File Upload */}
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                  Upload Contract / Document (Optional)
                </Label>
                {file ? (
                  <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-4 py-2.5">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground/80 font-mono truncate flex-1">
                      {file.name}
                    </span>
                    <button
                      onClick={() => setFile(null)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <div className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center hover:border-primary/30 transition-colors">
                      <Upload className="w-6 h-6 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">
                        Drop a PDF or contract file for AI analysis
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.txt,.md,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setFile(e.target.files[0]);
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!service.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/80 gap-2"
              >
                Next: Budget & Milestones
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Budget & Milestones */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 space-y-5">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                  Budget (µALGO)
                </Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g., 10000"
                  className="bg-secondary/30 border-border/50 font-mono text-lg"
                />
                {parsedAmount > 0 && (
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground font-mono">
                    <span>
                      Platform Fee (2%):{" "}
                      <span className="text-primary">
                        {Math.round(parsedAmount * 0.02).toLocaleString()} µALGO
                      </span>
                    </span>
                    <span>
                      Seller Receives:{" "}
                      <span className="text-emerald-400">
                        {Math.round(parsedAmount * 0.98).toLocaleString()} µALGO
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* AI Advice Button */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={getAiAdvice}
                  disabled={adviceLoading || !service || !parsedAmount}
                  className="gap-1.5 text-xs border-indigo-glow/30 text-indigo-glow hover:bg-indigo-glow/10"
                >
                  {adviceLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  Get AI Advice
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkCounterOffer}
                  disabled={!service || parsedAmount < 1000}
                  className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
                >
                  <Zap className="w-3 h-3" />
                  Check Market Rate
                </Button>
              </div>

              {/* AI Advice Display */}
              {aiAdvice && (
                <div className="bg-indigo-glow/5 border border-indigo-glow/20 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-glow" />
                    <span className="text-[10px] text-indigo-glow font-semibold uppercase tracking-wider">
                      Oracle Advisory
                    </span>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none text-xs [&_p]:mb-2 [&_h2]:text-indigo-glow [&_h3]:text-indigo-glow/80 [&_code]:bg-black/30 [&_code]:px-1 [&_code]:rounded [&_table]:text-xs [&_th]:text-indigo-glow/80">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {aiAdvice}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Counter Offer */}
              {counterOffer && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] text-primary font-semibold uppercase tracking-wider">
                      Oracle Counter-Offer
                    </span>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none text-xs mb-3 [&_p]:mb-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {counterOffer.message}
                    </ReactMarkdown>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="border-primary/30 text-primary font-mono"
                    >
                      Suggested: {counterOffer.suggestedPrice.toLocaleString()}{" "}
                      µALGO
                    </Badge>
                    <Button
                      size="sm"
                      onClick={acceptCounterOffer}
                      className="bg-primary text-primary-foreground hover:bg-primary/80 text-xs gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Accept
                    </Button>
                  </div>
                </div>
              )}

              {/* Milestones */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Milestones
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => distributeMilestones(parsedAmount)}
                      disabled={!parsedAmount}
                      className="text-[10px] text-primary h-6"
                    >
                      Auto-distribute
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={addMilestone}
                      className="text-[10px] h-6 gap-1"
                    >
                      <PlusCircle className="w-3 h-3" />
                      Add
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {milestones.map((m, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 bg-secondary/20 rounded-lg p-2"
                    >
                      <span className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] text-primary font-bold shrink-0">
                        {i + 1}
                      </span>
                      <Input
                        value={m.title}
                        onChange={(e) => {
                          const updated = [...milestones];
                          updated[i] = { ...updated[i], title: e.target.value };
                          setMilestones(updated);
                        }}
                        placeholder="Milestone title"
                        className="flex-1 bg-transparent border-border/30 text-sm h-8"
                      />
                      <Input
                        type="number"
                        value={m.amount || ""}
                        onChange={(e) => {
                          const updated = [...milestones];
                          updated[i] = {
                            ...updated[i],
                            amount: parseInt(e.target.value) || 0,
                          };
                          setMilestones(updated);
                        }}
                        placeholder="µALGO"
                        className="w-28 bg-transparent border-border/30 text-sm h-8 font-mono"
                      />
                      {milestones.length > 1 && (
                        <button
                          onClick={() => removeMilestone(i)}
                          className="text-destructive/60 hover:text-destructive shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {parsedAmount > 0 && totalMilestone !== parsedAmount && (
                  <p className="text-[10px] text-destructive mt-2 font-mono">
                    Milestone total ({totalMilestone.toLocaleString()}) ≠ Budget
                    ({parsedAmount.toLocaleString()})
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!parsedAmount || milestones.some((m) => !m.title)}
                className="bg-primary text-primary-foreground hover:bg-primary/80 gap-2"
              >
                Review & Deploy
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Deploy */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-card/50 backdrop-blur-sm border border-primary/20 rounded-xl p-6 shadow-xl shadow-primary/5">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border/30">
                <Shield className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg tracking-wider">
                  Contract Review
                </h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase block mb-1">
                      Service
                    </span>
                    <span className="font-medium">{service}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase block mb-1">
                      Total Amount
                    </span>
                    <span className="font-mono font-bold text-primary text-lg">
                      {parsedAmount.toLocaleString()} µALGO
                    </span>
                  </div>
                </div>

                {description && (
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase block mb-1">
                      Description
                    </span>
                    <p className="text-sm text-foreground/80">{description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-secondary/30 rounded-lg p-3">
                    <span className="text-muted-foreground block mb-1">
                      Platform Fee (2%)
                    </span>
                    <span className="text-primary font-bold">
                      {Math.round(parsedAmount * 0.02).toLocaleString()} µALGO
                    </span>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-3">
                    <span className="text-muted-foreground block mb-1">
                      Seller Payout (98%)
                    </span>
                    <span className="text-emerald-400 font-bold">
                      {Math.round(parsedAmount * 0.98).toLocaleString()} µALGO
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground uppercase block mb-2">
                    Milestones ({milestones.length})
                  </span>
                  <div className="space-y-1.5">
                    {milestones.map((m, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-secondary/20 rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] text-primary font-bold">
                            {i + 1}
                          </span>
                          <span className="text-sm">{m.title}</span>
                        </div>
                        <span className="font-mono text-xs text-primary">
                          {m.amount.toLocaleString()} µALGO
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={createEscrow}
                disabled={loading}
                className="bg-primary text-primary-foreground hover:bg-primary/80 gap-2 font-display tracking-wider px-8"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Forging Contract...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Deploy to Blockchain
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
