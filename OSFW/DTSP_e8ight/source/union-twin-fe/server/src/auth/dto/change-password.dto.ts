import { IsString, MinLength } from 'class-validator';

import { MAX_PASSWORD_BYTES } from '../../common/constants';
import { MaxByteLength } from '../../common/validators/max-byte-length.validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @MaxByteLength(MAX_PASSWORD_BYTES)
  newPassword: string;
}
