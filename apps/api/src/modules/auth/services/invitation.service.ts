import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthRepository } from '../repositories/auth.repository';
import { HashService } from './hash.service';
import { addDays, isExpired } from '../utils/date.util';
import { normalizeEmail } from '../utils/auth.util';
import type { CreateInvitationDto } from '../dto/invitation.dto';
import {
  UserInvitationCreatedEvent,
  UserInvitationAcceptedEvent,
  UserInvitationCancelledEvent,
} from '../events/invitation.events';
import {
  InvalidTokenException,
  TooManyAttemptsException,
  UserNotFoundException,
} from '../exceptions/auth.exceptions';

export interface InvitationResponse {
  success: true;
  message: string;
  data?: {
    invitationId: string;
    email: string;
    isNewUser: boolean;
  };
}

export interface InvitationListResponse {
  success: true;
  data: Array<{
    id: string;
    email: string;
    status: string;
    expiresAt: string;
    resendCount: number;
    createdAt: string;
  }>;
}

export interface InvitationDetailResponse {
  success: true;
  data: {
    id: string;
    email: string;
    status: string;
    token: string | null;
    expiresAt: string | null;
    resendCount: number;
    metadata: Record<string, unknown> | null;
    createdAt: string;
  };
}

const INVITATION_EXPIRY_DAYS = 7;
const MAX_RESENDS = 5;

export class DuplicateInvitationException extends Error {
  constructor(message = 'An active invitation already exists for this email in this company') {
    super(message);
    this.name = 'DuplicateInvitationException';
  }
}

export class InvitationExpiredException extends Error {
  constructor(message = 'Invitation has expired') {
    super(message);
    this.name = 'InvitationExpiredException';
  }
}

export class InvitationAlreadyAcceptedException extends Error {
  constructor(message = 'Invitation has already been accepted') {
    super(message);
    this.name = 'InvitationAlreadyAcceptedException';
  }
}

export class InvitationCancelledException extends Error {
  constructor(message = 'Invitation has been cancelled') {
    super(message);
    this.name = 'InvitationCancelledException';
  }
}

