import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { PageLayout, PageHeader } from "@/components/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Loader2, Image, AlertCircle, Copy, PenLine, UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const questionSchema = z.object({
  content: z.string().min(10, "Question must be at least 10 characters"),
  type: z.enum(["mcq", "assertion_reason", "short_answer", "long_answer", "true_false", "fill_blank", "numerical", "matching"]),
  subject: z.string().min(1, "Subject is required"),
  chapter: z.string().optional(),
  grade: z.string().min(1, "Grade is required"),
  marks: z.number().min(1).max(10),
  difficulty: z.enum(["easy", "medium", "hard"]),
  correctAnswer: z.string().optional(),
  passageId: z.string().optional(),
});

type QuestionFormData = z.infer<typeof questionSchema>;

export default function TeacherManualEntryPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Duplicate detection state
  const [duplicateWarning, setDuplicateWarning] = useState<{
    type: 'exact' | 'similar';
    message: string;
    similarQuestions?: any[];
    recommendation?: string;
  } | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<QuestionFormData | null>(null);

  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      content: "",
      type: "mcq",
      subject: "",
      chapter: "",
      grade: "",
      marks: 1,
      difficulty: "medium",
      correctAnswer: "",
      passageId: "",
    },
  });

  const { data: chapters = [] } = useQuery<any[]>({
    queryKey: ["/api/chapters"],
  });

  const { data: passages = [] } = useQuery<any[]>({
    queryKey: ["/api/passages"],
  });

  const subjects = Array.from(new Set(chapters.map(c => c.subject))).sort();
  const grades = ["6", "7", "8", "9", "10", "11", "12"];
  const questionType = form.watch("type");
  const selectedSubject = form.watch("subject");

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/teacher/upload/image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload image");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setImageUrl(data.imageUrl);
      toast({
        title: "Image uploaded",
        description: "Image uploaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormData & { forceUpload?: boolean }) => {
      const payload: any = {
        ...data,
        imageUrl: imageUrl || null,
        options: questionType === "mcq" ? options.filter(o => o.trim()) : null,
        forceUpload: data.forceUpload || false,
      };

      const response = await apiRequest("POST", "/api/teacher/questions", payload);
      return response.json();
    },
    onSuccess: (data: any) => {
      setDuplicateWarning(null);
      setPendingSubmitData(null);
      toast({
        title: "Question submitted",
        description: data.message || "Question submitted for HOD approval",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/questions"] });
      navigate("/teacher/questions");
    },
    onError: (error: any) => {
      // Parse the error response for duplicate detection
      try {
        const msg = error.message || '';
        const jsonStart = msg.indexOf('{');
        if (jsonStart >= 0) {
          const errorData = JSON.parse(msg.substring(jsonStart));
          if (errorData.duplicate) {
            if (errorData.duplicateType === 'exact') {
              setDuplicateWarning({
                type: 'exact',
                message: errorData.error,
                similarQuestions: errorData.existingQuestion ? [errorData.existingQuestion] : [],
              });
            } else if (errorData.duplicateType === 'similar') {
              setDuplicateWarning({
                type: 'similar',
                message: errorData.error || errorData.message,
                similarQuestions: errorData.similarQuestions,
                recommendation: errorData.recommendation,
              });
              setShowDuplicateModal(true);
            }
            return;
          }
        }
      } catch {
        // Not a duplicate error - handle normally
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Real-time duplicate check (debounced)
  const checkDuplicateMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/questions/check-duplicate", {
        content,
        options: questionType === "mcq" ? options.filter(o => o.trim()) : undefined,
        subject: form.getValues("subject"),
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.status === 'exact_duplicate') {
        setDuplicateWarning({
          type: 'exact',
          message: data.message,
          similarQuestions: data.exactMatch ? [data.exactMatch] : [],
        });
      } else if (data.status === 'similar_found') {
        setDuplicateWarning({
          type: 'similar',
          message: data.message,
          similarQuestions: data.similarQuestions,
          recommendation: data.recommendation,
        });
      } else {
        setDuplicateWarning(null);
      }
    },
  });

  // Debounced check on content blur  
  const handleContentBlur = useCallback(() => {
    const content = form.getValues("content");
    if (content && content.length >= 10) {
      checkDuplicateMutation.mutate(content);
    }
  }, [form, questionType, options]);

  const handleForceUpload = () => {
    if (pendingSubmitData) {
      createQuestionMutation.mutate({ ...pendingSubmitData, forceUpload: true });
    }
    setShowDuplicateModal(false);
  };

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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setImageFile(file);
      setUploadingImage(true);
      await uploadImageMutation.mutateAsync(file);
      setUploadingImage(false);
    }
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const onSubmit = (data: QuestionFormData) => {
    if (questionType === "mcq") {
      const filledOptions = options.filter(o => o.trim());
      if (filledOptions.length < 2) {
        toast({
          title: "Invalid options",
          description: "MCQ requires at least 2 options",
          variant: "destructive",
        });
        return;
      }
    }

    if ((questionType === "mcq" || questionType === "assertion_reason") && !data.correctAnswer) {
      toast({
        title: "Missing answer",
        description: "Please provide the correct answer",
        variant: "destructive",
      });
      return;
    }

    // If there's an exact duplicate warning, block submission
    if (duplicateWarning?.type === 'exact') {
      toast({
        title: "Duplicate Question",
        description: "This exact question already exists. Please modify it first.",
        variant: "destructive",
      });
      return;
    }

    setPendingSubmitData(data);
    createQuestionMutation.mutate(data);
  };

  return (
    <PageLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <PageHeader>
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-xl font-bold">Create Question</h1>
              <p className="text-sm text-muted-foreground">Add a new question to the question bank</p>
            </div>
            <Button variant="outline" onClick={() => navigate("/teacher/upload")} data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </PageHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This question will be submitted for HOD approval before becoming active.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Question Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mcq">MCQ</SelectItem>
                            <SelectItem value="assertion_reason">Assertion-Reason</SelectItem>
                            <SelectItem value="true_false">True/False</SelectItem>
                            <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                            <SelectItem value="short_answer">Short Answer</SelectItem>
                            <SelectItem value="long_answer">Long Answer</SelectItem>
                            <SelectItem value="numerical">Numerical</SelectItem>
                            <SelectItem value="matching">Matching</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="marks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marks *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={10}
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                            data-testid="input-marks"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Difficulty *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-difficulty">
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-subject">
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subjects.length > 0 ? (
                              subjects.map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))
                            ) : (
                              <>
                                <SelectItem value="Mathematics">Mathematics</SelectItem>
                                <SelectItem value="Science">Science</SelectItem>
                                <SelectItem value="English">English</SelectItem>
                                <SelectItem value="Social Studies">Social Studies</SelectItem>
                                <SelectItem value="Hindi">Hindi</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-grade">
                              <SelectValue placeholder="Select grade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {grades.map((g) => (
                              <SelectItem key={g} value={g}>Grade {g}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="chapter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chapter (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-chapter">
                            <SelectValue placeholder="Select chapter (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">No specific chapter</SelectItem>
                          {chapters
                            .filter(c => c.subject === selectedSubject)
                            .map((c) => (
                              <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question Text *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your question here. You can use LaTeX for math: $x^2 + y^2 = z^2$"
                          className="min-h-32"
                          {...field}
                          onBlur={() => { field.onBlur(); handleContentBlur(); }}
                          data-testid="input-content"
                        />
                      </FormControl>
                      <FormDescription>
                        Supports math notation: $x^2$, \frac{"{a}"}{"{b}"}, \sqrt{"{x}"}
                      </FormDescription>
                      <FormMessage />
                      
                      {/* Inline duplicate warning */}
                      {checkDuplicateMutation.isPending && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Checking for duplicates...
                        </p>
                      )}
                      {duplicateWarning?.type === 'exact' && (
                        <div className="mt-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md" data-testid="duplicate-exact-warning">
                          <p className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" /> Exact duplicate found
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">{duplicateWarning.message}</p>
                          {duplicateWarning.similarQuestions?.[0] && (
                            <p className="text-xs text-red-500 dark:text-red-500 mt-1 italic">
                              Existing: "{duplicateWarning.similarQuestions[0].content?.substring(0, 100)}..."
                            </p>
                          )}
                        </div>
                      )}
                      {duplicateWarning?.type === 'similar' && (
                        <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md" data-testid="duplicate-similar-warning">
                          <p className="text-sm font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" /> Similar question exists
                          </p>
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{duplicateWarning.message}</p>
                          {duplicateWarning.similarQuestions?.map((sq: any, idx: number) => (
                            <p key={idx} className="text-xs text-amber-500 dark:text-amber-500 mt-1">
                              {Math.round((sq.similarity || 0) * 100)}% match: "{sq.content?.substring(0, 80)}..."
                            </p>
                          ))}
                        </div>
                      )}
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {questionType === "mcq" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    MCQ Options
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                      disabled={options.length >= 6}
                      data-testid="button-add-option"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Option
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-8 font-medium">{String.fromCharCode(65 + idx)}.</span>
                      <Input
                        value={opt}
                        onChange={(e) => updateOption(idx, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        data-testid={`input-option-${idx}`}
                      />
                      {options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(idx)}
                          data-testid={`button-remove-option-${idx}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {(questionType === "mcq" || questionType === "assertion_reason" || questionType === "true_false") && (
              <Card>
                <CardHeader>
                  <CardTitle>Correct Answer</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="correctAnswer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Answer *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={questionType === "mcq" ? "e.g., A, B, C, or D" : "Enter the correct answer"}
                            {...field}
                            data-testid="input-answer"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Optional: Image & Passage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image">Question Image</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="image"
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleImageChange}
                      disabled={uploadingImage}
                      data-testid="input-image"
                    />
                    {uploadingImage && <Loader2 className="w-4 h-4 animate-spin" />}
                  </div>
                  {imageUrl && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <Image className="w-4 h-4" />
                      Image uploaded successfully
                    </p>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="passageId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link to Passage (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-passage">
                            <SelectValue placeholder="Select a passage (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">No passage</SelectItem>
                          {passages.map((p: any) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.title || p.content?.substring(0, 50) + "..."}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Link this question to an existing comprehension passage
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/teacher/upload")}
                className="flex-1"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createQuestionMutation.isPending || duplicateWarning?.type === 'exact'}
                className="flex-1"
                data-testid="button-submit"
              >
                {createQuestionMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit for Approval"
                )}
              </Button>
            </div>
          </form>
        </Form>

        {/* Duplicate Detection Modal (for >85% similarity) */}
        <Dialog open={showDuplicateModal} onOpenChange={setShowDuplicateModal}>
          <DialogContent className="max-w-2xl" data-testid="duplicate-modal">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-5 h-5" />
                Similar Question Found
              </DialogTitle>
              <DialogDescription>
                A similar question already exists in the question bank. Choose how to proceed.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 my-4">
              {duplicateWarning?.similarQuestions?.map((sq: any, idx: number) => (
                <div key={idx} className="p-4 bg-muted rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Existing Question</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">
                      {Math.round((sq.similarity || 0) * 100)}% match
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{sq.content}</p>
                  {sq.chapter && <p className="text-xs text-muted-foreground mt-1">Chapter: {sq.chapter}</p>}
                </div>
              ))}
              
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <span className="text-sm font-medium">Your Question</span>
                <p className="text-sm text-muted-foreground mt-1">{pendingSubmitData?.content}</p>
              </div>
            </div>

            <DialogFooter className="flex gap-2 sm:gap-2">
              <Button
                variant="outline"
                onClick={() => { setShowDuplicateModal(false); navigate("/teacher/questions"); }}
                className="flex items-center gap-1"
                data-testid="duplicate-use-existing"
              >
                <Copy className="w-4 h-4" /> Use Existing
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDuplicateModal(false)}
                className="flex items-center gap-1"
                data-testid="duplicate-edit-new"
              >
                <PenLine className="w-4 h-4" /> Edit New
              </Button>
              <Button
                onClick={handleForceUpload}
                variant="default"
                className="flex items-center gap-1"
                data-testid="duplicate-upload-anyway"
              >
                <UploadCloud className="w-4 h-4" /> Upload Anyway
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
}
