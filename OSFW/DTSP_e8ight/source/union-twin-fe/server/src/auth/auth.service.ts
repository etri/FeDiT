import { createHash, randomBytes } from 'crypto';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestAccountDeletionDto } from './dto/request-account-deletion.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { RefreshToken } from './entities/refresh-token.entity';
import { BCRYPT_SALT_ROUNDS, Role } from '../common/constants';
import { isUniqueViolation } from '../common/utils/database';
import { Role as RoleEntity } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  randomBytes(32).toString('hex'),
  BCRYPT_SALT_ROUNDS,
);

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(RoleEntity)
    private rolesRepository: Repository<RoleEntity>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const viewerRole = await this.rolesRepository.findOne({
      where: { name: Role.VIEWER },
    });
    if (!viewerRole) {
      throw new InternalServerErrorException(
        'Default VIEWER role not found. Run seeds first.',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    try {
      const user = this.usersRepository.create({
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        organization: dto.organization ?? null,
        phoneNumber: dto.phoneNumber ?? null,
        roleId: viewerRole.id,
      });
      const savedUser = await this.usersRepository.save(user);
      const fullUser = await this.usersRepository.findOneOrFail({
        where: { id: savedUser.id },
      });
      return this.generateTokens(fullUser);
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

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        isActive: true,
        deletionRequestedAt: true,
        roleId: true,
        passwordChangedAt: true,
      },
      relations: { role: true },
    });

    const passwordMatch = await bcrypt.compare(
      dto.password,
      user?.password ?? DUMMY_PASSWORD_HASH,
    );

    if (!user || !passwordMatch) {
      throw new UnauthorizedException({
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials',
      });
    }

    if (!user.isActive) {
      if (user.deletionRequestedAt) {
        throw new UnauthorizedException({
          errorCode: 'ACCOUNT_DELETION_REQUESTED',
          message: 'Account deletion has been requested',
        });
      }
      throw new UnauthorizedException({
        errorCode: 'ACCOUNT_DEACTIVATED',
        message: 'Account is deactivated',
      });
    }

    return this.generateTokens(user);
  }

  async refresh(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);

    const { raw } = await this.refreshTokenRepository
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ isRevoked: true })
      .where('"tokenHash" = :tokenHash', { tokenHash })
      .andWhere('"isRevoked" = false')
      .andWhere('"expiresAt" > now()')
      .returning('*')
      .execute();

    const storedToken: RefreshToken | undefined = (raw as RefreshToken[])[0];

    if (!storedToken) {
      throw new UnauthorizedException({
        errorCode: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid or expired refresh token',
      });
    }

    const user = await this.usersRepository.findOne({
      where: { id: storedToken.userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException({
        errorCode: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid or expired refresh token',
      });
    }

    return this.generateTokens(user);
  }

  async logout(userId: string) {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  async getProfile(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  async updateProfile(userId: string, dto: UpdateMeDto) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException();

    Object.assign(user, dto);
    return this.usersRepository.save(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException({
        errorCode: 'SAME_AS_CURRENT_PASSWORD',
        message: 'New password must differ from the current one',
      });
    }

    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'password'],
    });
    if (!user) throw new UnauthorizedException();

    const passwordMatch = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );
    if (!passwordMatch) {
      throw new UnauthorizedException({
        errorCode: 'INVALID_CURRENT_PASSWORD',
        message: 'Current password is incorrect',
      });
    }

    const hashedPassword = await bcrypt.hash(
      dto.newPassword,
      BCRYPT_SALT_ROUNDS,
    );

    await this.logout(userId);
    await this.usersRepository.update(
      { id: userId },
      { password: hashedPassword, passwordChangedAt: new Date() },
    );
  }

  async requestAccountDeletion(userId: string, dto: RequestAccountDeletionDto) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: { id: true, password: true },
      relations: { role: true },
    });
    if (!user) throw new UnauthorizedException();

    if (user.role?.name === Role.ADMIN) {
      throw new ForbiddenException({
        errorCode: 'ADMIN_CANNOT_REQUEST_DELETION',
        message: 'Admin accounts cannot request deletion',
      });
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException({
        errorCode: 'INVALID_CURRENT_PASSWORD',
        message: 'Current password is incorrect',
      });
    }

    const now = new Date();
    await this.logout(userId);
    await this.usersRepository.update(
      { id: userId },
      { isActive: false, deactivatedAt: now, deletionRequestedAt: now },
    );
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role?.name,
      pwd_iat: user.passwordChangedAt?.getTime() ?? 0,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = randomBytes(48).toString('base64url');

    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await this.refreshTokenRepository
      .createQueryBuilder()
      .delete()
      .where('userId = :userId', { userId: user.id })
      .andWhere('expiresAt < now()')
      .execute();

    await this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({
        tokenHash: hashToken(refreshToken),
        userId: user.id,
        expiresAt,
      }),
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role?.name,
      },
    };
  }
}
