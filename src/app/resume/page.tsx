"use client";

import { useState, useCallback } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Upload,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Target,
  Sparkles,
  Shield,
  Search,
  ArrowRight,
  X,
  TrendingUp,
  Zap,
  Eye,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionAnalysis {
  name: string;
  score: number;
  status: "good" | "warning" | "critical";
  feedback: string;
  improvements: string[];
}

interface ActionItem {
  priority: "high" | "medium" | "low";
  action: string;
  impact: string;
}

interface ResumeAnalysis {
  overallScore: number;
  summary: string;
  sections: SectionAnalysis[];
  criticalIssues: string[];
  strengths: string[];
  missingElements: string[];
  formattingIssues: string[];
  keywordSuggestions: string[];
  actionPlan: ActionItem[];
  atsScore: number;
  atsIssues: string[];
}

const statusIcons = {
  good: CheckCircle2,
  warning: AlertCircle,
  critical: AlertTriangle,
};

const statusColors = {
  good: "text-emerald-400",
  warning: "text-yellow-400",
  critical: "text-red-400",
};

const statusBg = {
  good: "bg-emerald-400/10 border-emerald-400/20",
  warning: "bg-yellow-400/10 border-yellow-400/20",
  critical: "bg-red-400/10 border-red-400/20",
};

const priorityColors = {
  high: "bg-red-400/10 text-red-400 border-red-400/20",
  medium: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
  low: "bg-blue-400/10 text-blue-400 border-blue-400/20",
};

function getScoreColor(score: number) {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

function getScoreLabel(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Strong";
  if (score >= 70) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 40) return "Needs Work";
  return "Critical";
}

