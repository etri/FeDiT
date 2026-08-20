import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';

import { User } from '../../users/entities/user.entity';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  pwd_iat?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET must be set in environment');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersRepo.findOne({
      where: { id: payload.sub, isActive: true },
    });
    if (!user) {
      throw new UnauthorizedException({
        errorCode: 'ACCOUNT_DEACTIVATED',
        message: 'Account is deactivated',
      });
    }
    if (payload.pwd_iat !== undefined && user.passwordChangedAt) {
      if (payload.pwd_iat < user.passwordChangedAt.getTime()) {
        throw new UnauthorizedException({
          errorCode: 'PASSWORD_CHANGED',
          message: 'Password was changed; please sign in again',
        });
      }
    }
    return {
      id: user.id,
      email: payload.email,
      role: user.role?.name,
    };
  }
}
