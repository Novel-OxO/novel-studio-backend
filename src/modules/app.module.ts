import { Module } from '@nestjs/common';

import { PrismaModule } from './prisma.module';

const externalModules = [PrismaModule];

@Module({
  imports: [...externalModules],
  controllers: [],
  providers: [],
})
export class AppModule {}
