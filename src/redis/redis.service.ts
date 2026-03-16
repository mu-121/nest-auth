import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { createClient } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  public readonly client = createClient({
    username: 'default',
    password: 'GdJbcGIVapmkC41emcMORjlFHXqhI89x',
    socket: {
      host: 'redis-13272.c15.us-east-1-4.ec2.cloud.redislabs.com',
      port: 13272,
    },
  });

  constructor() {
    this.client.on('error', (err) => this.logger.error('Redis Client Error', err));
  }

  async onModuleInit() {
    await this.client.connect();
    this.logger.log('Redis connected successfully');
  }

  async onModuleDestroy() {
    await this.client.disconnect();
    this.logger.log('Redis disconnected');
  }
}
