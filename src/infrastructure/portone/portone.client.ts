import { PortOneClient } from '@portone/server-sdk';

/**
 * 포트원 클라이언트 싱글톤
 */
export class PortOneClientService {
  private static instance: ReturnType<typeof PortOneClient>;

  static getInstance(): ReturnType<typeof PortOneClient> {
    if (!this.instance) {
      const apiSecret = process.env.PORT_ONE_API_SECRET;
      if (!apiSecret) {
        throw new Error('PORT_ONE_API_SECRET environment variable is not set');
      }
      this.instance = PortOneClient({ secret: apiSecret });
    }
    return this.instance;
  }
}
