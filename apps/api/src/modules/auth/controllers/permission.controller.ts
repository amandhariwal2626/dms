import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../decorators/current-user.decorator';
import { PermissionService } from '../services/permission.service';
import type {
  CreatePermissionDto,
  UpdatePermissionDto,
  PermissionStatusChangeDto,
  PermissionQueryDto,
} from '../dto/permission.dto';
import type { AuthenticatedUser } from '../types/auth.types';

@UseGuards(AuthGuard('jwt'))
@Controller()
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get('permissions')
  async list(@Query() query: PermissionQueryDto) {
    return this.permissionService.list(query);
  }

  @Get('permissions/:id')
  async getById(@Param('id') id: string) {
    return this.permissionService.getById(id);
  }

  @Post('permissions')
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePermissionDto) {
    return this.permissionService.create(user.id, dto);
  }

  @Put('permissions/:id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.permissionService.update(id, user.id, dto);
  }

  @Patch('permissions/:id/status')
  async changeStatus(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PermissionStatusChangeDto,
  ) {
    return this.permissionService.changeStatus(id, user.id, dto);
  }

  @Delete('permissions/:id')
  async delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.permissionService.delete(id, user.id);
  }

  @Get('modules/:moduleId/permissions')
  async listByModule(@Param('moduleId') moduleId: string) {
    return this.permissionService.listByModule(moduleId);
  }
}
