import { forwardRef, Module } from '@nestjs/common';

import { SectionController } from '@/api/controller/sections/section.controller';

import { SECTION_REPOSITORY } from '@/domain/sections/section.repository';
import { SectionService } from '@/domain/sections/section.service';

import { PrismaSectionRepository } from '@/infrastructure/database/prisma.section';

import { AuthModule } from './auth.module';
import { CourseModule } from './course.module';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule), forwardRef(() => CourseModule)],
  controllers: [SectionController],
  providers: [
    SectionService,
    {
      provide: SECTION_REPOSITORY,
      useClass: PrismaSectionRepository,
    },
  ],
  exports: [SectionService, SECTION_REPOSITORY],
})
export class SectionModule {}
