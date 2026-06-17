import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  ArrowLeft, Plus, Trash2, Users, UserPlus, Layers, CheckCircle2, XCircle,
} from "lucide-react";

const token = () => localStorage.getItem("safal_token") || "";
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token()}` });

interface Batch {
  id: string;
  testId: string;
  name: string;
  assignedSet: string;
  studentCount: number;
  studentIds: string[];
}

interface Student {
  id: string;
  name: string;
  email: string;
  grade: string | null;
  section: string | null;
  rollNumber: string | null;
}

interface Test {
  id: string;
  title: string;
  subject: string;
  grade: string;
  questionSets?: { setName: string; questionIds: string[]; totalMarks: number }[];
  setsApproved?: boolean;
}

export default function BatchManagerPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Get testId from URL query params
  const [match, params] = useRoute("/hod/batches/:testId");
  const testId = params?.testId || "";

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [newBatchName, setNewBatchName] = useState("");
  const [newBatchSet, setNewBatchSet] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Fetch test details
  const { data: test } = useQuery<Test>({
    queryKey: ["/api/tests", testId],
    queryFn: async () => {
      const res = await fetch(`/api/tests/${testId}`, { headers: { Authorization: `Bearer ${token()}` } });
      if (!res.ok) throw new Error("Failed to fetch test");
      return res.json();
    },
    enabled: !!testId,
  });

  // Fetch batches for this test
  const { data: batchList = [], refetch: refetchBatches } = useQuery<Batch[]>({
    queryKey: ["/api/tests", testId, "batches"],
    queryFn: async () => {
      const res = await fetch(`/api/tests/${testId}/batches`, { headers: { Authorization: `Bearer ${token()}` } });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!testId,
  });

  // Fetch all students in this school
  const { data: allStudents = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    queryFn: async () => {
      const res = await fetch("/api/students", { headers: { Authorization: `Bearer ${token()}` } });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const availableSets = test?.questionSets?.map(s => s.setName) || [];

  // Students already assigned to any batch for this test
  const assignedStudentIds = new Set(batchList.flatMap(b => b.studentIds || []));
  const unassignedStudents = allStudents.filter(s => !assignedStudentIds.has(s.id));

  // Filter by test grade
  const gradeFilteredStudents = test?.grade
    ? unassignedStudents.filter(s => s.grade === test.grade)
    : unassignedStudents;

  // Create batch
  const createBatchMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/tests/${testId}/batches`, {
        method: "POST", headers: headers(),
        body: JSON.stringify({ name: newBatchName, assignedSet: newBatchSet }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests", testId, "batches"] });
      toast({ title: "Batch created" });
      setIsCreateOpen(false);
      setNewBatchName("");
      setNewBatchSet("");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // Delete batch
  const deleteBatchMutation = useMutation({
    mutationFn: async (batchId: string) => {
      const res = await fetch(`/api/batches/${batchId}`, { method: "DELETE", headers: headers() });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests", testId, "batches"] });
      toast({ title: "Batch deleted" });
    },
  });

  // Assign students
  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBatch) throw new Error("No batch selected");
      const res = await fetch(`/api/batches/${selectedBatch.id}/students`, {
        method: "POST", headers: headers(),
        body: JSON.stringify({ studentIds: selectedStudentIds }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests", testId, "batches"] });
      toast({ title: `${data.assignedCount} students assigned` });
      setIsAssignOpen(false);
      setSelectedStudentIds([]);
      setSelectedBatch(null);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // Remove student from batch
  const removeMutation = useMutation({
    mutationFn: async ({ batchId, studentId }: { batchId: string; studentId: string }) => {
      const res = await fetch(`/api/batches/${batchId}/students`, {
        method: "DELETE", headers: headers(),
        body: JSON.stringify({ studentIds: [studentId] }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests", testId, "batches"] });
      toast({ title: "Student removed from batch" });
    },
  });

  const toggleStudent = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedStudentIds(gradeFilteredStudents.map(s => s.id));
  };

  if (!testId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">No test selected. Go back and select a test.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/hod/generate-paper")} data-testid="btn-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold" data-testid="batch-manager-title">Batch Manager</h1>
            {test && (
              <p className="text-sm text-muted-foreground">
                {test.title} &middot; {test.subject} &middot; Class {test.grade}
                {test.setsApproved && <Badge className="ml-2 bg-green-100 text-green-700">Sets Approved</Badge>}
              </p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Info banner */}
        {availableSets.length === 0 && (
          <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
            <CardContent className="py-4 text-sm text-amber-700 dark:text-amber-400">
              This test has no generated sets yet. Generate multi-set papers first, then assign batches.
            </CardContent>
          </Card>
        )}

        {/* Create Batch + Batch List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Batches ({batchList.length})
                </CardTitle>
                <CardDescription>
                  Each batch maps to one question set. Assign students to batches.
                </CardDescription>
              </div>
              <Button onClick={() => setIsCreateOpen(true)} disabled={availableSets.length === 0} data-testid="btn-create-batch">
                <Plus className="w-4 h-4 mr-2" /> Create Batch
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {batchList.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Layers className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">No batches yet. Create a batch and assign students.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {batchList.map(batch => (
                  <div key={batch.id} className="border rounded-lg p-4" data-testid={`batch-card-${batch.name}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-base px-3 py-1 font-semibold">
                          {batch.name}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          {batch.assignedSet}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {batch.studentCount} student(s)
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm" variant="outline"
                          onClick={() => { setSelectedBatch(batch); setSelectedStudentIds([]); setIsAssignOpen(true); }}
                          data-testid={`btn-assign-${batch.name}`}
                        >
                          <UserPlus className="w-4 h-4 mr-1" /> Assign Students
                        </Button>
                        <Button
                          size="sm" variant="ghost" className="text-red-500 hover:text-red-700"
                          onClick={() => deleteBatchMutation.mutate(batch.id)}
                          data-testid={`btn-delete-${batch.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Students in this batch */}
                    {batch.studentIds && batch.studentIds.length > 0 && (
                      <div className="border rounded overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50 dark:bg-slate-800">
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Section</TableHead>
                              <TableHead>Roll No.</TableHead>
                              <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {batch.studentIds.map(sid => {
                              const s = allStudents.find(st => st.id === sid);
                              if (!s) return null;
                              return (
                                <TableRow key={sid}>
                                  <TableCell className="font-medium">{s.name}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground">{s.email}</TableCell>
                                  <TableCell>{s.section || "-"}</TableCell>
                                  <TableCell>{s.rollNumber || "-"}</TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      size="sm" variant="ghost" className="text-red-500 h-7"
                                      onClick={() => removeMutation.mutate({ batchId: batch.id, studentId: sid })}
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        {batchList.length > 0 && (
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="py-4">
              <div className="flex items-center gap-4 text-sm">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-medium">
                  {batchList.reduce((sum, b) => sum + b.studentCount, 0)} students assigned across {batchList.length} batches
                </span>
                {gradeFilteredStudents.length > 0 && (
                  <span className="text-amber-600">
                    ({gradeFilteredStudents.length} unassigned)
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Create Batch Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Batch</DialogTitle>
            <DialogDescription>Assign a name and map it to a question set.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Batch Name</Label>
              <Input
                value={newBatchName}
                onChange={e => setNewBatchName(e.target.value)}
                placeholder="e.g., Batch A"
                data-testid="input-batch-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Assigned Set</Label>
              <Select value={newBatchSet} onValueChange={setNewBatchSet}>
                <SelectTrigger data-testid="select-batch-set">
                  <SelectValue placeholder="Select a set" />
                </SelectTrigger>
                <SelectContent>
                  {availableSets.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createBatchMutation.mutate()}
              disabled={!newBatchName.trim() || !newBatchSet || createBatchMutation.isPending}
              data-testid="btn-confirm-create-batch"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Students Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Assign Students to {selectedBatch?.name}
            </DialogTitle>
            <DialogDescription>
              Select students to add to this batch ({selectedBatch?.assignedSet}).
              Showing Class {test?.grade} students not yet in any batch.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {gradeFilteredStudents.length} available &middot; {selectedStudentIds.length} selected
              </span>
              <Button size="sm" variant="outline" onClick={selectAll} data-testid="btn-select-all">
                Select All
              </Button>
            </div>

            {gradeFilteredStudents.length === 0 ? (
              <p className="text-center py-6 text-slate-400">
                All students are already assigned to batches.
              </p>
            ) : (
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                {gradeFilteredStudents.map(s => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 px-3 py-2 border-b last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    onClick={() => toggleStudent(s.id)}
                  >
                    <Checkbox
                      checked={selectedStudentIds.includes(s.id)}
                      onCheckedChange={() => toggleStudent(s.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                    </div>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      {s.section && <span>Sec {s.section}</span>}
                      {s.rollNumber && <span>Roll #{s.rollNumber}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsAssignOpen(false)}>Cancel</Button>
            <Button
              onClick={() => assignMutation.mutate()}
              disabled={selectedStudentIds.length === 0 || assignMutation.isPending}
              data-testid="btn-confirm-assign"
            >
              Assign {selectedStudentIds.length} Student(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