@Injectable()
export class InvitationService {
  private readonly logger = new Logger(InvitationService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly hashService: HashService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createInvitation(
    invitedByUserId: string,
    companyId: string,
    dto: CreateInvitationDto,
  ): Promise<InvitationResponse> {
    const email = normalizeEmail(dto.email);

    this.logger.log(`Creating invitation for ${email} in company ${companyId}`);

    const existingUser = await this.authRepository.findUserByEmail(email);

    if (existingUser) {
      const existingMembership = await this.authRepository.companyUserExists(
        companyId,
        existingUser.id,
      );
      if (existingMembership) {
        throw new Error('User is already a member of this company');
      }
    }

    const existingInvitation = await this.authRepository.findPendingInvitation(email, companyId);
    if (existingInvitation) {
      throw new DuplicateInvitationException();
    }

    const roles = await this.authRepository.findRolesByIds(dto.roleIds);
    const validRoleIds = roles.map((r) => r.id);

    const invitationToken = this.hashService.generateRandomToken();
    const expiresAt = addDays(new Date(), INVITATION_EXPIRY_DAYS);

    const invitation = await this.authRepository.createVerificationToken({
      email,
      token: invitationToken,
      purpose: 'INVITE',
      tokenType: 'EMAIL_LINK',
      expiresAt,
      status: 'PENDING',
      metadata: {
        invitedBy: invitedByUserId,
        companyId,
        firstName: dto.firstName,
        lastName: dto.lastName ?? null,
        designation: dto.designation ?? null,
        department: dto.department ?? null,
        roleIds: validRoleIds,
        message: dto.message ?? null,
      },
    });

    if (existingUser) {
      const employeeCode = await this.authRepository.getNextEmployeeCode(companyId);

      await this.authRepository.$transaction(async (tx) => {
        const companyUser = await tx.companyUser.create({
          data: {
            companyId,
            userId: existingUser.id,
            employeeCode,
            officialEmail: email,
            designation: dto.designation ?? null,
            department: dto.department as never,
            invitedBy: invitedByUserId,
            invitedAt: new Date(),
            status: 'INVITED',
            isActive: false,
          },
        });

        for (const roleId of validRoleIds) {
          await tx.userRole.create({
            data: {
              companyUserId: companyUser.id,
              roleId,
              assignedBy: invitedByUserId,
              source: 'INVITATION',
              isActive: false,
            },
          });
        }
      });
    }

    this.eventEmitter.emit(
      UserInvitationCreatedEvent.eventName,
      new UserInvitationCreatedEvent(invitation.id, email, companyId),
    );

    await this.authRepository.createActivityLog({
      user: { connect: { id: invitedByUserId } },
      title: 'User Invited',
      activityType: 'DATA_CREATE',
      module: 'AUTH',
      entityName: 'EmailVerificationToken',
      entityId: invitation.id,
      performedAt: new Date(),
    });

    this.logger.log(`Invitation created for ${email}`);

    return {
      success: true,
      message: 'Invitation sent successfully',
      data: {
        invitationId: invitation.id,
        email,
        isNewUser: !existingUser,
      },
    };
  }

  async acceptInvitation(token: string) {
    this.logger.log('Accepting invitation by token');

    const invitation = await this.authRepository.findInvitationByToken(token);

    if (!invitation) {
      throw new InvalidTokenException();
    }

    if (invitation.status !== 'PENDING' || invitation.isUsed) {
      throw new InvalidTokenException();
    }

    if (invitation.expiresAt && isExpired(invitation.expiresAt)) {
      await this.authRepository.updateVerificationToken(invitation.id, {
        status: 'EXPIRED',
      });
      throw new InvalidTokenException();
    }

    const metadata = invitation.metadata as Record<string, unknown> | null;
    const companyId = metadata?.companyId as string;
    const firstName = metadata?.firstName as string;
    const lastName = (metadata?.lastName as string | null) ?? null;
    const designation = (metadata?.designation as string | null) ?? null;
    const department = (metadata?.department as string | null) ?? null;
    const roleIds = (metadata?.roleIds as string[] | undefined) ?? [];
    const invitedBy = (metadata?.invitedBy as string | null) ?? null;

    const existingUser = await this.authRepository.findUserByEmail(invitation.email);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const normalizedEmail = normalizeEmail(invitation.email);
      const username = normalizedEmail.split('@')[0] ?? normalizedEmail;
      const newUser = await this.authRepository.createUser({
        email: invitation.email,
        normalizedEmail,
        username,
        normalizedUsername: username,
        firstName,
        lastName,
        passwordHash: '',
        forcePasswordChange: true,
      });
      userId = newUser.id;
    }

    const employeeCode = await this.authRepository.getNextEmployeeCode(companyId);

    await this.authRepository.$transaction(async (tx) => {
      const companyUser = await tx.companyUser.create({
        data: {
          companyId,
          userId,
          employeeCode,
          officialEmail: invitation.email,
          designation,
          department: department as never,
          invitedBy,
          invitedAt: new Date(),
          acceptedInvitationAt: new Date(),
          status: 'ACTIVE',
          isActive: true,
        },
      });

      for (const roleId of roleIds) {
        const roleExists = await tx.role.findUnique({ where: { id: roleId } });
        if (roleExists) {
          await tx.userRole.create({
            data: {
              companyUserId: companyUser.id,
              roleId,
              assignedBy: invitedBy ?? userId,
              source: 'INVITATION',
              isActive: true,
            },
          });
        }
      }

      await tx.emailVerificationToken.update({
        where: { id: invitation.id },
        data: {
          status: 'VERIFIED',
          verifiedAt: new Date(),
          isUsed: true,
          usedAt: new Date(),
        },
      });
    });

    if (existingUser) {
      await this.authRepository.updateUser(userId, {
        forcePasswordChange: true,
      });
    }

    this.eventEmitter.emit(
      UserInvitationAcceptedEvent.eventName,
      new UserInvitationAcceptedEvent(invitation.id, userId, companyId),
    );

    await this.authRepository.createActivityLog({
      user: { connect: { id: userId } },
      title: 'Invitation Accepted',
      activityType: 'STATUS_CHANGE',
      module: 'AUTH',
      entityName: 'EmailVerificationToken',
      entityId: invitation.id,
      performedAt: new Date(),
    });

    this.logger.log(`Invitation ${invitation.id} accepted by user ${userId}`);

    return { success: true, message: 'Invitation accepted successfully' };
  }

