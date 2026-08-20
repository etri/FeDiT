import { IsIn, IsOptional } from 'class-validator';

import { PaginationDto } from '../../common/dto/pagination.dto';

type NoticeStatus = 'published' | 'unpublished' | 'all';

export class NoticeQueryDto extends PaginationDto {
  @IsOptional()
  @IsIn(['published', 'unpublished', 'all'])
  status?: NoticeStatus;

  @IsOptional()
  @IsIn(['title', 'viewCount', 'createdAt', 'isPublished'])
  sortBy?: 'title' | 'viewCount' | 'createdAt' | 'isPublished';
}
