import { Repository, ObjectLiteral, DataSource } from 'typeorm';
import { IndexerState } from './entities/IndexerState';
import { NodeListing } from './entities/NodeListing';
import { WhitelistRequest } from './entities/WhitelistRequest';
import logger from './utils/logger';
import { ChatMessage } from './entities/ChatMessage';

export class DatabaseManager {

  private dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async initialize() {
    try {
      logger.info('Initializing database connection...');
      await this.dataSource.initialize();
      logger.info('Database connection initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  getRepository(tableName: string): Repository<ObjectLiteral> {
    try {
      switch (tableName) {
        case 'IndexerState':
          return this.dataSource.getRepository(IndexerState);
        case 'node_listings':
          return this.dataSource.getRepository(NodeListing);
        case 'whitelist_requests':
          return this.dataSource.getRepository(WhitelistRequest);
        case 'chat_messages':
          return this.dataSource.getRepository(ChatMessage);
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
      await this.dataSource.destroy();
      logger.info('Database connection closed successfully');
    } catch (error) {
      logger.error('Error closing database connection:', error);
      throw error;
    }
  }
} 