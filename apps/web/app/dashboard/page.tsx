'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import ProtectedRoute from '@/components/protected-route';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Users, FileText, TrendingUp, Clock, CheckCircle } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response: any = await apiClient.get('/stats/dashboard');
      return response.data;
    },
  });

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold">سیستم مدیریت فاکتور</h1>
                <p className="text-sm text-muted-foreground">
                  خوش آمدید، {user?.fullName}
                </p>
              </div>
              <Button onClick={handleLogout} variant="outline">
                خروج
              </Button>
            </div>
            <nav className="mt-4 flex gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="text-sm"
              >
                داشبورد
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push('/customers')}
                className="text-sm"
              >
                مشتریان
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push('/documents')}
                className="text-sm"
              >
                اسناد
              </Button>
              {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'supervisor') && (
                <Button
                  variant="ghost"
                  onClick={() => router.push('/approvals')}
                  className="text-sm"
                >
                  تأییدیه‌ها
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => router.push('/calls')}
                className="text-sm"
              >
                تماس‌ها
              </Button>
            </nav>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">مشتریان فعال</p>
                  <p className="text-3xl font-bold">{stats?.customers?.active || 0}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    از {stats?.customers?.total || 0} مشتری
                  </p>
                </div>
                <Users className="h-12 w-12 text-blue-500 opacity-80" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">اسناد امروز</p>
                  <p className="text-3xl font-bold">{stats?.documents?.today || 0}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats?.documents?.thisMonth || 0} این ماه
                  </p>
                </div>
                <FileText className="h-12 w-12 text-green-500 opacity-80" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">در انتظار تایید</p>
                  <p className="text-3xl font-bold">{stats?.documents?.pendingApprovals || 0}</p>
                  <p className="text-xs text-muted-foreground mt-2">سند</p>
                </div>
                <Clock className="h-12 w-12 text-yellow-500 opacity-80" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">درآمد این ماه</p>
                  <p className="text-2xl font-bold">
                    {(stats?.revenue?.thisMonth || 0).toLocaleString('fa-IR')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">ریال</p>
                </div>
                <TrendingUp className="h-12 w-12 text-purple-500 opacity-80" />
              </div>
            </div>
          </div>

          {/* Recent Documents */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                آخرین اسناد
              </h2>
              <div className="space-y-3">
                {stats?.recentDocuments?.length > 0 ? (
                  stats.recentDocuments.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                      onClick={() => router.push(`/documents/${doc.id}`)}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{doc.documentNumber}</p>
                        <p className="text-sm text-muted-foreground">{doc.customerName}</p>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">
                          {doc.finalAmount.toLocaleString('fa-IR')} ریال
                        </p>
                        <div className="flex gap-1 mt-1">
                          {doc.approvalStatus === 'approved' && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {doc.approvalStatus === 'pending' && (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    هیچ سندی یافت نشد
                  </p>
                )}
              </div>
            </div>

            {/* Documents by Type */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                اسناد به تفکیک نوع
              </h2>
              <div className="space-y-3">
                {stats?.documentsByType?.length > 0 ? (
                  stats.documentsByType.map((item: any) => (
                    <div
                      key={item.type}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <p className="font-medium">
                        {item.type === 'invoice'
                          ? 'فاکتور'
                          : item.type === 'quote'
                          ? 'پیش‌فاکتور'
                          : item.type === 'receipt'
                          ? 'رسید'
                          : 'سایر'}
                      </p>
                      <p className="text-2xl font-bold">{item.count}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    هیچ سندی یافت نشد
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">اطلاعات کاربر</h2>
            <div className="space-y-2">
              <p>
                <span className="font-medium">نام:</span> {user?.fullName}
              </p>
              <p>
                <span className="font-medium">نام کاربری:</span> {user?.username}
              </p>
              <p>
                <span className="font-medium">نقش:</span> {user?.role}
              </p>
              <p>
                <span className="font-medium">وضعیت:</span>{' '}
                {user?.isActive ? 'فعال' : 'غیرفعال'}
              </p>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
