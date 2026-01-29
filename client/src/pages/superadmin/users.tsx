import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft, Plus, Edit, Trash2, Building2, Users, Mail, Shield, 
  GraduationCap, UserCheck, AlertTriangle
} from "lucide-react";

interface School {
  id: string;
  name: string;
  code: string;
}

interface User {
  id: string;
  tenantId: string | null;
  email: string;
  name: string;
  role: string;
  grade: string | null;
  active: boolean;
  userCode?: string;
}

const ROLES = [
  { value: "principal", label: "Principal", color: "bg-purple-100 text-purple-700" },
  { value: "hod", label: "HOD", color: "bg-blue-100 text-blue-700" },
  { value: "teacher", label: "Teacher", color: "bg-green-100 text-green-700" },
  { value: "student", label: "Student", color: "bg-amber-100 text-amber-700" },
  { value: "parent", label: "Parent", color: "bg-pink-100 text-pink-700" },
];

const GRADES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

export default function SuperAdminUsersPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(() =>
    localStorage.getItem("superadmin_selected_school") || ""
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  // Persist school selection
  useEffect(() => {
    if (selectedSchoolId) {
      localStorage.setItem("superadmin_selected_school", selectedSchoolId);
    }
  }, [selectedSchoolId]);

  // Fetch schools
  const { data: schools = [] } = useQuery<School[]>({
    queryKey: ["/api/superadmin/schools"],
    queryFn: async () => {
      const res = await fetch("/api/superadmin/schools", {
        headers: { Authorization: `Bearer ${localStorage.getItem("safal_token")}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch users for selected school
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/superadmin/users", selectedSchoolId],
    queryFn: async () => {
      if (!selectedSchoolId) return [];
      const res = await fetch(`/api/superadmin/users?schoolId=${selectedSchoolId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("safal_token")}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedSchoolId,
  });

  const selectedSchool = schools.find(s => s.id === selectedSchoolId);

  // Create user mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<User> & { password: string }) => {
      const res = await fetch("/api/superadmin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("safal_token")}`,
        },
        body: JSON.stringify({ ...data, tenantId: selectedSchoolId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/users"] });
      toast({ title: "User created successfully" });
      setIsCreateOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update user mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<User> & { id: string; password?: string }) => {
      const res = await fetch(`/api/superadmin/users/${data.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("safal_token")}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/users"] });
      toast({ title: "User updated successfully" });
      setEditUser(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/superadmin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("safal_token")}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/users"] });
      toast({ title: "User deleted successfully" });
      setDeleteUser(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getRoleBadge = (role: string) => {
    const roleConfig = ROLES.find(r => r.value === role);
    return roleConfig ? (
      <Badge className={roleConfig.color}>{roleConfig.label}</Badge>
    ) : (
      <Badge variant="outline">{role}</Badge>
    );
  };

  if (!user || user.role !== "super_admin") {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/superadmin")} data-testid="btn-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Users Management</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Create users for each school</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* School Selection */}
        <Card className="border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-600 text-white text-sm font-bold">1</span>
              Select School
            </CardTitle>
            <CardDescription>Choose a school to manage its users</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
              <SelectTrigger className="max-w-md h-12" data-testid="select-school">
                <SelectValue placeholder="-- Choose a School --" />
              </SelectTrigger>
              <SelectContent>
                {schools.filter(s => s.active !== false).map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {school.name}
                      <Badge variant="outline" className="ml-2">{school.code}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!selectedSchoolId && (
              <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Please select a school to manage users
              </p>
            )}
          </CardContent>
        </Card>

        {/* Users List */}
        {selectedSchoolId && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Users for {selectedSchool?.name}
                  </CardTitle>
                  <CardDescription>
                    {users.length} user(s) in this school
                  </CardDescription>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} data-testid="btn-add-user">
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                  <Users className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No Users Yet</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">
                    Add principals, teachers, and students for this school
                  </p>
                  <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First User
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800">
                        <TableHead className="font-semibold">User</TableHead>
                        <TableHead className="font-semibold">Email</TableHead>
                        <TableHead className="font-semibold">Role</TableHead>
                        <TableHead className="font-semibold">Grade</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                                <UserCheck className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white">{u.name}</p>
                                {u.userCode && (
                                  <p className="text-xs text-slate-500 font-mono">{u.userCode}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {u.email}
                            </span>
                          </TableCell>
                          <TableCell>{getRoleBadge(u.role)}</TableCell>
                          <TableCell>
                            {u.grade ? (
                              <Badge variant="outline">
                                <GraduationCap className="w-3 h-3 mr-1" />
                                Grade {u.grade}
                              </Badge>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={u.active !== false
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            }>
                              {u.active !== false ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setEditUser(u)}
                                data-testid={`btn-edit-${u.id}`}
                                title="Edit"
                              >
                                <Edit className="w-4 h-4 text-blue-600" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setDeleteUser(u)}
                                data-testid={`btn-delete-${u.id}`}
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Create/Edit User Dialog */}
      <UserFormDialog
        isOpen={isCreateOpen || !!editUser}
        onClose={() => {
          setIsCreateOpen(false);
          setEditUser(null);
        }}
        user={editUser}
        schoolCode={selectedSchool?.code || ""}
        onSubmit={(data) => {
          if (editUser) {
            updateMutation.mutate({ ...data, id: editUser.id });
          } else {
            createMutation.mutate(data as any);
          }
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Delete User
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{deleteUser?.name}"</strong>?
              <br /><br />
              This will deactivate the user account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUser && deleteMutation.mutate(deleteUser.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// User Form Dialog Component
function UserFormDialog({
  isOpen,
  onClose,
  user,
  schoolCode,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  schoolCode: string;
  onSubmit: (data: Partial<User> & { password?: string }) => void;
  isLoading: boolean;
}) {
  const { toast } = useToast();
  const isEditing = !!user;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "teacher",
    grade: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        password: "",
        role: user.role || "teacher",
        grade: user.grade || "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "teacher",
        grade: "",
      });
    }
  }, [user, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    if (!formData.email.trim()) {
      toast({ title: "Email is required", variant: "destructive" });
      return;
    }
    if (!isEditing && !formData.password.trim()) {
      toast({ title: "Password is required for new users", variant: "destructive" });
      return;
    }
    
    const data: any = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      grade: formData.grade || null,
    };
    
    if (formData.password) {
      data.password = formData.password;
    }
    
    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {isEditing ? "Edit User" : "Create New User"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Update user information" : `Add a new user for school ${schoolCode}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Full Name <span className="text-red-500">*</span></Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., John Doe"
              data-testid="input-user-name"
            />
          </div>

          <div className="space-y-2">
            <Label>Email <span className="text-red-500">*</span></Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g., john@school.edu"
              data-testid="input-user-email"
            />
          </div>

          <div className="space-y-2">
            <Label>
              Password {!isEditing && <span className="text-red-500">*</span>}
              {isEditing && <span className="text-slate-400 text-xs ml-2">(leave blank to keep current)</span>}
            </Label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={isEditing ? "Enter new password" : "Enter password"}
              data-testid="input-user-password"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role <span className="text-red-500">*</span></Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                <SelectTrigger data-testid="select-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        {role.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Grade {formData.role === "student" && <span className="text-red-500">*</span>}</Label>
              <Select value={formData.grade} onValueChange={(v) => setFormData({ ...formData, grade: v })}>
                <SelectTrigger data-testid="select-grade">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Grade</SelectItem>
                  {GRADES.map((grade) => (
                    <SelectItem key={grade} value={grade}>Grade {grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} data-testid="btn-submit-user">
              {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />}
              {isEditing ? "Update User" : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
