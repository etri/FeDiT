import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { User } from './entities/user.entity';
import { BCRYPT_SALT_ROUNDS } from '../common/constants';
import { isUniqueViolation } from '../common/utils/database';
import { paginate } from '../common/utils/pagination';
import { Role } from '../roles/entities/role.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async findAll(query: UsersQueryDto) {
    const {
      page,
      size,
      sortBy = 'role',
      sortOrder = 'ASC',
      search,
      pendingDeletion,
    } = query;

    const qb = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .skip((page - 1) * size)
      .take(size);

    if (search) {
      qb.andWhere('(user.name ILIKE :search OR user.email ILIKE :search)', {
        search: `%${search.replace(/[\\%_]/g, '\\$&')}%`,
      });
    }

    if (pendingDeletion) {
      qb.andWhere('user.deletionRequestedAt IS NOT NULL');
    }

    qb.orderBy(sortBy === 'role' ? 'role.name' : `user.${sortBy}`, sortOrder);

    const [data, total] = await qb.getManyAndCount();

    return paginate(data, total, page, size);
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(dto: CreateUserDto) {
    const role = await this.rolesRepository.findOne({
      where: { id: dto.roleId },
    });
    if (!role) throw new NotFoundException('Role not found');

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    try {
      const user = this.usersRepository.create({
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        organization: dto.organization ?? null,
        phoneNumber: dto.phoneNumber ?? null,
        roleId: dto.roleId,
        isActive: dto.isActive ?? true,
        deactivatedAt: dto.isActive === false ? new Date() : null,
      });
      const savedUser = await this.usersRepository.save(user);
      return this.findOne(savedUser.id);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException({
          errorCode: 'EMAIL_ALREADY_REGISTERED',
          message: 'Email already registered',
        });
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findOne(id);

    if (dto.roleId && dto.roleId !== user.roleId) {
      const role = await this.rolesRepository.findOne({
        where: { id: dto.roleId },
      });
      if (!role) throw new NotFoundException('Role not found');
      user.role = role;
    }

    if (dto.isActive === true && !user.isActive) {
      user.deactivatedAt = null;
      user.deletionRequestedAt = null;
    }

    Object.assign(user, dto);
    return this.usersRepository.save(user);
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    user.isActive = false;
    user.deactivatedAt = new Date();
    return this.usersRepository.save(user);
  }

  async hardDelete(id: string) {
    const user = await this.findOne(id);
    return this.usersRepository.remove(user);
  }
}
