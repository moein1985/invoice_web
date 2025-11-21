import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async create(createDocumentDto: CreateDocumentDto, userId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: createDocumentDto.customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Get user to check approval limits
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Calculate totals
    let totalAmount = 0;
    let totalPurchaseAmount = 0;
    let totalProfitAmount = 0;

    const itemsData = createDocumentDto.items.map((item) => {
      const lineTotal = item.quantity * item.unitPrice;
      const purchasePrice = item.purchasePrice || 0;
      const linePurchase = item.quantity * purchasePrice;
      const lineProfit = lineTotal - linePurchase;
      const profitPercentage = purchasePrice > 0 ? (lineProfit / linePurchase) * 100 : 0;

      totalAmount += lineTotal;
      totalPurchaseAmount += linePurchase;
      totalProfitAmount += lineProfit;

      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: lineTotal,
        purchasePrice: purchasePrice,
        profitAmount: lineProfit,
        profitPercentage: item.profitPercentage || profitPercentage,
        isManualPrice: item.isManualPrice || false,
      };
    });

    const discountAmount = createDocumentDto.discountAmount || 0;
    const finalAmount = totalAmount - discountAmount;

    // Determine if requires approval
    const requiresApproval = createDocumentDto.requiresApproval !== undefined
      ? createDocumentDto.requiresApproval
      : (user.maxApprovalAmount ? finalAmount > Number(user.maxApprovalAmount) : false);

    // Generate document number based on type
    const typePrefix = this.getDocumentPrefix(createDocumentDto.documentType);
    const year = new Date().getFullYear();
    const count = await this.prisma.document.count({
      where: {
        documentType: createDocumentDto.documentType,
        createdAt: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
    });
    const documentNumber = `${typePrefix}-${year}-${String(count + 1).padStart(6, '0')}`;

    const document = await this.prisma.document.create({
      data: {
        documentNumber,
        documentType: createDocumentDto.documentType,
        customerId: createDocumentDto.customerId,
        issueDate: new Date(createDocumentDto.issueDate),
        dueDate: createDocumentDto.dueDate ? new Date(createDocumentDto.dueDate) : null,
        totalAmount,
        discountAmount,
        finalAmount,
        createdBy: userId,
        notes: createDocumentDto.notes,
        attachment: createDocumentDto.attachment,
        defaultProfitPercentage: createDocumentDto.defaultProfitPercentage,
        requiresApproval,
        approvalStatus: requiresApproval ? 'pending' : 'not_required',
        totalPurchaseAmount,
        totalProfitAmount,
        items: {
          create: itemsData,
        },
      },
      include: {
        items: true,
        customer: true,
        creator: true,
      },
    });

    return this.formatDocument(document);
  }

  private getDocumentPrefix(type: string): string {
    const prefixes: Record<string, string> = {
      temp_proforma: 'TMP',
      proforma: 'PRF',
      invoice: 'INV',
      return_invoice: 'RTN',
      receipt: 'RCP',
      other: 'DOC',
    };
    return prefixes[type] || 'DOC';
  }

  async findAll(params?: {
    page?: number;
    limit?: number;
    customerId?: string;
    documentType?: string;
    status?: string;
    approvalStatus?: string;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params?.customerId) where.customerId = params.customerId;
    if (params?.documentType) where.documentType = params.documentType;
    if (params?.status) where.status = params.status;
    if (params?.approvalStatus) where.approvalStatus = params.approvalStatus;

    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          creator: true,
          approver: true,
          items: true,
        },
      }),
      this.prisma.document.count({ where }),
    ]);

    return {
      data: documents.map((doc: any) => this.formatDocument(doc)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        customer: true,
        creator: true,
        approver: true,
        items: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return this.formatDocument(document);
  }

  async update(id: string, updateDocumentDto: UpdateDocumentDto, _userId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.status !== 'draft' && !updateDocumentDto.status) {
      throw new BadRequestException('Only draft documents can be edited');
    }

    // Update document - currently only status can be updated
    // TODO: Implement full edit with items recalculation
    const updatedDocument = await this.prisma.document.update({
      where: { id },
      data: {
        ...(updateDocumentDto.status && { status: updateDocumentDto.status as any }),
      },
      include: {
        customer: true,
        creator: true,
        approver: true,
        items: true,
      },
    });

    return this.formatDocument(updatedDocument);
  }

  async remove(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.approvalStatus === 'approved') {
      throw new BadRequestException('Cannot delete approved documents');
    }

    await this.prisma.document.delete({ where: { id } });

    return { message: 'Document deleted successfully' };
  }

  private formatDocument(document: any) {
    return {
      id: document.id,
      documentNumber: document.documentNumber,
      documentType: document.documentType,
      customerId: document.customerId,
      customerName: document.customer?.name,
      issueDate: document.issueDate.toISOString().split('T')[0],
      dueDate: document.dueDate ? document.dueDate.toISOString().split('T')[0] : null,
      totalAmount: Number(document.totalAmount),
      discountAmount: Number(document.discountAmount),
      finalAmount: Number(document.finalAmount),
      status: document.status,
      approvalStatus: document.approvalStatus,
      requiresApproval: document.requiresApproval,
      approvedBy: document.approvedBy,
      approvedByName: document.approver?.fullName,
      approvedAt: document.approvedAt?.toISOString(),
      rejectionReason: document.rejectionReason,
      convertedFromId: document.convertedFromId,
      notes: document.notes,
      attachment: document.attachment,
      defaultProfitPercentage: document.defaultProfitPercentage ? Number(document.defaultProfitPercentage) : null,
      totalPurchaseAmount: document.totalPurchaseAmount ? Number(document.totalPurchaseAmount) : null,
      totalProfitAmount: document.totalProfitAmount ? Number(document.totalProfitAmount) : null,
      createdBy: document.createdBy,
      createdByName: document.creator?.fullName,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString(),
      items: document.items?.map((item: any) => ({
        id: item.id,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : null,
        profitAmount: item.profitAmount ? Number(item.profitAmount) : null,
        profitPercentage: item.profitPercentage ? Number(item.profitPercentage) : null,
        isManualPrice: item.isManualPrice,
      })),
    };
  }
}
