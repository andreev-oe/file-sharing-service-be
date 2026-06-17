import { Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  async findById(id: string): Promise<User> {
    throw new Error('Not implemented');
  }

  async findByEmail(email: string): Promise<User | null> {
    throw new Error('Not implemented');
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    throw new Error('Not implemented');
  }

  async updateAvatar(id: string, s3Key: string): Promise<User> {
    throw new Error('Not implemented');
  }
}
