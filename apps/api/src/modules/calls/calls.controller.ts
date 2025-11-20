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
import { CallsService } from './calls.service';
import { CreateCallDto } from './dto/create-call.dto';
import { UpdateCallDto } from './dto/update-call.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('calls')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Post()
  @Roles('admin', 'manager', 'user')
  create(@Body() createCallDto: CreateCallDto, @CurrentUser() user: any) {
    return this.callsService.create(createCallDto, user.id);
  }

  @Get()
  @Roles('admin', 'manager', 'user')
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('customerId') customerId?: string,
    @Query('userId') userId?: string,
    @Query('direction') direction?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.callsService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      customerId,
      userId,
      direction,
      status,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  @Roles('admin', 'manager', 'user')
  findOne(@Param('id') id: string) {
    return this.callsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'manager', 'user')
  update(@Param('id') id: string, @Body() updateCallDto: UpdateCallDto) {
    return this.callsService.update(id, updateCallDto);
  }

  @Delete(':id')
  @Roles('admin', 'manager')
  remove(@Param('id') id: string) {
    return this.callsService.remove(id);
  }
}
