import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useDepartment } from "@/lib/department-context";
import { useLocation } from "wouter";
import { PageLayout, PageHeader, PageContent, ContentCard, GridContainer, PageFooter } from "@/components/page-layout";
import { CoinButton } from "@/components/coin-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, FileText, Send, CheckCircle, XCircle, Download, AlertTriangle, Image, Loader2, Copy, Layers, ShieldCheck, BarChart3, Users } from "lucide-react";
import { apiRequest, queryClient, authFetch } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BrandMark } from "@/components/BrandLogo";

interface Test {
  id: string;
  title: string;
  subject: string;
  grade: string;
  totalMarks: number;
  duration: number;
  workflowState: string;
  questionIds: string[] | null;
  questionSets: { setName: string; questionIds: string[]; totalMarks: number }[] | null;
  setsApproved: boolean;
  setsApprovedBy: string | null;
  setsApprovedAt: string | null;
  hodApprovedBy: string | null;
  hodApprovedAt: string | null;
  hodComments: string | null;
  principalApprovedBy: string | null;
  principalApprovedAt: string | null;
  paperFormat: string;
  generatedPaperUrl: string | null;
  answerKeyUrl: string | null;
  blueprintId: string | null;
}

interface ValidationResult {
  valid: boolean;
  issues: string[];
  sectionAnalysis: {
    section: string;
    questionType: string;
    difficulty: string;
    requiredPerSet: number;
    requiredTotal: number;
    available: number;
    canFulfill: boolean;
    difficultyBreakdown: Record<string, { available: number; neededPerSet: number }>;
  }[];
  remediation: {
    maxSetsNoOverlap: number;
    canReduceSets: boolean;
    suggestedSetCount: number;
  };
}

interface MultiSetResult {
  success: boolean;
  testId: string;
  setCount: number;
  sets: {
    setName: string;
    questionCount: number;
    totalMarks: number;
    sectionBreakdown: any[];
  }[];
  warnings: string[];
  stats: {
    overlapCount: number;
    perSetStats: {
      setName: string;
      difficultyDistribution: Record<string, number>;
      chapterDistribution: Record<string, number>;
      typeDistribution?: Record<string, number>;
      totalMarks: number;
    }[];
    allSetsEqualMarks: boolean;
  };
  validation: {
    overlapCount: number;
    perSetStats: {
      setName: string;
      difficultyDistribution: Record<string, number>;
      chapterDistribution: Record<string, number>;
      typeDistribution?: Record<string, number>;
      totalMarks: number;
    }[];
    allSetsEqualMarks: boolean;
  };
}

const workflowStateLabels: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground" },
  submitted: { label: "Submitted", color: "bg-coin-blue text-white" },
  pending_hod: { label: "Pending HOD Review", color: "bg-coin-orange text-white" },
  hod_approved: { label: "HOD Approved", color: "bg-coin-green text-white" },
  hod_rejected: { label: "HOD Rejected", color: "bg-coin-red text-white" },
  pending_principal: { label: "Pending Principal", color: "bg-coin-orange text-white" },
  principal_approved: { label: "Principal Approved", color: "bg-coin-green text-white" },
  principal_rejected: { label: "Principal Rejected", color: "bg-coin-red text-white" },
  sent_to_committee: { label: "Sent to Committee", color: "bg-coin-purple text-white" },
  locked: { label: "Locked", color: "bg-coin-indigo text-white" },
};

