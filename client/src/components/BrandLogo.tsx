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
  xs: "w-6 h-6",
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-14 h-14",
  xl: "w-20 h-20",
  "2xl": "w-28 h-28",
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
          "relative rounded-full overflow-hidden flex-shrink-0",
          "shadow-[0_2px_12px_rgba(0,0,0,0.2)]",
          "ring-1 ring-white/10",
          "transition-transform hover:scale-105",
          logoSizes[size]
        )}
      >
        <img
          src={logoImage}
          alt="Prashnakosh"
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>
      {showText && (
        <div className={cn(variant === "full" ? "text-center" : "flex flex-col")}>
          <span
            className={cn(
              "font-semibold text-[#D4AF37] tracking-tight leading-tight",
              textSizes[size]
            )}
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            प्रश्नकोश
          </span>
          <span
            className={cn(
              "font-medium text-white/80 tracking-tight leading-tight",
              taglineSizes[size]
            )}
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Prashnakosh
          </span>
          {showTagline && (
            <span className={cn("text-white/30 mt-0.5", taglineSizes[size])}>
              Jignyasa &bull; Knowledge &bull; Excellence
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
        "relative rounded-full overflow-hidden flex-shrink-0",
        "shadow-[0_2px_12px_rgba(0,0,0,0.2)]",
        "ring-1 ring-white/10",
        "transition-transform hover:scale-105",
        logoSizes[size],
        className
      )}
      data-testid="brand-mark"
    >
      <img
        src={logoImage}
        alt="Prashnakosh"
        className="w-full h-full object-cover"
        draggable={false}
      />
    </div>
  );
}

export function BrandFooter({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-1", className)} data-testid="brand-footer">
      <span className="text-white/30 text-sm">
        Powered by{" "}
        <span className="font-semibold text-[#D4AF37]/60">SmartGenEduX</span>
        {" "}@ 2026
      </span>
      <span className="text-[10px] uppercase tracking-widest text-white/15">
        Prashnakosh Beta
      </span>
    </div>
  );
}
