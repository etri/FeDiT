import { IsOptional, IsString, MaxLength } from 'class-validator';

import { MAX_NOTICE_CONTENT_LENGTH } from '../../common/constants';

export class UpdateNoticeDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_NOTICE_CONTENT_LENGTH)
  content?: string;
}
