import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, Clock, XCircle, FileQuestion, AlertCircle, Archive } from "lucide-react";

// ============================================================================
// PAGE TITLE - Consistent title with optional subtitle + actions
// ============================================================================

interface PageTitleProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export function PageTitle({ title, subtitle, actions, className, icon }: PageTitleProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6", className)} data-testid="page-title">
      <div className="flex items-center gap-3">
        {icon && <div className="p-2 rounded-xl bg-white/[0.06] text-[#818CF8]">{icon}</div>}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {title}
          </h1>
          {subtitle && <p className="text-sm text-white/40 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
    </div>
  );
}

// ============================================================================
// STATUS BADGE - Consistent status indicators
// ============================================================================

type BadgeVariant = "approved" | "pending" | "rejected" | "draft" | "active" | "locked" | "archived" | "info" | "warning" | "success" | "error";

interface StatusBadgeProps {
  variant: BadgeVariant;
  label?: string;
  className?: string;
  size?: "sm" | "md";
}

const badgeConfig: Record<BadgeVariant, { bg: string; text: string; icon: ReactNode; defaultLabel: string }> = {
  approved: { bg: "bg-emerald-500/15 border-emerald-500/25", text: "text-emerald-400", icon: <CheckCircle className="w-3 h-3" />, defaultLabel: "Approved" },
  pending: { bg: "bg-amber-500/15 border-amber-500/25", text: "text-amber-400", icon: <Clock className="w-3 h-3" />, defaultLabel: "Pending" },
  rejected: { bg: "bg-red-500/15 border-red-500/25", text: "text-red-400", icon: <XCircle className="w-3 h-3" />, defaultLabel: "Rejected" },
  draft: { bg: "bg-white/[0.06] border-white/[0.12]", text: "text-white/50", icon: <FileQuestion className="w-3 h-3" />, defaultLabel: "Draft" },
  active: { bg: "bg-[#4F46E5]/15 border-[#4F46E5]/25", text: "text-[#818CF8]", icon: <CheckCircle className="w-3 h-3" />, defaultLabel: "Active" },
  locked: { bg: "bg-[#D4AF37]/15 border-[#D4AF37]/25", text: "text-[#D4AF37]", icon: <Archive className="w-3 h-3" />, defaultLabel: "Locked" },
  archived: { bg: "bg-white/[0.04] border-white/[0.08]", text: "text-white/35", icon: <Archive className="w-3 h-3" />, defaultLabel: "Archived" },
  info: { bg: "bg-[#38BDF8]/15 border-[#38BDF8]/25", text: "text-[#38BDF8]", icon: <AlertCircle className="w-3 h-3" />, defaultLabel: "Info" },
  warning: { bg: "bg-amber-500/15 border-amber-500/25", text: "text-amber-400", icon: <AlertTriangle className="w-3 h-3" />, defaultLabel: "Warning" },
  success: { bg: "bg-emerald-500/15 border-emerald-500/25", text: "text-emerald-400", icon: <CheckCircle className="w-3 h-3" />, defaultLabel: "Success" },
  error: { bg: "bg-red-500/15 border-red-500/25", text: "text-red-400", icon: <XCircle className="w-3 h-3" />, defaultLabel: "Error" },
};

export function StatusBadge({ variant, label, className, size = "sm" }: StatusBadgeProps) {
  const config = badgeConfig[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        config.bg, config.text,
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        className
      )}
      data-testid={`status-badge-${variant}`}
    >
      {config.icon}
      {label || config.defaultLabel}
    </span>
  );
}

