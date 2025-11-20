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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @Roles('admin', 'manager', 'user')
  create(@Body() createDocumentDto: CreateDocumentDto, @CurrentUser() user: any) {
    return this.documentsService.create(createDocumentDto, user.id);
  }

  @Get()
  @Roles('admin', 'manager', 'user')
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
  @Roles('admin', 'manager', 'user')
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'manager', 'user')
  update(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.update(id, updateDocumentDto, user.id);
  }

  @Post(':id/approve')
  @Roles('admin', 'manager')
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.approve(id, user.id, user.role);
  }

  @Post(':id/reject')
  @Roles('admin', 'manager')
  reject(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.reject(id, user.id, user.role);
  }

  @Delete(':id')
  @Roles('admin', 'manager')
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}
