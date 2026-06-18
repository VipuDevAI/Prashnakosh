import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { loginSchema, type LoginInput } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LogIn, Loader2, Shield, BookOpen, GraduationCap } from "lucide-react";

export default function LoginPage() {
  const [location, navigate] = useLocation();
  const { user, login, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === "super_admin") {
        navigate("/superadmin");
      } else {
        navigate("/dashboard");
      }
    }
  }, [isAuthenticated, isLoading, navigate, user]);

  // Show session expired toast if redirected
  useEffect(() => {
    if (window.location.search.includes("expired=1")) {
      toast({ title: "Session expired", description: "Please log in again to continue.", variant: "destructive" });
      window.history.replaceState({}, "", "/");
    }
  }, [toast]);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { schoolCode: "", email: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginInput) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data: any) => {
      if (!data?.user) {
        toast({ title: "Login failed", description: data?.error || "Invalid credentials", variant: "destructive" });
        return;
      }
      login(data.user, data.token, data.expiresAt);
      toast({ title: "Welcome back!", description: `Logged in as ${data.user.name}` });
    },
    onError: (error: any) => {
      toast({ title: "Login failed", description: error.message || "Please check your credentials", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center cosmic-bg">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen cosmic-bg relative overflow-hidden flex" data-testid="login-page">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#4F46E5]/8 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#9333EA]/8 blur-[100px] animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-[#D4AF37]/5 blur-[80px] animate-pulse" style={{ animationDelay: "4s" }} />
      </div>

      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 z-10">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#9333EA] flex items-center justify-center shadow-lg shadow-[#4F46E5]/20">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-light tracking-tight text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                <span className="text-[#D4AF37] font-semibold">Prashnakosh</span>
              </h1>
            </div>
          </div>
          <p className="text-5xl font-light text-white/90 mt-8 leading-tight tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <span className="text-[#D4AF37]">Jignyasa</span> &bull; Knowledge &bull; Excellence
          </p>
          <p className="text-lg text-white/50 mt-4 max-w-lg leading-relaxed">
            The premium academic assessment platform for schools and educational institutions. Create, manage, and deliver examinations with precision.
          </p>
        </div>

        <div className="space-y-6">
          {[
            { icon: <Shield className="w-5 h-5" />, title: "Secure Question Bank", desc: "Department-isolated, role-based access control" },
            { icon: <BookOpen className="w-5 h-5" />, title: "Blueprint-Driven Papers", desc: "Generate Set A/B/C with lesson-balanced distribution" },
            { icon: <GraduationCap className="w-5 h-5" />, title: "Online Mock Tests", desc: "Auto-graded assessments with instant results" },
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
              <div className="p-2.5 rounded-lg bg-[#4F46E5]/10 text-[#818CF8] flex-shrink-0">{f.icon}</div>
              <div>
                <h3 className="text-white font-medium text-sm">{f.title}</h3>
                <p className="text-white/40 text-xs mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-white/30 text-xs">
          Secure &bull; Reliable &bull; Built for Education
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-md" data-testid="login-form-container">
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#9333EA] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#4F46E5]/20">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-light text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              <span className="text-[#D4AF37] font-semibold">Prashnakosh</span>
            </h1>
            <p className="text-white/40 text-sm mt-1">Jignyasa &bull; Knowledge &bull; Excellence</p>
          </div>

          {/* Glass login card */}
          <div className="glass-card p-8 space-y-6" data-testid="login-card">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Welcome Back
              </h2>
              <p className="text-white/40 text-sm mt-1">Sign in to your account</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-5" data-testid="login-form">
                <FormField
                  control={form.control}
                  name="schoolCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/60 text-xs uppercase tracking-wider">School Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter school code"
                          className="bg-white/[0.05] border-white/10 text-white placeholder:text-white/25 h-11 rounded-lg focus:border-[#4F46E5] focus:ring-[#4F46E5]/20"
                          data-testid="login-school-code"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/60 text-xs uppercase tracking-wider">Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="Enter your email"
                          className="bg-white/[0.05] border-white/10 text-white placeholder:text-white/25 h-11 rounded-lg focus:border-[#4F46E5] focus:ring-[#4F46E5]/20"
                          data-testid="login-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/60 text-xs uppercase tracking-wider">Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Enter your password"
                          className="bg-white/[0.05] border-white/10 text-white placeholder:text-white/25 h-11 rounded-lg focus:border-[#4F46E5] focus:ring-[#4F46E5]/20"
                          data-testid="login-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full h-12 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:from-[#6366F1] hover:to-[#818CF8] text-white font-semibold rounded-lg shadow-lg shadow-[#4F46E5]/25 transition-all duration-300 hover:shadow-[#4F46E5]/40 hover:-translate-y-0.5"
                  data-testid="login-submit-button"
                >
                  {loginMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-5 h-5 mr-2" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 space-y-1">
            <p className="text-white/20 text-xs">
              Powered by{" "}
              <span className="text-[#D4AF37]/60 font-medium">SmartGenEduX</span>
              {" "}@ 2026
            </p>
            <p className="text-white/15 text-[10px] uppercase tracking-widest">Prashnakosh Beta</p>
          </div>
        </div>
      </div>
    </div>
  );
}
