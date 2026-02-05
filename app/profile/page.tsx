'use client'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useUser } from "@/hooks/useUser.hook";

export default function ProfilePage() {
  const { profile: userProfile, isLoading, error, fetchProfile } = useUser();

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <LoadingSpinner size="lg" label="Đang tải thông tin tài khoản…" />
      </main>
    );
  }

  if (error) {
      return (
          <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
              <div>Error: {error}</div>
              <Button onClick={() => {
                  fetchProfile();
              }}>Thử lại</Button>
          </main>
      );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-pink-950/20 pt-8 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
            Thông tin cá nhân
          </h1>
          <p className="text-muted-foreground">
            Xem thông tin tài khoản của bạn
          </p>
        </div>

        {/* Avatar Card */}
        <Card className="border-border shadow-xl shadow-purple-500/10 dark:shadow-purple-500/5 backdrop-blur-sm bg-card/95">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full blur-md opacity-50" />
                <div className="relative rounded-full overflow-hidden border-4 border-background shadow-2xl">
                  <Avatar className="w-32 h-32">
                    <AvatarImage src={userProfile?.pictureUrl ?? ''} alt={userProfile?.displayName ?? ''}
                      loading='lazy'
                      crossOrigin='anonymous'
                      referrerPolicy='no-referrer'
                    />
                    <AvatarFallback>{userProfile?.displayName?.charAt(0) ?? ''}</AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-semibold">{userProfile?.displayName ?? ''}</h2>
                <p className="text-sm text-muted-foreground mt-1">{userProfile?.gmail ?? ''}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-border shadow-xl shadow-purple-500/10 dark:shadow-purple-500/5 backdrop-blur-sm bg-card/95">
          <CardHeader>
            <CardTitle>Chi tiết tài khoản</CardTitle>
            <CardDescription>
              Thông tin được đồng bộ từ tài khoản Google của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Display Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Tên hiển thị
              </Label>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-foreground font-medium">{userProfile?.displayName ?? ''}</p>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Email
              </Label>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-foreground font-medium">{userProfile?.gmail ?? ''}</p>
              </div>
            </div>

            {/* Info Notice */}
            <div className="mt-6 p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
              <div className="flex gap-3">
                <svg
                  className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    Thông tin chỉ đọc
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Các thông tin này được đồng bộ tự động từ tài khoản Google của bạn và không thể chỉnh sửa trực tiếp.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
