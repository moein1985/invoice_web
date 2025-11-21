import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { RejectDocumentDto } from './dto/reject-document.dto';
import { DocumentConversionService } from './services/document-conversion.service';
import { DocumentApprovalService } from './services/document-approval.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly conversionService: DocumentConversionService,
    private readonly approvalService: DocumentApprovalService,
  ) {}

  @Post()
  @Roles('admin', 'manager', 'employee', 'supervisor', 'user')
  create(@Body() createDocumentDto: CreateDocumentDto, @CurrentUser() user: any) {
    return this.documentsService.create(createDocumentDto, user.id);
  }

  @Get()
  @Roles('admin', 'manager', 'employee', 'supervisor', 'user')
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('customerId') customerId?: string,
    @Query('documentType') documentType?: string,
    @Query('status') status?: string,
    @Query('approvalStatus') approvalStatus?: string,
  ) {
    return this.documentsService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      customerId,
      documentType,
      status,
      approvalStatus,
    });
  }

  @Get(':id')
  @Roles('admin', 'manager', 'employee', 'supervisor', 'user')
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'manager', 'employee', 'supervisor', 'user')
  update(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.update(id, updateDocumentDto, user.id);
  }

  // Conversion endpoints
  @Post(':id/convert')
  @Roles('admin', 'manager', 'employee', 'supervisor', 'user')
  convert(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.conversionService.convertDocument(id, user.id);
  }

  @Get(':id/conversion-chain')
  @Roles('admin', 'manager', 'employee', 'supervisor', 'user')
  getConversionChain(@Param('id') id: string) {
    return this.conversionService.getConversionChain(id);
  }

  // Approval endpoints
  @Post(':id/request-approval')
  @Roles('admin', 'manager', 'employee', 'supervisor', 'user')
  requestApproval(@Param('id') id: string) {
    return this.approvalService.requestApproval(id);
  }

  @Post(':id/approve')
  @Roles('admin', 'manager', 'supervisor')
  approveDocument(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.approvalService.approveDocument(id, user.id);
  }

  @Post(':id/reject')
  @Roles('admin', 'manager', 'supervisor')
  rejectDocument(
    @Param('id') id: string,
    @Body() rejectDto: RejectDocumentDto,
    @CurrentUser() user: any,
  ) {
    return this.approvalService.rejectDocument(id, user.id, rejectDto.reason);
  }

  @Get('approvals/pending')
  @Roles('admin', 'manager', 'supervisor')
  getPendingApprovals(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.approvalService.getPendingApprovals(user.id, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('approvals/history')
  @Roles('admin', 'manager', 'supervisor')
  getApprovalHistory(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.approvalService.getApprovalHistory(user.id, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Delete(':id')
  @Roles('admin', 'manager')
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}
