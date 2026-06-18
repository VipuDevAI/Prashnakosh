import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  Plus, Trash2, Building2, BookOpen, GraduationCap, Users, UserPlus, Settings2, Zap, CheckCircle2,
} from "lucide-react";

const token = () => localStorage.getItem("safal_token") || "";
const authHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token()}` });

interface SchoolClass {
  id: string; name: string; numericGrade: number; sortOrder: number; active: boolean;
}
interface SchoolSubject {
  id: string; name: string; code: string; active: boolean;
}
interface Department {
  id: string; classId: string; subjectId: string; name: string;
  headId: string | null; headRoleLabel: string; active: boolean;
  className?: string; numericGrade?: number; subjectName?: string;
  memberCount?: number; headName?: string | null;
}
interface DeptMember {
  id: string; userId: string; departmentId: string; role: string;
  userName?: string; userEmail?: string; userRole?: string;
}
interface User {
  id: string; name: string; email: string; role: string;
}

export default function DepartmentCMSPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("departments");

  // State for dialogs
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isAssignHeadOpen, setIsAssignHeadOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  
  // Form state
  const [className, setClassName] = useState("");
  const [classGrade, setClassGrade] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [headRoleLabel, setHeadRoleLabel] = useState("HOD");

  // Queries
  const { data: classes = [] } = useQuery<SchoolClass[]>({
    queryKey: ["/api/admin/classes"],
    queryFn: async () => { const r = await fetch("/api/admin/classes", { headers: { Authorization: `Bearer ${token()}` } }); return r.ok ? r.json() : []; },
  });

  const { data: subjects = [] } = useQuery<SchoolSubject[]>({
    queryKey: ["/api/admin/subjects"],
    queryFn: async () => { const r = await fetch("/api/admin/subjects", { headers: { Authorization: `Bearer ${token()}` } }); return r.ok ? r.json() : []; },
  });

  const { data: deptList = [] } = useQuery<Department[]>({
    queryKey: ["/api/admin/departments"],
    queryFn: async () => { const r = await fetch("/api/admin/departments", { headers: { Authorization: `Bearer ${token()}` } }); return r.ok ? r.json() : []; },
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => { const r = await fetch("/api/users", { headers: { Authorization: `Bearer ${token()}` } }); return r.ok ? r.json() : []; },
  });

  const { data: deptMembers = [], refetch: refetchMembers } = useQuery<DeptMember[]>({
    queryKey: ["/api/admin/departments", selectedDept?.id, "members"],
    queryFn: async () => {
      if (!selectedDept) return [];
      const r = await fetch(`/api/admin/departments/${selectedDept.id}/members`, { headers: { Authorization: `Bearer ${token()}` } });
      return r.ok ? r.json() : [];
    },
    enabled: !!selectedDept && isMembersOpen,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/classes"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/subjects"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/departments"] });
  };

  // Mutations
  const createClass = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/admin/classes", { method: "POST", headers: authHeaders(), body: JSON.stringify({ name: className, numericGrade: parseInt(classGrade), sortOrder: parseInt(classGrade) }) });
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },
    onSuccess: () => { invalidateAll(); toast({ title: "Class created" }); setIsAddClassOpen(false); setClassName(""); setClassGrade(""); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const createSubject = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/admin/subjects", { method: "POST", headers: authHeaders(), body: JSON.stringify({ name: subjectName, code: subjectCode || subjectName.substring(0, 3).toUpperCase() }) });
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },
    onSuccess: () => { invalidateAll(); toast({ title: "Subject created" }); setIsAddSubjectOpen(false); setSubjectName(""); setSubjectCode(""); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const generateDepts = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/admin/departments/generate", { method: "POST", headers: authHeaders(), body: JSON.stringify({ classIds: selectedClassIds, subjectIds: selectedSubjectIds }) });
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },
    onSuccess: (data) => { invalidateAll(); toast({ title: `${data.created} departments generated` }); setIsGenerateOpen(false); setSelectedClassIds([]); setSelectedSubjectIds([]); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const assignHead = useMutation({
    mutationFn: async ({ deptId, headId, label }: { deptId: string; headId: string; label: string }) => {
      const r = await fetch(`/api/admin/departments/${deptId}`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ headId, headRoleLabel: label }) });
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },
    onSuccess: () => { invalidateAll(); toast({ title: "Head assigned" }); setIsAssignHeadOpen(false); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addMember = useMutation({
    mutationFn: async ({ deptId, userId, role }: { deptId: string; userId: string; role: string }) => {
      const r = await fetch(`/api/admin/departments/${deptId}/members`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ userId, role }) });
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },
    onSuccess: () => { refetchMembers(); invalidateAll(); toast({ title: "Member added" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const removeMember = useMutation({
    mutationFn: async ({ deptId, userId }: { deptId: string; userId: string }) => {
      const r = await fetch(`/api/admin/departments/${deptId}/members/${userId}`, { method: "DELETE", headers: authHeaders() });
      if (!r.ok) throw new Error("Failed to remove");
      return r.json();
    },
    onSuccess: () => { refetchMembers(); invalidateAll(); toast({ title: "Member removed" }); },
  });

  const deleteClass = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/admin/classes/${id}`, { method: "DELETE", headers: authHeaders() }); },
    onSuccess: () => { invalidateAll(); toast({ title: "Class removed" }); },
  });

  const deleteSubject = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/admin/subjects/${id}`, { method: "DELETE", headers: authHeaders() }); },
    onSuccess: () => { invalidateAll(); toast({ title: "Subject removed" }); },
  });

  // Group departments by class for display
  const deptsByClass = new Map<number, Department[]>();
  for (const d of deptList) {
    const grade = d.numericGrade || 0;
    if (!deptsByClass.has(grade)) deptsByClass.set(grade, []);
    deptsByClass.get(grade)!.push(d);
  }

  const hodTeacherUsers = allUsers.filter(u => ["teacher", "hod"].includes(u.role));
  const [assignUserId, setAssignUserId] = useState("");
  const [assignRole, setAssignRole] = useState("teacher");
  const [headUserId, setHeadUserId] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold" data-testid="dept-cms-title">Department Management</h1>
            <p className="text-sm text-muted-foreground">Manage classes, subjects, and departments</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="departments" data-testid="tab-departments">
              <Building2 className="w-4 h-4 mr-2" /> Departments ({deptList.length})
            </TabsTrigger>
            <TabsTrigger value="classes" data-testid="tab-classes">
              <GraduationCap className="w-4 h-4 mr-2" /> Classes ({classes.length})
            </TabsTrigger>
            <TabsTrigger value="subjects" data-testid="tab-subjects">
              <BookOpen className="w-4 h-4 mr-2" /> Subjects ({subjects.length})
            </TabsTrigger>
          </TabsList>

          {/* DEPARTMENTS TAB */}
          <TabsContent value="departments" className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Each department = one Class + Subject combination. Each gets its own question bank, blueprints, and papers.
              </p>
              <Button onClick={() => { setSelectedClassIds(classes.map(c => c.id)); setSelectedSubjectIds(subjects.map(s => s.id)); setIsGenerateOpen(true); }} data-testid="btn-generate-depts">
                <Zap className="w-4 h-4 mr-2" /> Generate Departments
              </Button>
            </div>

            {deptList.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-lg font-medium mb-2">No departments yet</p>
                  <p className="text-sm text-muted-foreground mb-4">Create classes and subjects first, then generate departments.</p>
                </CardContent>
              </Card>
            ) : (
              Array.from(deptsByClass.entries()).sort((a, b) => a[0] - b[0]).map(([grade, depts]) => (
                <Card key={grade}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      Class {depts[0]?.className || grade}
                      <Badge variant="secondary" className="ml-2">{depts.length} departments</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {depts.sort((a, b) => (a.subjectName || "").localeCompare(b.subjectName || "")).map(dept => (
                        <div key={dept.id} className="border rounded-lg p-3 hover:border-primary/40 transition-colors" data-testid={`dept-card-${dept.name}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{dept.subjectName}</span>
                            <Badge variant="outline" className="text-xs">{dept.memberCount || 0} members</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mb-3">
                            {dept.headName ? (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                {dept.headRoleLabel}: {dept.headName}
                              </span>
                            ) : (
                              <span className="text-amber-500">No {dept.headRoleLabel || "HOD"} assigned</span>
                            )}
                          </div>
                          <div className="flex gap-1.5">
                            <Button size="sm" variant="outline" className="text-xs h-7 flex-1"
                              onClick={() => { setSelectedDept(dept); setHeadUserId(dept.headId || ""); setHeadRoleLabel(dept.headRoleLabel || "HOD"); setIsAssignHeadOpen(true); }}>
                              <Settings2 className="w-3 h-3 mr-1" /> Head
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs h-7 flex-1"
                              onClick={() => { setSelectedDept(dept); setIsMembersOpen(true); }}>
                              <Users className="w-3 h-3 mr-1" /> Members
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* CLASSES TAB */}
          <TabsContent value="classes" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Add classes offered by your school.</p>
              <Button onClick={() => setIsAddClassOpen(true)} data-testid="btn-add-class">
                <Plus className="w-4 h-4 mr-2" /> Add Class
              </Button>
            </div>
            <Card>
              <CardContent className="pt-6">
                {classes.length === 0 ? (
                  <p className="text-center py-8 text-slate-400">No classes added yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Grade Number</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classes.sort((a, b) => a.numericGrade - b.numericGrade).map(cls => (
                        <TableRow key={cls.id}>
                          <TableCell className="font-medium">{cls.name}</TableCell>
                          <TableCell>{cls.numericGrade}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" className="text-red-500 h-7" onClick={() => deleteClass.mutate(cls.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SUBJECTS TAB */}
          <TabsContent value="subjects" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Add subjects offered by your school.</p>
              <Button onClick={() => setIsAddSubjectOpen(true)} data-testid="btn-add-subject">
                <Plus className="w-4 h-4 mr-2" /> Add Subject
              </Button>
            </div>
            <Card>
              <CardContent className="pt-6">
                {subjects.length === 0 ? (
                  <p className="text-center py-8 text-slate-400">No subjects added yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjects.map(subj => (
                        <TableRow key={subj.id}>
                          <TableCell className="font-medium">{subj.name}</TableCell>
                          <TableCell><Badge variant="outline">{subj.code}</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" className="text-red-500 h-7" onClick={() => deleteSubject.mutate(subj.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Class Dialog */}
      <Dialog open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Class</DialogTitle>
            <DialogDescription>Add a new class to your school.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={className} onChange={e => setClassName(e.target.value)} placeholder="e.g., IX, X, XI, XII" data-testid="input-class-name" />
            </div>
            <div className="space-y-2">
              <Label>Numeric Grade</Label>
              <Input type="number" value={classGrade} onChange={e => setClassGrade(e.target.value)} placeholder="e.g., 9, 10, 11, 12" data-testid="input-class-grade" />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsAddClassOpen(false)}>Cancel</Button>
            <Button onClick={() => createClass.mutate()} disabled={!className || !classGrade} data-testid="btn-confirm-add-class">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Subject Dialog */}
      <Dialog open={isAddSubjectOpen} onOpenChange={setIsAddSubjectOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Subject</DialogTitle>
            <DialogDescription>Add a new subject to your school.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Subject Name</Label>
              <Input value={subjectName} onChange={e => setSubjectName(e.target.value)} placeholder="e.g., Science, Mathematics" data-testid="input-subject-name" />
            </div>
            <div className="space-y-2">
              <Label>Code (optional)</Label>
              <Input value={subjectCode} onChange={e => setSubjectCode(e.target.value.toUpperCase())} placeholder="Auto-generated if empty" data-testid="input-subject-code" />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsAddSubjectOpen(false)}>Cancel</Button>
            <Button onClick={() => createSubject.mutate()} disabled={!subjectName} data-testid="btn-confirm-add-subject">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Departments Dialog */}
      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Departments</DialogTitle>
            <DialogDescription>
              Select classes and subjects to auto-create departments. Existing combinations will be skipped.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Classes ({selectedClassIds.length} selected)</Label>
              <div className="flex flex-wrap gap-2">
                {classes.map(cls => (
                  <Badge key={cls.id} variant={selectedClassIds.includes(cls.id) ? "default" : "outline"}
                    className="cursor-pointer" onClick={() => setSelectedClassIds(prev => prev.includes(cls.id) ? prev.filter(id => id !== cls.id) : [...prev, cls.id])}>
                    {cls.name}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Subjects ({selectedSubjectIds.length} selected)</Label>
              <div className="flex flex-wrap gap-2">
                {subjects.map(subj => (
                  <Badge key={subj.id} variant={selectedSubjectIds.includes(subj.id) ? "default" : "outline"}
                    className="cursor-pointer" onClick={() => setSelectedSubjectIds(prev => prev.includes(subj.id) ? prev.filter(id => id !== subj.id) : [...prev, subj.id])}>
                    {subj.name}
                  </Badge>
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Will generate up to {selectedClassIds.length * selectedSubjectIds.length} departments.
            </p>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>Cancel</Button>
            <Button onClick={() => generateDepts.mutate()} disabled={!selectedClassIds.length || !selectedSubjectIds.length} data-testid="btn-confirm-generate">
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Head Dialog */}
      <Dialog open={isAssignHeadOpen} onOpenChange={setIsAssignHeadOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Department Head</DialogTitle>
            <DialogDescription>{selectedDept?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Role Label</Label>
              <Input value={headRoleLabel} onChange={e => setHeadRoleLabel(e.target.value)} placeholder="HOD, Department Coordinator, etc." data-testid="input-head-role-label" />
            </div>
            <div className="space-y-2">
              <Label>Select Head</Label>
              <Select value={headUserId} onValueChange={setHeadUserId}>
                <SelectTrigger data-testid="select-head-user">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {hodTeacherUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name} ({u.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsAssignHeadOpen(false)}>Cancel</Button>
            <Button onClick={() => { if (selectedDept && headUserId) assignHead.mutate({ deptId: selectedDept.id, headId: headUserId, label: headRoleLabel }); }}
              disabled={!headUserId} data-testid="btn-confirm-assign-head">
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Members Dialog */}
      <Dialog open={isMembersOpen} onOpenChange={setIsMembersOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {selectedDept?.name} — Members
            </DialogTitle>
          </DialogHeader>

          {/* Add member */}
          <div className="flex gap-2 mt-2">
            <Select value={assignUserId} onValueChange={setAssignUserId}>
              <SelectTrigger className="flex-1" data-testid="select-add-member">
                <SelectValue placeholder="Select user to add" />
              </SelectTrigger>
              <SelectContent>
                {hodTeacherUsers.filter(u => !deptMembers.some(m => m.userId === u.id)).map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name} ({u.role})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={assignRole} onValueChange={setAssignRole}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="hod">HOD</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => { if (selectedDept && assignUserId) { addMember.mutate({ deptId: selectedDept.id, userId: assignUserId, role: assignRole }); setAssignUserId(""); } }}
              disabled={!assignUserId} data-testid="btn-add-member">
              <UserPlus className="w-4 h-4" />
            </Button>
          </div>

          {/* Member list */}
          <div className="mt-4">
            {deptMembers.length === 0 ? (
              <p className="text-center py-6 text-slate-400">No members assigned yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deptMembers.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.userName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{m.userEmail}</TableCell>
                      <TableCell><Badge variant={m.role === "hod" ? "default" : "outline"}>{m.role}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" className="text-red-500 h-7"
                          onClick={() => { if (selectedDept) removeMember.mutate({ deptId: selectedDept.id, userId: m.userId }); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
