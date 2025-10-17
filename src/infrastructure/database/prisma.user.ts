import { Injectable } from '@nestjs/common';

import { NewUser } from '@/domain/users/new-user';
import { User } from '@/domain/users/user';
import { IUserRepository } from '@/domain/users/user.repository';

import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(user: NewUser): Promise<User> {
    const createdUser = await this.prisma.user.create({
      data: {
        email: user.email,
        hashedPassword: user.password,
        nickname: user.nickname,
      },
    });

    return new User(
      createdUser.id,
      createdUser.email,
      createdUser.hashedPassword,
      createdUser.nickname,
      createdUser.profileImageUrl,
      createdUser.createdAt,
      createdUser.updatedAt,
      createdUser.deletedAt,
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    return new User(
      user.id,
      user.email,
      user.hashedPassword,
      user.nickname,
      user.profileImageUrl,
      user.createdAt,
      user.updatedAt,
      user.deletedAt,
    );
  }
}
