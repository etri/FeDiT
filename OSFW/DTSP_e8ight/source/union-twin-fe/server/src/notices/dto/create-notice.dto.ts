import { IsString, MaxLength } from 'class-validator';

import { MAX_NOTICE_CONTENT_LENGTH } from '../../common/constants';

export class CreateNoticeDto {
  @IsString()
  @MaxLength(500)
  title: string;

  @IsString()
  @MaxLength(MAX_NOTICE_CONTENT_LENGTH)
  content: string;
}
