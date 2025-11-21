import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';

@Injectable()
export class DocumentApprovalService {
  constructor(private prisma: PrismaService) {}

  /**
   * درخواست تأیید برای یک سند
   */
  async requestApproval(documentId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('سند یافت نشد');
    }

    if (document.status !== 'draft') {
      throw new BadRequestException('فقط اسناد پیش‌نویس قابل ارسال برای تأیید هستند');
    }

    if (document.approvalStatus !== 'not_required' && document.approvalStatus !== 'pending') {
      throw new BadRequestException('این سند قبلاً پردازش شده است');
    }

    const updatedDocument = await this.prisma.document.update({
      where: { id: documentId },
      data: {
        approvalStatus: 'pending',
        requiresApproval: true,
        status: 'pending',
      },
      include: {
        items: true,
        customer: true,
        creator: true,
      },
    });

    return updatedDocument;
  }

  /**
   * تأیید یک سند
   */
  async approveDocument(documentId: string, userId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        customer: true,
      },
    });

    if (!document) {
      throw new NotFoundException('سند یافت نشد');
    }

    if (document.approvalStatus !== 'pending') {
      throw new BadRequestException('این سند در وضعیت انتظار تأیید نیست');
    }

    // چک کردن سطح دسترسی کاربر
    const approver = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!approver) {
      throw new NotFoundException('کاربر یافت نشد');
    }

    // چک کردن محدودیت مبلغ
    if (!this.canApprove(approver, Number(document.finalAmount))) {
      const maxAmount = approver.maxApprovalAmount ? Number(approver.maxApprovalAmount).toLocaleString() : 'نامحدود';
      throw new ForbiddenException(
        `شما مجاز به تأیید مبلغ ${Number(document.finalAmount).toLocaleString()} تومان نیستید. ` +
        `حداکثر مبلغ قابل تأیید شما: ${maxAmount} تومان`
      );
    }

    const updatedDocument = await this.prisma.document.update({
      where: { id: documentId },
      data: {
        approvalStatus: 'approved',
        approvedBy: userId,
        approvedAt: new Date(),
        status: 'approved',
        rejectionReason: null,
      },
      include: {
        items: true,
        customer: true,
        creator: true,
        approver: true,
      },
    });

    return updatedDocument;
  }

  /**
   * رد یک سند
   */
  async rejectDocument(documentId: string, userId: string, reason: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('سند یافت نشد');
    }

    if (document.approvalStatus !== 'pending') {
      throw new BadRequestException('این سند در وضعیت انتظار تأیید نیست');
    }

    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('لطفاً دلیل رد را وارد کنید');
    }

    const updatedDocument = await this.prisma.document.update({
      where: { id: documentId },
      data: {
        approvalStatus: 'rejected',
        approvedBy: userId,
        approvedAt: new Date(),
        status: 'rejected',
        rejectionReason: reason,
      },
      include: {
        items: true,
        customer: true,
        creator: true,
        approver: true,
      },
    });

    return updatedDocument;
  }

  /**
   * دریافت لیست اسناد منتظر تأیید
   */
  async getPendingApprovals(userId: string, params?: {
    page?: number;
    limit?: number;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const skip = (page - 1) * limit;

    // دریافت سطح دسترسی کاربر
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('کاربر یافت نشد');
    }

    const where: any = {
      approvalStatus: 'pending',
      requiresApproval: true,
    };

    // اگر کاربر محدودیت مبلغ دارد، فقط اسناد در محدوده نمایش داده شود
    if (user.maxApprovalAmount) {
      where.finalAmount = {
        lte: user.maxApprovalAmount,
      };
    }

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
      data: documents,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * چک کردن اینکه آیا کاربر می‌تواند این مبلغ را تأیید کند
   */
  private canApprove(user: any, amount: number): boolean {
    // Admin و manager نامحدود هستند
    if (user.role === 'admin' || !user.maxApprovalAmount) {
      return true;
    }

    return amount <= Number(user.maxApprovalAmount);
  }

  /**
   * دریافت تاریخچه تأییدات یک کاربر
   */
  async getApprovalHistory(userId: string, params?: {
    page?: number;
    limit?: number;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where: {
          approvedBy: userId,
          approvalStatus: {
            in: ['approved', 'rejected'],
          },
        },
        skip,
        take: limit,
        orderBy: { approvedAt: 'desc' },
        include: {
          customer: true,
          creator: true,
        },
      }),
      this.prisma.document.count({
        where: {
          approvedBy: userId,
          approvalStatus: {
            in: ['approved', 'rejected'],
          },
        },
      }),
    ]);

    return {
      data: documents,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
