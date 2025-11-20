import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get all stats in parallel
    const [
      totalCustomers,
      activeCustomers,
      totalDocuments,
      documentsThisMonth,
      documentsToday,
      pendingApprovals,
      monthlyTotal,
      documentsByType,
      recentDocuments,
    ] = await Promise.all([
      // Total customers
      this.prisma.customer.count(),

      // Active customers
      this.prisma.customer.count({
        where: { isActive: true },
      }),

      // Total documents
      this.prisma.document.count(),

      // Documents this month
      this.prisma.document.count({
        where: {
          createdAt: {
            gte: startOfMonth,
          },
        },
      }),

      // Documents today
      this.prisma.document.count({
        where: {
          createdAt: {
            gte: startOfToday,
          },
        },
      }),

      // Pending approvals
      this.prisma.document.count({
        where: {
          approvalStatus: 'pending',
        },
      }),

      // Total amount this month
      this.prisma.document.aggregate({
        where: {
          createdAt: {
            gte: startOfMonth,
          },
          approvalStatus: 'approved',
        },
        _sum: {
          finalAmount: true,
        },
      }),

      // Documents by type
      this.prisma.document.groupBy({
        by: ['documentType'],
        _count: {
          documentType: true,
        },
      }),

      // Recent documents
      this.prisma.document.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          customer: true,
          creator: true,
        },
      }),
    ]);

    return {
      customers: {
        total: totalCustomers,
        active: activeCustomers,
      },
      documents: {
        total: totalDocuments,
        thisMonth: documentsThisMonth,
        today: documentsToday,
        pendingApprovals,
      },
      revenue: {
        thisMonth: Number(monthlyTotal._sum.finalAmount || 0),
      },
      documentsByType: documentsByType.map((item: any) => ({
        type: item.documentType,
        count: item._count.documentType,
      })),
      recentDocuments: recentDocuments.map((doc: any) => ({
        id: doc.id,
        documentNumber: doc.documentNumber,
        documentType: doc.documentType,
        customerName: doc.customer?.name,
        finalAmount: Number(doc.finalAmount),
        status: doc.status,
        approvalStatus: doc.approvalStatus,
        createdAt: doc.createdAt.toISOString(),
      })),
    };
  }
}
