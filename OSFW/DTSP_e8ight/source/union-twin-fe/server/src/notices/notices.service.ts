import {
  Injectable,
  NotFoundException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateNoticeDto } from './dto/create-notice.dto';
import { NoticeQueryDto } from './dto/notice-query.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { Notice } from './entities/notice.entity';
import { Board, BoardType } from '../boards/entities/board.entity';
import { DEFAULT_BOARD_TITLE } from '../common/constants';
import { isUniqueViolation } from '../common/utils/database';
import { paginate } from '../common/utils/pagination';

@Injectable()
export class NoticesService implements OnModuleInit {
  private readonly logger = new Logger(NoticesService.name);
  private defaultBoardId: string;

  constructor(
    @InjectRepository(Notice)
    private noticesRepository: Repository<Notice>,
    @InjectRepository(Board)
    private boardsRepository: Repository<Board>,
  ) {}

  async onModuleInit() {
    let board = await this.boardsRepository.findOne({
      where: { type: BoardType.NOTICE },
    });

    if (!board) {
      try {
        board = await this.boardsRepository.save(
          this.boardsRepository.create({
            title: DEFAULT_BOARD_TITLE,
            type: BoardType.NOTICE,
            description: '공지사항 게시판',
          }),
        );
      } catch (err) {
        if (isUniqueViolation(err)) {
          this.logger.log(
            'Default NOTICE board was created by another instance — re-reading',
          );
          board = await this.boardsRepository.findOne({
            where: { type: BoardType.NOTICE },
          });
        } else {
          throw err;
        }
      }
    }

    if (!board) {
      throw new Error(
        'Failed to find or create the default NOTICE board during onModuleInit',
      );
    }

    this.defaultBoardId = board.id;
  }

  findAll(query: NoticeQueryDto) {
    return this.findNotices({ ...query, status: 'published' });
  }

  findAllAdmin(query: NoticeQueryDto) {
    return this.findNotices({ ...query, status: query.status ?? 'all' });
  }

  private noticeWithAuthorQb() {
    return this.noticesRepository
      .createQueryBuilder('notice')
      .leftJoin('notice.author', 'author')
      .addSelect(['author.id', 'author.name', 'author.email']);
  }

  private async findNotices(query: NoticeQueryDto) {
    const {
      page,
      size,
      status,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const qb = this.noticeWithAuthorQb();

    switch (status) {
      case 'published':
        qb.where('notice.isPublished = :isPublished', { isPublished: true });
        break;
      case 'unpublished':
        qb.where('notice.isPublished = :isPublished', { isPublished: false });
        break;
      case 'all':
        break;
    }

    qb.orderBy('notice.isPinned', 'DESC')
      .addOrderBy(`notice.${sortBy}`, sortOrder)
      .skip((page - 1) * size)
      .take(size);

    const [data, total] = await qb.getManyAndCount();

    return paginate(data, total, page, size);
  }

  async findOne(id: string) {
    const notice = await this.noticeWithAuthorQb()
      .where('notice.id = :id', { id })
      .andWhere('notice.isPublished = true')
      .getOne();
    if (!notice) throw new NotFoundException('Notice not found');

    await this.noticesRepository.query(
      'UPDATE notices SET "viewCount" = "viewCount" + 1 WHERE id = $1',
      [id],
    );
    notice.viewCount += 1;

    return notice;
  }

  async findOneAdmin(id: string) {
    const notice = await this.noticeWithAuthorQb()
      .where('notice.id = :id', { id })
      .getOne();
    if (!notice) throw new NotFoundException('Notice not found');
    return notice;
  }

  create(dto: CreateNoticeDto, authorId: string) {
    const notice = this.noticesRepository.create({
      ...dto,
      authorId,
      boardId: this.defaultBoardId,
      isPublished: true,
      publishedAt: new Date(),
    });
    return this.noticesRepository.save(notice);
  }

  async update(id: string, dto: UpdateNoticeDto) {
    const notice = await this.getNoticeOrFail(id);
    Object.assign(notice, dto);
    return this.noticesRepository.save(notice);
  }

  async remove(id: string) {
    const notice = await this.getNoticeOrFail(id);
    return this.noticesRepository.remove(notice);
  }

  async publish(id: string) {
    const notice = await this.getNoticeOrFail(id);
    notice.isPublished = !notice.isPublished;
    if (notice.isPublished && !notice.publishedAt) {
      notice.publishedAt = new Date();
    }
    return this.noticesRepository.save(notice);
  }

  async togglePin(id: string) {
    const notice = await this.getNoticeOrFail(id);
    notice.isPinned = !notice.isPinned;
    return this.noticesRepository.save(notice);
  }

  private async getNoticeOrFail(id: string) {
    const notice = await this.noticesRepository.findOne({ where: { id } });
    if (!notice) throw new NotFoundException('Notice not found');
    return notice;
  }
}
