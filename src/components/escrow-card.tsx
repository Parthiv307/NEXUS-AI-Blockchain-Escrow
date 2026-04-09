"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  Shield,
  Banknote,
  Truck,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface EscrowData {
  id: string;
  service: string;
  description: string;
  buyer: string;
  seller: string;
  amount: number;
  platformFee: number;
  sellerPayout: number;
  status: string;
  milestones: {
    id: string;
    title: string;
    amount: number;
    completed: boolean;
  }[];
  createdAt: string;
  updatedAt: string;
  txId: string;
  disputeReason?: string;
  disputeResolution?: string;
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ElementType; bgClass: string }
> = {
  PENDING: {
    label: "Pending",
    color: "text-yellow-400",
    icon: Clock,
    bgClass: "bg-yellow-400/10 border-yellow-400/20",
  },
  FUNDED: {
    label: "Funded",
    color: "text-blue-400",
    icon: Banknote,
    bgClass: "bg-blue-400/10 border-blue-400/20",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-indigo-400",
    icon: ArrowRightLeft,
    bgClass: "bg-indigo-400/10 border-indigo-400/20",
  },
  DELIVERED: {
    label: "Delivered",
    color: "text-cyan-400",
    icon: Truck,
    bgClass: "bg-cyan-400/10 border-cyan-400/20",
  },
  RELEASED: {
    label: "Released",
    color: "text-emerald-400",
    icon: CheckCircle2,
    bgClass: "bg-emerald-400/10 border-emerald-400/20",
  },
  DISPUTED: {
    label: "Disputed",
    color: "text-red-400",
    icon: AlertTriangle,
    bgClass: "bg-red-400/10 border-red-400/20",
  },
  REFUNDED: {
    label: "Refunded",
    color: "text-orange-400",
    icon: RotateCcw,
    bgClass: "bg-orange-400/10 border-orange-400/20",
  },
};

export function EscrowCard({
  escrow,
  onClick,
}: {
  escrow: EscrowData;
  onClick?: () => void;
}) {
  const config = statusConfig[escrow.status] || statusConfig.PENDING;
  const StatusIcon = config.icon;
  const completedMilestones = escrow.milestones.filter(
    (m) => m.completed
  ).length;
  const progress =
    escrow.milestones.length > 0
      ? (completedMilestones / escrow.milestones.length) * 100
      : 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 transition-all duration-200",
        "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
        onClick && "cursor-pointer"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground truncate">
            {escrow.service}
          </h4>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {escrow.id}
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "shrink-0 gap-1 text-[10px] font-mono border",
            config.bgClass,
            config.color
          )}
        >
          <StatusIcon className="w-3 h-3" />
          {config.label}
        </Badge>
      </div>

      {/* Amount */}
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-3.5 h-3.5 text-primary/60" />
        <span className="text-lg font-bold font-mono text-primary">
          {escrow.amount.toLocaleString()}
        </span>
        <span className="text-xs text-muted-foreground">µALGO</span>
      </div>

      {/* Milestones Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
          <span>
            Milestones: {completedMilestones}/{escrow.milestones.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border/30">
        <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[60%]">
          TX: {escrow.txId.substring(0, 16)}...
        </div>
        <div className="text-[10px] text-muted-foreground">
          {new Date(escrow.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
