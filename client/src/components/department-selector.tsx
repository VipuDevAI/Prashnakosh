import { useDepartment } from "@/lib/department-context";
import { useAuth } from "@/lib/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

export function DepartmentSelector() {
  const { user } = useAuth();
  const { departments, activeDepartment, activeDepartmentId, setActiveDepartmentId, isLoading } = useDepartment();

  // Only show for roles that use departments
  if (!user || user.role === "admin" || user.role === "super_admin" || user.role === "student") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 animate-pulse" data-testid="department-selector-loading">
        <Building2 className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (departments.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800" data-testid="department-selector-empty">
        <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        <span className="text-sm text-amber-700 dark:text-amber-300">No departments assigned</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2" data-testid="department-selector">
      <Building2 className="w-4 h-4 text-muted-foreground hidden sm:block" />
      <Select value={activeDepartmentId || ""} onValueChange={setActiveDepartmentId}>
        <SelectTrigger 
          className="w-[140px] sm:w-[200px] h-9 text-sm font-medium border-primary/20 bg-primary/5 dark:bg-primary/10"
          data-testid="department-selector-trigger"
        >
          <SelectValue placeholder="Select Department">
            {activeDepartment && (
              <span className="truncate">
                <span className="font-semibold">{activeDepartment.className}</span>
                {" "}
                <span className="text-muted-foreground">{activeDepartment.subjectName}</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {departments.map((dept) => (
            <SelectItem 
              key={dept.departmentId} 
              value={dept.departmentId}
              data-testid={`department-option-${dept.departmentName}`}
            >
              <div className="flex flex-col">
                <span className="font-medium">{dept.className} - {dept.subjectName}</span>
                <span className="text-xs text-muted-foreground capitalize">{dept.role}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
