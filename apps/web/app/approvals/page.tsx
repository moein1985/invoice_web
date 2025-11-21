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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Eye, Clock, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PaginatedDocuments, Document } from '@/types/document';

export default function ApprovalsPage() {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const queryClient = useQueryClient();

  // Fetch pending approvals
  const { data: pendingData, isLoading: pendingLoading } = useQuery<PaginatedDocuments>({
    queryKey: ['approvals', 'pending'],
    queryFn: () => apiClient.get('/documents/approvals/pending'),
  });

  // Fetch approval history
  const { data: historyData, isLoading: historyLoading } = useQuery<PaginatedDocuments>({
    queryKey: ['approvals', 'history'],
    queryFn: () => apiClient.get('/documents/approvals/history'),
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (documentId: string) =>
      apiClient.post(`/documents/${documentId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      setSelectedDocument(null);
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ documentId, reason }: { documentId: string; reason: string }) =>
      apiClient.post(`/documents/${documentId}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      setSelectedDocument(null);
      setShowRejectDialog(false);
      setRejectionReason('');
    },
  });

  const handleApprove = (document: Document) => {
    if (confirm(`آیا مطمئن هستید که می‌خواهید سند ${document.documentNumber} را تأیید کنید؟`)) {
      approveMutation.mutate(document.id);
    }
  };

  const handleRejectClick = (document: Document) => {
    setSelectedDocument(document);
    setShowRejectDialog(true);
  };

  const handleRejectSubmit = () => {
    if (!selectedDocument || !rejectionReason.trim() || rejectionReason.length < 10) {
      alert('لطفاً دلیل رد را وارد کنید (حداقل 10 کاراکتر)');
      return;
    }
    rejectMutation.mutate({
      documentId: selectedDocument.id,
      reason: rejectionReason,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount);
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      temp_proforma: 'پیش‌فاکتور موقت',
      proforma: 'پیش‌فاکتور',
      invoice: 'فاکتور',
      return_invoice: 'فاکتور برگشتی',
      receipt: 'رسید',
      other: 'سایر',
    };
    return labels[type] || type;
  };

  const getApprovalStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
    };
    const labels: Record<string, string> = {
      pending: 'در انتظار تأیید',
      approved: 'تأیید شده',
      rejected: 'رد شده',
    };
    return <Badge variant={variants[status] || 'outline'}>{labels[status] || status}</Badge>;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">تأییدیه‌ها</h1>
          <p className="text-muted-foreground">مدیریت درخواست‌های تأیید اسناد</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">در انتظار تأیید</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingData?.meta.total || 0}</div>
            <p className="text-xs text-muted-foreground">اسناد نیازمند تأیید شما</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تأیید شده</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {historyData?.data.filter((d) => d.approvalStatus === 'approved').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">اسناد تأیید شده توسط شما</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">رد شده</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {historyData?.data.filter((d) => d.approvalStatus === 'rejected').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">اسناد رد شده توسط شما</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            در انتظار تأیید ({pendingData?.meta.total || 0})
          </TabsTrigger>
          <TabsTrigger value="history">
            تاریخچه ({historyData?.meta.total || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingLoading ? (
            <div className="text-center py-8">در حال بارگذاری...</div>
          ) : !pendingData?.data.length ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>هیچ سند در انتظار تأییدی وجود ندارد</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>شماره سند</TableHead>
                    <TableHead>نوع</TableHead>
                    <TableHead>مشتری</TableHead>
                    <TableHead>تاریخ صدور</TableHead>
                    <TableHead className="text-right">مبلغ کل (ریال)</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead className="text-center">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingData.data.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell className="font-medium">{document.documentNumber}</TableCell>
                      <TableCell>{getDocumentTypeLabel(document.documentType)}</TableCell>
                      <TableCell>{document.customerName || '-'}</TableCell>
                      <TableCell>{new Date(document.issueDate).toLocaleDateString('fa-IR')}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(document.finalAmount)}
                      </TableCell>
                      <TableCell>{getApprovalStatusBadge(document.approvalStatus)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(document)}
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            تأیید
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectClick(document)}
                            disabled={rejectMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            رد
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {historyLoading ? (
            <div className="text-center py-8">در حال بارگذاری...</div>
          ) : !historyData?.data.length ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>تاریخچه‌ای برای نمایش وجود ندارد</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>شماره سند</TableHead>
                    <TableHead>نوع</TableHead>
                    <TableHead>مشتری</TableHead>
                    <TableHead className="text-right">مبلغ (ریال)</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>تاریخ تأیید/رد</TableHead>
                    <TableHead>دلیل رد</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyData.data.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell className="font-medium">{document.documentNumber}</TableCell>
                      <TableCell>{getDocumentTypeLabel(document.documentType)}</TableCell>
                      <TableCell>{document.customerName || '-'}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(document.finalAmount)}
                      </TableCell>
                      <TableCell>{getApprovalStatusBadge(document.approvalStatus)}</TableCell>
                      <TableCell>
                        {document.approvedAt
                          ? new Date(document.approvedAt).toLocaleDateString('fa-IR')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {document.rejectionReason || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رد سند {selectedDocument?.documentNumber}</DialogTitle>
            <DialogDescription>
              لطفاً دلیل رد سند را وارد کنید (حداقل 10 کاراکتر)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">دلیل رد</Label>
              <Textarea
                id="reason"
                placeholder="دلیل رد سند را به طور کامل توضیح دهید..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                {rejectionReason.length} / حداقل 10 کاراکتر
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              انصراف
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={rejectMutation.isPending || rejectionReason.length < 10}
            >
              {rejectMutation.isPending ? 'در حال ارسال...' : 'رد سند'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
