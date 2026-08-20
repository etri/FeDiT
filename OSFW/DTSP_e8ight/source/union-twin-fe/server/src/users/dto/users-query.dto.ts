import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { PaginationDto } from '../../common/dto/pagination.dto';

const USERS_SORT_KEYS = [
  'name',
  'email',
  'organization',
  'phoneNumber',
  'isActive',
  'createdAt',
  'role',
] as const;

export type UsersSortKey = (typeof USERS_SORT_KEYS)[number];

export class UsersQueryDto extends PaginationDto {
  @IsOptional()
  @IsIn(USERS_SORT_KEYS)
  sortBy?: UsersSortKey;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  pendingDeletion?: boolean;
}
