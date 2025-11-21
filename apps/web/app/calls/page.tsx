'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PhoneIncoming, PhoneOutgoing, Play, Trash2 } from 'lucide-react';

interface CallRecord {
  id: string;
  customerName: string;
  userName: string;
  phoneNumber: string;
  direction: 'incoming' | 'outgoing';
  startTime: string;
  endTime: string | null;
  duration: string | null;
  status: 'answered' | 'missed' | 'busy' | 'failed';
  notes: string | null;
  recordingUrl: string | null;
}

export default function CallsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filterDirection, setFilterDirection] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch calls
  const { data: callsData } = useQuery({
    queryKey: ['calls', page, filterDirection, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (filterDirection !== 'all') params.append('direction', filterDirection);
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const response: any = await apiClient.get(`/calls?${params}`);
      return response.data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response: any = await apiClient.delete(`/calls/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calls'] });
    },
  });

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      answered: 'bg-green-500',
      missed: 'bg-red-500',
      busy: 'bg-yellow-500',
      failed: 'bg-gray-500',
    };
    const labels: Record<string, string> = {
      answered: 'پاسخ داده شده',
      missed: 'از دست رفته',
      busy: 'مشغول',
      failed: 'ناموفق',
    };
    return <Badge className={colors[status] || 'bg-gray-500'}>{labels[status] || status}</Badge>;
  };

  const calls = callsData?.data || [];
  const meta = callsData?.meta || { page: 1, totalPages: 1 };

  return (
    <div className="p-8" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">تاریخچه تماس‌ها</h1>
      </div>

      <div className="flex gap-4 mb-6">
        <Select value={filterDirection} onValueChange={setFilterDirection}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="جهت تماس" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            <SelectItem value="incoming">ورودی</SelectItem>
            <SelectItem value="outgoing">خروجی</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="وضعیت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            <SelectItem value="answered">پاسخ داده شده</SelectItem>
            <SelectItem value="missed">از دست رفته</SelectItem>
            <SelectItem value="busy">مشغول</SelectItem>
            <SelectItem value="failed">ناموفق</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>جهت</TableHead>
              <TableHead>مشتری</TableHead>
              <TableHead>شماره تلفن</TableHead>
              <TableHead>کاربر</TableHead>
              <TableHead>زمان شروع</TableHead>
              <TableHead>مدت</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead>عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calls.map((call: CallRecord) => (
              <TableRow key={call.id}>
                <TableCell>
                  {call.direction === 'incoming' ? (
                    <PhoneIncoming className="h-4 w-4 text-green-600" />
                  ) : (
                    <PhoneOutgoing className="h-4 w-4 text-blue-600" />
                  )}
                </TableCell>
                <TableCell>{call.customerName}</TableCell>
                <TableCell className="font-mono" dir="ltr">
                  {call.phoneNumber}
                </TableCell>
                <TableCell>{call.userName}</TableCell>
                <TableCell>{new Date(call.startTime).toLocaleString('fa-IR')}</TableCell>
                <TableCell>{call.duration || '-'}</TableCell>
                <TableCell>{getStatusBadge(call.status)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {call.recordingUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(call.recordingUrl!, '_blank')}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(call.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        <Button variant="outline" onClick={() => setPage(page - 1)} disabled={page === 1}>
          قبلی
        </Button>
        <span className="py-2 px-4">
          صفحه {meta.page} از {meta.totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() => setPage(page + 1)}
          disabled={page === meta.totalPages}
        >
          بعدی
        </Button>
      </div>
    </div>
  );
}
