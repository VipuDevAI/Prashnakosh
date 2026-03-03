import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { loginSchema, type LoginInput } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LogIn, Loader2, School, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { BRAND } from "@/lib/brand";

export default function LoginPage() {
  const [location, navigate] = useLocation();
  const { user, login, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === "super_admin") {
        navigate("/superadmin");
      } else {
        navigate("/dashboard");
      }
    }
  }, [isAuthenticated, isLoading, navigate, user]);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      schoolCode: "",
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginInput) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data: any) => {
      if (!data || !data.user) {
        toast({
          title: "Login Failed",
          description: "Invalid response from server",
          variant: "destructive",
        });
        return;
      }
      login(data.user, data.token);
      
      if (data.user.mustChangePassword) {
        toast({
          title: "Password Change Required",
          description: "Please change your password to continue",
        });
        navigate("/change-password");
        return;
      }
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${data.user.name}`,
      });
      
      if (data.user.role === "super_admin") {
        navigate("/superadmin");
      } else {
        navigate("/dashboard");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginInput) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen cosmic-bg flex flex-col items-center justify-center p-4 relative">
      {/* Animated gradient orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-500/30 to-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-gradient-to-br from-purple-500/25 to-pink-500/20 rounded-full blur-3xl" style={{ animation: 'pulse 4s ease-in-out infinite' }} />
        <div className="absolute -bottom-40 left-1/3 w-80 h-80 bg-gradient-to-br from-orange-500/25 to-yellow-500/20 rounded-full blur-3xl" style={{ animation: 'pulse 5s ease-in-out infinite 1s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8" data-testid="img-logo">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse" />
            <img 
              src={BRAND.logo} 
              alt={BRAND.name}
              className="relative w-28 h-28 rounded-full object-cover ring-4 ring-white/20 shadow-2xl"
              style={{ animation: 'float 3s ease-in-out infinite' }}
            />
          </div>
          <h1 className="text-4xl font-bold gradient-text tracking-tight">
            {BRAND.name.toUpperCase()}
          </h1>
          <p className="text-cyan-300/80 mt-2 text-lg font-medium tracking-widest uppercase">
            {BRAND.tagline}
          </p>
        </div>

        {/* Login Card with Gradient Border */}
        <div className="gradient-border-card p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Sign In</h2>
            <p className="text-gray-400">Enter your school code and credentials</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="schoolCode"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <School className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                        <input
                          {...field}
                          placeholder="School Code"
                          className="input-cosmic w-full pl-12 pr-4"
                          data-testid="input-school-code"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-pink-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                        <input
                          {...field}
                          type="email"
                          placeholder="Enter your email"
                          className="input-cosmic w-full pl-12 pr-4"
                          data-testid="input-email"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-pink-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-400" />
                        <input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          className="input-cosmic w-full pl-12 pr-12"
                          data-testid="input-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-pink-400" />
                  </FormItem>
                )}
              />

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="gradient-btn-warm w-full flex items-center justify-center gap-2 text-lg mt-8"
                data-testid="button-login"
              >
                {loginMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </>
                )}
              </button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm">
              Forgot Password?
            </a>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-gray-500 text-sm">
          <span>© 2025 {BRAND.name}. All rights reserved.</span>
        </footer>
      </div>

      {/* Floating particles effect */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
