import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAuth, getToken } from "./auth";

export interface DepartmentInfo {
  departmentId: string;
  departmentName: string;
  className: string;
  numericGrade: number | null;
  subjectName: string;
  role: string;
  headRoleLabel: string;
}

interface DepartmentContextType {
  departments: DepartmentInfo[];
  activeDepartment: DepartmentInfo | null;
  activeDepartmentId: string | null;
  setActiveDepartmentId: (id: string) => void;
  isLoading: boolean;
  refreshDepartments: () => Promise<void>;
}

const DepartmentContext = createContext<DepartmentContextType | undefined>(undefined);

const STORAGE_KEY = "safal_active_department";

export function DepartmentProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [departments, setDepartments] = useState<DepartmentInfo[]>([]);
  const [activeDepartmentId, setActiveDeptId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDepartments = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    // Admin/super_admin don't need department context
    if (user.role === "admin" || user.role === "super_admin") {
      setDepartments([]);
      setActiveDeptId(null);
      return;
    }
    const token = getToken();
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/my-departments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch departments");
      const data: DepartmentInfo[] = await res.json();
      setDepartments(data);

      // Restore from localStorage or default to first
      const stored = localStorage.getItem(STORAGE_KEY);
      const valid = data.find(d => d.departmentId === stored);
      if (valid) {
        setActiveDeptId(stored);
      } else if (data.length > 0) {
        setActiveDeptId(data[0].departmentId);
        localStorage.setItem(STORAGE_KEY, data[0].departmentId);
      }
    } catch (err) {
      console.error("Failed to load departments:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const setActiveDepartmentId = (id: string) => {
    setActiveDeptId(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const activeDepartment = departments.find(d => d.departmentId === activeDepartmentId) || null;

  return (
    <DepartmentContext.Provider
      value={{
        departments,
        activeDepartment,
        activeDepartmentId,
        setActiveDepartmentId,
        isLoading,
        refreshDepartments: fetchDepartments,
      }}
    >
      {children}
    </DepartmentContext.Provider>
  );
}

export function useDepartment() {
  const context = useContext(DepartmentContext);
  if (context === undefined) {
    throw new Error("useDepartment must be used within a DepartmentProvider");
  }
  return context;
}
