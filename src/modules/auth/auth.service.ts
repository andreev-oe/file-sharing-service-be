import { Injectable } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  async register(dto: RegisterDto): Promise<void> {
    throw new Error('Not implemented');
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    throw new Error('Not implemented');
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    throw new Error('Not implemented');
  }

  async logout(refreshToken: string): Promise<void> {
    throw new Error('Not implemented');
  }
}
