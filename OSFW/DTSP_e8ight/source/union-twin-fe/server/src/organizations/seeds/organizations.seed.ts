import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Organization } from '../entities/organization.entity';

const DEFAULT_ORGANIZATIONS = [
  '이에이트(E8)',
  '한국전자통신연구원',
  '한국과학기술원',
];

@Injectable()
export class OrganizationsSeed implements OnModuleInit {
  private readonly logger = new Logger(OrganizationsSeed.name);

  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
  ) {}

  async onModuleInit() {
    for (const name of DEFAULT_ORGANIZATIONS) {
      const exists = await this.organizationsRepository.findOne({
        where: { name },
      });
      if (!exists) {
        await this.organizationsRepository.save(
          this.organizationsRepository.create({ name }),
        );
        this.logger.log(`Created organization: ${name}`);
      }
    }
  }
}
