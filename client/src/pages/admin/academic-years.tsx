import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  ArrowLeft, Plus, Calendar, CheckCircle, Lock, Edit
} from "lucide-react";

interface AcademicYear {
  id: string;
  tenantId: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isLocked: boolean;
  lockedAt?: string;
  lockedBy?: string;
  createdAt: string;
}

export default function AcademicYearsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { selectedSchool, isSuperAdmin } = useSchoolContext();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editYear, setEditYear] = useState<AcademicYear | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });

  const isAuthorized = user?.role === "admin" || user?.role === "super_admin";
  const targetTenantId = isSuperAdmin ? selectedSchool?.id : user?.tenantId;

  const { data: years = [], isLoading } = useQuery<AcademicYear[]>({
    queryKey: ["/api/admin/academic-years", targetTenantId],
    queryFn: async () => {
      if (!targetTenantId) return [];
      const response = await fetch(`/api/admin/academic-years?tenantId=${targetTenantId}`);
      return response.json();
    },
    enabled: !!targetTenantId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/admin/academic-years", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Academic Year Created" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/academic-years"] });
      setIsCreateOpen(false);
      setFormData({ name: "", startDate: "", endDate: "" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const response = await apiRequest("PATCH", `/api/admin/academic-years/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Academic Year Updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/academic-years"] });
      setEditYear(null);
      setFormData({ name: "", startDate: "", endDate: "" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/admin/academic-years/${id}/activate`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Academic Year Activated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/academic-years"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const lockMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/admin/academic-years/${id}/lock`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Academic Year Locked" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/academic-years"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!editYear) return;
    updateMutation.mutate({ id: editYear.id, data: formData });
  };

  const openEdit = (year: AcademicYear) => {
    setEditYear(year);
    setFormData({
      name: year.name,
      startDate: year.startDate.split("T")[0],
      endDate: year.endDate.split("T")[0],
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!isAuthorized) {
    return null;
  }

  return (
    <PageLayout>
      <PageHeader>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Academic Years</h1>
              <p className="text-sm text-muted-foreground">
                Manage academic year cycles {selectedSchool ? `for ${selectedSchool.name}` : ""}
              </p>
            </div>
          </div>
          {isSuperAdmin && <SchoolSwitcher />}
        </div>
      </PageHeader>

      <PageContent>
        <RequireSchoolSelection>
        <div className="flex justify-end mb-6">
          <CoinButton
            onClick={() => setIsCreateOpen(true)}
            color="blue"
            data-testid="button-create-year"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Academic Year
          </CoinButton>
        </div>

        <ContentCard>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : years.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Academic Years</h3>
              <p className="text-muted-foreground">Create your first academic year to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {years.map((year) => (
                  <TableRow key={year.id} data-testid={`row-year-${year.id}`}>
                    <TableCell className="font-medium">{year.name}</TableCell>
                    <TableCell>{formatDate(year.startDate)}</TableCell>
                    <TableCell>{formatDate(year.endDate)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {year.isActive && (
                          <Badge className="bg-coin-green text-white">Active</Badge>
                        )}
                        {year.isLocked && (
                          <Badge variant="secondary">
                            <Lock className="w-3 h-3 mr-1" />
                            Locked
                          </Badge>
                        )}
                        {!year.isActive && !year.isLocked && (
                          <Badge variant="outline">Draft</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!year.isLocked && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(year)}
                              data-testid={`button-edit-${year.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {!year.isActive && (
                              <CoinButton
                                color="green"
                                className="text-sm px-3 py-1.5"
                                onClick={() => activateMutation.mutate(year.id)}
                                disabled={activateMutation.isPending}
                                data-testid={`button-activate-${year.id}`}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Activate
                              </CoinButton>
                            )}
                            <CoinButton
                              color="gold"
                              className="text-sm px-3 py-1.5"
                              onClick={() => lockMutation.mutate(year.id)}
                              disabled={lockMutation.isPending}
                              data-testid={`button-lock-${year.id}`}
                            >
                              <Lock className="w-4 h-4 mr-1" />
                              Lock
                            </CoinButton>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ContentCard>
        </RequireSchoolSelection>
      </PageContent>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Academic Year</DialogTitle>
            <DialogDescription>
              Add a new academic year cycle for your school
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g., 2025-2026"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-year-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  data-testid="input-start-date"
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  data-testid="input-end-date"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <CoinButton
                color="blue"
                onClick={handleCreate}
                disabled={createMutation.isPending || !formData.name || !formData.startDate || !formData.endDate}
                data-testid="button-submit-create"
              >
                Create
              </CoinButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editYear} onOpenChange={(open) => !open && setEditYear(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Academic Year</DialogTitle>
            <DialogDescription>
              Update the academic year details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-edit-year-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-startDate">Start Date</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  data-testid="input-edit-start-date"
                />
              </div>
              <div>
                <Label htmlFor="edit-endDate">End Date</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  data-testid="input-edit-end-date"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditYear(null)}>
                Cancel
              </Button>
              <CoinButton
                color="blue"
                onClick={handleUpdate}
                disabled={updateMutation.isPending}
                data-testid="button-submit-update"
              >
                Save Changes
              </CoinButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
