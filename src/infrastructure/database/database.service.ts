import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '../../modules/user/user.schema';

export type DrizzleDB = NodePgDatabase<typeof schema>;

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: pg.Pool;
  db: DrizzleDB;

  constructor(private readonly config: ConfigService) {
    this.pool = new pg.Pool({
      connectionString: this.config.getOrThrow<string>('DATABASE_URL'),
      max: 10,
    });

    this.db = drizzle(this.pool, { schema, logger: this.config.get('NODE_ENV') !== 'production' });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.pool.query('SELECT 1');
      this.logger.log('Database connected');
    } catch (error) {
      this.logger.error('Database connection failed', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
    this.logger.log('Database disconnected');
  }
}
