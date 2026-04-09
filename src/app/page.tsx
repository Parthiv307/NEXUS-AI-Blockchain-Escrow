"use client";

import { Navbar } from "@/components/navbar";
import { SplineScene } from "@/components/spline-scene";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Zap,
  Shield,
  Brain,
  ScrollText,
  ArrowRight,
  Sparkles,
  Lock,
  Eye,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Brain,
    title: "AI Oracle",
    description:
      "Intelligent escrow advisor that analyzes contracts, suggests optimal terms, and negotiates fair deals.",
    gradient: "from-primary/20 to-primary/5",
    borderColor: "border-primary/30",
    iconColor: "text-primary",
  },
  {
    icon: Shield,
    title: "Blockchain Escrow",
    description:
      "Algorand-powered smart contracts with milestone-based releases, 2% platform fee, and full state machine lifecycle.",
    gradient: "from-indigo-glow/20 to-indigo-glow/5",
    borderColor: "border-indigo-glow/30",
    iconColor: "text-indigo-glow",
  },
  {
    icon: Scale,
    title: "AI Dispute Mediator",
    description:
      "When conflicts arise, the Oracle reviews evidence from both parties and suggests fair, reasoned resolutions.",
    gradient: "from-emerald-glow/20 to-emerald-glow/5",
    borderColor: "border-emerald-glow/30",
    iconColor: "text-emerald-glow",
  },
  {
    icon: Eye,
    title: "Smart Contract Explainer",
    description:
      "AI breaks down complex contract code into plain English, making blockchain transparent for everyone.",
    gradient: "from-cyan-400/20 to-cyan-400/5",
    borderColor: "border-cyan-400/30",
    iconColor: "text-cyan-400",
  },
  {
    icon: ScrollText,
    title: "Live Ledger Explorer",
    description:
      "Real-time transaction terminal with AI-generated summaries for every blockchain event.",
    gradient: "from-violet-400/20 to-violet-400/5",
    borderColor: "border-violet-400/30",
    iconColor: "text-violet-400",
  },
  {
    icon: Lock,
    title: "Document Analysis",
    description:
      "Upload contracts and PDFs — AI extracts key terms, parties, and milestones to auto-populate escrow fields.",
    gradient: "from-amber-400/20 to-amber-400/5",
    borderColor: "border-amber-400/30",
    iconColor: "text-amber-400",
  },
];

const stats = [
  { value: "52K+", label: "µALGO Secured" },
  { value: "4", label: "Active Escrows" },
  { value: "98%", label: "Resolution Rate" },
  { value: "24/7", label: "Oracle Uptime" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        {/* Spline Background */}
        <div className="absolute inset-0 z-0">
          <SplineScene className="w-full h-full opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-7"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-8">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-mono text-primary tracking-wide">
                AI + BLOCKCHAIN CONVERGENCE
              </span>
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
              <span className="text-foreground">Where</span>{" "}
              <span className="text-primary">Intelligence</span>
              <br />
              <span className="text-foreground">Meets</span>{" "}
              <span className="text-indigo-glow">Security</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-10">
              NEXUS fuses AI oracle intelligence with Algorand blockchain
              escrow. The AI makes blockchain accessible. The blockchain makes
              AI verifiable. Together, they&apos;re unstoppable.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/80 font-display tracking-wider gap-2 px-8 h-12"
                >
                  Enter NEXUS
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/escrow/create">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-border/50 hover:bg-secondary/50 font-display tracking-wider gap-2 px-8 h-12"
                >
                  <Zap className="w-4 h-4" />
                  Create Escrow
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats panel */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-5"
          >
            <div className="bg-card/30 backdrop-blur-xl border border-border/30 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-emerald-glow animate-pulse" />
                <span className="text-[10px] font-mono text-emerald-glow tracking-widest uppercase">
                  Network Status: Live
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-secondary/30 border border-border/30 rounded-xl p-4"
                  >
                    <div className="text-2xl font-bold font-mono text-primary">
                      {stat.value}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-border/30">
                <div className="font-mono text-[10px] text-muted-foreground/60 space-y-1">
                  <div className="flex justify-between">
                    <span>Protocol</span>
                    <span className="text-foreground/60">Algorand ARC4</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Oracle Engine</span>
                    <span className="text-foreground/60">Groq LLM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee</span>
                    <span className="text-primary">2.0%</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              AI & Blockchain,{" "}
              <span className="text-primary">Complementary</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Two powerful systems deeply intertwined — AI makes blockchain
              smart, blockchain makes AI accountable.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "group rounded-xl border bg-gradient-to-b p-5 transition-all duration-300",
                    "hover:shadow-lg hover:-translate-y-0.5",
                    feature.gradient,
                    feature.borderColor
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg bg-background/50 border border-border/30 flex items-center justify-center mb-4",
                      "group-hover:scale-110 transition-transform"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", feature.iconColor)} />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-card/30 backdrop-blur-xl border border-primary/20 rounded-2xl p-10 shadow-2xl shadow-primary/5"
          >
            <div className="w-14 h-14 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-6">
              <Zap className="w-7 h-7 text-primary" />
            </div>
            <h2 className="font-display text-3xl font-bold mb-4">
              Ready to Enter the <span className="text-primary">NEXUS</span>?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Create your first AI-powered escrow contract. The Oracle will
              guide you through every step with intelligent recommendations.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/escrow/create">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/80 font-display tracking-wider gap-2 px-8"
                >
                  <Sparkles className="w-4 h-4" />
                  Create Escrow
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-primary/30 hover:bg-primary/10 font-display tracking-wider gap-2 px-8"
                >
                  View Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-display text-sm tracking-[0.15em] text-primary">
              NEXUS
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              AI-Powered Blockchain Escrow
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Built on Algorand Protocol &middot; Powered by Groq AI
          </p>
        </div>
      </footer>
    </div>
  );
}
