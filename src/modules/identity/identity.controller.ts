import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/types/auth.types.js';
import { IdentityService } from './identity.service.js';
import { UpdateProfileDto, type UserView } from './schemas/identity.schema.js';

@ApiTags('identity')
@Controller('me')
export class IdentityController {
  constructor(private readonly identity: IdentityService) {}

  @Get()
  getProfile(@CurrentUser() user: AuthenticatedUser): Promise<UserView> {
    return this.identity.getProfile(user.id);
  }

  @Patch()
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserView> {
    return this.identity.updateProfile(user.id, dto);
  }
}
