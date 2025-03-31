import { Repository, ObjectLiteral } from 'typeorm';
import { Template } from './types';
import { AppDataSource } from './data-source';
import { IndexerState } from './entities/IndexerState';
import { NodeListing } from './entities/NodeListing';

export class DatabaseManager {
  async initialize() {
    await AppDataSource.initialize();
    await AppDataSource.runMigrations();
  }

  getRepository(tableName: string): Repository<ObjectLiteral> {
    switch (tableName) {
      case 'IndexerState':
        return AppDataSource.getRepository(IndexerState);
      case 'node_listings':
        return AppDataSource.getRepository(NodeListing);
      default:
        throw new Error(`No repository found for table: ${tableName}`);
    }
  }

  async close() {
    await AppDataSource.destroy();
  }
} 