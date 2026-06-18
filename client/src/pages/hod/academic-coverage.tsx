import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useDepartment } from "@/lib/department-context";
import { DepartmentSelector } from "@/components/department-selector";
import { PageLayout, PageHeader } from "@/components/page-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, ChevronDown, ChevronRight, AlertTriangle,
  CheckCircle, TrendingUp, BookOpen, Layers, FileText, Target
} from "lucide-react";
import { authFetch } from "@/lib/queryClient";

// --- Types ---
interface TopicCoverage {
  name: string;
  required: number;
  approved: number;
  pending: number;
  total: number;
  coverage: number;
  need: number;
  status: "green" | "yellow" | "red";
}

interface LessonCoverage {
  name: string;
  required: number;
  approved: number;
  pending: number;
  total: number;
  coverage: number;
  need: number;
  status: "green" | "yellow" | "red";
  topics: TopicCoverage[];
}

interface SectionCoverage {
  sectionName: string;
  marks: number;
  questionType: string;
  questionCount: number;
  difficulty: string;
  required: number;
  approved: number;
  pending: number;
  coverage: number;
  need: number;
  status: "green" | "yellow" | "red";
  lessons: LessonCoverage[];
}

interface BlueprintCoverage {
  blueprintId: string;
  blueprintName: string;
  subject: string;
  grade: string;
  totalMarks: number;
  totalRequired: number;
  totalApproved: number;
  totalPending: number;
  overallCoverage: number;
  sections: SectionCoverage[];
}

interface AcademicCoverageData {
  departmentId: string;
  departmentName: string;
  totalQuestions: number;
  totalApprovedQuestions: number;
  totalPendingQuestions: number;
  blueprints: BlueprintCoverage[];
  summary: {
    totalRequired: number;
    totalApproved: number;
    totalPending: number;
    overallCoverage: number;
    status: "green" | "yellow" | "red";
    weakSections: { blueprint: string; section: string; coverage: number; need: number }[];
    weakLessons: { blueprint: string; section: string; lesson: string; coverage: number; need: number }[];
    weakTopics: { blueprint: string; section: string; lesson: string; topic: string; coverage: number; need: number }[];
  };
}

// --- Helper Components ---
function StatusBadge({ status }: { status: string }) {
  if (status === "green") return <Badge className="bg-emerald-600 text-white" data-testid="badge-status-green">Complete</Badge>;
  if (status === "yellow") return <Badge className="bg-amber-500 text-white" data-testid="badge-status-yellow">Partial</Badge>;
  return <Badge className="bg-red-500 text-white" data-testid="badge-status-red">Critical</Badge>;
}

function CoverageBar({ percent, status }: { percent: number; status: string }) {
  const color = status === "green" ? "bg-emerald-500" : status === "yellow" ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="w-full bg-muted rounded-full h-2.5">
      <div className={`h-2.5 rounded-full transition-all ${color}`} style={{ width: `${Math.min(percent, 100)}%` }} />
    </div>
  );
}

function NeedIndicator({ need }: { need: number }) {
  if (need <= 0) return <span className="text-emerald-600 text-xs font-medium">Sufficient</span>;
  return <span className="text-red-600 text-xs font-semibold">Need {need} More</span>;
}

// --- Topic Row ---
function TopicRow({ topic }: { topic: TopicCoverage }) {
  return (
    <div className="flex items-center gap-3 py-2 px-4 bg-background/50 rounded-md" data-testid={`topic-row-${topic.name}`}>
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: topic.status === "green" ? "#10b981" : topic.status === "yellow" ? "#f59e0b" : "#ef4444" }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{topic.name}</p>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
        <span>Req: <strong className="text-foreground">{topic.required}</strong></span>
        <span>App: <strong className="text-emerald-600">{topic.approved}</strong></span>
        <span>{topic.coverage}%</span>
      </div>
      <div className="w-20 flex-shrink-0"><CoverageBar percent={topic.coverage} status={topic.status} /></div>
      <div className="w-28 text-right flex-shrink-0"><NeedIndicator need={topic.need} /></div>
    </div>
  );
}

