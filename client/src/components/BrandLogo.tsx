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

/* ------------------------------------------------------------------ */
/*  Size tokens                                                        */
/* ------------------------------------------------------------------ */

const circleSize: Record<BrandSize, number> = {
  xs: 36,
  sm: 44,
  md: 56,
  lg: 72,
  xl: 100,
  "2xl": 140,
};

const shieldPad: Record<BrandSize, number> = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 18,
  "2xl": 24,
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

/* ------------------------------------------------------------------ */
/*  Shared circular container for the shield                           */
/* ------------------------------------------------------------------ */

function ShieldCircle({ size }: { size: BrandSize }) {
  const circle = circleSize[size];
  const pad = shieldPad[size];
  const shield = circle - pad * 2;

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: circle, height: circle }}
    >
      {/* Glow ring */}
      <div
        className="absolute inset-0 rounded-full opacity-40 blur-md"
        style={{
          background: "radial-gradient(circle, rgba(99,132,255,0.5) 0%, rgba(59,40,160,0.3) 60%, transparent 80%)",
        }}
      />
      {/* Circle background */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "linear-gradient(145deg, #1a2342 0%, #0c1225 50%, #070d1a 100%)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5), 0 0 30px rgba(80,100,220,0.12), inset 0 1px 1px rgba(255,255,255,0.05)",
          border: "1px solid rgba(100,130,255,0.12)",
        }}
      />
      {/* Shield image */}
      <img
        src={logoImage}
        alt=""
        width={shield}
        height={shield}
        draggable={false}
        className="absolute object-contain drop-shadow-lg"
        style={{
          top: pad,
          left: pad,
          width: shield,
          height: shield,
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main BrandLogo                                                     */
/* ------------------------------------------------------------------ */

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
      <ShieldCircle size={size} />

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

/* ------------------------------------------------------------------ */
/*  BrandMark — icon only (sidebar collapsed, favicon)                 */
/* ------------------------------------------------------------------ */

export function BrandMark({ size = "md", className }: { size?: BrandSize; className?: string }) {
  return (
    <div className={cn("inline-flex", className)} data-testid="brand-mark">
      <ShieldCircle size={size} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */

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
