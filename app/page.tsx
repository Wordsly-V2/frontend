import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
            Wordsly V2
          </h1>
          <p className="text-xl text-muted-foreground">
            Hệ thống màu sắc mới đã được áp dụng
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Demo Trang đăng nhập</CardTitle>
            <CardDescription>
              Xem trang đăng nhập với màu sắc mới
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/login">
              <Button className="w-full" size="lg">
                Xem trang đăng nhập
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🎨 Bảng màu chủ đạo</CardTitle>
            <CardDescription>
              Các màu brand được sử dụng trong ứng dụng
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 dark:from-purple-500 dark:to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg">
                  Primary
                </div>
                <p className="text-sm text-muted-foreground text-center">Màu chính</p>
              </div>
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 flex items-center justify-center text-white font-semibold shadow-lg">
                  Secondary
                </div>
                <p className="text-sm text-muted-foreground text-center">Màu phụ</p>
              </div>
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-gradient-to-br from-pink-600 to-pink-700 dark:from-pink-500 dark:to-pink-600 flex items-center justify-center text-white font-semibold shadow-lg">
                  Accent
                </div>
                <p className="text-sm text-muted-foreground text-center">Màu nhấn</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Demo Components</h3>
              <div className="flex flex-wrap gap-3">
                <Button>Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="ghost">Ghost Button</Button>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Demo Text Colors</h3>
              <div className="space-y-2">
                <p className="text-foreground">Foreground text - màu chữ chính</p>
                <p className="text-muted-foreground">Muted foreground - màu chữ phụ</p>
                <p className="text-primary">Primary text - màu chữ nhấn</p>
                <a href="#" className="text-primary hover:opacity-80 transition-opacity">
                  Link với primary color
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📝 Hướng dẫn thay đổi màu</CardTitle>
            <CardDescription>
              Cách thay đổi màu sắc cho toàn bộ ứng dụng
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">1. Mở file globals.css</h4>
              <code className="block bg-muted p-3 rounded-md text-sm">
                app/globals.css
              </code>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">2. Tìm phần :root và thay đổi brand colors</h4>
              <code className="block bg-muted p-3 rounded-md text-sm whitespace-pre">
{`--brand-primary: oklch(0.6 0.25 270);
--brand-secondary: oklch(0.65 0.22 250);
--brand-accent: oklch(0.7 0.2 320);`}
              </code>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">3. Xem file COLORS.md để biết thêm ví dụ</h4>
              <p className="text-sm text-muted-foreground">
                File COLORS.md chứa nhiều ví dụ bảng màu phổ biến và hướng dẫn chi tiết về OKLCH color space.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
