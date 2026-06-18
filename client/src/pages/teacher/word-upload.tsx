import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useDepartment } from "@/lib/department-context";
import { PageLayout, PageHeader } from "@/components/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, FileText, AlertTriangle, CheckCircle, XCircle, Loader2, Copy, Ban, BookOpen, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, authFetch } from "@/lib/queryClient";

interface PreviewQuestion {
  index: number;
  type: string;
  content: string;
  options: string[] | null;
  correctAnswer: string | null;
  marks: number;
  difficulty: string;
  section?: string;
  lesson?: string;
  topic?: string;
  duplicateStatus?: 'exact_duplicate' | 'similar_found' | 'unique';
  duplicateMatchId?: string;
  duplicateSimilarity?: number;
}

interface SkippedContent {
  lineNumber: number;
  content: string;
  reason: string;
}

interface DuplicateSummary {
  exactDuplicates: number;
  similarFound: number;
  unique: number;
  totalChecked: number;
}

interface HierarchyItem {
  section: string;
  lesson: string;
  topic: string;
  count: number;
}

interface PreviewResult {
  success: boolean;
  preview: {
    questions: PreviewQuestion[];
    totalParsed: number;
    skippedContent: SkippedContent[];
    warnings: string[];
    hierarchySummary?: HierarchyItem[];
    duplicateSummary?: DuplicateSummary;
  };
  metadata: {
    subject: string;
    lesson: string;
    grade: string;
    filename: string;
  };
  rawQuestions: any[];
}

