import { Repository, ObjectLiteral } from 'typeorm';
import { AppDataSource } from './data-source';
import { IndexerState } from './entities/IndexerState';
import { NodeListing } from './entities/NodeListing';
import { WhitelistRequest } from './entities/WhitelistRequest';
import logger from './utils/logger';

export class DatabaseManager {
  async initialize() {
    try {
      logger.info('Initializing database connection...');
      await AppDataSource.initialize();
      logger.info('Database connection initialized successfully');
      
      logger.info('Running pending migrations...');
      await AppDataSource.runMigrations();
      logger.info('Migrations completed successfully');
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  getRepository(tableName: string): Repository<ObjectLiteral> {
    try {
      switch (tableName) {
        case 'IndexerState':
          return AppDataSource.getRepository(IndexerState);
        case 'node_listings':
          return AppDataSource.getRepository(NodeListing);
        case 'whitelist_requests':
          return AppDataSource.getRepository(WhitelistRequest);
        default:
          logger.error(`Repository not found for table: ${tableName}`);
          throw new Error(`No repository found for table: ${tableName}`);
      }
    } catch (error) {
      logger.error(`Error getting repository for table ${tableName}:`, error);
      throw error;
    }
  }

  async close() {
    try {
      logger.info('Closing database connection...');
      await AppDataSource.destroy();
      logger.info('Database connection closed successfully');
    } catch (error) {
      logger.error('Error closing database connection:', error);
      throw error;
    }
  }
} 