import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useSchoolContext } from "@/lib/school-context";
import { PageLayout, PageHeader, PageContent, ContentCard } from "@/components/page-layout";
import { RequireSchoolSelection } from "@/components/school-switcher";
import { CoinButton } from "@/components/coin-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowLeft, HardDrive, RefreshCw, Image, FileText, BookOpen } from "lucide-react";

interface StorageUsage {
  tenantId: string;
  totalBytes: number;
  questionImageBytes: number;
  uploadFileBytes: number;
  referenceFileBytes: number;
  lastCalculatedAt: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function StorageGovernancePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { selectedSchool } = useSchoolContext();

  useEffect(() => {
    if (user && user.role !== "super_admin") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  if (!user || user.role !== "super_admin") {
    return null;
  }

  const { data: usage, isLoading } = useQuery<StorageUsage>({
    queryKey: ["/api/admin/storage-usage", selectedSchool?.id],
    queryFn: async () => {
      if (!selectedSchool) return null;
      const response = await fetch(`/api/admin/storage-usage?tenantId=${selectedSchool.id}`);
      return response.json();
    },
    enabled: !!selectedSchool,
  });

  const recalculateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/storage-usage/recalculate", {
        tenantId: selectedSchool?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Storage Usage Recalculated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/storage-usage"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const totalBytes = usage?.totalBytes || 0;
  const maxBytes = 1024 * 1024 * 1024; // 1 GB limit for display
  const usagePercent = Math.min((totalBytes / maxBytes) * 100, 100);

  return (
    <PageLayout>
      <PageHeader
        title="Storage Governance"
        subtitle="Monitor and manage storage usage per school"
        actions={
          <Button variant="ghost" onClick={() => navigate("/dashboard")} data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        }
      />
      <PageContent>
        <RequireSchoolSelection>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="md:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <HardDrive className="w-5 h-5" />
                        Total Storage Usage
                      </CardTitle>
                      <CardDescription>
                        Storage consumption for {selectedSchool?.name}
                      </CardDescription>
                    </div>
                    <CoinButton
                      color="blue"
                      onClick={() => recalculateMutation.mutate()}
                      disabled={recalculateMutation.isPending}
                      data-testid="button-recalculate"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${recalculateMutation.isPending ? "animate-spin" : ""}`} />
                      Recalculate
                    </CoinButton>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>{formatBytes(totalBytes)} used</span>
                    <span className="text-muted-foreground">of {formatBytes(maxBytes)}</span>
                  </div>
                  <Progress value={usagePercent} className="h-3" />
                  {usage?.lastCalculatedAt && (
                    <p className="text-xs text-muted-foreground">
                      Last calculated: {new Date(usage.lastCalculatedAt).toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Image className="w-4 h-4 text-blue-500" />
                    Question Images
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {formatBytes(usage?.questionImageBytes || 0)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Images attached to questions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="w-4 h-4 text-green-500" />
                    Upload Files
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {formatBytes(usage?.uploadFileBytes || 0)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    CSV/XLSX bulk uploads
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BookOpen className="w-4 h-4 text-purple-500" />
                    Reference Library
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {formatBytes(usage?.referenceFileBytes || 0)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Previous papers & study materials
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">S3 Configuration</CardTitle>
                  <CardDescription>Cloud storage settings (read-only)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Storage Provider</span>
                    <span>AWS S3 / Compatible</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tenant Path Isolation</span>
                    <span className="text-green-600">Enabled</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Signed URLs</span>
                    <span className="text-green-600">Enabled</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Server-Side Encryption</span>
                    <span className="text-green-600">AES-256</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </RequireSchoolSelection>
      </PageContent>
    </PageLayout>
  );
}
