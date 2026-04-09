// In-memory escrow store (simulates blockchain state)
// In production, this would be backed by Algorand smart contracts

export type EscrowStatus =
  | "PENDING"
  | "FUNDED"
  | "IN_PROGRESS"
  | "DELIVERED"
  | "RELEASED"
  | "DISPUTED"
  | "REFUNDED";

export interface EscrowMilestone {
  id: string;
  title: string;
  amount: number;
  completed: boolean;
}

export interface Escrow {
  id: string;
  service: string;
  description: string;
  buyer: string;
  seller: string;
  amount: number;
  platformFee: number;
  sellerPayout: number;
  status: EscrowStatus;
  milestones: EscrowMilestone[];
  createdAt: string;
  updatedAt: string;
  txId: string;
  disputeReason?: string;
  disputeResolution?: string;
}

export interface LedgerEntry {
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

function generateTxId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 52; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateAddress(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let result = "";
  for (let i = 0; i < 58; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateId(): string {
  return `ESC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

// Seed data
const seedEscrows: Escrow[] = [
  {
    id: "ESC-ALPHA-001",
    service: "Smart Contract Audit",
    description: "Full security audit of DeFi lending protocol smart contracts",
    buyer: generateAddress(),
    seller: generateAddress(),
    amount: 25000,
    platformFee: 500,
    sellerPayout: 24500,
    status: "IN_PROGRESS",
    milestones: [
      { id: "m1", title: "Initial Code Review", amount: 8000, completed: true },
      { id: "m2", title: "Vulnerability Assessment", amount: 10000, completed: false },
      { id: "m3", title: "Final Report", amount: 7000, completed: false },
    ],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    txId: generateTxId(),
  },
  {
    id: "ESC-BETA-002",
    service: "AI Model Training Pipeline",
    description: "Custom ML pipeline for blockchain transaction classification",
    buyer: generateAddress(),
    seller: generateAddress(),
    amount: 15000,
    platformFee: 300,
    sellerPayout: 14700,
    status: "FUNDED",
    milestones: [
      { id: "m1", title: "Data Preprocessing", amount: 5000, completed: false },
      { id: "m2", title: "Model Training", amount: 7000, completed: false },
      { id: "m3", title: "Deployment", amount: 3000, completed: false },
    ],
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    txId: generateTxId(),
  },
  {
    id: "ESC-GAMMA-003",
    service: "NFT Marketplace Frontend",
    description: "React-based NFT marketplace with wallet integration",
    buyer: generateAddress(),
    seller: generateAddress(),
    amount: 12000,
    platformFee: 240,
    sellerPayout: 11760,
    status: "RELEASED",
    milestones: [
      { id: "m1", title: "UI Design", amount: 3000, completed: true },
      { id: "m2", title: "Frontend Dev", amount: 6000, completed: true },
      { id: "m3", title: "Wallet Integration", amount: 3000, completed: true },
    ],
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    txId: generateTxId(),
  },
  {
    id: "ESC-DELTA-004",
    service: "Tokenomics Consulting",
    description: "Token distribution model and vesting schedule design",
    buyer: generateAddress(),
    seller: generateAddress(),
    amount: 8000,
    platformFee: 160,
    sellerPayout: 7840,
    status: "DISPUTED",
    milestones: [
      { id: "m1", title: "Market Analysis", amount: 3000, completed: true },
      { id: "m2", title: "Token Model Design", amount: 5000, completed: false },
    ],
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    txId: generateTxId(),
    disputeReason: "Deliverable quality did not meet agreed specifications for token model design phase.",
  },
];

const seedLedger: LedgerEntry[] = [
  {
    id: "L001",
    escrowId: "ESC-ALPHA-001",
    service: "Smart Contract Audit",
    action: "ESCROW_CREATED",
    amount: 25000,
    txId: generateTxId(),
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
    aiSummary: "New escrow initiated for a comprehensive DeFi smart contract security audit. 25,000 µALGO locked with 3 milestone-based releases.",
    buyer: seedEscrows[0].buyer,
    seller: seedEscrows[0].seller,
  },
  {
    id: "L002",
    escrowId: "ESC-ALPHA-001",
    service: "Smart Contract Audit",
    action: "MILESTONE_COMPLETED",
    amount: 8000,
    txId: generateTxId(),
    timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
    aiSummary: "First milestone 'Initial Code Review' completed and verified. 8,000 µALGO released to seller from escrow.",
    buyer: seedEscrows[0].buyer,
    seller: seedEscrows[0].seller,
  },
  {
    id: "L003",
    escrowId: "ESC-BETA-002",
    service: "AI Model Training Pipeline",
    action: "ESCROW_FUNDED",
    amount: 15000,
    txId: generateTxId(),
    timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
    aiSummary: "Buyer funded escrow for ML pipeline development. 15,000 µALGO now held in smart contract awaiting work commencement.",
    buyer: seedEscrows[1].buyer,
    seller: seedEscrows[1].seller,
  },
  {
    id: "L004",
    escrowId: "ESC-GAMMA-003",
    service: "NFT Marketplace Frontend",
    action: "ESCROW_RELEASED",
    amount: 12000,
    txId: generateTxId(),
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    aiSummary: "All milestones completed. Full escrow of 12,000 µALGO released to seller. Platform fee of 240 µALGO collected. Contract closed successfully.",
    buyer: seedEscrows[2].buyer,
    seller: seedEscrows[2].seller,
  },
  {
    id: "L005",
    escrowId: "ESC-DELTA-004",
    service: "Tokenomics Consulting",
    action: "DISPUTE_FILED",
    amount: 8000,
    txId: generateTxId(),
    timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
    aiSummary: "Buyer disputed escrow citing quality concerns on token model deliverable. 8,000 µALGO frozen pending AI Oracle mediation.",
    buyer: seedEscrows[3].buyer,
    seller: seedEscrows[3].seller,
  },
];

// Global store
let escrows: Escrow[] = [...seedEscrows];
let ledger: LedgerEntry[] = [...seedLedger];

export function getEscrows(): Escrow[] {
  return [...escrows];
}

export function getEscrow(id: string): Escrow | undefined {
  return escrows.find((e) => e.id === id);
}

export function createEscrow(data: {
  service: string;
  description: string;
  amount: number;
  milestones: { title: string; amount: number }[];
}): Escrow {
  const fee = Math.round(data.amount * 0.02);
  const escrow: Escrow = {
    id: generateId(),
    service: data.service,
    description: data.description,
    buyer: generateAddress(),
    seller: generateAddress(),
    amount: data.amount,
    platformFee: fee,
    sellerPayout: data.amount - fee,
    status: "FUNDED",
    milestones: data.milestones.map((m, i) => ({
      id: `m${i + 1}`,
      title: m.title,
      amount: m.amount,
      completed: false,
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    txId: generateTxId(),
  };
  escrows = [escrow, ...escrows];

  addLedgerEntry({
    escrowId: escrow.id,
    service: escrow.service,
    action: "ESCROW_CREATED",
    amount: escrow.amount,
    buyer: escrow.buyer,
    seller: escrow.seller,
  });

  return escrow;
}

export function updateEscrowStatus(id: string, status: EscrowStatus, extra?: { disputeReason?: string; disputeResolution?: string }): Escrow | null {
  const idx = escrows.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  escrows[idx] = {
    ...escrows[idx],
    status,
    updatedAt: new Date().toISOString(),
    ...(extra || {}),
  };

  addLedgerEntry({
    escrowId: escrows[idx].id,
    service: escrows[idx].service,
    action: `STATUS_${status}`,
    amount: escrows[idx].amount,
    buyer: escrows[idx].buyer,
    seller: escrows[idx].seller,
  });

  return escrows[idx];
}

export function getLedger(): LedgerEntry[] {
  return [...ledger].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function addLedgerEntry(data: {
  escrowId: string;
  service: string;
  action: string;
  amount: number;
  buyer: string;
  seller: string;
  aiSummary?: string;
}): LedgerEntry {
  const entry: LedgerEntry = {
    id: `L${String(ledger.length + 1).padStart(3, "0")}`,
    escrowId: data.escrowId,
    service: data.service,
    action: data.action,
    amount: data.amount,
    txId: generateTxId(),
    timestamp: new Date().toISOString(),
    aiSummary: data.aiSummary,
    buyer: data.buyer,
    seller: data.seller,
  };
  ledger = [entry, ...ledger];
  return entry;
}
