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
import { RoleService } from '../services/role.service';
import type { CreateRoleDto, UpdateRoleDto, StatusChangeDto, RoleQueryDto } from '../dto/role.dto';
import type { AuthenticatedUser } from '../types/auth.types';

@UseGuards(AuthGuard('jwt'))
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser, @Query() query: RoleQueryDto) {
    return this.roleService.list(user.companyId ?? '', query);
  }

  @Get(':id')
  async getById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.roleService.getById(id, user.companyId ?? '');
  }

  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRoleDto) {
    return this.roleService.create(user.companyId ?? '', user.id, dto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.roleService.update(id, user.companyId ?? '', user.id, dto);
  }

  @Patch(':id/status')
  async changeStatus(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: StatusChangeDto,
  ) {
    return this.roleService.changeStatus(id, user.companyId ?? '', user.id, dto);
  }

  @Post(':id/clone')
  async clone(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.roleService.clone(id, user.companyId ?? '', user.id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.roleService.delete(id, user.companyId ?? '', user.id);
  }
}
