import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/lib/auth";
import { useDepartment } from "@/lib/department-context";
import { DepartmentSelector } from "@/components/department-selector";
import { PageLayout, PageHeader } from "@/components/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, FileText, CheckCircle, AlertTriangle, BookOpen, Layers, ChevronDown, ChevronRight } from "lucide-react";
import { authFetch } from "@/lib/queryClient";

interface CoverageSection {
  sectionName: string;
  marks: number;
  questionType: string;
  questionCount: number;
  difficulty: string;
  required: number;
  approved: number;
  pending: number;
  rejected: number;
  draft: number;
  total: number;
  coveragePercent: number;
  lessonBreakdown: Record<string, {
    topics: Record<string, { approved: number; pending: number; total: number }>;
    total: number;
  }>;
}

interface CoverageData {
  blueprintId: string;
  blueprintName: string;
  subject: string;
  grade: string;
  totalMarks: number;
  totalRequired: number;
  totalApproved: number;
  totalPending: number;
  overallCoverage: number;
  sections: CoverageSection[];
}

interface Blueprint {
  id: string;
  name: string;
  subject: string;
  grade: string;
  totalMarks: number;
  sections: any[];
  departmentId?: string;
}

function getCoverageColor(percent: number): string {
  if (percent >= 100) return "text-green-600 dark:text-green-400";
  if (percent >= 75) return "text-blue-600 dark:text-blue-400";
  if (percent >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function getCoverageBg(percent: number): string {
  if (percent >= 100) return "bg-green-500";
  if (percent >= 75) return "bg-blue-500";
  if (percent >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function getCoverageLabel(percent: number): string {
  if (percent >= 100) return "Complete";
  if (percent >= 75) return "Good";
  if (percent >= 50) return "Partial";
  return "Low";
}

export default function BlueprintUploadDashboard() {
  const { user } = useAuth();
  const { activeDepartmentId, activeDepartment } = useDepartment();
  const [, navigate] = useLocation();
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const deptParam = activeDepartmentId ? `?departmentId=${activeDepartmentId}` : "";
  const { data: blueprints = [] } = useQuery<Blueprint[]>({
    queryKey: ["/api/blueprints", activeDepartmentId],
    queryFn: () => authFetch(`/api/blueprints${deptParam}`),
  });

  const { data: coverage, isLoading: loadingCoverage } = useQuery<CoverageData>({
    queryKey: ["/api/blueprints", selectedBlueprintId, "coverage"],
    queryFn: () => authFetch(`/api/blueprints/${selectedBlueprintId}/coverage`),
    enabled: !!selectedBlueprintId,
  });

  const toggleSection = (name: string) => {
    const next = new Set(expandedSections);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setExpandedSections(next);
  };

  const handleUploadForSection = (sectionName: string) => {
    const params = new URLSearchParams({
      blueprintId: selectedBlueprintId,
      targetSection: sectionName,
    });
    navigate(`/teacher/upload/word?${params.toString()}`);
  };

  if (!user) { navigate("/"); return null; }

  return (
    <PageLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <PageHeader>
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-xl font-bold" data-testid="blueprint-upload-title">Blueprint Upload Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {activeDepartment
                  ? `${activeDepartment.className} - ${activeDepartment.subjectName}`
                  : "Select a blueprint to upload questions by section"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <DepartmentSelector />
              <Button variant="outline" onClick={() => navigate("/dashboard")} data-testid="button-back-dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
              </Button>
            </div>
          </div>
        </PageHeader>

        {/* Blueprint Selector */}
        <Card data-testid="blueprint-selector-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Select Blueprint
            </CardTitle>
            <CardDescription>Choose the blueprint template to upload questions for</CardDescription>
          </CardHeader>
          <CardContent>
            {blueprints.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground" data-testid="no-blueprints">
                <Layers className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="font-medium">No blueprints found</p>
                <p className="text-sm">Ask your Department Head to create a blueprint template first.</p>
              </div>
            ) : (
              <Select value={selectedBlueprintId} onValueChange={setSelectedBlueprintId}>
                <SelectTrigger className="w-full" data-testid="select-blueprint">
                  <SelectValue placeholder="Select a blueprint..." />
                </SelectTrigger>
                <SelectContent>
                  {blueprints.map(bp => (
                    <SelectItem key={bp.id} value={bp.id} data-testid={`blueprint-option-${bp.id}`}>
                      {bp.name} ({bp.totalMarks} marks)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {/* Coverage Overview */}
        {selectedBlueprintId && coverage && (
          <>
            <Card data-testid="coverage-overview">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Overall Coverage</CardTitle>
                <CardDescription>{coverage.blueprintName} - {coverage.totalMarks} marks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold" data-testid="total-required">{coverage.totalRequired}</p>
                    <p className="text-xs text-muted-foreground">Required</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="total-approved">{coverage.totalApproved}</p>
                    <p className="text-xs text-muted-foreground">Approved</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400" data-testid="total-pending">{coverage.totalPending}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className={`text-2xl font-bold ${getCoverageColor(coverage.overallCoverage)}`} data-testid="overall-coverage">{coverage.overallCoverage}%</p>
                    <p className="text-xs text-muted-foreground">Coverage</p>
                  </div>
                </div>
                <Progress value={Math.min(coverage.overallCoverage, 100)} className="h-2" />
              </CardContent>
            </Card>

            {/* Section-wise Upload Cards */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Upload by Section
              </h3>

              {coverage.sections.map((section) => {
                const isExpanded = expandedSections.has(section.sectionName);
                const hasLessons = Object.keys(section.lessonBreakdown).length > 0;

                return (
                  <Card key={section.sectionName} data-testid={`section-card-${section.sectionName}`}>
                    <CardContent className="pt-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-lg" data-testid={`section-name-${section.sectionName}`}>
                              Section {section.sectionName}
                            </h4>
                            <Badge variant="outline">{section.marks} marks</Badge>
                            <Badge variant="secondary" className="capitalize">{section.questionType?.replace("_", " ") || "Mixed"}</Badge>
                            {section.difficulty && <Badge variant="secondary" className="capitalize">{section.difficulty}</Badge>}
                          </div>

                          {/* Stats Row */}
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3 text-sm">
                            <div className="px-2 py-1 rounded bg-muted/60">
                              <span className="text-muted-foreground">Required:</span>{" "}
                              <span className="font-semibold" data-testid={`section-required-${section.sectionName}`}>{section.required}</span>
                            </div>
                            <div className="px-2 py-1 rounded bg-green-50 dark:bg-green-900/20">
                              <span className="text-muted-foreground">Approved:</span>{" "}
                              <span className="font-semibold text-green-600 dark:text-green-400" data-testid={`section-approved-${section.sectionName}`}>{section.approved}</span>
                            </div>
                            <div className="px-2 py-1 rounded bg-amber-50 dark:bg-amber-900/20">
                              <span className="text-muted-foreground">Pending:</span>{" "}
                              <span className="font-semibold text-amber-600 dark:text-amber-400" data-testid={`section-pending-${section.sectionName}`}>{section.pending}</span>
                            </div>
                            <div className="px-2 py-1 rounded bg-muted/60 col-span-2 sm:col-span-1">
                              <span className="text-muted-foreground">Coverage:</span>{" "}
                              <span className={`font-semibold ${getCoverageColor(section.coveragePercent)}`} data-testid={`section-coverage-${section.sectionName}`}>
                                {section.coveragePercent}%
                              </span>
                            </div>
                            <div className="hidden sm:block px-2 py-1">
                              <Badge className={getCoverageBg(section.coveragePercent) + " text-white text-xs"}>
                                {getCoverageLabel(section.coveragePercent)}
                              </Badge>
                            </div>
                          </div>

                          <Progress value={Math.min(section.coveragePercent, 100)} className="h-1.5 mb-2" />

                          {/* Lesson Breakdown Toggle */}
                          {hasLessons && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-muted-foreground px-1"
                              onClick={() => toggleSection(section.sectionName)}
                              data-testid={`toggle-lessons-${section.sectionName}`}
                            >
                              {isExpanded ? <ChevronDown className="w-3 h-3 mr-1" /> : <ChevronRight className="w-3 h-3 mr-1" />}
                              {isExpanded ? "Hide" : "Show"} Lesson Breakdown
                            </Button>
                          )}

                          {isExpanded && hasLessons && (
                            <div className="mt-2 ml-2 space-y-2 border-l-2 border-muted pl-3">
                              {Object.entries(section.lessonBreakdown).map(([lessonName, lessonData]) => (
                                <div key={lessonName}>
                                  <div className="flex items-center gap-2 text-sm font-medium">
                                    <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                                    {lessonName}
                                    <Badge variant="outline" className="text-xs">{lessonData.total} Q</Badge>
                                  </div>
                                  {Object.entries(lessonData.topics).map(([topicName, topicData]) => (
                                    <div key={topicName} className="ml-5 flex items-center justify-between text-xs py-0.5 text-muted-foreground">
                                      <span>{topicName}</span>
                                      <span>
                                        <span className="text-green-600">{topicData.approved} approved</span>
                                        {topicData.pending > 0 && <span className="text-amber-600 ml-2">{topicData.pending} pending</span>}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Upload Button */}
                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => handleUploadForSection(section.sectionName)}
                            data-testid={`upload-section-${section.sectionName}`}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload
                          </Button>
                          {section.coveragePercent >= 100 && (
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle className="w-3 h-3" /> Ready
                            </div>
                          )}
                          {section.coveragePercent < 50 && section.coveragePercent > 0 && (
                            <div className="flex items-center gap-1 text-xs text-amber-600">
                              <AlertTriangle className="w-3 h-3" /> Low
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {selectedBlueprintId && loadingCoverage && (
          <div className="text-center py-8 text-muted-foreground">Loading coverage data...</div>
        )}
      </div>
    </PageLayout>
  );
}
