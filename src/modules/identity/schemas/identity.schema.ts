import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayName?: string;

  @IsOptional()
  @IsObject()
  preferences?: Record<string, unknown>;
}

export interface UserView {
  readonly id: string;
  readonly email: string;
  readonly displayName: string | null;
  readonly status: string;
  readonly preferences: Record<string, unknown>;
  readonly createdAt: string;
}
