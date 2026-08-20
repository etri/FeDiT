import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { BCRYPT_SALT_ROUNDS, Role } from '../../common/constants';
import { Role as RoleEntity } from '../../roles/entities/role.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class AdminSeed implements OnModuleInit {
  private readonly logger = new Logger(AdminSeed.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(RoleEntity)
    private rolesRepository: Repository<RoleEntity>,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    const email = 'admin@e8ight.co.kr';

    const exists = await this.usersRepository.findOne({ where: { email } });
    if (exists) {
      return;
    }

    const password = this.configService.get<string>('ADMIN_SEED_PASSWORD');
    if (!password) {
      this.logger.error(
        `ADMIN_SEED_PASSWORD is not set — skipping admin user seed. ` +
          `Set it in .env and restart to bootstrap the initial admin account (${email}).`,
      );
      return;
    }

    const adminRole = await this.rolesRepository.findOne({
      where: { name: Role.ADMIN },
    });
    if (!adminRole) {
      this.logger.warn('ADMIN role not found — skipping admin user seed');
      return;
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    await this.usersRepository.save(
      this.usersRepository.create({
        email,
        password: hashedPassword,
        name: 'Admin',
        organization: '이에이트(E8)',
        roleId: adminRole.id,
      }),
    );

    this.logger.log(`Seeded default admin user: ${email}`);
  }
}
