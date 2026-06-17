import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type Redis from 'ioredis';
import {
  DEFAULT_ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  DEFAULT_REFRESH_TOKEN_EXPIRES_IN_SECONDS,
} from '../../config/jwt.config';
import { REDIS } from '../cache/redis.provider';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const REDIS_REFRESH_TOKEN_KEY_PREFIX = 'refresh:';

interface RefreshTokenPayload {
  sub: string;
  jti: string;
  type: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  async register(dto: RegisterDto): Promise<void> {
    await this.usersService.create(dto.email, dto.password, dto.name);
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokenPair(user.id);
  }

  async refresh(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: RefreshTokenPayload;

    try {
      payload = this.jwtService.verify<RefreshTokenPayload>(token, {
        secret: this.config.get<string>('jwt.secret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException();
    }

    const storedUserId = await this.redis.get(`${REDIS_REFRESH_TOKEN_KEY_PREFIX}${payload.jti}`);
    if (!storedUserId) {
      throw new UnauthorizedException('Refresh token revoked or expired');
    }

    await this.redis.del(`${REDIS_REFRESH_TOKEN_KEY_PREFIX}${payload.jti}`);
    return this.issueTokenPair(payload.sub);
  }

  async logout(token: string): Promise<void> {
    const payload = this.jwtService.decode(token);
    if (payload && typeof payload === 'object' && 'jti' in payload && typeof payload.jti === 'string') {
      await this.redis.del(`${REDIS_REFRESH_TOKEN_KEY_PREFIX}${payload.jti}`);
    }
  }

  private async issueTokenPair(
    userId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const jti = crypto.randomUUID();
    const secret = this.config.get<string>('jwt.secret');
    const accessExpiresIn = this.config.get<number>(
      'jwt.accessExpiresInSeconds',
      DEFAULT_ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    );
    const refreshExpiresIn = this.config.get<number>(
      'jwt.refreshExpiresInSeconds',
      DEFAULT_REFRESH_TOKEN_EXPIRES_IN_SECONDS,
    );

    const accessToken = this.jwtService.sign(
      { sub: userId },
      { secret, expiresIn: accessExpiresIn },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId, jti, type: 'refresh' },
      { secret, expiresIn: refreshExpiresIn },
    );

    await this.redis.set(
      `${REDIS_REFRESH_TOKEN_KEY_PREFIX}${jti}`,
      userId,
      'EX',
      refreshExpiresIn,
    );

    return { accessToken, refreshToken };
  }
}
