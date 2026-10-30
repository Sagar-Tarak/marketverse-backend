import { HttpStatus, Injectable } from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/types/auth.types.js';
import { throwAppError } from '../../common/utils/app-error.util.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import type { Identity } from './functions/dev-auth.functions.js';
import type { UpdateProfileDto, UserView } from './schemas/identity.schema.js';

function asRecord(value: Prisma.JsonValue): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value
    : {};
}

const toUserView = (row: User): UserView => ({
  id: row.id,
  email: row.email,
  displayName: row.displayName,
  status: row.status,
  preferences: asRecord(row.preferences),
  createdAt: row.createdAt.toISOString(),
});

@Injectable()
export class IdentityService {
  constructor(private readonly prisma: PrismaService) {}

  /** Creates the app-side profile on first sight of an authenticated identity. */
  async ensureUser(identity: Identity): Promise<AuthenticatedUser> {
    const user =
      (await this.prisma.user.findUnique({ where: { id: identity.id } })) ??
      (await this.prisma.user.create({
        data: { id: identity.id, email: identity.email },
      }));

    if (user.status === 'SUSPENDED') {
      throwAppError('This account is suspended.', HttpStatus.FORBIDDEN);
    }
    return { id: user.id, email: user.email };
  }

  async getProfile(userId: string): Promise<UserView> {
    const row = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!row) throwAppError('User not found.', HttpStatus.NOT_FOUND);
    return toUserView(row);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserView> {
    const data: Prisma.UserUpdateInput = {};
    if (dto.displayName !== undefined) data.displayName = dto.displayName;
    // Validated as a plain object at the boundary (@IsObject).
    if (dto.preferences !== undefined) {
      data.preferences = dto.preferences as Prisma.InputJsonObject;
    }

    const row = await this.prisma.user.update({ where: { id: userId }, data });
    return toUserView(row);
  }
}
