import { MidgardClient } from './midgardClient';
import { DatabaseManager } from './db';
import { TemplateLoader } from './loadTemplates';
import { getParser } from './parsers';
import { Template, MidgardAction } from './types';
import logger from './utils/logger';

export class Indexer {
  private midgardClient: MidgardClient;
  private dbManager: DatabaseManager;
  private templateLoader: TemplateLoader;
  private templates: Template[] = [];

  constructor() {
    this.midgardClient = new MidgardClient();
    this.dbManager = new DatabaseManager();
    this.templateLoader = new TemplateLoader();
  }

  async initialize() {
    try {
      logger.info('Initializing indexer...');
      this.templates = this.templateLoader.loadTemplates();
      logger.info(`Loaded ${this.templates.length} templates`);
    } catch (error) {
      logger.error('Failed to initialize indexer:', error);
      throw error;
    }
  }

  private async getLastProcessedBlock(address: string): Promise<number> {
    try {
      const indexerStateRepo = this.dbManager.getRepository('IndexerState');
      const state = await indexerStateRepo.findOne({ where: { address } });
      const lastBlock = state?.lastBlock || 0;
      logger.debug(`Last processed block for address ${address}: ${lastBlock}`);
      return lastBlock;
    } catch (error) {
      logger.error(`Error getting last processed block for address ${address}:`, error);
      throw error;
    }
  }

  private async updateLastProcessedBlock(address: string, block: number) {
    try {
      const indexerStateRepo = this.dbManager.getRepository('IndexerState');
      await indexerStateRepo.upsert(
        {
          address,
          lastBlock: block,
          lastUpdated: new Date(),
        },
        ['address']
      );
      logger.debug(`Updated last processed block for address ${address} to ${block}`);
    } catch (error) {
      logger.error(`Error updating last processed block for address ${address}:`, error);
      throw error;
    }
  }

  private filterActionsByPrefix(actions: MidgardAction[], prefix: string): MidgardAction[] {
    const filtered = actions.filter(action => action.metadata.send.memo.startsWith(prefix));
    logger.debug(`Filtered ${actions.length} actions to ${filtered.length} with prefix ${prefix}`);
    return filtered;
  }

  async processTemplate(template: Template) {
    try {
      logger.info(`Processing template for address ${template.address}`);
      const lastBlock = await this.getLastProcessedBlock(template.address);
      const actions = await this.midgardClient.getActions(template.address);
      
      // Filter actions by height
      const newActions = actions.filter(action => action.height > lastBlock);
      logger.info(`Found ${newActions.length} new actions for address ${template.address}`);
      
      // Process each prefix
      for (const prefix of template.prefix) {
        logger.debug(`Processing prefix ${prefix} for address ${template.address}`);
        const filteredActions = this.filterActionsByPrefix(newActions, prefix);
        const parser = getParser(template.parser);
        const repository = this.dbManager.getRepository(template.table);

        for (const action of filteredActions) {
          try {
            const parsedData = parser(action);
            await repository.save(parsedData);
            logger.debug(`Saved action ${action.in[0]?.txID} for address ${template.address}`);
          } catch (error) {
            logger.warn(`Error processing action ${action.in[0]?.txID}:`, error);
          }
        }
      }

      // Update last processed block
      if (newActions.length > 0) {
        const maxBlock = Math.max(...newActions.map(a => a.height));
        await this.updateLastProcessedBlock(template.address, maxBlock);
        logger.info(`Updated last processed block for address ${template.address} to ${maxBlock}`);
      }
    } catch (error) {
      logger.error(`Error processing template for address ${template.address}:`, error);
      throw error;
    }
  }

  async processAllTemplates() {
    logger.info('Starting to process all templates');
    for (const template of this.templates) {
      try {
        await this.processTemplate(template);
      } catch (error) {
        logger.error(`Error processing template for address ${template.address}:`, error);
      }
    }
    logger.info('Finished processing all templates');
  }

  async close() {
    try {
      logger.info('Closing indexer...');
      await this.dbManager.close();
      logger.info('Indexer closed successfully');
    } catch (error) {
      logger.error('Error closing indexer:', error);
      throw error;
    }
  }
} 