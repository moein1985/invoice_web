import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateCallDto } from './dto/create-call.dto';
import { UpdateCallDto } from './dto/update-call.dto';

@Injectable()
export class CallsService {
  constructor(private prisma: PrismaService) {}

  async create(createCallDto: CreateCallDto, userId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: createCallDto.customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const call = await this.prisma.callHistory.create({
      data: {
        customerId: createCallDto.customerId,
        callerId: userId,
        phoneNumber: createCallDto.phoneNumber,
        callStart: new Date(createCallDto.startTime),
        callEnd: createCallDto.endTime ? new Date(createCallDto.endTime) : null,
        callDuration: createCallDto.duration ? parseInt(createCallDto.duration) : null,
        callStatus: (createCallDto.status as any) || 'answered',
        notes: createCallDto.notes,
        recordingUrl: createCallDto.recordingUrl,
      },
      include: {
        customer: true,
        caller: true,
      },
    });

    return this.formatCall(call);
  }

  async findAll(params?: {
    page?: number;
    limit?: number;
    customerId?: string;
    userId?: string;
    direction?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params?.customerId) where.customerId = params.customerId;
    if (params?.userId) where.userId = params.userId;
    if (params?.direction) where.direction = params.direction;
    if (params?.status) where.status = params.status;

    if (params?.startDate || params?.endDate) {
      where.startTime = {};
      if (params.startDate) where.startTime.gte = new Date(params.startDate);
      if (params.endDate) where.startTime.lte = new Date(params.endDate);
    }

    const [calls, total] = await Promise.all([
      this.prisma.callHistory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { callStart: 'desc' },
        include: {
          customer: true,
          caller: true,
        },
      }),
      this.prisma.callHistory.count({ where }),
    ]);

    return {
      data: calls.map((call) => this.formatCall(call)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const call = await this.prisma.callHistory.findUnique({
      where: { id },
      include: {
        customer: true,
        caller: true,
      },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    return this.formatCall(call);
  }

  async update(id: string, updateCallDto: UpdateCallDto) {
    const call = await this.prisma.callHistory.findUnique({
      where: { id },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    const updatedCall = await this.prisma.callHistory.update({
      where: { id },
      data: {
        ...(updateCallDto.endTime && { callEnd: new Date(updateCallDto.endTime) }),
        ...(updateCallDto.duration && { callDuration: parseInt(updateCallDto.duration) }),
        ...(updateCallDto.status && { callStatus: updateCallDto.status as any }),
        ...(updateCallDto.notes !== undefined && { notes: updateCallDto.notes }),
        ...(updateCallDto.recordingUrl !== undefined && {
          recordingUrl: updateCallDto.recordingUrl,
        }),
      },
      include: {
        customer: true,
        caller: true,
      },
    });

    return this.formatCall(updatedCall);
  }

  async remove(id: string) {
    const call = await this.prisma.callHistory.findUnique({
      where: { id },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    await this.prisma.callHistory.delete({ where: { id } });

    return { message: 'Call deleted successfully' };
  }

  private formatCall(call: any) {
    // Calculate duration if not set
    let duration = null;
    if (call.callDuration) {
      const mins = Math.floor(call.callDuration / 60);
      const secs = call.callDuration % 60;
      duration = `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    return {
      id: call.id,
      customerId: call.customerId,
      customerName: call.customer?.name,
      userId: call.callerId,
      userName: call.caller?.fullName,
      phoneNumber: call.phoneNumber,
      direction: call.direction.toLowerCase(),
      startTime: call.callStart.toISOString(),
      endTime: call.callEnd ? call.callEnd.toISOString() : null,
      duration,
      status: call.callStatus,
      notes: call.notes,
      recordingUrl: call.recordingUrl,
      createdAt: call.createdAt.toISOString(),
    };
  }
}
