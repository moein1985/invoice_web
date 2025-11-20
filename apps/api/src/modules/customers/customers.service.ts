import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto) {
    // Check if code already exists
    const existingCustomer = await this.prisma.customer.findUnique({
      where: { code: createCustomerDto.code },
    });

    if (existingCustomer) {
      throw new ConflictException('Customer code already exists');
    }

    const customer = await this.prisma.customer.create({
      data: {
        code: createCustomerDto.code,
        name: createCustomerDto.name,
        phone: createCustomerDto.phone || null,
        email: createCustomerDto.email || null,
        address: createCustomerDto.address || null,
        creditLimit: createCustomerDto.creditLimit || 0,
      },
    });

    return this.formatCustomer(customer);
  }

  async findAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = params?.sortBy || 'createdAt';
    const sortOrder = params?.sortOrder || 'desc';

    const where: any = {};

    // Filter by active status
    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    // Search in name, code, phone, email
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { code: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { documents: true },
          },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: customers.map((customer) =>
        this.formatCustomer(customer, customer._count.documents)
      ),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { documents: true },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.formatCustomer(customer, customer._count.documents);
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Check if new code already exists (excluding current customer)
    if (updateCustomerDto.code && updateCustomerDto.code !== customer.code) {
      const existingCustomer = await this.prisma.customer.findUnique({
        where: { code: updateCustomerDto.code },
      });

      if (existingCustomer) {
        throw new ConflictException('Customer code already exists');
      }
    }

    const updatedCustomer = await this.prisma.customer.update({
      where: { id },
      data: {
        ...(updateCustomerDto.code && { code: updateCustomerDto.code }),
        ...(updateCustomerDto.name && { name: updateCustomerDto.name }),
        ...(updateCustomerDto.phone !== undefined && { phone: updateCustomerDto.phone || null }),
        ...(updateCustomerDto.email !== undefined && { email: updateCustomerDto.email || null }),
        ...(updateCustomerDto.address !== undefined && {
          address: updateCustomerDto.address || null,
        }),
        ...(updateCustomerDto.creditLimit !== undefined && {
          creditLimit: updateCustomerDto.creditLimit,
        }),
        ...(updateCustomerDto.isActive !== undefined && {
          isActive: updateCustomerDto.isActive,
        }),
      },
      include: {
        _count: {
          select: { documents: true },
        },
      },
    });

    return this.formatCustomer(updatedCustomer, updatedCustomer._count.documents);
  }

  async remove(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { documents: true },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (customer._count.documents > 0) {
      throw new ConflictException('Cannot delete customer with existing documents');
    }

    await this.prisma.customer.delete({
      where: { id },
    });

    return { message: 'Customer deleted successfully' };
  }

  async toggleActive(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const updatedCustomer = await this.prisma.customer.update({
      where: { id },
      data: { isActive: !customer.isActive },
    });

    return this.formatCustomer(updatedCustomer);
  }

  private formatCustomer(customer: any, documentCount?: number) {
    return {
      id: customer.id,
      code: customer.code,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      creditLimit: Number(customer.creditLimit),
      isActive: customer.isActive,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
      ...(documentCount !== undefined && { documentCount }),
    };
  }
}
