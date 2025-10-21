import { Module } from '@nestjs/common';

import { PaymentController } from '@/api/controller/payments/payment.controller';

import { ENROLLMENT_REPOSITORY } from '@/domain/enrollments/enrollment.repository';
import { PAYMENT_REPOSITORY } from '@/domain/payments/payment.repository';
import { PaymentService } from '@/domain/payments/payment.service';

import { PrismaEnrollmentRepository } from '@/infrastructure/database/prisma.enrollment';
import { PrismaPaymentRepository } from '@/infrastructure/database/prisma.payment';

import { OrderModule } from './order.module';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule, OrderModule],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    {
      provide: PAYMENT_REPOSITORY,
      useClass: PrismaPaymentRepository,
    },
    {
      provide: ENROLLMENT_REPOSITORY,
      useClass: PrismaEnrollmentRepository,
    },
  ],
  exports: [PaymentService, PAYMENT_REPOSITORY, ENROLLMENT_REPOSITORY],
})
export class PaymentModule {}
