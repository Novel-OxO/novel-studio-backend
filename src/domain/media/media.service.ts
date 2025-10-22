import { randomUUID } from 'crypto';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { USER_REPOSITORY, type IUserRepository } from '@/domain/users/user.repository';

@Injectable()
export class MediaService {
  private s3Client: S3Client;
  private cloudFrontDomain: string;
  private bucketName: string;

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly configService: ConfigService,
  ) {
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const cloudFrontDomain = this.configService.get<string>('CLOUDFRONT_DOMAIN');
    const bucketName = this.configService.get<string>('AWS_S3_BUCKET');

    if (!region || !accessKeyId || !secretAccessKey || !cloudFrontDomain || !bucketName) {
      throw new Error('AWS 설정이 올바르지 않습니다.');
    }

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    this.cloudFrontDomain = cloudFrontDomain;
    this.bucketName = bucketName;
  }

  async generatePresignedUrl(userId: string, fileName: string) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('관리자만 미디어를 업로드할 수 있습니다.');
    }

    const fileExtension = fileName.split('.').pop();
    const key = `media/${userId}/${randomUUID()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const presignedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600, // 1시간
    });

    return {
      presignedUrl,
      key,
      cloudFrontUrl: this.getMediaUrl(key),
    };
  }

  getMediaUrl(key: string): string {
    return `https://${this.cloudFrontDomain}/${key}`;
  }
}
