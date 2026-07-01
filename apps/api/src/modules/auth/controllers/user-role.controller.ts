import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UserRoleService } from '../services/user-role.service';
import type { AuthenticatedUser } from '../types/auth.types';
import type {
  AssignRolesDto,
  ReplaceRolesDto,
  UpdateUserRoleStatusDto,
  UpdateUserRoleDto,
} from '../dto/user-role.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UserRoleController {
  constructor(private readonly userRoleService: UserRoleService) {}

  @Get(':userId/roles')
  async getRolesByUser(@Param('userId') userId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.userRoleService.getRolesByUser(userId, user.companyId ?? '');
  }

  @Put(':userId/roles')
  async replaceRoles(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReplaceRolesDto,
  ) {
    return this.userRoleService.replaceRoles(userId, user.companyId ?? '', user.id, dto);
  }

  @Post(':userId/roles/assign')
  async assignRoles(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AssignRolesDto,
  ) {
    return this.userRoleService.assignRoles(userId, user.companyId ?? '', user.id, dto);
  }

  @Delete(':userId/roles/:roleId')
  async removeRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.userRoleService.removeRole(userId, roleId, user.companyId ?? '', user.id);
  }

  @Patch(':userId/roles/:roleId/status')
  async updateUserRoleStatus(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserRoleStatusDto,
  ) {
    return this.userRoleService.updateUserRoleStatus(
      userId,
      roleId,
      user.companyId ?? '',
      user.id,
      dto,
    );
  }

  @Patch(':userId/roles/:roleId')
  async updateUserRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.userRoleService.updateUserRole(userId, roleId, user.companyId ?? '', user.id, dto);
  }

  @Get('profile/roles')
  async getProfileRoles(@CurrentUser() user: AuthenticatedUser) {
    return this.userRoleService.getProfileRoles(
      user.id,
      user.companyId ?? '',
      user.companyUserId ?? '',
    );
  }
}
