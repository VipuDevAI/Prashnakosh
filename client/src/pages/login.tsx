import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogIn, Loader2, Eye, EyeOff, Shield, FileText, BarChart3 } from "lucide-react";
import { BrandLogo, BrandFooter } from "@/components/BrandLogo";

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [schoolCode, setSchoolCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      navigate(user.role === "super_admin" ? "/superadmin/dashboard" : "/dashboard");
    }
  }, [isLoading, navigate, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!schoolCode.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolCode: schoolCode.trim(),
          email: email.trim(),
          password: password
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Invalid credentials. Please try again.");
      }
      
      const data = await response.json();
      login(data.user, data.token, data.expiresAt);
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060918]">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#060918] relative overflow-hidden" data-testid="login-page">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />

      {/* Left panel - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 xl:p-16">
        {/* Top branding */}
        <div>
          <BrandLogo size="xl" showTagline variant="default" />
        </div>

        {/* Center content */}
        <div className="flex-1 flex flex-col justify-center max-w-xl">
          <h2 className="text-4xl xl:text-5xl font-light text-white/90 leading-tight tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            The Academic
            <br />
            <span className="font-bold bg-gradient-to-r from-[#C9A84C] to-[#E8DCAA] bg-clip-text text-transparent">
              Assessment Engine
            </span>
          </h2>
          <p className="text-white/40 mt-6 text-lg leading-relaxed max-w-md">
            Build question banks. Create blueprints. Generate quarterly examination papers with precision.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 mt-10">
            {[
              { icon: <Shield className="w-4 h-4" />, label: "Department Isolation" },
              { icon: <FileText className="w-4 h-4" />, label: "Blueprint-Driven Papers" },
              { icon: <BarChart3 className="w-4 h-4" />, label: "Coverage Analytics" },
            ].map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/50 text-sm backdrop-blur-sm"
              >
                {f.icon}
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="text-white/20 text-sm">
          Trusted by Maharishi Vidya Mandir &amp; partner institutions
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[420px]">
          {/* Mobile branding */}
          <div className="lg:hidden flex flex-col items-center mb-10">
            <BrandLogo size="lg" variant="full" />
          </div>

          {/* Login card */}
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 sm:p-10" data-testid="login-card">
            <div className="mb-8">
              <h3 className="text-2xl font-semibold text-white tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Sign in
              </h3>
              <p className="text-white/40 mt-2 text-sm">
                Enter your credentials to access the platform
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" data-testid="login-form">
              {/* School Code */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
                  School Code
                </label>
                <Input
                  data-testid="login-school-code"
                  type="text"
                  placeholder="e.g. MVMCHN"
                  value={schoolCode}
                  onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                  className="h-12 bg-white/[0.06] border-white/[0.1] text-white placeholder:text-white/20 rounded-xl focus:border-[#C9A84C]/50 focus:ring-[#C9A84C]/20 transition-colors"
                  autoComplete="organization"
                  autoFocus
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
                  Email Address
                </label>
                <Input
                  data-testid="login-email"
                  type="email"
                  placeholder="you@school.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-white/[0.06] border-white/[0.1] text-white placeholder:text-white/20 rounded-xl focus:border-[#C9A84C]/50 focus:ring-[#C9A84C]/20 transition-colors"
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Input
                    data-testid="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-white/[0.06] border-white/[0.1] text-white placeholder:text-white/20 rounded-xl pr-12 focus:border-[#C9A84C]/50 focus:ring-[#C9A84C]/20 transition-colors"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm" data-testid="login-error">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                data-testid="login-submit-button"
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl text-base font-semibold text-[#0a0a1b] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #C9A84C 0%, #E8DCAA 50%, #C9A84C 100%)", boxShadow: "0 4px 20px rgba(201,168,76,0.3)" }}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Sign In
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-8">
            <BrandFooter />
          </div>
        </div>
      </div>
    </div>
  );
}
