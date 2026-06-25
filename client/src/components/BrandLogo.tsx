import { cn } from "@/lib/utils";
import logoImage from "@/assets/logo.png";

type BrandSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

interface BrandLogoProps {
  size?: BrandSize;
  showText?: boolean;
  showTagline?: boolean;
  className?: string;
  variant?: "default" | "compact" | "full";
}

const logoSizes: Record<BrandSize, string> = {
  xs: "w-7 h-7",
  sm: "w-9 h-9",
  md: "w-11 h-11",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
  "2xl": "w-32 h-32",
};

const textSizes: Record<BrandSize, string> = {
  xs: "text-sm",
  sm: "text-base",
  md: "text-lg",
  lg: "text-xl",
  xl: "text-2xl",
  "2xl": "text-3xl",
};

const taglineSizes: Record<BrandSize, string> = {
  xs: "text-[9px]",
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-sm",
  xl: "text-base",
  "2xl": "text-lg",
};

export function BrandLogo({
  size = "md",
  showText = true,
  showTagline = false,
  className,
  variant = "default",
}: BrandLogoProps) {
  return (
    <div
      className={cn(
        "flex items-center",
        variant === "full" ? "flex-col text-center gap-3" : "gap-3",
        className
      )}
      data-testid="brand-logo"
    >
      <div
        className={cn(
          "relative flex-shrink-0",
          "transition-transform hover:scale-105",
          logoSizes[size]
        )}
      >
        <img
          src={logoImage}
          alt="Prashnakosh"
          className="w-full h-full object-contain drop-shadow-lg"
          draggable={false}
        />
      </div>
      {showText && (
        <div className={cn(variant === "full" ? "text-center" : "flex flex-col")}>
          <span
            className={cn(
              "font-bold tracking-wide leading-tight",
              "bg-gradient-to-r from-[#1a1f5c] via-[#2d3494] to-[#1a1f5c] bg-clip-text text-transparent",
              "dark:from-white dark:via-[#E8DCAA] dark:to-white",
              textSizes[size]
            )}
            style={{ fontFamily: "'Montserrat', 'Outfit', sans-serif" }}
          >
            PRASHNAKOSH
          </span>
          <span
            className={cn(
              "font-medium tracking-[0.25em] uppercase leading-tight",
              "text-[#C9A84C]",
              taglineSizes[size]
            )}
            style={{ fontFamily: "'Montserrat', 'Outfit', sans-serif" }}
          >
            Jignyasa
          </span>
          {showTagline && (
            <span className={cn("text-white/30 mt-1", taglineSizes[size])}>
              Knowledge &bull; Excellence &bull; Innovation
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function BrandMark({ size = "md", className }: { size?: BrandSize; className?: string }) {
  return (
    <div
      className={cn(
        "relative flex-shrink-0",
        "transition-transform hover:scale-105",
        logoSizes[size],
        className
      )}
      data-testid="brand-mark"
    >
      <img
        src={logoImage}
        alt="Prashnakosh"
        className="w-full h-full object-contain drop-shadow-lg"
        draggable={false}
      />
    </div>
  );
}

export function BrandFooter({ className }: { className?: string }) {
  const year = new Date().getFullYear();
  return (
    <div className={cn("flex flex-col items-center gap-1", className)} data-testid="brand-footer">
      <span className="text-white/30 text-sm">
        Powered by{" "}
        <span className="font-semibold text-[#C9A84C]/70">SmartGenEduX</span>
        {" "}&copy; {year}
      </span>
      <span className="text-[10px] uppercase tracking-[0.3em] text-white/15">
        Prashnakosh Beta
      </span>
    </div>
  );
}
