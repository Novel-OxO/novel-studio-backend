import { forwardRef, Module } from '@nestjs/common';

import { CartController } from '@/api/controller/cart/cart.controller';

import { CART_ITEM_REPOSITORY } from '@/domain/cart/cart-item.repository';
import { CartItemService } from '@/domain/cart/cart-item.service';

import { PrismaCartItemRepository } from '@/infrastructure/database/prisma.cart-item';

import { AuthModule } from './auth.module';
import { CourseModule } from './course.module';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule), CourseModule],
  controllers: [CartController],
  providers: [
    CartItemService,
    {
      provide: CART_ITEM_REPOSITORY,
      useClass: PrismaCartItemRepository,
    },
  ],
  exports: [CartItemService, CART_ITEM_REPOSITORY],
})
export class CartModule {}
