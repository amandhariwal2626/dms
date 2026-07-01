import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../decorators/current-user.decorator';
import { RolePermissionService } from '../services/role-permission.service';
import type { ReplacePermissionsDto, CopyPermissionsDto } from '../dto/role-permission.dto';
import type { AuthenticatedUser } from '../types/auth.types';

@UseGuards(AuthGuard('jwt'))
@Controller('roles/:roleId/permissions')
export class RolePermissionController {
  constructor(private readonly rolePermissionService: RolePermissionService) {}

  @Put()
  async replace(
    @Param('roleId') roleId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReplacePermissionsDto,
  ) {
    return this.rolePermissionService.replacePermissions(
      roleId,
      user.companyId ?? '',
      user.id,
      dto,
    );
  }

  @Get()
  async list(@Param('roleId') roleId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.rolePermissionService.getPermissionsByRole(roleId, user.companyId ?? '');
  }

  @Get('effective-permissions')
  async effective(@Param('roleId') roleId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.rolePermissionService.getEffectivePermissions(roleId, user.companyId ?? '');
  }

  @Post('copy')
  async copy(
    @Param('roleId') roleId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CopyPermissionsDto,
  ) {
    return this.rolePermissionService.copyPermissions(roleId, user.companyId ?? '', user.id, dto);
  }

  @Delete()
  async clear(@Param('roleId') roleId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.rolePermissionService.clearPermissions(roleId, user.companyId ?? '', user.id);
  }
}
