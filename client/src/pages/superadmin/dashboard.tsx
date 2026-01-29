import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Settings, HardDrive, LogOut, Shield, Users } from "lucide-react";

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!user || user.role !== "super_admin") {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user || user.role !== "super_admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Prashnakosh</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Super Admin Console</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 dark:text-slate-300">
              Welcome, <strong>{user.name}</strong>
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => { 
                logout(); 
                window.location.href = "/login";
              }}
              data-testid="btn-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white mb-6 shadow-lg shadow-indigo-500/30">
            <Shield className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Super Admin Dashboard
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            You are shaping the academic structure of every school. 
            <span className="block mt-2 font-medium text-indigo-600 dark:text-indigo-400">
              Configure once. Everything else flows automatically.
            </span>
          </p>
        </div>

        {/* Three Primary Buttons */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {/* Add School */}
          <Card 
            className="group cursor-pointer hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 border-2 hover:border-emerald-500/50 bg-white dark:bg-slate-900"
            onClick={() => navigate("/superadmin/schools")}
            data-testid="card-add-school"
          >
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/30">
                <Building2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Add School
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Onboard new schools
              </p>
              <div className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wide">
                Create • Edit • Delete
              </div>
            </CardContent>
          </Card>

          {/* Users Management */}
          <Card 
            className="group cursor-pointer hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 border-2 hover:border-orange-500/50 bg-white dark:bg-slate-900"
            onClick={() => navigate("/superadmin/users")}
            data-testid="card-users"
          >
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-white mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-orange-500/30">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Users
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Add users per school
              </p>
              <div className="mt-3 text-xs text-orange-600 dark:text-orange-400 font-medium uppercase tracking-wide">
                Teachers • Students • HOD
              </div>
            </CardContent>
          </Card>

          {/* Admin Settings */}
          <Card 
            className="group cursor-pointer hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 border-2 hover:border-blue-500/50 bg-white dark:bg-slate-900"
            onClick={() => navigate("/superadmin/settings")}
            data-testid="card-admin-settings"
          >
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/30">
                <Settings className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Admin Settings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure wings & exams
              </p>
              <div className="mt-3 text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">
                Wings • Exams • Structure
              </div>
            </CardContent>
          </Card>

          {/* S3 Storage */}
          <Card 
            className="group cursor-pointer hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 border-2 hover:border-purple-500/50 bg-white dark:bg-slate-900"
            onClick={() => navigate("/superadmin/storage")}
            data-testid="card-s3-storage"
          >
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 text-white mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/30">
                <HardDrive className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                S3 Storage
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Allocate storage buckets
              </p>
              <div className="mt-3 text-xs text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wide">
                Buckets • Folders • Mapping
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Footer */}
        <div className="mt-16 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            All configurations made here automatically apply to HOD, Teacher, and Student dashboards.
          </p>
        </div>
      </main>
    </div>
  );
}
