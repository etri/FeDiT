import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Notice } from './entities/notice.entity';
import { NoticesController } from './notices.controller';
import { NoticesService } from './notices.service';
import { Board } from '../boards/entities/board.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notice, Board])],
  controllers: [NoticesController],
  providers: [NoticesService],
})
export class NoticesModule {}