export default function TeacherWordUploadPage() {
  const { user } = useAuth();
  const { activeDepartmentId, activeDepartment } = useDepartment();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Read blueprint context from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const targetSection = urlParams.get("targetSection") || null;
  const blueprintId = urlParams.get("blueprintId") || null;

  const [file, setFile] = useState<File | null>(null);
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [grade, setGrade] = useState("");
  const [previewData, setPreviewData] = useState<PreviewResult | null>(null);
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [excludedIndices, setExcludedIndices] = useState<Set<number>>(new Set());

  // Auto-populate subject and grade from department context
  const effectiveSubject = activeDepartment?.subjectName || subject;
  const effectiveGrade = activeDepartment?.numericGrade?.toString() || grade;

  const { data: chapters = [] } = useQuery<any[]>({
    queryKey: ["/api/chapters"],
  });

  const subjects = Array.from(new Set(chapters.map(c => c.subject))).sort();
  const grades = ["6", "7", "8", "9", "10", "11", "12"];

  const previewMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("No file selected");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("subject", effectiveSubject || subject);
      formData.append("chapter", chapter);
      formData.append("grade", effectiveGrade || grade);
      if (activeDepartmentId) {
        formData.append("departmentId", activeDepartmentId);
      }
      if (targetSection) {
        formData.append("targetSection", targetSection);
      }
      if (blueprintId) {
        formData.append("blueprintId", blueprintId);
      }

      const token = localStorage.getItem("safal_token");
      const response = await fetch("/api/teacher/upload/word/preview", {
        method: "POST",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to parse document");
      }

      return response.json() as Promise<PreviewResult>;
    },
    onSuccess: (data) => {
      setPreviewData(data);
      setStep("preview");
      // Auto-exclude exact duplicates
      const excluded = new Set<number>();
      data.preview.questions.forEach((q, idx) => {
        if (q.duplicateStatus === 'exact_duplicate') {
          excluded.add(idx);
        }
      });
      setExcludedIndices(excluded);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!previewData) throw new Error("No preview data");
      const questionsToSave = previewData.rawQuestions.filter((_, idx) => !excludedIndices.has(idx));
      if (questionsToSave.length === 0) {
        throw new Error("No questions to save after removing duplicates");
      }
      const response = await apiRequest("POST", "/api/teacher/upload/word/confirm", {
        questions: questionsToSave,
        metadata: previewData.metadata,
        departmentId: activeDepartmentId || undefined,
        forceUpload: true,
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success",
        description: data.message || `${data.questionsCreated} questions submitted for approval`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/questions"] });
      navigate("/teacher/questions");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!user) {
    navigate("/");
    return null;
  }

  if (!["teacher", "hod", "admin", "super_admin"].includes(user.role)) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Access denied. Teacher role required.</p>
        </div>
      </PageLayout>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".docx")) {
        toast({
          title: "Invalid file",
          description: "Please upload a Word (.docx) file",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handlePreview = () => {
    const subj = effectiveSubject || subject;
    const gr = effectiveGrade || grade;
    if (!file || !subj || !gr) {
      toast({
        title: "Missing fields",
        description: "Please select a file, subject, and grade",
        variant: "destructive",
      });
      return;
    }
    previewMutation.mutate();
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "mcq": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "assertion_reason": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "short_answer": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "long_answer": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  if (step === "preview" && previewData) {
    const importableCount = previewData.preview.questions.filter((_, idx) => !excludedIndices.has(idx)).length;
    const dupSummary = previewData.preview.duplicateSummary;
    const hierarchy = previewData.preview.hierarchySummary || [];
    
    // Group hierarchy by section for display
    const sectionGroups: Record<string, { lesson: string; topic: string; count: number }[]> = {};
    hierarchy.forEach(h => {
      const key = h.section || "(No Section)";
      if (!sectionGroups[key]) sectionGroups[key] = [];
      sectionGroups[key].push({ lesson: h.lesson, topic: h.topic, count: h.count });
    });
    
    return (
      <PageLayout>
        <div className="space-y-6 max-w-4xl mx-auto">
          <PageHeader>
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <h1 className="text-xl font-bold" data-testid="preview-title">Preview Parsed Questions</h1>
                <p className="text-sm text-muted-foreground">{previewData.preview.totalParsed} questions found in {previewData.metadata.filename}</p>
              </div>
              <Button variant="outline" onClick={() => setStep("upload")} data-testid="button-back-upload">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Upload
              </Button>
            </div>
          </PageHeader>

          {/* === HIERARCHY SUMMARY === */}
          {hierarchy.length > 0 && (
            <Card data-testid="hierarchy-summary">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layers className="w-5 h-5 text-primary" />
                  Document Structure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(sectionGroups).map(([section, items]) => (
                    <div key={section} className="border rounded-lg p-3" data-testid={`hierarchy-section-${section}`}>
                      <h4 className="font-semibold text-sm text-primary mb-2">Section {section}</h4>
                      {/* Group by lesson */}
                      {Object.entries(
                        items.reduce((acc, item) => {
                          if (!acc[item.lesson]) acc[item.lesson] = [];
                          acc[item.lesson].push(item);
                          return acc;
                        }, {} as Record<string, typeof items>)
                      ).map(([lessonName, topics]) => (
                        <div key={lessonName} className="ml-4 mb-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                            <BookOpen className="w-3.5 h-3.5" />
                            {lessonName}
                          </div>
                          {topics.map((t, ti) => (
                            <div key={ti} className="ml-6 flex items-center justify-between text-sm py-0.5">
                              <span className="text-muted-foreground">{t.topic}</span>
                              <Badge variant="secondary" className="text-xs">{t.count} Q</Badge>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Duplicate Summary */}
          {dupSummary && (dupSummary.exactDuplicates > 0 || dupSummary.similarFound > 0) && (
            <Alert variant={dupSummary.exactDuplicates > 0 ? "destructive" : "default"} data-testid="duplicate-summary">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Duplicate Detection Results</AlertTitle>
              <AlertDescription>
                <div className="flex gap-4 mt-2 flex-wrap">
                  {dupSummary.exactDuplicates > 0 && (
                    <span className="text-sm px-2 py-1 rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">
                      {dupSummary.exactDuplicates} exact duplicate{dupSummary.exactDuplicates > 1 ? 's' : ''} (auto-excluded)
                    </span>
                  )}
                  {dupSummary.similarFound > 0 && (
                    <span className="text-sm px-2 py-1 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">
                      {dupSummary.similarFound} similar question{dupSummary.similarFound > 1 ? 's' : ''} found
                    </span>
                  )}
                  <span className="text-sm px-2 py-1 rounded bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                    {dupSummary.unique} unique
                  </span>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {previewData.preview.warnings.length > 0 && (
            <Alert variant="destructive" data-testid="warnings-alert">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warnings ({previewData.preview.warnings.length})</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {previewData.preview.warnings.map((w, i) => (
                    <li key={i} className="text-sm">{w}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {previewData.preview.skippedContent.length > 0 && (
            <Alert data-testid="skipped-content">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Skipped Content ({previewData.preview.skippedContent.length} items)</AlertTitle>
              <AlertDescription>
                <p className="mb-2">The following content was skipped and will NOT be imported:</p>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {previewData.preview.skippedContent.map((s, i) => (
                    <div key={i} className="text-sm p-2 bg-muted rounded">
                      <span className="font-medium">Line {s.lineNumber}:</span> {s.reason}
                      <br />
                      <span className="text-muted-foreground italic">{s.content}</span>
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Questions to Import ({importableCount} of {previewData.preview.totalParsed})
              </CardTitle>
              <CardDescription>
                Subject: {previewData.metadata.subject} | Grade: {previewData.metadata.grade}
                {activeDepartment && ` | Department: ${activeDepartment.className} - ${activeDepartment.subjectName}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {previewData.preview.questions.map((q, idx) => {
                  const isExcluded = excludedIndices.has(idx);
                  const isExactDup = q.duplicateStatus === 'exact_duplicate';
                  const isSimilar = q.duplicateStatus === 'similar_found';
                  
                  return (
                    <div 
                      key={q.index} 
                      className={`p-4 border rounded-lg ${isExcluded ? 'opacity-50 bg-muted' : ''} ${isExactDup ? 'border-red-300 dark:border-red-700' : isSimilar ? 'border-amber-300 dark:border-amber-700' : ''}`}
                      data-testid={`preview-question-${q.index}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium">Q{q.index}</span>
                            <Badge className={getTypeBadgeColor(q.type)}>{q.type.replace("_", " ")}</Badge>
                            <Badge variant="outline">{q.marks} mark{q.marks > 1 ? "s" : ""}</Badge>
                            <Badge variant="secondary">{q.difficulty}</Badge>
                            
                            {isExactDup && (
                              <Badge variant="destructive" className="flex items-center gap-1" data-testid={`dup-badge-exact-${q.index}`}>
                                <Ban className="w-3 h-3" /> Exact Duplicate
                              </Badge>
                            )}
                            {isSimilar && (
                              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 flex items-center gap-1" data-testid={`dup-badge-similar-${q.index}`}>
                                <Copy className="w-3 h-3" /> {Math.round((q.duplicateSimilarity || 0) * 100)}% Similar
                              </Badge>
                            )}
                          </div>
                          {/* Section/Lesson/Topic tags */}
                          {(q.section || q.lesson || q.topic) && (
                            <div className="flex items-center gap-1.5 mb-2 flex-wrap text-xs">
                              {q.section && <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">Sec {q.section}</span>}
                              {q.lesson && <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">{q.lesson}</span>}
                              {q.topic && <span className="px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">{q.topic}</span>}
                            </div>
                          )}
                          <p className="text-sm">{q.content}</p>
                          {q.options && (
                            <div className="mt-2 grid grid-cols-2 gap-1 text-sm text-muted-foreground">
                              {q.options.map((opt, i) => (
                                <div key={i}>{String.fromCharCode(65 + i)}. {opt}</div>
                              ))}
                            </div>
                          )}
                          {q.correctAnswer && (
                            <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                              Answer: {q.correctAnswer}
                            </p>
                          )}
                        </div>
                        
                        {isSimilar && !isExactDup && (
                          <Button
                            variant={isExcluded ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              const next = new Set(excludedIndices);
                              if (isExcluded) next.delete(idx);
                              else next.add(idx);
                              setExcludedIndices(next);
                            }}
                            data-testid={`toggle-exclude-${q.index}`}
                          >
                            {isExcluded ? "Include" : "Exclude"}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setStep("upload")}
              className="flex-1"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending || importableCount === 0}
              className="flex-1"
              data-testid="button-confirm-import"
            >
              {confirmMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Import ({importableCount} questions)
                </>
              )}
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <PageHeader>
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-xl font-bold">
                {targetSection ? `Upload Section ${targetSection} Questions` : "Upload Word Document"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {targetSection 
                  ? `Upload questions for Section ${targetSection} of the selected blueprint`
                  : "Upload a .docx file with questions in the required format"}
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate(blueprintId ? "/teacher/upload/blueprint" : "/teacher/upload")} data-testid="button-back-modes">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {blueprintId ? "Back to Blueprint" : "Back"}
            </Button>
          </div>
        </PageHeader>

        <Alert>
          <FileText className="h-4 w-4" />
          <AlertTitle>Required Document Format</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-2 text-sm">
              {targetSection && (
                <div className="mb-3 p-2 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <span className="font-semibold text-blue-700 dark:text-blue-300">
                    Uploading for Section {targetSection}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 ml-2 text-xs">
                    Questions from other sections will be reassigned to Section {targetSection}
                  </span>
                </div>
              )}
              <p><strong>Structure markers</strong> (plain text, no special formatting):</p>
              <pre className="bg-muted p-3 rounded text-xs leading-relaxed mt-1 overflow-x-auto whitespace-pre">
{`SECTION A

LESSON: Life Processes

TOPIC: Nutrition

Q1. What is the role of HCl in the stomach?
A. Kills bacteria
B. Digests proteins
C. Both A and B
D. None of these
Answer: C
Marks: 1

TOPIC: Respiration

Q2. Differentiate between aerobic and anaerobic respiration.
Marks: 3`}</pre>
              <p className="text-muted-foreground mt-2">
                Each question inherits the current SECTION, LESSON, and TOPIC context.
                Warnings will be shown for questions without proper context.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Upload Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Word Document (.docx)</Label>
              <Input
                id="file"
                type="file"
                accept=".docx"
                onChange={handleFileChange}
                data-testid="input-file"
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  Selected: {file.name}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                {activeDepartment ? (
                  <Input id="subject" value={activeDepartment.subjectName} disabled className="bg-muted" data-testid="input-subject" />
                ) : (
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger id="subject" data-testid="select-subject">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Science", "Mathematics", "English", "Hindi", "Sanskrit", "Social Science", "Computer Science"].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade">Grade *</Label>
                {activeDepartment ? (
                  <Input id="grade" value={`Class ${activeDepartment.className}`} disabled className="bg-muted" data-testid="input-grade" />
                ) : (
                  <Select value={grade} onValueChange={setGrade}>
                    <SelectTrigger id="grade" data-testid="select-grade">
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((g) => (
                        <SelectItem key={g} value={g}>Grade {g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              LESSON and TOPIC are detected automatically from the document content. No manual selection needed.
            </p>

            <Button
              onClick={handlePreview}
              disabled={!file || (!(effectiveSubject || subject)) || (!(effectiveGrade || grade)) || previewMutation.isPending}
              className="w-full"
              data-testid="button-preview"
            >
              {previewMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Parsing Document...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Preview Questions
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
