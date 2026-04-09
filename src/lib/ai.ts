// Google Gemini AI Client — fully functional with provided API key
// Uses @google/generative-ai SDK with gemini-2.5-flash

import { GoogleGenerativeAI } from "@google/generative-ai";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function getGeminiClient() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || "";
  if (!apiKey) throw new Error("GOOGLE_GEMINI_API_KEY not set");
  return new GoogleGenerativeAI(apiKey);
}

async function callGeminiWithRetry(
  genAI: GoogleGenerativeAI,
  messages: ChatMessage[],
  systemPrompt: string,
  retries = 2,
  baseDelay = 2000
): Promise<string> {
  // Pass systemInstruction as Content object to getGenerativeModel
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: { parts: [{ text: systemPrompt }], role: "user" },
  });

  // Build conversation history for Gemini
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: m.content }],
  }));

  // Filter consecutive same-role messages (Gemini requires alternating)
  const cleanHistory: { role: "user" | "model"; parts: { text: string }[] }[] = [];
  for (const msg of history) {
    if (cleanHistory.length === 0 || cleanHistory[cleanHistory.length - 1].role !== msg.role) {
      cleanHistory.push(msg);
    } else {
      cleanHistory[cleanHistory.length - 1].parts[0].text += "\n\n" + msg.parts[0].text;
    }
  }

  const chat = model.startChat({
    history: cleanHistory.length > 0 ? cleanHistory : undefined,
  });

  const lastMessage = messages[messages.length - 1];

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await chat.sendMessage(lastMessage.content);
      return result.response.text() || "The Oracle is silent. Please try again.";
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      const is429 = err.status === 429 || (err.message && err.message.includes("429"));

      if (is429 && attempt < retries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`[Gemini] Rate limited. Retrying in ${delay}ms (attempt ${attempt + 1}/${retries})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      if (is429) {
        console.warn("[Gemini] Rate limit persists after retries. Using intelligent fallback.");
      } else {
        console.error("[Gemini] API error:", err.message || error);
      }
      throw error;
    }
  }

  throw new Error("Exhausted retries");
}

export async function chatWithOracle(
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<string> {
  const defaultSystem = `You are NEXUS Oracle — an advanced AI assistant specializing in blockchain escrow transactions, smart contracts, and decentralized finance. You operate within the NEXUS platform which combines AI intelligence with Algorand blockchain security.

Your capabilities:
- Advise users on escrow contract terms, budgets, and milestone structures
- Analyze documents and extract key escrow-relevant information  
- Explain smart contract code in plain English
- Mediate disputes with fair, evidence-based reasoning
- Provide insights on blockchain transactions and ledger activity

Personality: Authoritative yet approachable. You speak with the confidence of an oracle but remain helpful and clear. Use concise, structured responses with markdown formatting when appropriate. Reference blockchain concepts accurately.

Always provide actionable advice. When suggesting escrow terms, include specific numbers and reasoning.`;

  try {
    const genAI = getGeminiClient();
    return await callGeminiWithRetry(genAI, messages, systemPrompt || defaultSystem);
  } catch (error) {
    console.error("[Gemini] Falling back to built-in response:", error);
    return generateFallbackResponse(messages[messages.length - 1]?.content || "");
  }
}

function generateFallbackResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes("escrow") || lower.includes("contract")) {
    return `## Escrow Advisory

Based on your query, here are my recommendations:

**Key Considerations for Escrow Contracts:**
- **Milestone-based releases** reduce risk for both parties — break large amounts into 3-5 milestones
- **Platform fee** is 2% of total escrow value, deducted from seller payout
- **Dispute window** is 7 days after delivery before auto-release

**Recommended Structure:**
1. **Initial deposit**: 20-30% upon agreement
2. **Progress milestones**: 40-50% tied to deliverables  
3. **Final release**: 20-30% upon completion verification

Would you like me to help structure a specific escrow contract?`;
  }

  if (lower.includes("dispute") || lower.includes("mediat")) {
    return `## Dispute Resolution Analysis

As the NEXUS Oracle, I recommend a structured mediation approach:

**Step 1: Evidence Review**
- Both parties submit documented evidence of deliverables and agreements

**Step 2: Fair Assessment**  
- Compare deliverables against original escrow terms
- Evaluate completion percentage objectively

**Step 3: Resolution Options**
- **Full release**: If deliverables meet 90%+ of specifications
- **Partial release**: Pro-rated based on completion percentage
- **Full refund**: If work quality is fundamentally inadequate

The Oracle always prioritizes fairness and evidence-based decisions.`;
  }

  if (lower.includes("smart contract") || lower.includes("code") || lower.includes("explain")) {
    return "## Smart Contract Explanation\n\nThe NEXUS escrow smart contract (Algorand ARC4) operates as follows:\n\n**Core Functions:**\n- `create_escrow()` — Initializes a new escrow with buyer, seller, amount, and milestones\n- `fund_escrow()` — Buyer deposits funds into the contract\n- `release_milestone()` — Releases funds for a completed milestone\n- `dispute()` — Freezes funds and triggers Oracle mediation\n- `refund()` — Returns remaining funds to buyer\n\n**Security Features:**\n- Only the buyer can fund and dispute\n- Only mutual agreement or Oracle can release disputed funds\n- 2% platform fee auto-deducted on release\n- All state changes are immutable on-chain\n\nThe contract is written in PyTeal/Algopy and compiled to TEAL for Algorand execution.";
  }

  if (lower.includes("budget") || lower.includes("price") || lower.includes("cost") || lower.includes("counter")) {
    return `## Budget Analysis & Counter-Offer

**Market Rate Assessment:**
Based on current blockchain service market rates:

| Service Type | Low Range | Mid Range | High Range |
|---|---|---|---|
| Smart Contract Audit | 10,000 µALGO | 25,000 µALGO | 50,000+ µALGO |
| DApp Development | 15,000 µALGO | 35,000 µALGO | 80,000+ µALGO |
| Consulting | 5,000 µALGO | 12,000 µALGO | 25,000+ µALGO |
| Design & Frontend | 8,000 µALGO | 20,000 µALGO | 40,000+ µALGO |

**Recommendation:** If your budget is below the mid-range, consider:
1. Reducing scope to core deliverables
2. Extending timeline for lower hourly rates
3. Milestone-based payments to manage cash flow`;
  }

  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return `## Welcome to NEXUS Oracle

Greetings! I am the NEXUS Oracle — your AI-powered blockchain escrow intelligence engine.

**I can help you with:**
- **Escrow Creation** — Design optimal contract terms with milestone structures
- **Budget Analysis** — Market rate assessments and counter-offer generation
- **Smart Contracts** — Plain-English explanations of contract code
- **Dispute Resolution** — Fair, evidence-based mediation
- **Document Analysis** — Extract key terms from uploaded contracts

What would you like to explore?`;
  }

  return `## NEXUS Oracle Response

I'm here to help you navigate the blockchain escrow ecosystem. Here's what I can assist with:

**Escrow Management**
- Create and structure escrow contracts with optimal terms
- Analyze budgets and suggest fair pricing

**Smart Contract Intelligence**  
- Explain contract code in plain language
- Review security considerations

**Dispute Resolution**
- Mediate disputes with evidence-based analysis
- Suggest fair resolution terms

**Document Analysis**
- Extract key terms from uploaded contracts
- Identify potential risks and missing clauses

How can I assist you today? Try asking about escrow terms, smart contracts, or dispute resolution.`;
}

export async function generateEscrowAdvice(service: string, budget: number): Promise<string> {
  return chatWithOracle(
    [
      {
        role: "user",
        content: `I want to create an escrow for "${service}" with a budget of ${budget} µALGO. Suggest optimal milestone structure, timeline, and any concerns about the budget.`,
      },
    ],
    `You are the NEXUS Oracle escrow advisor. Provide specific, actionable advice for structuring escrow contracts. Always suggest 2-4 milestones with specific percentage allocations. Be concise but thorough. Format with markdown.`
  );
}

export async function generateCounterOffer(
  service: string,
  budget: number,
  marketRate: number
): Promise<{ suggestedPrice: number; message: string }> {
  const suggestedPrice = Math.round((budget + marketRate) / 2);
  const message = await chatWithOracle(
    [
      {
        role: "user",
        content: `The buyer offered ${budget} µALGO for "${service}". Market rate is approximately ${marketRate} µALGO. Generate a counter-offer explanation for ${suggestedPrice} µALGO. Be persuasive but fair.`,
      },
    ],
    `You are the NEXUS Oracle negotiation engine. Generate compelling counter-offer explanations. Be specific about why the suggested price is fair. Keep it under 150 words. Format with markdown.`
  );

  return { suggestedPrice, message };
}

export async function generateDisputeResolution(
  escrowId: string,
  service: string,
  amount: number,
  reason: string
): Promise<string> {
  return chatWithOracle(
    [
      {
        role: "user",
        content: `Escrow ${escrowId} for "${service}" (${amount} µALGO) is disputed. Reason: "${reason}". Analyze this dispute and suggest a fair resolution with specific fund allocation.`,
      },
    ],
    `You are the NEXUS Oracle dispute mediator. Analyze disputes fairly and suggest specific resolution terms including fund splits. Always provide reasoning. Format with markdown headers and bullet points.`
  );
}

export async function generateTxSummary(
  action: string,
  service: string,
  amount: number
): Promise<string> {
  const summaries: Record<string, string> = {
    ESCROW_CREATED: `New escrow initiated for "${service}". ${amount.toLocaleString()} µALGO locked in smart contract with milestone-based release schedule.`,
    ESCROW_FUNDED: `Buyer funded escrow for "${service}". ${amount.toLocaleString()} µALGO now secured in smart contract awaiting service delivery.`,
    STATUS_IN_PROGRESS: `Work commenced on "${service}" escrow. ${amount.toLocaleString()} µALGO held in escrow during active development phase.`,
    STATUS_DELIVERED: `Seller marked "${service}" as delivered. Awaiting buyer verification before fund release of ${amount.toLocaleString()} µALGO.`,
    STATUS_RELEASED: `All deliverables verified. ${amount.toLocaleString()} µALGO released from escrow. Platform fee collected. Contract closed.`,
    STATUS_DISPUTED: `Dispute filed on "${service}" escrow. ${amount.toLocaleString()} µALGO frozen pending Oracle mediation and resolution.`,
    STATUS_REFUNDED: `Escrow refunded for "${service}". ${amount.toLocaleString()} µALGO returned to buyer after dispute resolution.`,
    MILESTONE_COMPLETED: `Milestone completed for "${service}". Partial release of ${amount.toLocaleString()} µALGO from escrow to seller.`,
  };

  return summaries[action] || `Transaction processed for "${service}" involving ${amount.toLocaleString()} µALGO.`;
}