// --- Lesson Card ---
function LessonCard({ lesson, defaultOpen }: { lesson: LessonCoverage; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen || false);
  return (
    <div className="border rounded-lg overflow-hidden" data-testid={`lesson-card-${lesson.name}`}>
      <button
        className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
        onClick={() => setOpen(!open)}
        data-testid={`lesson-toggle-${lesson.name}`}
      >
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        <BookOpen className="w-4 h-4 text-indigo-500" />
        <span className="font-medium text-sm flex-1">{lesson.name}</span>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>Req: <strong className="text-foreground">{lesson.required}</strong></span>
          <span>App: <strong className="text-emerald-600">{lesson.approved}</strong></span>
          <span>Pend: <strong className="text-amber-600">{lesson.pending}</strong></span>
        </div>
        <div className="w-16"><CoverageBar percent={lesson.coverage} status={lesson.status} /></div>
        <span className="text-xs font-semibold w-10 text-right">{lesson.coverage}%</span>
        <StatusBadge status={lesson.status} />
        <div className="w-28 text-right"><NeedIndicator need={lesson.need} /></div>
      </button>
      {open && lesson.topics.length > 0 && (
        <div className="px-4 pb-3 space-y-1 border-t bg-muted/20">
          <p className="text-xs text-muted-foreground font-medium pt-2 pb-1 px-4">Topics</p>
          {lesson.topics.map(t => <TopicRow key={t.name} topic={t} />)}
        </div>
      )}
    </div>
  );
}

