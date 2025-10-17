import { Injectable } from '@nestjs/common';

import { NewUser } from '@/domain/users/new-user';
import { UpdateUser } from '@/domain/users/update-user';
import { User, UserRole } from '@/domain/users/user';
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
      createdUser.role as UserRole,
      createdUser.createdAt,
      createdUser.updatedAt,
      createdUser.deletedAt,
    );
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
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
      user.role as UserRole,
      user.createdAt,
      user.updatedAt,
      user.deletedAt,
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
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
      user.role as UserRole,
      user.createdAt,
      user.updatedAt,
      user.deletedAt,
    );
  }

  async findByEmailIncludingDeleted(email: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
      },
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
      user.role as UserRole,
      user.createdAt,
      user.updatedAt,
      user.deletedAt,
    );
  }

  async update(id: string, updateUser: UpdateUser): Promise<User> {
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...(updateUser.nickname && { nickname: updateUser.nickname }),
        ...(updateUser.profileImageUrl !== undefined && { profileImageUrl: updateUser.profileImageUrl }),
      },
    });

    return new User(
      updatedUser.id,
      updatedUser.email,
      updatedUser.hashedPassword,
      updatedUser.nickname,
      updatedUser.profileImageUrl,
      updatedUser.role as UserRole,
      updatedUser.createdAt,
      updatedUser.updatedAt,
      updatedUser.deletedAt,
    );
  }

  async restore(id: string, newUser: NewUser): Promise<User> {
    const restoredUser = await this.prisma.user.update({
      where: { id },
      data: {
        hashedPassword: newUser.password,
        nickname: newUser.nickname,
        deletedAt: null,
      },
    });

    return new User(
      restoredUser.id,
      restoredUser.email,
      restoredUser.hashedPassword,
      restoredUser.nickname,
      restoredUser.profileImageUrl,
      restoredUser.role as UserRole,
      restoredUser.createdAt,
      restoredUser.updatedAt,
      restoredUser.deletedAt,
    );
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
