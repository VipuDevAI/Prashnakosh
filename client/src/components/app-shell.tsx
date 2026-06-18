import { type ReactNode, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useDepartment } from "@/lib/department-context";
import { DepartmentSelector } from "@/components/department-selector";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, BookOpen, FileText, Upload, CheckCircle,
  TrendingUp, Printer, ClipboardList, BarChart3, Settings, LogOut,
  ChevronLeft, ChevronRight, Users, Shield, Bell, Menu, X, BookOpen as Logo
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  roles?: string[];
  badge?: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "Questions", href: "/hod/questions", icon: <BookOpen className="w-5 h-5" />, roles: ["hod", "admin", "super_admin"] },
  { label: "Blueprints", href: "/hod/blueprints", icon: <FileText className="w-5 h-5" />, roles: ["hod", "admin", "super_admin"] },
  { label: "Upload", href: "/teacher/blueprint-upload", icon: <Upload className="w-5 h-5" />, roles: ["teacher", "hod", "admin", "super_admin"] },
  { label: "Approvals", href: "/hod/questions", icon: <CheckCircle className="w-5 h-5" />, roles: ["hod", "admin", "super_admin"] },
  { label: "Coverage", href: "/hod/academic-coverage", icon: <TrendingUp className="w-5 h-5" />, roles: ["hod", "admin", "super_admin"] },
  { label: "Paper Gen", href: "/hod/paper-generator", icon: <Printer className="w-5 h-5" />, roles: ["hod", "admin", "super_admin"] },
  { label: "Mock Tests", href: "/tests", icon: <ClipboardList className="w-5 h-5" /> },
  { label: "Analytics", href: "/analytics", icon: <BarChart3 className="w-5 h-5" />, roles: ["hod", "admin", "super_admin"] },
  { label: "Users", href: "/admin/users", icon: <Users className="w-5 h-5" />, roles: ["admin", "super_admin"] },
];

function SidebarNav({ collapsed, onCollapse }: { collapsed: boolean; onCollapse: (v: boolean) => void }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const role = user?.role || "";

  const filtered = navItems.filter(item => !item.roles || item.roles.includes(role));

  return (
    <aside className={cn(
      "pk-sidebar flex flex-col h-screen transition-all duration-300 z-50",
      collapsed ? "w-[72px]" : "w-[240px]"
    )}>
      {/* Logo area */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/[0.06] flex-shrink-0">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#4F46E5] to-[#9333EA] flex items-center justify-center flex-shrink-0">
          <Logo className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-lg font-semibold text-[#D4AF37] tracking-tight whitespace-nowrap" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Prashnakosh
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {filtered.map((item) => {
          const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
          return (
            <Link key={item.href + item.label} href={item.href}>
              <div
                className={cn(
                  "pk-sidebar-item cursor-pointer group",
                  isActive && "active",
                  collapsed && "justify-center px-0"
                )}
                title={collapsed ? item.label : undefined}
              >
                <span className={cn(
                  "transition-colors",
                  isActive ? "text-[#D4AF37]" : "text-white/40 group-hover:text-white/70"
                )}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom area */}
      <div className="border-t border-white/[0.06] px-3 py-3 space-y-1 flex-shrink-0">
        <button
          onClick={() => onCollapse(!collapsed)}
          className="pk-sidebar-item w-full justify-center"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!collapsed && <span>Collapse</span>}
        </button>
        <button onClick={logout} className="pk-sidebar-item w-full text-red-400/60 hover:text-red-400" title="Logout">
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

function TopBar() {
  const { user } = useAuth();
  const { activeDepartment } = useDepartment();

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-white/[0.06] bg-black/20 backdrop-blur-sm flex-shrink-0">
      <div className="flex items-center gap-3">
        {activeDepartment && (
          <span className="text-sm text-white/40">
            {activeDepartment.className} &mdash; {activeDepartment.subjectName}
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <DepartmentSelector />
        <Bell className="w-5 h-5 text-white/30 cursor-pointer hover:text-white/60 transition-colors" />
        <div className="flex items-center gap-2.5 pl-4 border-l border-white/[0.06]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#9333EA] flex items-center justify-center text-white text-xs font-semibold">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-white/90 leading-tight">{user?.name}</p>
            <p className="text-[10px] text-[#D4AF37]/60 uppercase tracking-wider">{user?.role?.replace("_", " ")}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen cosmic-bg flex">
      {/* Desktop sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <SidebarNav collapsed={collapsed} onCollapse={setCollapsed} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative">
            <SidebarNav collapsed={false} onCollapse={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 h-14 border-b border-white/[0.06] bg-black/20 backdrop-blur-sm">
          <button onClick={() => setMobileOpen(true)} className="text-white/60 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-lg font-semibold text-[#D4AF37]" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Prashnakosh
          </span>
        </div>

        {/* Desktop top bar */}
        <div className="hidden lg:block">
          <TopBar />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
