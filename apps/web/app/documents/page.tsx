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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, Check, X, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DocumentItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

interface Document {
  id: string;
  documentNumber: string;
  documentType: string;
  customerId: string;
  customerName: string;
  issueDate: string;
  dueDate: string | null;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: string;
  approvalStatus: string;
  createdByName: string;
  items: DocumentItem[];
}

interface Customer {
  id: string;
  name: string;
}

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [formData, setFormData] = useState({
    documentType: 'temp_proforma',
    customerId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    discountAmount: 0,
    defaultProfitPercentage: 20,
    notes: '',
    attachment: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, purchasePrice: 0, profitPercentage: 20 }] as DocumentItem[],
  });

  // Fetch documents
  const { data: documentsData } = useQuery({
    queryKey: ['documents', page, filterType, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (filterType !== 'all') params.append('documentType', filterType);
      if (filterStatus !== 'all') params.append('approvalStatus', filterStatus);
      
      const response: any = await apiClient.get(`/documents?${params}`);
      return response.data;
    },
  });

  // Fetch customers
  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const response: any = await apiClient.get('/customers?limit=1000');
      return response.data;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response: any = await apiClient.post('/documents', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response: any = await apiClient.patch(`/documents/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setIsDialogOpen(false);
      setSelectedDocument(null);
      resetForm();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response: any = await apiClient.delete(`/documents/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setIsDeleteDialogOpen(false);
      setSelectedDocument(null);
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response: any = await apiClient.post(`/documents/${id}/approve`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const response: any = await apiClient.post(`/documents/${id}/reject`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const resetForm = () => {
    setFormData({
      documentType: 'temp_proforma',
      customerId: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      discountAmount: 0,
      defaultProfitPercentage: 20,
      notes: '',
      attachment: '',
      items: [{ description: '', quantity: 1, unitPrice: 0, purchasePrice: 0, profitPercentage: 20 }],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDocument) {
      updateMutation.mutate({ id: selectedDocument.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (document: Document) => {
    setSelectedDocument(document);
    setFormData({
      documentType: document.documentType,
      customerId: document.customerId,
      issueDate: document.issueDate,
      dueDate: document.dueDate || '',
      discountAmount: document.discountAmount,
      items: document.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (document: Document) => {
    setSelectedDocument(document);
    setIsDeleteDialogOpen(true);
  };

  const handleView = (document: Document) => {
    setSelectedDocument(document);
    setIsViewDialogOpen(true);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unitPrice: 0, purchasePrice: 0, profitPercentage: formData.defaultProfitPercentage || 20 }],
    });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index: number, field: keyof DocumentItem, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const calculateFinal = () => {
    return calculateTotal() - formData.discountAmount;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-500',
      sent: 'bg-blue-500',
      paid: 'bg-green-500',
      cancelled: 'bg-red-500',
    };
    return <Badge className={colors[status] || 'bg-gray-500'}>{status}</Badge>;
  };

  const getApprovalBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      approved: 'bg-green-500',
      rejected: 'bg-red-500',
    };
    return <Badge className={colors[status] || 'bg-gray-500'}>{status}</Badge>;
  };

  const documents = documentsData?.data || [];
  const customers = customersData?.data || [];
  const meta = documentsData?.meta || { page: 1, totalPages: 1 };

  return (
    <div className="p-8" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">مدیریت اسناد</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="ml-2 h-4 w-4" />
          سند جدید
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="نوع سند" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            <SelectItem value="temp_proforma">پیش‌فاکتور موقت</SelectItem>
            <SelectItem value="proforma">پیش‌فاکتور</SelectItem>
            <SelectItem value="invoice">فاکتور</SelectItem>
            <SelectItem value="return_invoice">فاکتور برگشتی</SelectItem>
            <SelectItem value="receipt">رسید</SelectItem>
            <SelectItem value="other">سایر</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="وضعیت تایید" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            <SelectItem value="pending">در انتظار</SelectItem>
            <SelectItem value="approved">تایید شده</SelectItem>
            <SelectItem value="rejected">رد شده</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>شماره سند</TableHead>
              <TableHead>نوع</TableHead>
              <TableHead>مشتری</TableHead>
              <TableHead>تاریخ صدور</TableHead>
              <TableHead>مبلغ نهایی</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead>تایید</TableHead>
              <TableHead>عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc: Document) => (
              <TableRow key={doc.id}>
                <TableCell className="font-mono">{doc.documentNumber}</TableCell>
                <TableCell>{doc.documentType}</TableCell>
                <TableCell>{doc.customerName}</TableCell>
                <TableCell>{doc.issueDate}</TableCell>
                <TableCell>{doc.finalAmount.toLocaleString('fa-IR')} ریال</TableCell>
                <TableCell>{getStatusBadge(doc.status)}</TableCell>
                <TableCell>{getApprovalBadge(doc.approvalStatus)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => window.location.href = `/documents/${doc.id}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {doc.status === 'draft' && (
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(doc)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {doc.approvalStatus === 'pending' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => approveMutation.mutate(doc.id)}
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => rejectMutation.mutate(doc.id)}
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </>
                    )}
                    {doc.approvalStatus !== 'approved' && (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(doc)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        <Button
          variant="outline"
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
        >
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{selectedDocument ? 'ویرایش سند' : 'سند جدید'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نوع سند</Label>
                <Select
                  value={formData.documentType}
                  onValueChange={(value: string) => setFormData({ ...formData, documentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="temp_proforma">پیش‌فاکتور موقت</SelectItem>
                    <SelectItem value="proforma">پیش‌فاکتور</SelectItem>
                    <SelectItem value="invoice">فاکتور</SelectItem>
                    <SelectItem value="return_invoice">فاکتور برگشتی</SelectItem>
                    <SelectItem value="receipt">رسید</SelectItem>
                    <SelectItem value="other">سایر</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>مشتری</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(value: string) => setFormData({ ...formData, customerId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب مشتری" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer: Customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>تاریخ صدور</Label>
                <Input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>تاریخ سررسید</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>آیتم‌ها</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 ml-2" />
                  افزودن آیتم
                </Button>
              </div>

              <div className="space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="space-y-2 border rounded-lg p-3 bg-gray-50">
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-6">
                        <Label className="text-xs">شرح</Label>
                        <Input
                          placeholder="شرح کالا/خدمت"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">تعداد</Label>
                        <Input
                          type="number"
                          placeholder="تعداد"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                          required
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">قیمت فروش</Label>
                        <Input
                          type="number"
                          placeholder="قیمت واحد"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
                          required
                          min="0"
                        />
                      </div>
                      <div className="col-span-2 flex items-end gap-2">
                        <div className="text-sm py-2 font-semibold">
                          {(item.quantity * item.unitPrice).toLocaleString('fa-IR')}
                        </div>
                        {formData.items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {(formData.documentType === 'temp_proforma' || formData.documentType === 'proforma') && (
                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-3">
                          <Label className="text-xs text-muted-foreground">قیمت خرید</Label>
                          <Input
                            type="number"
                            placeholder="قیمت خرید"
                            value={item.purchasePrice || 0}
                            onChange={(e) => updateItem(index, 'purchasePrice', parseFloat(e.target.value))}
                            min="0"
                          />
                        </div>
                        <div className="col-span-3">
                          <Label className="text-xs text-muted-foreground">درصد سود (%)</Label>
                          <Input
                            type="number"
                            placeholder="درصد سود"
                            value={item.profitPercentage || 0}
                            onChange={(e) => updateItem(index, 'profitPercentage', parseFloat(e.target.value))}
                            min="0"
                            max="100"
                            step="0.1"
                          />
                        </div>
                        <div className="col-span-6 flex items-end">
                          <div className="text-xs text-muted-foreground">
                            سود: {((item.quantity * item.unitPrice) - (item.quantity * (item.purchasePrice || 0))).toLocaleString('fa-IR')} ریال
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تخفیف (ریال)</Label>
                <Input
                  type="number"
                  value={formData.discountAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, discountAmount: parseFloat(e.target.value) || 0 })
                  }
                  min="0"
                />
              </div>

              {(formData.documentType === 'temp_proforma' || formData.documentType === 'proforma') && (
                <div className="space-y-2">
                  <Label>درصد سود پیش‌فرض (%)</Label>
                  <Input
                    type="number"
                    value={formData.defaultProfitPercentage}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultProfitPercentage: parseFloat(e.target.value) || 20 })
                    }
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>یادداشت‌ها</Label>
              <Input
                placeholder="یادداشت‌های اضافی..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>پیوست (URL)</Label>
              <Input
                placeholder="آدرس فایل پیوست..."
                value={formData.attachment}
                onChange={(e) => setFormData({ ...formData, attachment: e.target.value })}
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>جمع کل:</span>
                <span className="font-bold">{calculateTotal().toLocaleString('fa-IR')} ریال</span>
              </div>
              <div className="flex justify-between">
                <span>تخفیف:</span>
                <span className="font-bold">
                  {formData.discountAmount.toLocaleString('fa-IR')} ریال
                </span>
              </div>
              <div className="flex justify-between text-lg">
                <span>مبلغ نهایی:</span>
                <span className="font-bold">{calculateFinal().toLocaleString('fa-IR')} ریال</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setSelectedDocument(null);
                  resetForm();
                }}
              >
                انصراف
              </Button>
              <Button type="submit">
                {selectedDocument ? 'ویرایش' : 'ایجاد'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>جزئیات سند</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>شماره سند</Label>
                  <p className="font-mono mt-1">{selectedDocument.documentNumber}</p>
                </div>
                <div>
                  <Label>نوع سند</Label>
                  <p className="mt-1">{selectedDocument.documentType}</p>
                </div>
                <div>
                  <Label>مشتری</Label>
                  <p className="mt-1">{selectedDocument.customerName}</p>
                </div>
                <div>
                  <Label>تاریخ صدور</Label>
                  <p className="mt-1">{selectedDocument.issueDate}</p>
                </div>
                <div>
                  <Label>وضعیت</Label>
                  <p className="mt-1">{getStatusBadge(selectedDocument.status)}</p>
                </div>
                <div>
                  <Label>وضعیت تایید</Label>
                  <p className="mt-1">{getApprovalBadge(selectedDocument.approvalStatus)}</p>
                </div>
              </div>

              <div>
                <Label>آیتم‌ها</Label>
                <Table className="mt-2">
                  <TableHeader>
                    <TableRow>
                      <TableHead>شرح</TableHead>
                      <TableHead>تعداد</TableHead>
                      <TableHead>قیمت واحد</TableHead>
                      <TableHead>جمع</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedDocument.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.unitPrice.toLocaleString('fa-IR')}</TableCell>
                        <TableCell>
                          {(item.quantity * item.unitPrice).toLocaleString('fa-IR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>جمع کل:</span>
                  <span className="font-bold">
                    {selectedDocument.totalAmount.toLocaleString('fa-IR')} ریال
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>تخفیف:</span>
                  <span className="font-bold">
                    {selectedDocument.discountAmount.toLocaleString('fa-IR')} ریال
                  </span>
                </div>
                <div className="flex justify-between text-lg">
                  <span>مبلغ نهایی:</span>
                  <span className="font-bold">
                    {selectedDocument.finalAmount.toLocaleString('fa-IR')} ریال
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
            <AlertDialogDescription>
              این عملیات قابل بازگشت نیست. سند {selectedDocument?.documentNumber} برای همیشه حذف
              خواهد شد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedDocument && deleteMutation.mutate(selectedDocument.id)}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
