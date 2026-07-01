import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../decorators/current-user.decorator';
import { ProfileService, type FileUpload } from '../services/profile.service';
import { UpdateProfileDto, ChangePasswordDto, UpdatePreferencesDto } from '../dto/profile.dto';
import type { AuthenticatedUser } from '../types/auth.types';

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.getProfile(
      user.id,
      user.sessionId,
      user.companyId,
      user.companyUserId,
    );
  }

  @Put('profile')
  async updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(user.id, dto);
  }

  @Patch('change-password')
  async changePassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePasswordDto) {
    return this.profileService.changePassword(user.id, user.sessionId ?? '', dto);
  }

  @Post('profile-photo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePhoto(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: FileUpload,
  ) {
    return this.profileService.uploadProfilePhoto(user.id, user.companyId ?? '', file);
  }

  @Patch('preferences')
  async updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.profileService.updatePreferences(user.id, dto);
  }
}
