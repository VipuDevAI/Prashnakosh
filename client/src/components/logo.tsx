import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
}

const sizeClasses = {
  sm: "h-8",
  md: "h-10",
  lg: "h-14",
  xl: "h-20",
};

const textSizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-2xl",
};

export function Logo({ size = "md", className, showText = false }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img
        src={BRAND.logo}
        alt="Prashnakosh Logo"
        className={cn(
          "object-contain",
          sizeClasses[size]
        )}
      />
    </div>
  );
}

export function LogoMark({ size = "md", className }: Omit<LogoProps, "showText">) {
  return (
    <img
      src={BRAND.loginLogo}
      alt="Prashnakosh Logo"
      className={cn(
        "object-contain rounded-full",
        "ring-2 ring-white/20 dark:ring-cyan-500/30",
        "transition-transform hover:scale-105",
        sizeClasses[size],
        className
      )}
    />
  );
}
