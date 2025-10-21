import { forwardRef, Module } from '@nestjs/common';

import { OrderController } from '@/api/controller/orders/order.controller';

import { ORDER_REPOSITORY } from '@/domain/orders/order.repository';
import { OrderService } from '@/domain/orders/order.service';

import { PrismaOrderRepository } from '@/infrastructure/database/prisma.order';

import { AuthModule } from './auth.module';
import { CartModule } from './cart.module';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule), CartModule],
  controllers: [OrderController],
  providers: [
    OrderService,
    {
      provide: ORDER_REPOSITORY,
      useClass: PrismaOrderRepository,
    },
  ],
  exports: [OrderService, ORDER_REPOSITORY],
})
export class OrderModule {}