  async resendInvitation(invitationId: string, userId: string) {
    this.logger.log(`Resending invitation ${invitationId}`);

    const invitation = await this.authRepository.findInvitationById(invitationId);

    if (!invitation) {
      throw new UserNotFoundException();
    }

    if (invitation.resendCount >= MAX_RESENDS) {
      throw new TooManyAttemptsException('Maximum resend limit reached');
    }

    const newToken = this.hashService.generateRandomToken();
    const expiresAt = addDays(new Date(), INVITATION_EXPIRY_DAYS);

    await this.authRepository.updateVerificationToken(invitationId, {
      token: newToken,
      expiresAt,
      resendCount: invitation.resendCount + 1,
      lastResendAt: new Date(),
      status: 'PENDING',
      isUsed: false,
      usedAt: null,
    });

    const metadata = invitation.metadata as Record<string, unknown> | null;
    const companyId = metadata?.companyId as string;

    this.eventEmitter.emit(
      UserInvitationCreatedEvent.eventName,
      new UserInvitationCreatedEvent(invitationId, invitation.email, companyId),
    );

    await this.authRepository.createActivityLog({
      user: { connect: { id: userId } },
      title: 'Invitation Resent',
      activityType: 'DATA_CREATE',
      module: 'AUTH',
      entityName: 'EmailVerificationToken',
      entityId: invitationId,
      performedAt: new Date(),
    });

    this.logger.log(`Invitation ${invitationId} resent`);

    return { success: true, message: 'Invitation resent successfully' };
  }

  async cancelInvitation(invitationId: string, userId: string) {
    this.logger.log(`Cancelling invitation ${invitationId}`);

    const invitation = await this.authRepository.findInvitationById(invitationId);

    if (!invitation) {
      throw new UserNotFoundException();
    }

    if (invitation.isUsed || invitation.status === 'VERIFIED') {
      throw new Error('Cannot cancel an already accepted invitation');
    }

    await this.authRepository.updateVerificationToken(invitationId, {
      status: 'EXPIRED',
      isUsed: true,
      usedAt: new Date(),
    });

    const metadata = invitation.metadata as Record<string, unknown> | null;
    const companyId = metadata?.companyId as string;

    this.eventEmitter.emit(
      UserInvitationCancelledEvent.eventName,
      new UserInvitationCancelledEvent(invitationId, companyId),
    );

    await this.authRepository.createActivityLog({
      user: { connect: { id: userId } },
      title: 'Invitation Cancelled',
      activityType: 'STATUS_CHANGE',
      module: 'AUTH',
      entityName: 'EmailVerificationToken',
      entityId: invitationId,
      performedAt: new Date(),
    });

    this.logger.log(`Invitation ${invitationId} cancelled`);

    return { success: true, message: 'Invitation cancelled successfully' };
  }

  async listInvitations(companyId: string): Promise<InvitationListResponse> {
    this.logger.log(`Listing invitations for company ${companyId}`);

    const invitations = await this.authRepository.findInvitationsByCompany(companyId);

    return {
      success: true,
      data: invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        status: inv.status,
        expiresAt: inv.expiresAt?.toISOString() ?? '',
        resendCount: inv.resendCount,
        createdAt: inv.createdAt.toISOString(),
      })),
    };
  }

  async getInvitation(invitationId: string): Promise<InvitationDetailResponse> {
    this.logger.log(`Getting invitation ${invitationId}`);

    const invitation = await this.authRepository.findInvitationById(invitationId);

    if (!invitation) {
      throw new UserNotFoundException();
    }

    return {
      success: true,
      data: {
        id: invitation.id,
        email: invitation.email,
        status: invitation.status,
        token: invitation.token,
        expiresAt: invitation.expiresAt?.toISOString() ?? null,
        resendCount: invitation.resendCount,
        metadata: invitation.metadata as Record<string, unknown> | null,
        createdAt: invitation.createdAt.toISOString(),
      },
    };
  }
}
