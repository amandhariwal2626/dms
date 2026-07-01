import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../decorators/current-user.decorator';
import { InvitationService } from '../services/invitation.service';
import { CreateInvitationDto } from '../dto/invitation.dto';
import type { AuthenticatedUser } from '../types/auth.types';

@Controller('users/invitations')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateInvitationDto) {
    return this.invitationService.createInvitation(user.id, user.companyId ?? '', dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    return this.invitationService.listInvitations(user.companyId ?? '');
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async get(@Param('id') id: string) {
    return this.invitationService.getInvitation(id);
  }

  @Post(':token/accept')
  async accept(@Param('token') token: string) {
    return this.invitationService.acceptInvitation(token);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/resend')
  async resend(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.invitationService.resendInvitation(id, user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async cancel(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.invitationService.cancelInvitation(id, user.id);
  }
}
