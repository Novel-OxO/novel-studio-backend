import { utilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';

import { LoggerService } from '@nestjs/common';

export function createAppLogger(): LoggerService {
  const isProduction = process.env.NODE_ENV === 'production';

  const consoleTransport = new winston.transports.Console({
    level: isProduction ? 'info' : 'debug',
    format: winston.format.combine(
      winston.format.timestamp(),
      utilities.format.nestLike('c4-cometrue', { prettyPrint: true, colors: true }),
    ),
  });

  const transports: winston.transport[] = [consoleTransport];

  if (isProduction) {
    transports.push(
      new winston.transports.File({
        filename: 'error.log',
        level: 'error',
      }),
      new winston.transports.File({
        filename: 'combined.log',
        level: 'info',
      }),
    );
  }

  return WinstonModule.createLogger({
    transports,
  });
}
