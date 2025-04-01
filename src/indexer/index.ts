import { Indexer } from './indexer';
import { DatabaseManager } from '../db';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  try {
    // Initialize database first
    const dbManager = new DatabaseManager();
    await dbManager.initialize();

    // Then create and initialize indexer
    const indexer = new Indexer();
    await indexer.initialize();

    // Start processing
    while (true) {
      await indexer.processAllTemplates();
      await new Promise(resolve => setTimeout(resolve, 20000)); // Wait 15 seconds
    }
  } catch (error) {
    console.error('Error in main:', error);
    process.exit(1);
  }
}

main(); 