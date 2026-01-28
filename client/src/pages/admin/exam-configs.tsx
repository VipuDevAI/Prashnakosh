import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useSchoolContext } from "@/lib/school-context";
import { PageLayout, PageHeader, PageContent, ContentCard } from "@/components/page-layout";
import { SchoolSwitcher, RequireSchoolSelection } from "@/components/school-switcher";
import { CoinButton } from "@/components/coin-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, Plus, Edit, Trash2, Eye, FileText, Upload, 
  GraduationCap, Building2, Calendar, Clock, Award, 
  ToggleLeft, Droplet, AlertTriangle
} from "lucide-react";

// Types
interface AdminExamConfig {
  id: string;
  tenantId: string;
  wing: WingType;
  examName: string;
  academicYearId: string;
  durationMinutes: number;
  totalMarks: number;
  examType: AdminExamType;
  allowMockTest: boolean;
  watermarkText: string | null;
  logoUrl: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  createdBy: string | null;
}

type WingType = "primary" | "middle" | "secondary" | "senior_secondary";
type AdminExamType = "unit" | "term" | "annual" | "practice";

interface AcademicYear {
  id: string;
  name: string;
  isActive: boolean;
}

// Wing configuration
const wingConfig: Record<WingType, { label: string; grades: string[]; color: string }> = {
  primary: { 
    label: "Primary Wing (1-5)", 
    grades: ["1", "2", "3", "4", "5"],
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
  },
  middle: { 
    label: "Middle Wing (6-8)", 
    grades: ["6", "7", "8"],
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
  },
  secondary: { 
    label: "Secondary Wing (9-10)", 
    grades: ["9", "10"],
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
  },
  senior_secondary: { 
    label: "Senior Secondary (11-12)", 
    grades: ["11", "12"],
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
  },
};

const wingOptions: { value: WingType; label: string }[] = [
  { value: "primary", label: "Primary (1-5)" },
  { value: "middle", label: "Middle (6-8)" },
  { value: "secondary", label: "Secondary (9-10)" },
  { value: "senior_secondary", label: "Senior Secondary (11-12)" },
];

const examTypeOptions: { value: AdminExamType; label: string }[] = [
  { value: "unit", label: "Unit Test" },
  { value: "term", label: "Term Exam" },
  { value: "annual", label: "Annual Exam" },
  { value: "practice", label: "Practice Test" },
];

const examTypeColors: Record<AdminExamType, string> = {
  unit: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  term: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  annual: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
  practice: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
};

