import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Logo, LogoMark } from "./logo";

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className={cn("min-h-screen corporate-gradient dark:cosmic-bg flex flex-col relative", className)}>
      {/* Stars effect for dark mode */}
      <div className="dark:block hidden absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-gradient-to-br from-purple-500/15 to-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-80 h-80 bg-gradient-to-br from-orange-500/15 to-yellow-500/10 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 flex flex-col flex-1">
        {children}
      </div>
    </div>
  );
}

interface PageHeaderProps {
  children: ReactNode;
  className?: string;
  showLogo?: boolean;
}

export function PageHeader({ children, className, showLogo = false }: PageHeaderProps) {
  return (
    <header className={cn(
      "bg-white/90 dark:bg-slate-900/80 backdrop-blur-md",
      "text-slate-800 dark:text-slate-100",
      "border-b border-slate-200/60 dark:border-white/10",
      "shadow-[0_2px_16px_rgba(0,0,0,0.04),0_4px_24px_rgba(0,0,0,0.02)]",
      "dark:shadow-[0_2px_16px_rgba(0,0,0,0.3)]",
      className
    )}>
      {showLogo && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <LogoMark size="sm" />
        </div>
      )}
      {children}
    </header>
  );
}

interface PageContentProps {
  children: ReactNode;
  className?: string;
}

export function PageContent({ children, className }: PageContentProps) {
  return (
    <main className={cn("p-4 sm:p-6 lg:p-8 flex-1 overflow-x-hidden", className)}>
      {children}
    </main>
  );
}

interface ContentCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  actions?: ReactNode;
  variant?: "default" | "elevated" | "glass";
}

export function ContentCard({ 
  children, 
  className, 
  title, 
  description, 
  actions,
  variant = "default" 
}: ContentCardProps) {
  const variantClasses = {
    default: cn(
      "bg-white dark:bg-slate-900/60 dark:backdrop-blur-lg",
      "rounded-2xl p-5 sm:p-6",
      "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08),0_8px_32px_-8px_rgba(0,0,0,0.04)]",
      "dark:shadow-[0_4px_30px_-4px_rgba(0,0,0,0.4)]",
      "border border-slate-100 dark:border-white/10",
      "dark:hover:border-cyan-500/30 dark:hover:shadow-[0_0_30px_rgba(0,212,255,0.1)]",
    ),
    elevated: cn(
      "bg-white dark:bg-slate-900/70 dark:backdrop-blur-lg",
      "rounded-2xl p-5 sm:p-6",
      "shadow-[0_8px_30px_-4px_rgba(0,0,0,0.12),0_16px_48px_-8px_rgba(0,0,0,0.06)]",
      "dark:shadow-[0_8px_40px_-4px_rgba(0,0,0,0.5)]",
      "border border-slate-100/80 dark:border-white/10",
      "dark:hover:border-purple-500/30",
    ),
    glass: cn(
      "bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl",
      "rounded-2xl p-5 sm:p-6",
      "shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)]",
      "dark:shadow-[0_4px_30px_-4px_rgba(0,0,0,0.3)]",
      "border border-white/40 dark:border-white/10",
    ),
  };

  return (
    <div className={cn(
      variantClasses[variant],
      "text-slate-700 dark:text-slate-200",
      "overflow-x-auto transition-all duration-300",
      className
    )}>
      {(title || description || actions) && (
        <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

interface GridContainerProps {
  children: ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4;
}

export function GridContainer({ children, className, cols = 3 }: GridContainerProps) {
  const colClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-5 sm:gap-6", colClasses[cols], className)}>
      {children}
    </div>
  );
}

export function PageFooter() {
  return (
    <footer className={cn(
      "py-4 px-4 sm:px-6 text-sm",
      "text-slate-500 dark:text-slate-400",
      "border-t border-slate-200/60 dark:border-white/10",
      "bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm mt-auto"
    )}>
      <div className="flex flex-col items-center gap-1 max-w-7xl mx-auto text-center">
        <span>© 2025 All rights reserved</span>
        <span>
          Powered by{" "}
          <span className="font-semibold gradient-text">
            SmartGenEduX
          </span>
          {" "}@2025
        </span>
      </div>
    </footer>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: { value: number; label: string };
  color?: "blue" | "green" | "purple" | "orange" | "pink" | "teal";
}

export function StatCard({ title, value, icon, trend, color = "blue" }: StatCardProps) {
  const colorClasses = {
    blue: "from-blue-500/10 to-blue-600/5 border-blue-200/60 dark:from-cyan-500/20 dark:to-cyan-600/5 dark:border-cyan-500/30",
    green: "from-emerald-500/10 to-emerald-600/5 border-emerald-200/60 dark:from-emerald-500/20 dark:to-emerald-600/5 dark:border-emerald-500/30",
    purple: "from-purple-500/10 to-purple-600/5 border-purple-200/60 dark:from-purple-500/20 dark:to-purple-600/5 dark:border-purple-500/30",
    orange: "from-orange-500/10 to-orange-600/5 border-orange-200/60 dark:from-orange-500/20 dark:to-orange-600/5 dark:border-orange-500/30",
    pink: "from-pink-500/10 to-pink-600/5 border-pink-200/60 dark:from-pink-500/20 dark:to-pink-600/5 dark:border-pink-500/30",
    teal: "from-teal-500/10 to-teal-600/5 border-teal-200/60 dark:from-teal-500/20 dark:to-teal-600/5 dark:border-teal-500/30",
  };

  const iconColorClasses = {
    blue: "text-blue-600 dark:text-cyan-400",
    green: "text-emerald-600 dark:text-emerald-400",
    purple: "text-purple-600 dark:text-purple-400",
    orange: "text-orange-600 dark:text-orange-400",
    pink: "text-pink-600 dark:text-pink-400",
    teal: "text-teal-600 dark:text-teal-400",
  };

  const glowClasses = {
    blue: "dark:hover:shadow-[0_0_30px_rgba(0,212,255,0.2)]",
    green: "dark:hover:shadow-[0_0_30px_rgba(34,197,94,0.2)]",
    purple: "dark:hover:shadow-[0_0_30px_rgba(139,92,246,0.2)]",
    orange: "dark:hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]",
    pink: "dark:hover:shadow-[0_0_30px_rgba(236,72,153,0.2)]",
    teal: "dark:hover:shadow-[0_0_30px_rgba(20,184,166,0.2)]",
  };

  return (
    <div className={cn(
      "bg-gradient-to-br dark:bg-slate-900/50 dark:backdrop-blur-lg",
      colorClasses[color],
      "rounded-2xl p-5 border",
      "shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]",
      "transition-all duration-300 hover:scale-[1.02]",
      glowClasses[color]
    )}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{value}</p>
          {trend && (
            <p className={cn(
              "text-xs mt-2 font-medium",
              trend.value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            )}>
              {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn(
            "p-3 rounded-xl bg-white/60 dark:bg-white/10",
            "shadow-sm",
            iconColorClasses[color]
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
