import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className={cn("min-h-screen cosmic-bg flex flex-col", className)}>
      {children}
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
      "glass-card-heavy !rounded-none",
      "text-white",
      "border-b border-white/[0.06] !border-t-0 !border-x-0",
      className
    )}>
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
      "bg-white/[0.04] backdrop-blur-xl",
      "rounded-2xl p-5 sm:p-6",
      "shadow-[0_4px_20px_rgba(0,0,0,0.15)]",
      "border border-white/[0.08]",
    ),
    elevated: cn(
      "bg-white/[0.06] backdrop-blur-xl",
      "rounded-2xl p-5 sm:p-6",
      "shadow-[0_8px_30px_rgba(0,0,0,0.2)]",
      "border border-white/[0.1]",
    ),
    glass: cn(
      "bg-white/[0.05] backdrop-blur-2xl",
      "rounded-2xl p-5 sm:p-6",
      "shadow-[0_4px_24px_rgba(0,0,0,0.12)]",
      "border border-white/[0.08]",
    ),
  };

  return (
    <div className={cn(
      variantClasses[variant],
      "text-white/80",
      "overflow-x-auto transition-all duration-300",
      "hover:bg-white/[0.06] hover:-translate-y-0.5",
      className
    )}>
      {(title || description || actions) && (
        <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-white">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-white/40 mt-1">{description}</p>
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
      "text-white/30",
      "border-t border-white/[0.06]",
      "bg-black/20 backdrop-blur-sm mt-auto"
    )}>
      <div className="flex flex-col items-center gap-1 max-w-7xl mx-auto text-center">
        <span>
          Powered by{" "}
          <span className="font-semibold text-[#D4AF37]/60">SmartGenEduX</span>
          {" "}@ 2026
        </span>
        <span className="text-[10px] uppercase tracking-widest text-white/15">Prashnakosh Beta</span>
      </div>
    </footer>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: { value: number; label: string };
  color?: "blue" | "green" | "purple" | "orange" | "pink" | "teal" | "gold";
}

export function StatCard({ title, value, icon, trend, color = "blue" }: StatCardProps) {
  const colorMap: Record<string, { bg: string; icon: string; glow: string }> = {
    blue: { bg: "from-[#4F46E5]/15 to-[#4F46E5]/5", icon: "text-[#818CF8]", glow: "shadow-[#4F46E5]/10" },
    green: { bg: "from-emerald-500/15 to-emerald-500/5", icon: "text-emerald-400", glow: "shadow-emerald-500/10" },
    purple: { bg: "from-[#9333EA]/15 to-[#9333EA]/5", icon: "text-purple-400", glow: "shadow-[#9333EA]/10" },
    orange: { bg: "from-orange-500/15 to-orange-500/5", icon: "text-orange-400", glow: "shadow-orange-500/10" },
    pink: { bg: "from-pink-500/15 to-pink-500/5", icon: "text-pink-400", glow: "shadow-pink-500/10" },
    teal: { bg: "from-[#38BDF8]/15 to-[#38BDF8]/5", icon: "text-[#38BDF8]", glow: "shadow-[#38BDF8]/10" },
    gold: { bg: "from-[#D4AF37]/15 to-[#D4AF37]/5", icon: "text-[#D4AF37]", glow: "shadow-[#D4AF37]/10" },
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <div className={cn(
      "bg-gradient-to-br",
      c.bg,
      "rounded-2xl p-5 border border-white/[0.08]",
      "shadow-lg",
      c.glow,
      "transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white/50">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {trend && (
            <p className={cn(
              "text-xs mt-2 font-medium",
              trend.value >= 0 ? "text-emerald-400" : "text-red-400"
            )}>
              {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn(
            "p-3 rounded-xl bg-white/[0.06]",
            c.icon
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
