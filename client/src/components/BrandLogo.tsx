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
  xs: 36,
  sm: 46,
  md: 58,
  lg: 76,
  xl: 108,
  "2xl": 148,
};

const titleSize: Record<BrandSize, string> = {
  xs: "text-[11px]",
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-2xl",
  "2xl": "text-3xl",
};

const subSize: Record<BrandSize, string> = {
  xs: "text-[7px]",
  sm: "text-[8px]",
  md: "text-[9px]",
  lg: "text-[10px]",
  xl: "text-xs",
  "2xl": "text-sm",
};

const taglineSize: Record<BrandSize, string> = {
  xs: "text-[6px]",
  sm: "text-[7px]",
  md: "text-[8px]",
  lg: "text-[9px]",
  xl: "text-[10px]",
  "2xl": "text-xs",
};

function LogoImage({ size }: { size: BrandSize }) {
  const px = logoSizes[size];
  return (
    <img
      src={logoImage}
      alt="Prashnakosh"
      width={px}
      height={px}
      draggable={false}
      className="rounded-full flex-shrink-0 object-cover"
      style={{ width: px, height: px }}
    />
  );
}

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
        "flex items-center select-none",
        variant === "full" ? "flex-col text-center gap-3" : "gap-3",
        className
      )}
      data-testid="brand-logo"
    >
      <LogoImage size={size} />

      {showText && (
        <div className={cn(variant === "full" ? "text-center" : "flex flex-col justify-center min-w-0")}>
          <span
            className={cn(
              "font-bold tracking-[0.12em] leading-none whitespace-nowrap text-white",
              titleSize[size]
            )}
            style={{ fontFamily: "'Montserrat', 'Outfit', sans-serif" }}
          >
            PRASHNAKOSH
          </span>
          <span
            className={cn(
              "font-medium tracking-[0.25em] uppercase leading-none mt-1 whitespace-nowrap",
              "text-[#C9A84C]/80",
              subSize[size]
            )}
            style={{ fontFamily: "'Montserrat', 'Outfit', sans-serif" }}
          >
            JIGNYASA
          </span>
          {showTagline && (
            <span className={cn("text-white/25 mt-1.5 whitespace-nowrap", taglineSize[size])}>
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
    <div className={cn("inline-flex", className)} data-testid="brand-mark">
      <LogoImage size={size} />
    </div>
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