export default function ExamConfigsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { selectedSchool, isSuperAdmin } = useSchoolContext();
  const [activeWing, setActiveWing] = useState<WingType>("primary");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AdminExamConfig | null>(null);
  const [viewingConfig, setViewingConfig] = useState<AdminExamConfig | null>(null);
  const [deleteConfig, setDeleteConfig] = useState<AdminExamConfig | null>(null);

  if (!isSuperAdmin) {
    navigate("/dashboard");
    return null;
  }

  // Fetch exam configs
  const { data: examConfigs = [], isLoading } = useQuery<AdminExamConfig[]>({
    queryKey: ["/api/admin/exam-configs", selectedSchool?.id],
    queryFn: async () => {
      if (!selectedSchool?.id) return [];
      const response = await fetch(`/api/admin/exam-configs?tenantId=${selectedSchool.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("safal_token")}` },
      });
      if (!response.ok) throw new Error("Failed to fetch exam configs");
      return response.json();
    },
    enabled: !!selectedSchool?.id,
  });

  // Fetch academic years for dropdown
  const { data: academicYears = [] } = useQuery<AcademicYear[]>({
    queryKey: ["/api/admin/academic-years", selectedSchool?.id],
    queryFn: async () => {
      if (!selectedSchool?.id) return [];
      const response = await fetch(`/api/admin/academic-years?tenantId=${selectedSchool.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("safal_token")}` },
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedSchool?.id,
  });

  // Filter configs by wing
  const filteredConfigs = examConfigs.filter(c => c.wing === activeWing);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/exam-configs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/exam-configs"] });
      toast({ title: "Exam configuration deleted successfully" });
      setDeleteConfig(null);
    },
    onError: (error: any) => {
      const data = error?.response?.data || error;
      if (data.inUse) {
        toast({
          title: "Cannot Delete",
          description: "This exam is already in use and cannot be deleted.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || error.message || "Failed to delete exam configuration",
          variant: "destructive",
        });
      }
      setDeleteConfig(null);
    },
  });

  const handleDelete = async () => {
    if (deleteConfig) {
      deleteMutation.mutate(deleteConfig.id);
    }
  };

  return (
    <PageLayout>
      <PageHeader>
        <div className="flex items-center gap-4 px-6 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Exam Configuration</h1>
            <p className="text-sm text-muted-foreground">
              Configure exams by wing for each school
            </p>
          </div>
        </div>
      </PageHeader>

      <PageContent>
        <RequireSchoolSelection>
          {selectedSchool && (
            <>
              {/* Wing Tabs */}
              <Tabs value={activeWing} onValueChange={(v) => setActiveWing(v as WingType)} className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <TabsList className="grid grid-cols-4 w-auto">
                    {wingOptions.map((wing) => (
                      <TabsTrigger 
                        key={wing.value} 
                        value={wing.value}
                        data-testid={`tab-wing-${wing.value}`}
                        className="px-4"
                      >
                        <GraduationCap className="w-4 h-4 mr-2" />
                        {wing.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  <CoinButton
                    color="green"
                    icon={<Plus className="w-5 h-5" />}
                    onClick={() => setIsCreateOpen(true)}
                    data-testid="button-add-exam"
                  >
                    Add Exam
                  </CoinButton>
                </div>

                {wingOptions.map((wing) => (
                  <TabsContent key={wing.value} value={wing.value}>
                    <ContentCard 
                      title={`${wingConfig[wing.value].label} Exams`}
                      description={`Manage exam configurations for grades ${wingConfig[wing.value].grades.join(", ")}`}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : filteredConfigs.length === 0 ? (
                        <div className="text-center py-12">
                          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium mb-2">No exams configured</h3>
                          <p className="text-muted-foreground mb-4">
                            Add your first exam for {wing.label}
                          </p>
                          <CoinButton
                            color="green"
                            icon={<Plus className="w-5 h-5" />}
                            onClick={() => setIsCreateOpen(true)}
                            data-testid="button-add-exam-empty"
                          >
                            Add Exam
                          </CoinButton>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Exam Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Academic Year</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Total Marks</TableHead>
                                <TableHead>Mock Test</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredConfigs.map((config) => (
                                <ExamConfigRow
                                  key={config.id}
                                  config={config}
                                  academicYears={academicYears}
                                  onEdit={() => setEditingConfig(config)}
                                  onView={() => setViewingConfig(config)}
                                  onDelete={() => setDeleteConfig(config)}
                                />
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </ContentCard>
                  </TabsContent>
                ))}
              </Tabs>
            </>
          )}
        </RequireSchoolSelection>
      </PageContent>

      {/* Create/Edit Dialog */}
      <ExamConfigDialog
        isOpen={isCreateOpen || !!editingConfig}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingConfig(null);
        }}
        config={editingConfig}
        tenantId={selectedSchool?.id || ""}
        defaultWing={activeWing}
        academicYears={academicYears}
      />

      {/* View Dialog */}
      <ViewExamConfigDialog
        config={viewingConfig}
        academicYears={academicYears}
        onClose={() => setViewingConfig(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfig} onOpenChange={() => setDeleteConfig(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Exam Configuration
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteConfig?.examName}</strong>?
              This action cannot be undone. If this exam is already in use by blueprints or tests,
              deletion will be blocked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}

// Row component
function ExamConfigRow({
  config,
  academicYears,
  onEdit,
  onView,
  onDelete,
}: {
  config: AdminExamConfig;
  academicYears: AcademicYear[];
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
}) {
  const academicYear = academicYears.find(y => y.id === config.academicYearId);
  const { toast } = useToast();

  const toggleMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/admin/exam-configs/${config.id}`, {
        isActive: !config.isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/exam-configs"] });
      toast({ title: config.isActive ? "Exam deactivated" : "Exam activated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{config.examName}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={examTypeColors[config.examType]}>
          {examTypeOptions.find(t => t.value === config.examType)?.label || config.examType}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-sm">{academicYear?.name || "-"}</span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>{config.durationMinutes} min</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Award className="w-4 h-4 text-muted-foreground" />
          <span>{config.totalMarks}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={config.allowMockTest ? "default" : "secondary"}>
          {config.allowMockTest ? "Yes" : "No"}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch
            checked={config.isActive}
            onCheckedChange={() => toggleMutation.mutate()}
            data-testid={`switch-active-${config.id}`}
          />
          <Badge className={config.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
            {config.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={onView}
            data-testid={`button-view-${config.id}`}
            title="View"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onEdit}
            data-testid={`button-edit-${config.id}`}
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onDelete}
            data-testid={`button-delete-${config.id}`}
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// Create/Edit Dialog
function ExamConfigDialog({
  isOpen,
  onClose,
  config,
  tenantId,
  defaultWing,
  academicYears,
}: {
  isOpen: boolean;
  onClose: () => void;
  config: AdminExamConfig | null;
  tenantId: string;
  defaultWing: WingType;
  academicYears: AcademicYear[];
}) {
  const { toast } = useToast();
  const isEditing = !!config;
  
  const [formData, setFormData] = useState({
    wing: defaultWing,
    examName: "",
    academicYearId: "",
    durationMinutes: 60,
    totalMarks: 100,
    examType: "unit" as AdminExamType,
    allowMockTest: false,
    watermarkText: "",
    logoUrl: "",
    isActive: true,
  });

  useEffect(() => {
    if (config) {
      setFormData({
        wing: config.wing,
        examName: config.examName,
        academicYearId: config.academicYearId,
        durationMinutes: config.durationMinutes,
        totalMarks: config.totalMarks,
        examType: config.examType,
        allowMockTest: config.allowMockTest,
        watermarkText: config.watermarkText || "",
        logoUrl: config.logoUrl || "",
        isActive: config.isActive,
      });
    } else {
      setFormData({
        wing: defaultWing,
        examName: "",
        academicYearId: academicYears.find(y => y.isActive)?.id || "",
        durationMinutes: 60,
        totalMarks: 100,
        examType: "unit",
        allowMockTest: false,
        watermarkText: "",
        logoUrl: "",
        isActive: true,
      });
    }
  }, [config, defaultWing, academicYears]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEditing) {
        return apiRequest("PATCH", `/api/admin/exam-configs/${config.id}`, formData);
      }
      return apiRequest("POST", "/api/admin/exam-configs", {
        ...formData,
        tenantId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/exam-configs"] });
      toast({ title: isEditing ? "Exam updated successfully" : "Exam created successfully" });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save exam configuration",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.examName.trim()) {
      toast({ title: "Exam name is required", variant: "destructive" });
      return;
    }
    if (!formData.academicYearId) {
      toast({ title: "Academic year is required", variant: "destructive" });
      return;
    }
    
    mutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Exam Configuration" : "Create Exam Configuration"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the exam configuration settings" 
              : "Create a new exam for the selected wing"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Wing */}
            <div className="space-y-2">
              <Label>Wing *</Label>
              <Select
                value={formData.wing}
                onValueChange={(v) => setFormData({ ...formData, wing: v as WingType })}
                disabled={isEditing}
              >
                <SelectTrigger data-testid="select-wing">
                  <SelectValue placeholder="Select wing" />
                </SelectTrigger>
                <SelectContent>
                  {wingOptions.map((wing) => (
                    <SelectItem key={wing.value} value={wing.value}>
                      {wing.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Academic Year */}
            <div className="space-y-2">
              <Label>Academic Year *</Label>
              <Select
                value={formData.academicYearId}
                onValueChange={(v) => setFormData({ ...formData, academicYearId: v })}
              >
                <SelectTrigger data-testid="select-academic-year">
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name} {year.isActive && "(Active)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Exam Name */}
          <div className="space-y-2">
            <Label>Exam Name *</Label>
            <Input
              value={formData.examName}
              onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
              placeholder="e.g., Unit Test 1, Quarterly Exam"
              data-testid="input-exam-name"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Duration */}
            <div className="space-y-2">
              <Label>Duration (minutes) *</Label>
              <Input
                type="number"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 60 })}
                min={10}
                max={300}
                data-testid="input-duration"
              />
            </div>

            {/* Total Marks */}
            <div className="space-y-2">
              <Label>Total Marks *</Label>
              <Input
                type="number"
                value={formData.totalMarks}
                onChange={(e) => setFormData({ ...formData, totalMarks: parseInt(e.target.value) || 100 })}
                min={10}
                max={500}
                data-testid="input-total-marks"
              />
            </div>

            {/* Exam Type */}
            <div className="space-y-2">
              <Label>Exam Type *</Label>
              <Select
                value={formData.examType}
                onValueChange={(v) => setFormData({ ...formData, examType: v as AdminExamType })}
              >
                <SelectTrigger data-testid="select-exam-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {examTypeOptions.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Allow Mock Test */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div>
              <Label className="text-base">Allow Mock Test</Label>
              <p className="text-sm text-muted-foreground">
                If enabled, this exam will be available as a mock test for students
              </p>
            </div>
            <Switch
              checked={formData.allowMockTest}
              onCheckedChange={(checked) => setFormData({ ...formData, allowMockTest: checked })}
              data-testid="switch-allow-mock"
            />
          </div>

          {/* Watermark Text */}
          <div className="space-y-2">
            <Label>Watermark Text</Label>
            <Input
              value={formData.watermarkText}
              onChange={(e) => setFormData({ ...formData, watermarkText: e.target.value })}
              placeholder="e.g., CONFIDENTIAL, DRAFT"
              data-testid="input-watermark"
            />
            <p className="text-xs text-muted-foreground">
              Text to display as watermark on generated papers
            </p>
          </div>

          {/* Logo URL */}
          <div className="space-y-2">
            <Label>Logo URL (PNG only)</Label>
            <Input
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              placeholder="https://..."
              data-testid="input-logo-url"
            />
            <p className="text-xs text-muted-foreground">
              URL to the school logo for paper headers
            </p>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div>
              <Label className="text-base">Active Status</Label>
              <p className="text-sm text-muted-foreground">
                Only active exams appear in HOD blueprint dropdowns
              </p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              data-testid="switch-active"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <CoinButton
              type="submit"
              color="green"
              isLoading={mutation.isPending}
              icon={isEditing ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              data-testid="button-submit-exam"
            >
              {isEditing ? "Update Exam" : "Create Exam"}
            </CoinButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// View Dialog
function ViewExamConfigDialog({
  config,
  academicYears,
  onClose,
}: {
  config: AdminExamConfig | null;
  academicYears: AcademicYear[];
  onClose: () => void;
}) {
  if (!config) return null;
  
  const academicYear = academicYears.find(y => y.id === config.academicYearId);

  return (
    <Dialog open={!!config} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {config.examName}
          </DialogTitle>
          <DialogDescription>
            Exam configuration details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Wing</Label>
              <Badge className={wingConfig[config.wing].color}>
                {wingConfig[config.wing].label}
              </Badge>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Exam Type</Label>
              <Badge className={examTypeColors[config.examType]}>
                {examTypeOptions.find(t => t.value === config.examType)?.label}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Academic Year</Label>
              <p className="font-medium">{academicYear?.name || "-"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Status</Label>
              <Badge variant={config.isActive ? "default" : "secondary"}>
                {config.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Duration</Label>
              <p className="font-medium">{config.durationMinutes} minutes</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Total Marks</Label>
              <p className="font-medium">{config.totalMarks}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Allow Mock Test</Label>
              <Badge variant={config.allowMockTest ? "default" : "secondary"}>
                {config.allowMockTest ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Watermark</Label>
              <p className="font-medium">{config.watermarkText || "None"}</p>
            </div>
          </div>

          {config.logoUrl && (
            <div>
              <Label className="text-muted-foreground text-xs">Logo</Label>
              <img 
                src={config.logoUrl} 
                alt="Exam Logo" 
                className="h-12 mt-1 object-contain"
              />
            </div>
          )}

          <div>
            <Label className="text-muted-foreground text-xs">Applicable Grades</Label>
            <div className="flex gap-1 mt-1">
              {wingConfig[config.wing].grades.map(grade => (
                <Badge key={grade} variant="outline">Grade {grade}</Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