function getProgressColor(score: number) {
  if (score >= 80) return "[&>div]:bg-emerald-400";
  if (score >= 60) return "[&>div]:bg-yellow-400";
  if (score >= 40) return "[&>div]:bg-orange-400";
  return "[&>div]:bg-red-400";
}

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      const f = e.dataTransfer.files[0];
      if (f.type === "application/pdf" || f.type.startsWith("text/")) {
        setFile(f);
        setError("");
      } else {
        setError("Please upload a PDF or text file.");
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setError("");
    }
  };

  const analyzeResume = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/resume", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else if (data.analysis) {
        setAnalysis(data.analysis);
      }
    } catch {
      setError("Failed to analyze resume. Please try again.");
    }
    setLoading(false);
  };

  const resetAnalysis = () => {
    setFile(null);
    setAnalysis(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Resume Analyzer
            </h1>
            <p className="text-xs text-muted-foreground">
              AI-powered resume review with section-by-section feedback, ATS scoring, and improvement plan
            </p>
          </div>
        </div>

        {/* Upload Section (shown when no analysis) */}
        {!analysis && (
          <div className="max-w-2xl mx-auto">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={cn(
                "relative rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300",
                dragActive
                  ? "border-primary bg-primary/5 scale-[1.02]"
                  : file
                  ? "border-primary/30 bg-primary/5"
                  : "border-border/50 bg-card/30 hover:border-primary/30 hover:bg-card/50"
              )}
            >
              {file ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(file.size / 1024).toFixed(1)} KB &middot;{" "}
                      {file.type || "document"}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      onClick={analyzeResume}
                      disabled={loading}
                      className="bg-primary text-primary-foreground hover:bg-primary/80 gap-2 font-display tracking-wider px-8"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing Resume...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Analyze with AI
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFile(null);
                        setError("");
                      }}
                      className="gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-secondary/50 border border-border/50 flex items-center justify-center mx-auto">
                      <Upload className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-foreground/80">
                        Drop your resume here
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        or click to browse &middot; PDF or TXT files supported
                      </p>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.txt,.md"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              )}
            </div>

            {loading && (
              <div className="mt-8 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 text-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground/80">
                  The Oracle is dissecting your resume...
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Analyzing content, formatting, ATS compatibility, and more
                </p>
              </div>
            )}

            {error && (
              <div className="mt-6 bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-destructive font-medium">
                    Analysis Failed
                  </p>
                  <p className="text-xs text-destructive/70 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* What we analyze */}
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Eye, label: "Content Quality", desc: "Action verbs, achievements" },
                { icon: Search, label: "ATS Compatibility", desc: "Keyword optimization" },
                { icon: BarChart3, label: "Section Analysis", desc: "Completeness check" },
                { icon: Target, label: "Action Plan", desc: "Prioritized improvements" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="bg-card/30 border border-border/30 rounded-xl p-3 text-center"
                  >
                    <Icon className="w-5 h-5 text-primary/60 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-foreground/80">
                      {item.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Score Header */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Overall Score Card */}
              <div className="lg:col-span-4">
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 text-center h-full flex flex-col justify-center">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r="52"
                        fill="none"
                        stroke="currentColor"
                        className="text-secondary"
                        strokeWidth="8"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="52"
                        fill="none"
                        stroke="currentColor"
                        className={getScoreColor(analysis.overallScore)}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${(analysis.overallScore / 100) * 327} 327`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={cn("text-3xl font-bold font-mono", getScoreColor(analysis.overallScore))}>
                        {analysis.overallScore}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        / 100
                      </span>
                    </div>
                  </div>
                  <p className={cn("text-lg font-semibold", getScoreColor(analysis.overallScore))}>
                    {getScoreLabel(analysis.overallScore)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-xs mx-auto">
                    {analysis.summary}
                  </p>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetAnalysis}
                    className="mt-4 mx-auto gap-1.5 text-xs"
                  >
                    <Upload className="w-3 h-3" />
                    Analyze Another
                  </Button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="lg:col-span-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="bg-card/50 border border-border/50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Shield className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[10px] text-muted-foreground uppercase">
                        ATS Score
                      </span>
                    </div>
                    <span className={cn("text-xl font-bold font-mono", getScoreColor(analysis.atsScore))}>
                      {analysis.atsScore}%
                    </span>
                  </div>
                  <div className="bg-card/50 border border-border/50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-[10px] text-muted-foreground uppercase">
                        Issues
                      </span>
                    </div>
                    <span className="text-xl font-bold font-mono text-red-400">
                      {analysis.criticalIssues.length}
                    </span>
                  </div>
                  <div className="bg-card/50 border border-border/50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] text-muted-foreground uppercase">
                        Strengths
                      </span>
                    </div>
                    <span className="text-xl font-bold font-mono text-emerald-400">
                      {analysis.strengths.length}
                    </span>
                  </div>
                  <div className="bg-card/50 border border-border/50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[10px] text-muted-foreground uppercase">
                        Actions
                      </span>
                    </div>
                    <span className="text-xl font-bold font-mono text-primary">
                      {analysis.actionPlan.length}
                    </span>
                  </div>
                </div>

                {/* Critical Issues + Strengths */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Critical Issues */}
                  <div className="bg-red-400/5 border border-red-400/20 rounded-xl p-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">
                        Critical Issues
                      </span>
                    </div>
                    <ScrollArea className="max-h-[140px]">
                      {analysis.criticalIssues.length > 0 ? (
                        <ul className="space-y-1.5">
                          {analysis.criticalIssues.map((issue, i) => (
                            <li
                              key={i}
                              className="text-xs text-foreground/70 flex items-start gap-2"
                            >
                              <span className="text-red-400 mt-0.5 shrink-0">
                                &bull;
                              </span>
                              {issue}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-foreground/50 italic">
                          No critical issues found
                        </p>
                      )}
                    </ScrollArea>
                  </div>

                  {/* Strengths */}
                  <div className="bg-emerald-400/5 border border-emerald-400/20 rounded-xl p-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                        Strengths
                      </span>
                    </div>
                    <ScrollArea className="max-h-[140px]">
                      {analysis.strengths.length > 0 ? (
                        <ul className="space-y-1.5">
                          {analysis.strengths.map((s, i) => (
                            <li
                              key={i}
                              className="text-xs text-foreground/70 flex items-start gap-2"
                            >
                              <span className="text-emerald-400 mt-0.5 shrink-0">
                                &bull;
                              </span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-foreground/50 italic">
                          No notable strengths identified
                        </p>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Tabs */}
            <Tabs defaultValue="sections" className="w-full">
              <TabsList className="bg-secondary/50 w-full sm:w-auto">
                <TabsTrigger value="sections" className="text-xs gap-1.5">
                  <BarChart3 className="w-3 h-3" />
                  Sections
                </TabsTrigger>
                <TabsTrigger value="action-plan" className="text-xs gap-1.5">
                  <Target className="w-3 h-3" />
                  Action Plan
                </TabsTrigger>
                <TabsTrigger value="ats" className="text-xs gap-1.5">
                  <Search className="w-3 h-3" />
                  ATS & Keywords
                </TabsTrigger>
                <TabsTrigger value="missing" className="text-xs gap-1.5">
                  <AlertCircle className="w-3 h-3" />
                  Missing & Formatting
                </TabsTrigger>
              </TabsList>

              {/* Sections Tab */}
              <TabsContent value="sections" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.sections.map((section, i) => {
                    const StatusIcon = statusIcons[section.status] || AlertCircle;
                    return (
                      <div
                        key={i}
                        className={cn(
                          "rounded-xl border p-4",
                          statusBg[section.status]
                        )}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <StatusIcon
                              className={cn(
                                "w-4 h-4",
                                statusColors[section.status]
                              )}
                            />
                            <h4 className="text-sm font-semibold">
                              {section.name}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "text-sm font-bold font-mono",
                                getScoreColor(section.score)
                              )}
                            >
                              {section.score}
                            </span>
                            <Progress
                              value={section.score}
                              className={cn(
                                "w-16 h-1.5",
                                getProgressColor(section.score)
                              )}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-foreground/70 leading-relaxed mb-3">
                          {section.feedback}
                        </p>
                        {section.improvements.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                              Improvements:
                            </span>
                            {section.improvements.map((imp, j) => (
                              <div
                                key={j}
                                className="flex items-start gap-2 text-xs text-foreground/60"
                              >
                                <ArrowRight className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                                {imp}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Action Plan Tab */}
              <TabsContent value="action-plan" className="mt-4">
                <div className="space-y-3">
                  {analysis.actionPlan.map((item, i) => (
                    <div
                      key={i}
                      className="bg-card/50 border border-border/50 rounded-xl p-4 flex items-start gap-4"
                    >
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary font-mono">
                          {i + 1}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-mono border",
                            priorityColors[item.priority]
                          )}
                        >
                          {item.priority}
                        </Badge>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {item.action}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <Zap className="w-3 h-3 inline mr-1 text-primary/60" />
                          {item.impact}
                        </p>
                      </div>
                    </div>
                  ))}
                  {analysis.actionPlan.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No specific actions recommended.
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* ATS & Keywords Tab */}
              <TabsContent value="ats" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* ATS Score */}
                  <div className="bg-card/50 border border-border/50 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="w-4 h-4 text-primary" />
                      <h4 className="text-sm font-semibold">
                        ATS Compatibility
                      </h4>
                      <span
                        className={cn(
                          "ml-auto text-lg font-bold font-mono",
                          getScoreColor(analysis.atsScore)
                        )}
                      >
                        {analysis.atsScore}%
                      </span>
                    </div>
                    <Progress
                      value={analysis.atsScore}
                      className={cn("h-2 mb-4", getProgressColor(analysis.atsScore))}
                    />
                    {analysis.atsIssues.length > 0 ? (
                      <ul className="space-y-2">
                        {analysis.atsIssues.map((issue, i) => (
                          <li
                            key={i}
                            className="text-xs text-foreground/70 flex items-start gap-2"
                          >
                            <AlertCircle className="w-3 h-3 text-yellow-400 shrink-0 mt-0.5" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-emerald-400">
                        No ATS issues detected
                      </p>
                    )}
                  </div>

                  {/* Keyword Suggestions */}
                  <div className="bg-card/50 border border-border/50 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Search className="w-4 h-4 text-indigo-glow" />
                      <h4 className="text-sm font-semibold">
                        Suggested Keywords
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Add these keywords to improve ATS matching:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.keywordSuggestions.map((kw, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="bg-indigo-glow/10 text-indigo-glow border-indigo-glow/20 text-[10px]"
                        >
                          {kw}
                        </Badge>
                      ))}
                      {analysis.keywordSuggestions.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">
                          No additional keywords suggested
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Missing & Formatting Tab */}
              <TabsContent value="missing" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Missing Elements */}
                  <div className="bg-card/50 border border-border/50 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertCircle className="w-4 h-4 text-orange-400" />
                      <h4 className="text-sm font-semibold">
                        Missing Elements
                      </h4>
                    </div>
                    {analysis.missingElements.length > 0 ? (
                      <ul className="space-y-2">
                        {analysis.missingElements.map((el, i) => (
                          <li
                            key={i}
                            className="text-xs text-foreground/70 flex items-start gap-2"
                          >
                            <span className="text-orange-400 shrink-0">+</span>
                            {el}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-emerald-400">
                        All essential sections present
                      </p>
                    )}
                  </div>

                  {/* Formatting Issues */}
                  <div className="bg-card/50 border border-border/50 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Eye className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-sm font-semibold">
                        Formatting Issues
                      </h4>
                    </div>
                    {analysis.formattingIssues.length > 0 ? (
                      <ul className="space-y-2">
                        {analysis.formattingIssues.map((fi, i) => (
                          <li
                            key={i}
                            className="text-xs text-foreground/70 flex items-start gap-2"
                          >
                            <span className="text-cyan-400 shrink-0">&mdash;</span>
                            {fi}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-emerald-400">
                        No formatting issues detected
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
