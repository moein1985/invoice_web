// Enums
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
}

export enum DocumentType {
  INVOICE = 'invoice',
  QUOTE = 'quote',
  RECEIPT = 'receipt',
  OTHER = 'other',
}

export enum DocumentStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum CallStatus {
  COMPLETED = 'completed',
  MISSED = 'missed',
  REJECTED = 'rejected',
  BUSY = 'busy',
}

// User Types
export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
}

export interface UpdateUserDto {
  username?: string;
  password?: string;
  fullName?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UserDto {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Auth Types
export interface LoginDto {
  username: string;
  password: string;
}

export interface TokenDto {
  accessToken: string;
}

export interface AuthResponseDto {
  user: UserDto;
  token: string;
}

// Customer Types
export interface Customer {
  id: string;
  code: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  creditLimit: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCustomerDto {
  code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: number;
}

export interface UpdateCustomerDto {
  code?: string;
  name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  creditLimit?: number;
  isActive?: boolean;
}

export interface CustomerDto {
  id: string;
  code: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  creditLimit: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  documentCount?: number;
}

// Document Item Types
export interface DocumentItem {
  id: string;
  documentId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDocumentItemDto {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface UpdateDocumentItemDto {
  description?: string;
  quantity?: number;
  unitPrice?: number;
}

export interface DocumentItemDto {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Document Types
export interface Document {
  id: string;
  documentNumber: string;
  documentType: DocumentType;
  customerId: string;
  issueDate: Date;
  dueDate?: Date | null;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: DocumentStatus;
  approvalStatus: ApprovalStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDocumentDto {
  documentType: DocumentType;
  customerId: string;
  issueDate: Date | string;
  dueDate?: Date | string;
  discountAmount?: number;
  items: CreateDocumentItemDto[];
}

export interface UpdateDocumentDto {
  documentType?: DocumentType;
  customerId?: string;
  issueDate?: Date | string;
  dueDate?: Date | string;
  discountAmount?: number;
  status?: DocumentStatus;
  items?: CreateDocumentItemDto[];
}

export interface DocumentDto {
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
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  items?: DocumentItemDto[];
}

// Call History Types
export interface CallHistory {
  id: string;
  customerId: string;
  callerId: string;
  phoneNumber: string;
  callStart: Date;
  callEnd?: Date | null;
  callDuration?: number | null;
  callStatus: CallStatus;
  recordingUrl?: string | null;
  notes?: string | null;
  createdAt: Date;
}

export interface CreateCallHistoryDto {
  customerId: string;
  phoneNumber: string;
  callStart: Date | string;
  callEnd?: Date | string;
  callDuration?: number;
  callStatus: CallStatus;
  recordingUrl?: string;
  notes?: string;
}

export interface UpdateCallHistoryDto {
  callEnd?: Date | string;
  callDuration?: number;
  callStatus?: CallStatus;
  recordingUrl?: string;
  notes?: string;
}

export interface CallHistoryDto {
  id: string;
  customerId: string;
  customerName?: string;
  callerId: string;
  callerName?: string;
  phoneNumber: string;
  callStart: string;
  callEnd?: string | null;
  callDuration?: number | null;
  callStatus: CallStatus;
  recordingUrl?: string | null;
  notes?: string | null;
  createdAt: string;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface ApiError {
  statusCode: number;
  message: string;
  errors?: string[];
  timestamp: string;
}
