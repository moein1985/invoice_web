'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, FileText } from 'lucide-react';
import type { Document, ConversionChainItem } from '@/types/document';

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const documentId = params.id as string;

  // Fetch document details
  const { data: document, isLoading } = useQuery<Document>({
    queryKey: ['document', documentId],
    queryFn: () => apiClient.get(`/documents/${documentId}`),
  });

  // Fetch conversion chain
  const { data: conversionChain } = useQuery<ConversionChainItem[]>({
    queryKey: ['conversion-chain', documentId],
    queryFn: () => apiClient.get(`/documents/${documentId}/conversion-chain`),
    enabled: !!document?.convertedFromId,
  });

  // Convert mutation
  const convertMutation = useMutation({
    mutationFn: () => apiClient.post(`/documents/${documentId}/convert`),
    onSuccess: (newDoc: any) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      alert(`سند با موفقیت تبدیل شد: ${newDoc.documentNumber}`);
      router.push(`/documents/${newDoc.id}`);
    },
  });

  // Request approval mutation
  const requestApprovalMutation = useMutation({
    mutationFn: () => apiClient.post(`/documents/${documentId}/request-approval`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      alert('درخواست تأیید با موفقیت ارسال شد');
    },
  });

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
      not_required: 'outline',
    };
    const labels: Record<string, string> = {
      pending: 'در انتظار تأیید',
      approved: 'تأیید شده',
      rejected: 'رد شده',
      not_required: 'نیاز به تأیید ندارد',
    };
    return <Badge variant={variants[status] || 'outline'}>{labels[status] || status}</Badge>;
  };

  const canConvert = () => {
    if (!document) return false;
    if (document.documentType === 'temp_proforma') {
      return !document.requiresApproval || document.approvalStatus === 'approved';
    }
    return ['temp_proforma', 'proforma'].includes(document.documentType);
  };

  const getNextDocumentType = () => {
    if (!document) return '';
    const map: Record<string, string> = {
      temp_proforma: 'proforma',
      proforma: 'invoice',
    };
    return map[document.documentType] || '';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">در حال بارگذاری...</div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">سند یافت نشد</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 ml-2" />
            بازگشت
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{document.documentNumber}</h1>
            <p className="text-muted-foreground">{getDocumentTypeLabel(document.documentType)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canConvert() && (
            <Button
              onClick={() => {
                if (confirm(`آیا می‌خواهید این سند را به ${getDocumentTypeLabel(getNextDocumentType())} تبدیل کنید؟`)) {
                  convertMutation.mutate();
                }
              }}
              disabled={convertMutation.isPending}
            >
              <RefreshCw className="h-4 w-4 ml-2" />
              تبدیل به {getDocumentTypeLabel(getNextDocumentType())}
            </Button>
          )}

          {document.requiresApproval && document.approvalStatus === 'pending' && (
            <Button
              variant="outline"
              onClick={() => {
                if (confirm('آیا می‌خواهید درخواست تأیید مجدد ارسال کنید؟')) {
                  requestApprovalMutation.mutate();
                }
              }}
              disabled={requestApprovalMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 ml-2" />
              درخواست تأیید
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Document Info */}
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات سند</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">مشتری</p>
                  <p className="font-semibold">{document.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">تاریخ صدور</p>
                  <p className="font-semibold">{new Date(document.issueDate).toLocaleDateString('fa-IR')}</p>
                </div>
                {document.dueDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">تاریخ سررسید</p>
                    <p className="font-semibold">{new Date(document.dueDate).toLocaleDateString('fa-IR')}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">وضعیت تأیید</p>
                  <div className="mt-1">{getApprovalStatusBadge(document.approvalStatus)}</div>
                </div>
              </div>

              {document.approvedBy && (
                <div>
                  <p className="text-sm text-muted-foreground">تأیید کننده</p>
                  <p className="font-semibold">{document.approvedByName || document.approvedBy}</p>
                  <p className="text-xs text-muted-foreground">
                    {document.approvedAt && new Date(document.approvedAt).toLocaleString('fa-IR')}
                  </p>
                </div>
              )}

              {document.rejectionReason && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-sm font-semibold text-red-900">دلیل رد:</p>
                  <p className="text-sm text-red-800">{document.rejectionReason}</p>
                </div>
              )}

              {document.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">یادداشت‌ها</p>
                  <p className="text-sm">{document.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>آیتم‌ها</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {document.items?.map((item, index) => (
                  <div key={item.id || index} className="border-b pb-3 last:border-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold">{item.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} × {formatCurrency(item.unitPrice)} ریال
                        </p>
                        {item.purchasePrice && item.purchasePrice > 0 && (
                          <p className="text-xs text-muted-foreground">
                            قیمت خرید: {formatCurrency(item.purchasePrice)} | 
                            سود: {formatCurrency((item.profitAmount || 0))} ({item.profitPercentage}%)
                          </p>
                        )}
                      </div>
                      <p className="font-bold">{formatCurrency(item.totalPrice)} ریال</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>جمع کل:</span>
                  <span className="font-semibold">{formatCurrency(document.totalAmount)} ریال</span>
                </div>
                {document.discountAmount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>تخفیف:</span>
                    <span className="font-semibold">{formatCurrency(document.discountAmount)} ریال</span>
                  </div>
                )}
                {document.totalProfitAmount && document.totalProfitAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>سود کل:</span>
                    <span className="font-semibold">{formatCurrency(document.totalProfitAmount)} ریال</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg">
                  <span className="font-bold">مبلغ نهایی:</span>
                  <span className="font-bold">{formatCurrency(document.finalAmount)} ریال</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Conversion Chain */}
          {conversionChain && conversionChain.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  زنجیره تبدیل
                </CardTitle>
                <CardDescription>مسیر تبدیل این سند</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {conversionChain.map((item, index) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${index === conversionChain.length - 1 ? 'bg-primary' : 'bg-gray-400'}`} />
                        {index < conversionChain.length - 1 && (
                          <div className="w-0.5 h-8 bg-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <p className="font-semibold text-sm">{item.documentNumber}</p>
                        <p className="text-xs text-muted-foreground">{getDocumentTypeLabel(item.documentType)}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(item.finalAmount)} ریال</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Created By */}
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات ایجاد</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">ایجاد شده توسط</p>
                <p className="font-semibold">{document.createdByName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">تاریخ ایجاد</p>
                <p className="font-semibold">{new Date(document.createdAt).toLocaleString('fa-IR')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">آخرین بروزرسانی</p>
                <p className="font-semibold">{new Date(document.updatedAt).toLocaleString('fa-IR')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
