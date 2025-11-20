import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
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

    // Calculate total
    const totalAmount = createDocumentDto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const discountAmount = createDocumentDto.discountAmount || 0;
    const finalAmount = totalAmount - discountAmount;

    // Generate document number
    const count = await this.prisma.document.count();
    const documentNumber = `DOC-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

    const document = await this.prisma.document.create({
      data: {
        documentNumber,
        documentType: createDocumentDto.documentType as any,
        customerId: createDocumentDto.customerId,
        issueDate: new Date(createDocumentDto.issueDate),
        dueDate: createDocumentDto.dueDate ? new Date(createDocumentDto.dueDate) : null,
        totalAmount,
        discountAmount,
        finalAmount,
        createdBy: userId,
        items: {
          create: createDocumentDto.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
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
      include: { items: true },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.status !== 'draft') {
      throw new BadRequestException('Only draft documents can be edited');
    }

    // Calculate totals if items are updated
    let totalAmount = Number(document.totalAmount);
    let discountAmount = Number(document.discountAmount);

    if (updateDocumentDto.items) {
      totalAmount = updateDocumentDto.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );
    }

    if (updateDocumentDto.discountAmount !== undefined) {
      discountAmount = updateDocumentDto.discountAmount;
    }

    const finalAmount = totalAmount - discountAmount;

    // Update document
    const updatedDocument = await this.prisma.document.update({
      where: { id },
      data: {
        ...(updateDocumentDto.documentType && { documentType: updateDocumentDto.documentType as any }),
        ...(updateDocumentDto.customerId && { customerId: updateDocumentDto.customerId }),
        ...(updateDocumentDto.issueDate && { issueDate: new Date(updateDocumentDto.issueDate) }),
        ...(updateDocumentDto.dueDate !== undefined && {
          dueDate: updateDocumentDto.dueDate ? new Date(updateDocumentDto.dueDate) : null,
        }),
        totalAmount,
        discountAmount,
        finalAmount,
        ...(updateDocumentDto.items && {
          items: {
            deleteMany: {},
            create: updateDocumentDto.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
            })),
          },
        }),
      },
      include: {
        customer: true,
        creator: true,
        items: true,
      },
    });

    return this.formatDocument(updatedDocument);
  }

  async approve(id: string, _userId: string, userRole: string) {
    if (userRole !== 'admin' && userRole !== 'manager') {
      throw new ForbiddenException('Only admin or manager can approve documents');
    }

    const document = await this.prisma.document.update({
      where: { id },
      data: { approvalStatus: 'approved' },
      include: { customer: true, creator: true, items: true },
    });

    return this.formatDocument(document);
  }

  async reject(id: string, _userId: string, userRole: string) {
    if (userRole !== 'admin' && userRole !== 'manager') {
      throw new ForbiddenException('Only admin or manager can reject documents');
    }

    const document = await this.prisma.document.update({
      where: { id },
      data: { approvalStatus: 'rejected' },
      include: { customer: true, creator: true, items: true },
    });

    return this.formatDocument(document);
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
      })),
    };
  }
}
