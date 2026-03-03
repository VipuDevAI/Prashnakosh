import { BRAND } from "@/lib/brand";

interface AppLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-10",
  md: "h-12",
  lg: "h-14",
  xl: "h-20",
};

export function AppLogo({ size = "md", showText = false, className = "" }: AppLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img 
        src={BRAND.logo} 
        alt={BRAND.name}
        className={`${sizeClasses[size]} object-contain`}
      />
    </div>
  );
}
