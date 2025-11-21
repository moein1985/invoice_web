import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { DocumentType } from '@prisma/client';

@Injectable()
export class DocumentConversionService {
  constructor(private prisma: PrismaService) {}

  /**
   * تبدیل سند به نوع بعدی
   * temp_proforma -> proforma -> invoice
   */
  async convertDocument(documentId: string, userId: string) {
    try {
      console.log('🔄 Starting conversion for document:', documentId);
      
      const sourceDocument = await this.prisma.document.findUnique({
        where: { id: documentId },
        include: {
          items: true,
          customer: true,
        },
      });

      if (!sourceDocument) {
        throw new NotFoundException('سند یافت نشد');
      }

      console.log('📄 Source document found:', {
        type: sourceDocument.documentType,
        number: sourceDocument.documentNumber,
        itemsCount: sourceDocument.items.length
      });

      // تعیین نوع بعدی
      const nextType = this.getNextDocumentType(sourceDocument.documentType);
      if (!nextType) {
        throw new BadRequestException('این سند قابل تبدیل نیست');
      }

      console.log('➡️ Next type:', nextType);

      // چک کردن approval برای temp_proforma
      if (sourceDocument.documentType === 'temp_proforma') {
        if (sourceDocument.requiresApproval && sourceDocument.approvalStatus !== 'approved') {
          throw new BadRequestException('این سند هنوز تأیید نشده است');
        }
      }

      // تولید شماره جدید برای همه conversion ها
      const documentNumber = await this.generateDocumentNumber(nextType);

      console.log('🔢 New document number:', documentNumber);

      // ایجاد سند جدید
      console.log('💾 Creating new document...');
      
      // Prepare data object carefully
      const createData: any = {
        documentNumber,
        documentType: nextType,
        customerId: sourceDocument.customerId,
        issueDate: sourceDocument.issueDate,
        totalAmount: sourceDocument.totalAmount,
        discountAmount: sourceDocument.discountAmount,
        finalAmount: sourceDocument.finalAmount,
        status: 'draft',
        approvalStatus: 'not_required',
        requiresApproval: false,
        convertedFromId: sourceDocument.id,
        createdBy: userId,
      };
      
      // Add optional fields only if they have values
      if (sourceDocument.dueDate) createData.dueDate = sourceDocument.dueDate;
      if (sourceDocument.notes) createData.notes = sourceDocument.notes;
      if (sourceDocument.attachment) createData.attachment = sourceDocument.attachment;
      if (nextType === 'proforma' && sourceDocument.defaultProfitPercentage) {
        createData.defaultProfitPercentage = sourceDocument.defaultProfitPercentage;
      }
      
      // Add items
      createData.items = {
        create: sourceDocument.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          purchasePrice: nextType === 'proforma' ? item.purchasePrice : 0,
          profitAmount: nextType === 'proforma' ? item.profitAmount : 0,
          profitPercentage: nextType === 'proforma' ? item.profitPercentage : 0,
          isManualPrice: item.isManualPrice,
        })),
      };
      
      console.log('📝 Create data prepared, items count:', sourceDocument.items.length);
      
      const newDocument = await this.prisma.document.create({
        data: createData,
        include: {
          items: true,
          customer: true,
          creator: true,
          approver: true,
        },
      });

      console.log('✅ Document created successfully:', newDocument.documentNumber);
      return newDocument;
    } catch (error: any) {
      console.error('❌ Conversion error:', error?.message || error);
      console.error('📋 Error details:', error);
      throw error;
    }
  }

  /**
   * تعیین نوع بعدی سند
   */
  private getNextDocumentType(currentType: DocumentType): DocumentType | null {
    const conversionMap: Record<DocumentType, DocumentType | null> = {
      temp_proforma: 'proforma',
      proforma: 'invoice',
      invoice: null,
      receipt: null,
      return_invoice: null,
      other: null,
    };

    return conversionMap[currentType];
  }

  /**
   * تولید شماره سند جدید
   */
  async generateDocumentNumber(type: DocumentType): Promise<string> {
    const prefixMap: Record<string, string> = {
      temp_proforma: 'TMP',
      proforma: 'PRF',
      invoice: 'INV',
      receipt: 'RCP',
      return_invoice: 'RTN',
      other: 'DOC',
    };

    const prefix = prefixMap[type] || 'DOC';
    const year = new Date().getFullYear();
    
    // شمارش اسناد از این نوع در سال جاری
    const count = await this.prisma.document.count({
      where: {
        documentType: type,
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    });

    return `${prefix}-${year}-${String(count + 1).padStart(6, '0')}`;
  }

  /**
   * دریافت زنجیره تبدیل یک سند
   */
  async getConversionChain(documentId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('سند یافت نشد');
    }

    // پیدا کردن سند اصلی (ریشه زنجیره)
    let rootDocument = document;
    while (rootDocument.convertedFromId) {
      const parent = await this.prisma.document.findUnique({
        where: { id: rootDocument.convertedFromId },
      });
      if (!parent) break;
      rootDocument = parent;
    }

    // دریافت کل زنجیره از ریشه
    const chain = [];
    let current: any = rootDocument;
    
    while (current) {
      chain.push({
        id: current.id,
        documentNumber: current.documentNumber,
        documentType: current.documentType,
        finalAmount: current.finalAmount,
        createdAt: current.createdAt,
      });

      const next = await this.prisma.document.findFirst({
        where: { convertedFromId: current.id },
      });
      
      current = next;
    }

    return chain;
  }
}
