import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Role } from '../../common/constants';
import { Role as RoleEntity } from '../entities/role.entity';

const DEFAULT_ROLES: { name: string; description: string }[] = [
  { name: Role.ADMIN, description: 'Full access' },
  { name: Role.EDITOR, description: 'Can create and edit notices' },
  { name: Role.VIEWER, description: 'Read-only access' },
];

@Injectable()
export class RolesSeed implements OnModuleInit {
  private readonly logger = new Logger(RolesSeed.name);

  constructor(
    @InjectRepository(RoleEntity)
    private rolesRepository: Repository<RoleEntity>,
  ) {}

  async onModuleInit() {
    for (const roleDef of DEFAULT_ROLES) {
      const exists = await this.rolesRepository.findOne({
        where: { name: roleDef.name },
      });
      if (exists) continue;
      await this.rolesRepository.save(this.rolesRepository.create(roleDef));
      this.logger.log(`Seeded role: ${roleDef.name}`);
    }
  }
}
