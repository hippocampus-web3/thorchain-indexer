import { Indexer } from './indexer';
import { DatabaseManager } from '../db';
import { AppDataSource } from '../data-source';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

async function main() {
  try {
    // Initialize database first
    const dbManager = new DatabaseManager(AppDataSource);
    await dbManager.initialize();

    // Then create and initialize indexer
    const indexer = new Indexer(dbManager);
    await indexer.initialize();

    // Start processing
    while (true) {
      await indexer.processAllTemplates();
      await new Promise(resolve => setTimeout(resolve, 20000));
    }
  } catch (error) {
    logger.error('Error in main:', error);
    process.exit(1);
  }
}

main(); 