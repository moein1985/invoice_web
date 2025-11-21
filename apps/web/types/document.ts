export type DocumentType = 'temp_proforma' | 'proforma' | 'invoice' | 'return_invoice' | 'receipt' | 'other';
export type DocumentStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'not_required';

export interface DocumentItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  purchasePrice?: number;
  profitAmount?: number;
  profitPercentage?: number;
  isManualPrice?: boolean;
}

export interface Document {
  id: string;
  documentNumber: string;
  documentType: DocumentType;
  customerId: string;
  customerName?: string;
  issueDate: string;
  dueDate?: string | null;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: DocumentStatus;
  approvalStatus: ApprovalStatus;
  requiresApproval: boolean;
  approvedBy?: string | null;
  approvedByName?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  convertedFromId?: string | null;
  notes?: string | null;
  attachment?: string | null;
  defaultProfitPercentage?: number | null;
  totalPurchaseAmount?: number | null;
  totalProfitAmount?: number | null;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  items?: DocumentItem[];
}

export interface PaginatedDocuments {
  data: Document[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ConversionChainItem {
  id: string;
  documentNumber: string;
  documentType: DocumentType;
  finalAmount: number;
  createdAt: string;
}