export default function HODPaperGeneratorPage() {
  const { user } = useAuth();
  const { activeDepartmentId } = useDepartment();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedFormat, setSelectedFormat] = useState<"A4" | "Legal">("A4");
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [selectedSet, setSelectedSet] = useState<number>(1);
  const [customLogoUrl, setCustomLogoUrl] = useState<string>("");
  const [approvalComments, setApprovalComments] = useState("");
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Multi-set state
  const [setCount, setSetCount] = useState<number>(3);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [multiSetResult, setMultiSetResult] = useState<MultiSetResult | null>(null);
  const [allowOverlap, setAllowOverlap] = useState(false);
  const [setsApproved, setSetsApproved] = useState(false);

  const deptParam = activeDepartmentId ? `?departmentId=${activeDepartmentId}` : "";
  const { data: tests = [], isLoading } = useQuery<Test[]>({
    queryKey: ['/api/tests', activeDepartmentId],
    queryFn: () => authFetch(`/api/tests${deptParam}`),
  });

  // Validate multi-set capacity
  const validateMutation = useMutation({
    mutationFn: async ({ testId, setCount }: { testId: string; setCount: number }) => {
      const res = await apiRequest("POST", `/api/tests/${testId}/validate-multiset`, { setCount });
      return res.json();
    },
    onSuccess: (data) => {
      setValidationResult(data);
      setMultiSetResult(null);
    },
    onError: (error: any) => {
      toast({ title: "Validation Error", description: error.message, variant: "destructive" });
    },
  });

  // Generate multi-set
  const generateMultiSetMutation = useMutation({
    mutationFn: async ({ testId, setCount, allowOverlap }: { testId: string; setCount: number; allowOverlap: boolean }) => {
      const res = await apiRequest("POST", `/api/tests/${testId}/generate-multiset`, { 
        setCount, allowOverlap, mode: 'offline' 
      });
      return res.json();
    },
    onSuccess: (data: MultiSetResult) => {
      setMultiSetResult(data);
      setSetsApproved(false);
      toast({ title: "Multi-set generated", description: `${data.setCount} sets generated successfully` });
      queryClient.invalidateQueries({ queryKey: ['/api/tests'] });
    },
    onError: (error: any) => {
      toast({ title: "Generation Error", description: error.message, variant: "destructive" });
    },
  });

  // Approve sets
  const approveSetsMutation = useMutation({
    mutationFn: async (testId: string) => {
      const res = await apiRequest("POST", `/api/tests/${testId}/approve-sets`, {});
      return res.json();
    },
    onSuccess: () => {
      setSetsApproved(true);
      toast({ title: "Sets Approved", description: "All sets are now approved for download and exam use" });
      queryClient.invalidateQueries({ queryKey: ['/api/tests'] });
    },
    onError: (error: any) => {
      toast({ title: "Approval Error", description: error.message, variant: "destructive" });
    },
  });

  const generatePaperMutation = useMutation({
    mutationFn: async ({ testId, format }: { testId: string; format: string }) => {
      return apiRequest("POST", `/api/tests/${testId}/generate-paper`, { format });
    },
    onSuccess: () => {
      toast({ title: "Paper generated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/tests'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const hodApproveMutation = useMutation({
    mutationFn: async ({ testId, comments }: { testId: string; comments?: string }) => {
      return apiRequest("POST", `/api/tests/${testId}/hod-approve`, { userId: user?.id, comments });
    },
    onSuccess: () => {
      toast({ title: "Paper approved" });
      queryClient.invalidateQueries({ queryKey: ['/api/tests'] });
      setShowApproveDialog(false);
      setApprovalComments("");
    },
  });

  const hodRejectMutation = useMutation({
    mutationFn: async ({ testId, comments }: { testId: string; comments: string }) => {
      return apiRequest("POST", `/api/tests/${testId}/hod-reject`, { userId: user?.id, comments });
    },
    onSuccess: () => {
      toast({ title: "Paper rejected" });
      queryClient.invalidateQueries({ queryKey: ['/api/tests'] });
      setShowRejectDialog(false);
      setApprovalComments("");
    },
  });

  const submitToPrincipalMutation = useMutation({
    mutationFn: async (testId: string) => {
      return apiRequest("POST", `/api/tests/${testId}/submit-to-principal`, { userId: user?.id });
    },
    onSuccess: () => {
      toast({ title: "Paper submitted to Principal" });
      queryClient.invalidateQueries({ queryKey: ['/api/tests'] });
    },
  });

  if (!user) {
    navigate("/");
    return null;
  }

  const pendingTests = tests.filter(t => t.workflowState === "pending_hod" || t.workflowState === "draft");
  const approvedTests = tests.filter(t => t.workflowState === "hod_approved");
  const allTests = tests;
  const selectedTest = tests.find(t => t.id === selectedTestId);
  const storedSets = selectedTest?.questionSets;
  const maxDownloadableSet = storedSets?.length || 3;
  
  // Sync setsApproved from test data when test selection changes
  const testApprovalStatus = selectedTest?.setsApproved || false;

  return (
    <PageLayout>
      <PageHeader>
        <div className="flex items-center gap-4 px-6 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <BrandMark size="md" />
          <div>
            <h1 className="text-xl font-bold">Paper Generation & Approval</h1>
            <p className="text-sm text-muted-foreground">HOD Dashboard</p>
          </div>
        </div>
      </PageHeader>

      <PageContent>
        <GridContainer cols={2}>
          {/* Pending Review Card */}
          <ContentCard title="Pending Review" description="Papers awaiting your approval">
            {isLoading ? (
              <div className="py-4 text-center text-muted-foreground">Loading...</div>
            ) : pendingTests.length === 0 ? (
              <div className="py-4 text-center text-muted-foreground">No pending papers</div>
            ) : (
              <div className="space-y-3 mt-4">
                {pendingTests.map((test) => (
                  <Card key={test.id} className="bg-background/50" data-testid={`card-test-${test.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base">{test.title}</CardTitle>
                        <Badge className={workflowStateLabels[test.workflowState]?.color || "bg-muted"}>
                          {workflowStateLabels[test.workflowState]?.label || test.workflowState}
                        </Badge>
                      </div>
                      <CardDescription>{test.subject} | Grade {test.grade} | {test.totalMarks} marks</CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-2 flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => { setSelectedTestId(test.id); setShowApproveDialog(true); }}
                        data-testid={`button-approve-${test.id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => { setSelectedTestId(test.id); setShowRejectDialog(true); }}
                        data-testid={`button-reject-${test.id}`}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </ContentCard>

          {/* Multi-Set Generation Card */}
          <ContentCard title="Multi-Set Paper Generation" description="Generate non-overlapping question sets (A/B/C)">
            <div className="space-y-4 mt-4">
              <div>
                <Label>Select Test</Label>
                <Select onValueChange={(v) => { setSelectedTestId(v); setValidationResult(null); setMultiSetResult(null); setSetsApproved(false); }}>
                  <SelectTrigger data-testid="select-test">
                    <SelectValue placeholder="Choose a test with blueprint" />
                  </SelectTrigger>
                  <SelectContent>
                    {allTests.filter(t => t.blueprintId).map((test) => (
                      <SelectItem key={test.id} value={test.id}>
                        {test.title} ({test.subject})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTestId && !selectedTest?.blueprintId && (
                  <p className="text-xs text-destructive mt-1">Selected test has no blueprint. Multi-set requires a blueprint.</p>
                )}
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Number of Sets</Label>
                  <Select value={String(setCount)} onValueChange={(v) => { setSetCount(Number(v)); setValidationResult(null); setMultiSetResult(null); }}>
                    <SelectTrigger data-testid="select-set-count">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 Sets (A, B)</SelectItem>
                      <SelectItem value="3">3 Sets (A, B, C)</SelectItem>
                      <SelectItem value="4">4 Sets (A, B, C, D)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>Paper Format</Label>
                  <Select value={selectedFormat} onValueChange={(v: "A4" | "Legal") => setSelectedFormat(v)}>
                    <SelectTrigger data-testid="select-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="Legal">Legal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  School Logo URL (Optional)
                </Label>
                <Input
                  value={customLogoUrl}
                  onChange={(e) => setCustomLogoUrl(e.target.value)}
                  placeholder="https://example.com/school-logo.png"
                  data-testid="input-logo-url"
                />
              </div>

              {/* Step 1: Validate */}
              <Button
                className="w-full"
                variant="outline"
                onClick={() => selectedTestId && validateMutation.mutate({ testId: selectedTestId, setCount })}
                disabled={!selectedTestId || !selectedTest?.blueprintId || validateMutation.isPending}
                data-testid="button-validate-pool"
              >
                {validateMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Validating Pool...</>
                ) : (
                  <><ShieldCheck className="w-4 h-4 mr-2" /> Step 1: Validate Question Pool</>
                )}
              </Button>

              {/* Validation Summary */}
              {validationResult && (
                <ValidationSummary 
                  result={validationResult} 
                  setCount={setCount}
                  onReduceSets={(n) => { setSetCount(n); setValidationResult(null); }}
                  onAllowOverlap={() => setAllowOverlap(true)}
                />
              )}

              {/* Step 2: Generate */}
              {validationResult && (
                <Button
                  className="w-full"
                  onClick={() => selectedTestId && generateMultiSetMutation.mutate({ testId: selectedTestId, setCount: validationResult.remediation.suggestedSetCount || setCount, allowOverlap })}
                  disabled={generateMultiSetMutation.isPending}
                  data-testid="button-generate-multiset"
                >
                  {generateMultiSetMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating {setCount} Sets...</>
                  ) : (
                    <><Layers className="w-4 h-4 mr-2" /> Step 2: Generate {validationResult.valid ? setCount : validationResult.remediation.suggestedSetCount} Sets</>
                  )}
                </Button>
              )}

              {/* Multi-Set Result → Set Comparison View */}
              {multiSetResult && (
                <SetComparisonView 
                  result={multiSetResult} 
                  testId={selectedTestId!}
                  format={selectedFormat}
                  logoUrl={customLogoUrl}
                  setsApproved={setsApproved}
                  onApprove={() => selectedTestId && approveSetsMutation.mutate(selectedTestId)}
                  onRegenerate={() => {
                    setMultiSetResult(null);
                    setSetsApproved(false);
                    if (selectedTestId) {
                      generateMultiSetMutation.mutate({ testId: selectedTestId, setCount: validationResult?.remediation.suggestedSetCount || setCount, allowOverlap });
                    }
                  }}
                  approving={approveSetsMutation.isPending}
                  regenerating={generateMultiSetMutation.isPending}
                />
              )}

              {/* Legacy single-set generation fallback */}
              {selectedTestId && !selectedTest?.blueprintId && (
                <CoinButton
                  color="gold"
                  icon={<FileText className="w-5 h-5" />}
                  onClick={() => generatePaperMutation.mutate({ testId: selectedTestId, format: selectedFormat })}
                  disabled={generatePaperMutation.isPending}
                  data-testid="button-generate"
                >
                  Generate Single Paper
                </CoinButton>
              )}
            </div>
          </ContentCard>

          {/* Download Section */}
          {selectedTestId && storedSets && storedSets.length > 0 && (
            <ContentCard title="Download Papers" description={`${storedSets.length} sets available for download`}>
              {!setsApproved && !testApprovalStatus ? (
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Sets Not Approved</AlertTitle>
                  <AlertDescription>
                    Sets must be approved via the Set Comparison View before downloading. Review the comparison and click "Approve Sets".
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3 mt-4">
                  {storedSets.map((set, idx) => (
                    <Card key={set.setName} className="bg-background/50" data-testid={`download-set-${idx + 1}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">{set.setName}</CardTitle>
                          <Badge variant="outline">{set.questionIds.length} Qs | {set.totalMarks} marks</Badge>
                        </div>
                      </CardHeader>
                      <CardFooter className="pt-1 flex gap-2 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => window.open(`/api/tests/${selectedTestId}/paper-pdf?format=${selectedFormat}&set=${idx + 1}${customLogoUrl ? `&logoUrl=${encodeURIComponent(customLogoUrl)}` : ''}`, '_blank')} data-testid={`btn-pdf-set-${idx + 1}`}>
                          <Download className="w-3 h-3 mr-1" /> PDF
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => window.open(`/api/tests/${selectedTestId}/paper-docx?set=${idx + 1}`, '_blank')} data-testid={`btn-docx-set-${idx + 1}`}>
                          <Download className="w-3 h-3 mr-1" /> DOCX
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => window.open(`/api/tests/${selectedTestId}/answer-key-pdf?set=${idx + 1}${customLogoUrl ? `&logoUrl=${encodeURIComponent(customLogoUrl)}` : ''}`, '_blank')} data-testid={`btn-key-pdf-set-${idx + 1}`}>
                          <Download className="w-3 h-3 mr-1" /> Answer Key
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </ContentCard>
          )}

          {/* Submit to Principal */}
          <ContentCard title="Submit to Principal" description="Send approved papers for principal review">
            {approvedTests.length === 0 ? (
              <div className="py-4 text-center text-muted-foreground">No approved papers ready to submit</div>
            ) : (
              <div className="space-y-3 mt-4">
                {approvedTests.map((test) => (
                  <Card key={test.id} className="bg-background/50">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base">{test.title}</CardTitle>
                        <Badge className="bg-coin-green text-white">Ready</Badge>
                      </div>
                      <CardDescription>{test.subject} | Grade {test.grade}</CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-2">
                      <CoinButton
                        color="blue"
                        icon={<Send className="w-5 h-5" />}
                        onClick={() => submitToPrincipalMutation.mutate(test.id)}
                        disabled={submitToPrincipalMutation.isPending}
                        data-testid={`button-submit-principal-${test.id}`}
                      >
                        Submit to Principal
                      </CoinButton>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </ContentCard>

          {/* All Papers Status */}
          <ContentCard title="All Papers Status" description="Overview of all exam papers">
            <div className="space-y-2 mt-4">
              {allTests.map((test) => (
                <div key={test.id} className="flex items-center justify-between p-2 rounded bg-background/50" data-testid={`status-${test.id}`}>
                  <div>
                    <p className="font-medium text-sm">{test.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {test.subject} | Grade {test.grade}
                      {test.questionSets && ` | ${test.questionSets.length} sets`}
                    </p>
                  </div>
                  <Badge className={workflowStateLabels[test.workflowState]?.color || "bg-muted"}>
                    {workflowStateLabels[test.workflowState]?.label || test.workflowState}
                  </Badge>
                </div>
              ))}
            </div>
          </ContentCard>
        </GridContainer>

        {/* Approve Dialog */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Paper</DialogTitle>
              <DialogDescription>Add any comments (optional)</DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Approval comments..."
              value={approvalComments}
              onChange={(e) => setApprovalComments(e.target.value)}
              data-testid="input-approve-comments"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApproveDialog(false)}>Cancel</Button>
              <Button
                onClick={() => selectedTestId && hodApproveMutation.mutate({ testId: selectedTestId, comments: approvalComments })}
                disabled={hodApproveMutation.isPending}
                data-testid="button-confirm-approve"
              >
                Confirm Approval
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Paper</DialogTitle>
              <DialogDescription>Please provide a reason for rejection</DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Rejection reason (required)..."
              value={approvalComments}
              onChange={(e) => setApprovalComments(e.target.value)}
              data-testid="input-reject-comments"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => selectedTestId && approvalComments && hodRejectMutation.mutate({ testId: selectedTestId, comments: approvalComments })}
                disabled={hodRejectMutation.isPending || !approvalComments}
                data-testid="button-confirm-reject"
              >
                Confirm Rejection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContent>
      <PageFooter />
    </PageLayout>
  );
}

// ============================================================================
// VALIDATION SUMMARY COMPONENT
// ============================================================================

function ValidationSummary({ 
  result, 
  setCount, 
  onReduceSets, 
  onAllowOverlap 
}: { 
  result: ValidationResult; 
  setCount: number;
  onReduceSets: (n: number) => void;
  onAllowOverlap: () => void;
}) {
  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/30" data-testid="validation-summary">
      <div className="flex items-center gap-2">
        {result.valid ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-500" />
        )}
        <h3 className="font-semibold text-sm">
          {result.valid 
            ? `Pool validated: ${setCount} sets can be generated with zero overlap` 
            : `Insufficient questions for ${setCount} sets`
          }
        </h3>
      </div>

      {/* Section Analysis Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="text-left py-1.5 px-2 font-medium">Section</th>
              <th className="text-center py-1.5 px-2 font-medium">Type</th>
              <th className="text-center py-1.5 px-2 font-medium">Per Set</th>
              <th className="text-center py-1.5 px-2 font-medium">Total ({setCount} sets)</th>
              <th className="text-center py-1.5 px-2 font-medium">Available</th>
              <th className="text-center py-1.5 px-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {result.sectionAnalysis.map((sa, idx) => (
              <tr key={idx} className="border-b border-border/50">
                <td className="py-1.5 px-2 font-medium">{sa.section}</td>
                <td className="py-1.5 px-2 text-center">
                  <Badge variant="outline" className="text-[10px]">{sa.questionType}</Badge>
                </td>
                <td className="py-1.5 px-2 text-center">{sa.requiredPerSet}</td>
                <td className="py-1.5 px-2 text-center font-medium">{sa.requiredTotal}</td>
                <td className="py-1.5 px-2 text-center">{sa.available}</td>
                <td className="py-1.5 px-2 text-center">
                  {sa.canFulfill ? (
                    <CheckCircle className="w-4 h-4 text-green-600 inline" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 inline" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Difficulty breakdown for sections */}
      {result.sectionAnalysis.some(sa => Object.keys(sa.difficultyBreakdown).length > 1) && (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            View difficulty breakdown
          </summary>
          <div className="mt-2 space-y-2">
            {result.sectionAnalysis.map((sa, idx) => (
              <div key={idx}>
                <p className="font-medium">{sa.section}:</p>
                <div className="flex gap-3 ml-2">
                  {Object.entries(sa.difficultyBreakdown).map(([diff, data]) => (
                    <span key={diff} className={`${data.available >= data.neededPerSet * setCount ? 'text-green-600' : 'text-amber-500'}`}>
                      {diff}: {data.available} avail / {data.neededPerSet * setCount} needed
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Remediation options */}
      {!result.valid && (
        <div className="space-y-2">
          {result.issues.map((issue, idx) => (
            <p key={idx} className="text-xs text-destructive">{issue}</p>
          ))}
          
          <div className="flex gap-2 flex-wrap pt-2">
            {result.remediation.canReduceSets && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onReduceSets(result.remediation.suggestedSetCount)}
                data-testid="button-reduce-sets"
              >
                <Layers className="w-3 h-3 mr-1" />
                Reduce to {result.remediation.suggestedSetCount} Sets
              </Button>
            )}
            <Button 
              size="sm" 
              variant="outline"
              onClick={onAllowOverlap}
              data-testid="button-allow-overlap"
            >
              <Copy className="w-3 h-3 mr-1" />
              Allow Controlled Overlap
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SET COMPARISON VIEW — Full side-by-side fairness verification
// ============================================================================

type DeviationLevel = 'balanced' | 'slight' | 'significant';

function getDeviationLevel(values: number[]): DeviationLevel {
  if (values.length <= 1) return 'balanced';
  const max = Math.max(...values);
  const min = Math.min(...values);
  if (max === 0 && min === 0) return 'balanced';
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const deviation = avg > 0 ? (max - min) / avg : 0;
  if (deviation <= 0.1) return 'balanced';
  if (deviation <= 0.3) return 'slight';
  return 'significant';
}

function deviationColor(level: DeviationLevel): string {
  switch (level) {
    case 'balanced': return 'text-green-600 dark:text-green-400';
    case 'slight': return 'text-amber-600 dark:text-amber-400';
    case 'significant': return 'text-red-600 dark:text-red-400';
  }
}

function deviationBg(level: DeviationLevel): string {
  switch (level) {
    case 'balanced': return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800';
    case 'slight': return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
    case 'significant': return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
  }
}

function deviationLabel(level: DeviationLevel): string {
  switch (level) {
    case 'balanced': return 'Balanced';
    case 'slight': return 'Slight Deviation';
    case 'significant': return 'Significant Mismatch';
  }
}

function SetComparisonView({ 
  result, testId, format, logoUrl, setsApproved, onApprove, onRegenerate, approving, regenerating
}: { 
  result: MultiSetResult; 
  testId: string; format: string; logoUrl: string;
  setsApproved: boolean;
  onApprove: () => void;
  onRegenerate: () => void;
  approving: boolean;
  regenerating: boolean;
}) {
  const perSetStats = result.validation.perSetStats || result.stats.perSetStats || [];
  
  // Collect all difficulty/chapter/type keys across sets
  const allDiffs = new Set<string>();
  const allChapters = new Set<string>();
  const allTypes = new Set<string>();
  for (const ps of perSetStats) {
    Object.keys(ps.difficultyDistribution || {}).forEach(k => allDiffs.add(k));
    Object.keys(ps.chapterDistribution || {}).forEach(k => allChapters.add(k));
    Object.keys(ps.typeDistribution || {}).forEach(k => allTypes.add(k));
  }
  const diffs = ['easy', 'medium', 'hard'].filter(d => allDiffs.has(d));
  const chapters = Array.from(allChapters).sort();
  const types = Array.from(allTypes).sort();

  // Calculate overall fairness score
  const marksDeviation = getDeviationLevel(perSetStats.map(ps => ps.totalMarks));
  const qCountDeviation = getDeviationLevel(result.sets.map(s => s.questionCount));
  
  const diffDeviations: Record<string, DeviationLevel> = {};
  for (const d of diffs) {
    diffDeviations[d] = getDeviationLevel(perSetStats.map(ps => ps.difficultyDistribution?.[d] || 0));
  }
  const chapterDeviations: Record<string, DeviationLevel> = {};
  for (const c of chapters) {
    chapterDeviations[c] = getDeviationLevel(perSetStats.map(ps => ps.chapterDistribution?.[c] || 0));
  }
  const typeDeviations: Record<string, DeviationLevel> = {};
  for (const t of types) {
    typeDeviations[t] = getDeviationLevel(perSetStats.map(ps => ps.typeDistribution?.[t] || 0));
  }

  const allDeviations = [
    marksDeviation, qCountDeviation,
    ...Object.values(diffDeviations),
    ...Object.values(chapterDeviations),
    ...Object.values(typeDeviations),
  ];
  const hasSignificant = allDeviations.includes('significant');
  const hasSlight = allDeviations.includes('slight');
  const overallStatus: DeviationLevel = hasSignificant ? 'significant' : hasSlight ? 'slight' : 'balanced';

  return (
    <div className="space-y-4" data-testid="set-comparison-view">
      {/* Header with overall status */}
      <div className={`p-4 border rounded-lg ${deviationBg(overallStatus)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {overallStatus === 'balanced' ? (
              <ShieldCheck className="w-5 h-5 text-green-600" />
            ) : overallStatus === 'slight' ? (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <div>
              <h3 className="font-semibold text-sm" data-testid="comparison-status">
                {overallStatus === 'balanced' 
                  ? `All ${result.setCount} sets are balanced and fair` 
                  : overallStatus === 'slight'
                    ? `Minor deviations detected across ${result.setCount} sets`
                    : `Significant imbalance detected — consider regenerating`
                }
              </h3>
              <p className="text-xs text-muted-foreground">
                {result.validation.overlapCount} overlapping questions | 
                {result.validation.allSetsEqualMarks ? ' Equal marks' : ' Unequal marks'}
              </p>
            </div>
          </div>
          {setsApproved && (
            <Badge className="bg-green-600 text-white" data-testid="badge-approved">
              <CheckCircle className="w-3 h-3 mr-1" /> Approved
            </Badge>
          )}
        </div>
      </div>

      {/* ===== SIDE-BY-SIDE COMPARISON TABLE ===== */}
      <div className="border rounded-lg overflow-hidden" data-testid="comparison-table">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-2 px-3 font-semibold text-sm border-b">Metric</th>
                {result.sets.map(s => (
                  <th key={s.setName} className="text-center py-2 px-3 font-semibold text-sm border-b border-l">{s.setName}</th>
                ))}
                <th className="text-center py-2 px-3 font-semibold text-sm border-b border-l">Status</th>
              </tr>
            </thead>
            <tbody>
              {/* Total Questions */}
              <tr className="border-b hover:bg-muted/20">
                <td className="py-2 px-3 font-medium">Total Questions</td>
                {result.sets.map(s => (
                  <td key={s.setName} className="py-2 px-3 text-center border-l font-mono">{s.questionCount}</td>
                ))}
                <td className={`py-2 px-3 text-center border-l font-medium ${deviationColor(qCountDeviation)}`} data-testid="status-questions">
                  {deviationLabel(qCountDeviation)}
                </td>
              </tr>

              {/* Total Marks */}
              <tr className="border-b hover:bg-muted/20">
                <td className="py-2 px-3 font-medium">Total Marks</td>
                {perSetStats.map(ps => (
                  <td key={ps.setName} className="py-2 px-3 text-center border-l font-mono font-bold">{ps.totalMarks}</td>
                ))}
                <td className={`py-2 px-3 text-center border-l font-medium ${deviationColor(marksDeviation)}`} data-testid="status-marks">
                  {deviationLabel(marksDeviation)}
                </td>
              </tr>

              {/* Difficulty Distribution */}
              {diffs.length > 0 && (
                <tr className="bg-muted/30">
                  <td colSpan={result.sets.length + 2} className="py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b">
                    Difficulty Distribution
                  </td>
                </tr>
              )}
              {diffs.map(d => {
                const totalPerSet = perSetStats.map(ps => {
                  const sum = Object.values(ps.difficultyDistribution || {}).reduce((a, b) => a + b, 0);
                  return sum;
                });
                return (
                  <tr key={d} className="border-b hover:bg-muted/20">
                    <td className="py-1.5 px-3 font-medium capitalize pl-6">{d}</td>
                    {perSetStats.map((ps, idx) => {
                      const count = ps.difficultyDistribution?.[d] || 0;
                      const pct = totalPerSet[idx] > 0 ? Math.round((count / totalPerSet[idx]) * 100) : 0;
                      return (
                        <td key={ps.setName} className="py-1.5 px-3 text-center border-l">
                          <span className="font-mono">{count}</span>
                          <span className="text-muted-foreground ml-1">({pct}%)</span>
                        </td>
                      );
                    })}
                    <td className={`py-1.5 px-3 text-center border-l text-[10px] font-medium ${deviationColor(diffDeviations[d])}`} data-testid={`status-diff-${d}`}>
                      {deviationLabel(diffDeviations[d])}
                    </td>
                  </tr>
                );
              })}

              {/* Chapter Distribution */}
              {chapters.length > 0 && (
                <tr className="bg-muted/30">
                  <td colSpan={result.sets.length + 2} className="py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b">
                    Chapter Coverage
                  </td>
                </tr>
              )}
              {chapters.map(c => (
                <tr key={c} className="border-b hover:bg-muted/20">
                  <td className="py-1.5 px-3 font-medium pl-6 truncate max-w-[120px]" title={c}>{c}</td>
                  {perSetStats.map(ps => (
                    <td key={ps.setName} className="py-1.5 px-3 text-center border-l font-mono">
                      {ps.chapterDistribution?.[c] || 0}
                    </td>
                  ))}
                  <td className={`py-1.5 px-3 text-center border-l text-[10px] font-medium ${deviationColor(chapterDeviations[c])}`}>
                    {deviationLabel(chapterDeviations[c])}
                  </td>
                </tr>
              ))}

              {/* Question Type Distribution */}
              {types.length > 0 && (
                <tr className="bg-muted/30">
                  <td colSpan={result.sets.length + 2} className="py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b">
                    Question Type
                  </td>
                </tr>
              )}
              {types.map(t => (
                <tr key={t} className="border-b hover:bg-muted/20">
                  <td className="py-1.5 px-3 font-medium pl-6 capitalize">{t.replace('_', ' ')}</td>
                  {perSetStats.map(ps => (
                    <td key={ps.setName} className="py-1.5 px-3 text-center border-l font-mono">
                      {ps.typeDistribution?.[t] || 0}
                    </td>
                  ))}
                  <td className={`py-1.5 px-3 text-center border-l text-[10px] font-medium ${deviationColor(typeDeviations[t])}`}>
                    {deviationLabel(typeDeviations[t])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section Breakdown per set */}
      <details className="text-xs" data-testid="section-breakdown-toggle">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium py-1">
          View per-section breakdown
        </summary>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
          {result.sets.map(set => (
            <div key={set.setName} className="border rounded p-2">
              <p className="font-semibold text-xs mb-1">{set.setName}</p>
              {set.sectionBreakdown.map((sb: any, idx: number) => (
                <div key={idx} className="flex justify-between text-[10px] py-0.5">
                  <span className="truncate max-w-[100px]">{sb.name}</span>
                  <span className={sb.selected < sb.requested ? 'text-red-500' : 'text-green-600'}>
                    {sb.selected}/{sb.requested}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </details>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-3 w-3" />
          <AlertDescription className="text-xs">
            {result.warnings.map((w, i) => <p key={i}>{w}</p>)}
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2" data-testid="comparison-actions">
        {!setsApproved ? (
          <>
            <Button
              onClick={onApprove}
              disabled={approving || hasSignificant}
              className="flex-1"
              data-testid="button-approve-sets"
            >
              {approving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Approving...</>
              ) : (
                <><CheckCircle className="w-4 h-4 mr-2" /> Approve Sets</>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onRegenerate}
              disabled={regenerating}
              className="flex-1"
              data-testid="button-regenerate-sets"
            >
              {regenerating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Regenerating...</>
              ) : (
                <><Layers className="w-4 h-4 mr-2" /> Regenerate Sets</>
              )}
            </Button>
          </>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 w-full" data-testid="approved-message">
            <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-300">
              Sets approved. You can now download papers from the Download section below.
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto shrink-0" 
              onClick={onRegenerate}
              data-testid="button-regenerate-after-approval"
            >
              Regenerate
            </Button>
          </div>
        )}
      </div>

      {hasSignificant && !setsApproved && (
        <p className="text-xs text-red-500">
          Cannot approve: Significant deviations detected. Please regenerate or allow controlled overlap.
        </p>
      )}
    </div>
  );
}
