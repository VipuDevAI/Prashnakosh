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

const logoSizes: Record<BrandSize, number> = {
  xs: 34,
  sm: 42,
  md: 52,
  lg: 64,
  xl: 96,
  "2xl": 128,
};

const textSizes: Record<BrandSize, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-2xl",
  "2xl": "text-3xl",
};

const subTextSizes: Record<BrandSize, string> = {
  xs: "text-[8px]",
  sm: "text-[9px]",
  md: "text-[10px]",
  lg: "text-xs",
  xl: "text-sm",
  "2xl": "text-base",
};

export function BrandLogo({
  size = "md",
  showText = true,
  showTagline = false,
  className,
  variant = "default",
}: BrandLogoProps) {
  const px = logoSizes[size];

  return (
    <div
      className={cn(
        "flex items-center select-none",
        variant === "full" ? "flex-col text-center gap-3" : "gap-3",
        className
      )}
      data-testid="brand-logo"
    >
      <img
        src={logoImage}
        alt="Prashnakosh"
        width={px}
        height={px}
        className="flex-shrink-0 object-contain"
        draggable={false}
        style={{ width: px, height: px }}
      />
      {showText && (
        <div className={cn(variant === "full" ? "text-center" : "flex flex-col justify-center min-w-0")}>
          <span
            className={cn(
              "font-bold tracking-wide leading-none whitespace-nowrap",
              "text-white",
              textSizes[size]
            )}
            style={{ fontFamily: "'Montserrat', 'Outfit', sans-serif" }}
          >
            PRASHNAKOSH
          </span>
          {showTagline && (
            <span className={cn("text-white/25 mt-1 whitespace-nowrap", subTextSizes[size])}>
              Knowledge &bull; Excellence &bull; Innovation
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function BrandMark({ size = "md", className }: { size?: BrandSize; className?: string }) {
  const px = logoSizes[size];
  return (
    <img
      src={logoImage}
      alt="Prashnakosh"
      width={px}
      height={px}
      className={cn("flex-shrink-0 object-contain", className)}
      draggable={false}
      style={{ width: px, height: px }}
      data-testid="brand-mark"
    />
  );
}

export function BrandFooter({ className }: { className?: string }) {
  const year = new Date().getFullYear();
  return (
    <div className={cn("flex flex-col items-center gap-0.5", className)} data-testid="brand-footer">
      <span className="text-white/25 text-xs">
        Powered by{" "}
        <span className="font-semibold text-[#C9A84C]/60">SmartGenEduX</span>
        {" "}&copy; {year}
      </span>
      <span className="text-[9px] uppercase tracking-[0.3em] text-white/12 font-medium">
        Prashnakosh Beta
      </span>
    </div>
  );
}