// ============================================================================
// DATA TABLE - Dark themed table wrapper
// ============================================================================

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  className?: string;
  onRowClick?: (row: T) => void;
  keyExtractor?: (row: T) => string;
  isLoading?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  emptyMessage = "No data found",
  emptyIcon,
  className,
  onRowClick,
  keyExtractor,
  isLoading,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-[#4F46E5]/30 border-t-[#4F46E5] rounded-full animate-spin" />
      </div>
    );
  }

  if (data.length === 0) {
    return <EmptyState message={emptyMessage} icon={emptyIcon} />;
  }

  return (
    <div className={cn("overflow-x-auto rounded-xl", className)} data-testid="data-table">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[0.08]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/40",
                  col.headerClassName
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {data.map((row, idx) => (
            <tr
              key={keyExtractor ? keyExtractor(row) : idx}
              className={cn(
                "transition-colors duration-150",
                onRowClick ? "cursor-pointer hover:bg-white/[0.04]" : "hover:bg-white/[0.02]"
              )}
              onClick={() => onRowClick?.(row)}
              data-testid={`table-row-${idx}`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn("px-4 py-3.5 text-sm text-white/70", col.className)}
                >
                  {col.render ? col.render(row, idx) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// EMPTY STATE - Consistent "no data" placeholder
// ============================================================================

interface EmptyStateProps {
  message?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  message = "No data found",
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)} data-testid="empty-state">
      <div className="p-4 rounded-2xl bg-white/[0.04] mb-4">
        {icon || <FileQuestion className="w-10 h-10 text-white/20" />}
      </div>
      <p className="text-base font-medium text-white/50">{message}</p>
      {description && <p className="text-sm text-white/30 mt-1 max-w-md">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ============================================================================
// CONFIRM DIALOG - For destructive actions
// ============================================================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  requireTypedConfirmation?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  requireTypedConfirmation,
  variant = "default",
  onConfirm,
  isLoading,
}: ConfirmDialogProps) {
  const [typedValue, setTypedValue] = useState("");

  const canConfirm = requireTypedConfirmation
    ? typedValue === requireTypedConfirmation
    : true;

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm();
      setTypedValue("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setTypedValue(""); }}>
      <DialogContent className="glass-card border-white/[0.1] bg-[#0B0A1F]/95 text-white max-w-md" data-testid="confirm-dialog">
        <DialogHeader>
          <DialogTitle className="text-white text-lg">{title}</DialogTitle>
          <DialogDescription className="text-white/50 text-sm">
            {description}
          </DialogDescription>
        </DialogHeader>

        {requireTypedConfirmation && (
          <div className="space-y-2 py-2">
            <p className="text-sm text-white/60">
              Type <span className="font-mono font-bold text-red-400">{requireTypedConfirmation}</span> to confirm:
            </p>
            <Input
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              placeholder={requireTypedConfirmation}
              className="bg-white/[0.05] border-white/[0.1] text-white"
              data-testid="confirm-dialog-input"
              autoFocus
            />
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => { onOpenChange(false); setTypedValue(""); }}
            className="text-white/60 hover:text-white hover:bg-white/[0.06]"
            data-testid="confirm-dialog-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm || isLoading}
            className={cn(
              variant === "destructive"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-[#4F46E5] hover:bg-[#4338CA] text-white"
            )}
            data-testid="confirm-dialog-confirm"
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// SECTION DIVIDER - Visual section breaks
// ============================================================================

interface SectionDividerProps {
  label?: string;
  className?: string;
}

export function SectionDivider({ label, className }: SectionDividerProps) {
  if (!label) return <div className={cn("border-t border-white/[0.06] my-6", className)} />;
  return (
    <div className={cn("flex items-center gap-4 my-6", className)}>
      <div className="flex-1 border-t border-white/[0.06]" />
      <span className="text-xs font-semibold uppercase tracking-widest text-white/25">{label}</span>
      <div className="flex-1 border-t border-white/[0.06]" />
    </div>
  );
}

// ============================================================================
// TAB BAR - Premium styled tab navigation
// ============================================================================

interface TabItem {
  key: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
  className?: string;
}

export function TabBar({ tabs, activeTab, onTabChange, className }: TabBarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]",
        className
      )}
      data-testid="tab-bar"
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
            activeTab === tab.key
              ? "bg-[#4F46E5]/20 text-[#818CF8] border border-[#4F46E5]/30"
              : "text-white/40 hover:text-white/60 hover:bg-white/[0.04] border border-transparent"
          )}
          data-testid={`tab-${tab.key}`}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              "ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
              activeTab === tab.key ? "bg-[#4F46E5]/30 text-[#818CF8]" : "bg-white/[0.06] text-white/30"
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// SEARCH INPUT - Dark themed search
// ============================================================================

import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = "Search...", className }: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/30 h-10"
        data-testid="search-input"
      />
    </div>
  );
}

// ============================================================================
// FILTER SELECT - Dark themed select
// ============================================================================

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

export function FilterSelect({ value, onChange, options, placeholder, className }: FilterSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-10 rounded-lg px-3 text-sm bg-white/[0.05] border border-white/[0.1] text-white/80",
        "focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30 focus:border-[#4F46E5]/50",
        className
      )}
      data-testid="filter-select"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt => (
        <option key={opt.value} value={opt.value} className="bg-[#16113A] text-white">
          {opt.label}
        </option>
      ))}
    </select>
  );
}
