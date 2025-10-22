export class PresignedUrlResponse {
  presignedUrl: string;
  key: string;
  cloudFrontUrl: string;

  static create(presignedUrl: string, key: string, cloudFrontUrl: string): PresignedUrlResponse {
    const response = new PresignedUrlResponse();
    response.presignedUrl = presignedUrl;
    response.key = key;
    response.cloudFrontUrl = cloudFrontUrl;
    return response;
  }
}
