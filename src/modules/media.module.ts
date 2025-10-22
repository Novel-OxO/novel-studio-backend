import { forwardRef, Module } from '@nestjs/common';

import { MediaController } from '@/api/controller/media/media.controller';

import { MediaService } from '@/domain/media/media.service';

import { AuthModule } from './auth.module';
import { UserModule } from './user.module';

@Module({
  imports: [forwardRef(() => AuthModule), forwardRef(() => UserModule)],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
