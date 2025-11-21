'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import ProtectedRoute from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneDialer } from '@/components/phone-dialer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Search, Edit, Trash2, Phone } from 'lucide-react';

interface Customer {
  id: string;
  code: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  creditLimit: number;
  isActive: boolean;
  documentCount?: number;
}

interface CustomersResponse {
  data: Customer[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isPhoneDialerOpen, setIsPhoneDialerOpen] = useState(false);
  const [callCustomer, setCallCustomer] = useState<Customer | null>(null);

  const queryClient = useQueryClient();

  const { data: customersData, isLoading } = useQuery<CustomersResponse>({
    queryKey: ['customers', page, search],
    queryFn: () =>
      apiClient.get('/customers', {
        params: { page, limit: 10, search: search || undefined },
      }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/customers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsCreateDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.patch(`/customers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsEditDialogOpen(false);
      setSelectedCustomer(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setDeleteCustomerId(null);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/customers/${id}/toggle-active`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditDialogOpen(true);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">مدیریت مشتریان</h1>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="ml-2 h-4 w-4" />
                  مشتری جدید
                </Button>
              </DialogTrigger>
              <DialogContent>
                <CustomerForm
                  onSubmit={(data) => createMutation.mutate(data)}
                  isLoading={createMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="جستجو بر اساس نام، کد، تلفن یا ایمیل..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pr-10"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8">در حال بارگذاری...</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>کد</TableHead>
                      <TableHead>نام</TableHead>
                      <TableHead>تلفن</TableHead>
                      <TableHead>ایمیل</TableHead>
                      <TableHead>سقف اعتبار</TableHead>
                      <TableHead>اسناد</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customersData?.data.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.code}</TableCell>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>{customer.phone || '-'}</TableCell>
                        <TableCell>{customer.email || '-'}</TableCell>
                        <TableCell>{customer.creditLimit.toLocaleString()}</TableCell>
                        <TableCell>{customer.documentCount || 0}</TableCell>
                        <TableCell>
                          <Badge
                            variant={customer.isActive ? 'default' : 'secondary'}
                            className="cursor-pointer"
                            onClick={() => toggleActiveMutation.mutate(customer.id)}
                          >
                            {customer.isActive ? 'فعال' : 'غیرفعال'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {customer.phone && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setCallCustomer(customer);
                                  setIsPhoneDialerOpen(true);
                                }}
                                title="تماس با مشتری"
                              >
                                <Phone className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(customer)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeleteCustomerId(customer.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-muted-foreground">
                    نمایش {(page - 1) * 10 + 1} تا{' '}
                    {Math.min(page * 10, customersData?.meta.total || 0)} از{' '}
                    {customersData?.meta.total} مشتری
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      قبلی
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= (customersData?.meta.totalPages || 1)}
                    >
                      بعدی
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            {selectedCustomer && (
              <CustomerForm
                customer={selectedCustomer}
                onSubmit={(data) =>
                  updateMutation.mutate({ id: selectedCustomer.id, data })
                }
                isLoading={updateMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteCustomerId} onOpenChange={() => setDeleteCustomerId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
              <AlertDialogDescription>
                این عملیات قابل بازگشت نیست. مشتری به طور کامل حذف خواهد شد.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>انصراف</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteCustomerId && deleteMutation.mutate(deleteCustomerId)}
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Phone Dialer */}
        <PhoneDialerWrapper
          isOpen={isPhoneDialerOpen}
          customer={callCustomer}
          onClose={() => {
            setIsPhoneDialerOpen(false);
            setCallCustomer(null);
          }}
        />
      </div>
    </ProtectedRoute>
  );
}

function CustomerForm({
  customer,
  onSubmit,
  isLoading,
}: {
  customer?: Customer;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    code: customer?.code || '',
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    address: customer?.address || '',
    creditLimit: customer?.creditLimit || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{customer ? 'ویرایش مشتری' : 'مشتری جدید'}</DialogTitle>
        <DialogDescription>
          {customer ? 'اطلاعات مشتری را ویرایش کنید' : 'اطلاعات مشتری جدید را وارد کنید'}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="code">کد مشتری*</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">نام*</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">تلفن</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">ایمیل</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isLoading}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">آدرس</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="creditLimit">سقف اعتبار</Label>
          <Input
            id="creditLimit"
            type="number"
            value={formData.creditLimit}
            onChange={(e) =>
              setFormData({ ...formData, creditLimit: Number(e.target.value) })
            }
            disabled={isLoading}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'در حال ذخیره...' : customer ? 'ذخیره تغییرات' : 'ایجاد مشتری'}
        </Button>
      </form>
    </>
  );
}

// Phone Dialer component at the bottom
function PhoneDialerWrapper({
  isOpen,
  customer,
  onClose,
}: {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
}) {
  return (
    <PhoneDialer
      isOpen={isOpen}
      onClose={onClose}
      initialPhoneNumber={customer?.phone || ''}
      customerName={customer?.name}
    />
  );
}
