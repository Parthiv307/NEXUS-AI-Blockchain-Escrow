"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Upload, X, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface OracleChatProps {
  className?: string;
  initialSystemPrompt?: string;
  placeholder?: string;
  compact?: boolean;
}

export function OracleChat({
  className,
  initialSystemPrompt,
  placeholder = "Ask the Oracle about escrow, contracts, disputes...",
  compact = false,
}: OracleChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() && !file) return;

    let userContent = input.trim();
    if (file) {
      userContent = `[Uploaded: ${file.name}]\n\n${userContent}`;
    }

    const userMsg: Message = { role: "user", content: userContent };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setFile(null);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          systemPrompt: initialSystemPrompt,
        }),
      });

      const data = await res.json();
      setMessages([
        ...newMessages,
        { role: "assistant", content: data.reply || "The Oracle is silent." },
      ]);
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "⚠ Oracle connection interrupted. Please try again.",
        },
      ]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-border/50 overflow-hidden",
        "bg-card/50 backdrop-blur-sm",
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Oracle AI
          </h3>
          <p className="text-[10px] text-muted-foreground">
            Blockchain intelligence engine
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-glow animate-pulse" />
          <span className="text-[10px] text-emerald-glow font-mono">LIVE</span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea
        className={cn("flex-1 p-4", compact ? "h-[300px]" : "h-[450px]")}
        ref={scrollRef}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-50">
            <Bot className="w-10 h-10 text-primary/50" />
            <div>
              <p className="text-sm font-medium text-foreground/60">
                The Oracle awaits your query
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Ask about escrow terms, smart contracts, or disputes
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-2.5",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3 h-3 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm",
                  msg.role === "user"
                    ? "bg-primary/15 border border-primary/20 text-foreground"
                    : "bg-secondary/50 border border-border/50 text-foreground"
                )}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-invert prose-sm max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0 [&_h2]:text-primary [&_h3]:text-primary/80 [&_code]:bg-black/30 [&_code]:px-1 [&_code]:rounded [&_table]:text-xs [&_th]:text-primary/80 [&_a]:text-primary">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-6 h-6 rounded-md bg-indigo-glow/20 border border-indigo-glow/30 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3 h-3 text-indigo-glow" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5">
              <div className="w-6 h-6 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-3 h-3 text-primary" />
              </div>
              <div className="bg-secondary/50 border border-border/50 rounded-xl px-3.5 py-2.5 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                <span className="text-xs text-muted-foreground font-mono">
                  Oracle processing...
                </span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border/50 p-3">
        {file && (
          <div className="mb-2 inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg text-xs">
            <Upload className="w-3 h-3 text-primary" />
            <span className="text-foreground/80 font-mono truncate max-w-[200px]">
              {file.name}
            </span>
            <button
              onClick={() => setFile(null)}
              className="text-destructive hover:text-destructive/80"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <label className="cursor-pointer shrink-0">
            <div className="w-9 h-9 rounded-lg bg-secondary/50 border border-border/50 flex items-center justify-center hover:bg-secondary transition-colors">
              <Upload className="w-4 h-4 text-muted-foreground" />
            </div>
            <input
              type="file"
              accept=".pdf,.txt,.md,.json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) setFile(e.target.files[0]);
              }}
            />
          </label>
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[38px] max-h-[120px] resize-none bg-secondary/30 border-border/50 text-sm"
            rows={1}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || (!input.trim() && !file)}
            size="icon"
            className="shrink-0 w-9 h-9 bg-primary text-primary-foreground hover:bg-primary/80"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
