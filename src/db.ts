import { Repository, ObjectLiteral, DataSource } from 'typeorm';
import { IndexerState } from './entities/IndexerState';
import { NodeListing } from './entities/NodeListing';
import { WhitelistRequest } from './entities/WhitelistRequest';
import logger from './utils/logger';
import { ChatMessage } from './entities/ChatMessage';

export class DatabaseManager {
  private mainDataSource: DataSource;
  private subscriptionDataSource: DataSource;

  constructor(mainDataSource: DataSource, subscriptionDataSource: DataSource) {
    this.mainDataSource = mainDataSource;
    this.subscriptionDataSource = subscriptionDataSource;
  }

  async initialize() {
    try {
      logger.info('Initializing main database connection...');
      await this.mainDataSource.initialize();
      logger.info('Main database connection initialized successfully');

      logger.info('Initializing subscription database connection...');
      await this.subscriptionDataSource.initialize();
      logger.info('Subscription database connection initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize databases:', error);
      throw error;
    }
  }

  getRepository(tableName: string): Repository<ObjectLiteral> {
    try {
      if (tableName === 'subscriptions') {
        return this.subscriptionDataSource.getRepository('subscriptions');
      }

      switch (tableName) {
        case 'IndexerState':
          return this.mainDataSource.getRepository(IndexerState);
        case 'node_listings':
          return this.mainDataSource.getRepository(NodeListing);
        case 'whitelist_requests':
          return this.mainDataSource.getRepository(WhitelistRequest);
        case 'chat_messages':
          return this.mainDataSource.getRepository(ChatMessage);
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
      logger.info('Closing database connections...');
      await this.mainDataSource.destroy();
      await this.subscriptionDataSource.destroy();
      logger.info('Database connections closed successfully');
    } catch (error) {
      logger.error('Error closing database connections:', error);
      throw error;
    }
  }
} 