// --- Section Panel ---
function SectionPanel({ section, defaultOpen }: { section: SectionCoverage; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen || false);
  return (
    <Card className="overflow-hidden" data-testid={`section-panel-${section.sectionName}`}>
      <button
        className="w-full flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors text-left"
        onClick={() => setOpen(!open)}
        data-testid={`section-toggle-${section.sectionName}`}
      >
        {open ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        <Layers className="w-5 h-5 text-blue-600" />
        <div className="flex-1">
          <p className="font-semibold">Section {section.sectionName}</p>
          <p className="text-xs text-muted-foreground">{section.questionType} | {section.marks} marks each | {section.difficulty || "Mixed"} difficulty</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center">
            <p className="font-bold">{section.required}</p>
            <p className="text-[10px] text-muted-foreground">Required</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-emerald-600">{section.approved}</p>
            <p className="text-[10px] text-muted-foreground">Approved</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-amber-600">{section.pending}</p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </div>
        </div>
        <div className="w-24"><CoverageBar percent={section.coverage} status={section.status} /></div>
        <span className="text-sm font-bold w-12 text-right">{section.coverage}%</span>
        <StatusBadge status={section.status} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2 border-t">
          {section.need > 0 && (
            <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded-md mt-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700 dark:text-red-400 font-medium">Need {section.need} more approved questions</span>
            </div>
          )}
          {section.lessons.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No questions uploaded yet for this section</p>
          ) : (
            <div className="space-y-2 mt-2">
              {section.lessons.map(l => <LessonCard key={l.name} lesson={l} defaultOpen={l.status !== "green"} />)}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// --- Main Page ---
export default function AcademicCoverageDashboard() {
  const { user } = useAuth();
  const { activeDepartment, activeDepartmentId } = useDepartment();
  const [, navigate] = useLocation();
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>("all");

  const { data, isLoading, error } = useQuery<AcademicCoverageData>({
    queryKey: ["/api/departments", activeDepartmentId, "academic-coverage"],
    queryFn: () => authFetch(`/api/departments/${activeDepartmentId}/academic-coverage`),
    enabled: !!activeDepartmentId,
  });

  if (!user) return null;

  const filteredBlueprints = data?.blueprints
    ? selectedBlueprintId === "all"
      ? data.blueprints
      : data.blueprints.filter(b => b.blueprintId === selectedBlueprintId)
    : [];

  return (
    <div className="p-6 space-y-6">
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Academic Coverage Dashboard</h2>
        <p className="text-sm text-white/40">
          {activeDepartment ? `${activeDepartment.className} - ${activeDepartment.subjectName}` : "Select a department"}
        </p>
      </div>

      <div className="space-y-6">
        {!activeDepartmentId && (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Select a department to view coverage</CardContent></Card>
        )}

        {isLoading && (
          <Card><CardContent className="py-12 text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading coverage data...</p>
          </CardContent></Card>
        )}

        {error && (
          <Card><CardContent className="py-12 text-center text-red-500">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p>Failed to load coverage data</p>
          </CardContent></Card>
        )}

        {data && (
          <>
            {/* Department Summary */}
            <Card data-testid="department-summary-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Department Overview — {data.departmentName}
                </CardTitle>
                <CardDescription>Coverage across all blueprints (approved questions only)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <SummaryCard label="Total Questions" value={data.totalQuestions} />
                  <SummaryCard label="Approved" value={data.totalApprovedQuestions} color="emerald" />
                  <SummaryCard label="Pending" value={data.totalPendingQuestions} color="amber" />
                  <SummaryCard label="Required (Blueprints)" value={data.summary.totalRequired} color="blue" />
                  <SummaryCard label="Overall Coverage" value={`${data.summary.overallCoverage}%`} color={data.summary.status === "green" ? "emerald" : data.summary.status === "yellow" ? "amber" : "red"} />
                </div>
                <CoverageBar percent={data.summary.overallCoverage} status={data.summary.status} />
              </CardContent>
            </Card>

            {/* Weak Areas Alerts */}
            {(data.summary.weakSections.length > 0 || data.summary.weakLessons.length > 0 || data.summary.weakTopics.length > 0) && (
              <Card data-testid="weak-areas-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Attention Required
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.summary.weakSections.slice(0, 3).map((w, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Layers className="w-4 h-4 text-red-500" />
                      <span><strong>Section {w.section}</strong> in {w.blueprint}: {w.coverage}% — need <strong>{w.need}</strong> more questions</span>
                    </div>
                  ))}
                  {data.summary.weakLessons.slice(0, 5).map((w, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <BookOpen className="w-4 h-4 text-amber-500" />
                      <span><strong>{w.lesson}</strong> (Section {w.section}): {w.coverage}% — need <strong>{w.need}</strong> more</span>
                    </div>
                  ))}
                  {data.summary.weakTopics.slice(0, 5).map((w, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-orange-500" />
                      <span><strong>{w.topic}</strong> ({w.lesson}): {w.coverage}% — need <strong>{w.need}</strong> more</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Blueprint Filter */}
            {data.blueprints.length > 1 && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Filter by Blueprint:</span>
                <Select value={selectedBlueprintId} onValueChange={setSelectedBlueprintId}>
                  <SelectTrigger className="w-64" data-testid="select-blueprint-filter">
                    <SelectValue placeholder="All Blueprints" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Blueprints</SelectItem>
                    {data.blueprints.map(b => (
                      <SelectItem key={b.blueprintId} value={b.blueprintId}>
                        {b.blueprintName} ({b.overallCoverage}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Blueprints with Sections */}
            {filteredBlueprints.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No blueprints found for this department. Create a blueprint first.</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate("/blueprints")} data-testid="btn-create-blueprint">
                  Go to Blueprints
                </Button>
              </CardContent></Card>
            ) : (
              filteredBlueprints.map(bp => (
                <div key={bp.blueprintId} className="space-y-3" data-testid={`blueprint-coverage-${bp.blueprintId}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold">{bp.blueprintName}</h2>
                      <p className="text-xs text-muted-foreground">{bp.subject} | Grade {bp.grade} | {bp.totalMarks} marks</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">{bp.overallCoverage}%</span>
                      <StatusBadge status={bp.overallCoverage >= 100 ? "green" : bp.overallCoverage >= 50 ? "yellow" : "red"} />
                    </div>
                  </div>
                  {bp.sections.map(sec => (
                    <SectionPanel key={sec.sectionName} section={sec} defaultOpen={sec.status !== "green"} />
                  ))}
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

// --- Summary Card ---
function SummaryCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  const colorClass = color === "emerald" ? "text-emerald-400" : color === "amber" ? "text-amber-400" : color === "blue" ? "text-blue-400" : color === "red" ? "text-red-400" : "text-white";
  return (
    <div className="text-center p-3 bg-white/[0.04] rounded-xl border border-white/[0.06]" data-testid={`summary-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
      <p className="text-[10px] text-white/40 uppercase tracking-wide">{label}</p>
    </div>
  );
}
