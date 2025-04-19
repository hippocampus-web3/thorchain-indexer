import { MidgardClient } from '../utils/midgardClient';
import { DatabaseManager } from '../db';
import { TemplateLoader } from './loadTemplates';
import { getParser } from './parsers';
import { Template, MidgardAction } from '../types';
import logger from '../utils/logger';
import { checkTransactionAmount } from '../utils/checkTransactionAmount';

export class Indexer {
  private midgardClient: MidgardClient;
  private dbManager: DatabaseManager;
  private templateLoader: TemplateLoader;
  private templates: Template[] = [];

  constructor(dbManager: DatabaseManager) {
    this.midgardClient = new MidgardClient();
    this.dbManager = dbManager;
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
      logger.error(`Error updating last processed block for address ${address}: ${(error as Error)?.message}`);
      logger.silly(`Error updating last processed block for address ${address}:`, error);
      throw error;
    }
  }

  private async processAction(action: MidgardAction, templates: Template[]) {
    for (const template of templates) {
      for (const prefix of template.prefix) {
        if (action.metadata.send.memo.startsWith(prefix)) {
          try {
            checkTransactionAmount(action, template.minAmount)
            const parser = getParser(template.parser);
            const repository = this.dbManager.getRepository(template.table);
            const parsedData = await parser(action, this.dbManager);
            await repository.save(parsedData);
            logger.debug(`Saved action ${action.in[0]?.txID} for template ${template.table}`);
          } catch (error) {
            if (error instanceof Error && error.message.includes('does not exist')) {
              logger.warn(`Skipping invalid action ${action.in[0]?.txID}: ${error.message}`);
            } else {
              logger.error(`Error processing action ${action.in[0]?.txID} for template ${template.table}: ${(error as Error)?.message}`);
              logger.silly(`Error processing action ${action.in[0]?.txID} for template ${template.table}:`, error);
            }
          }
        }
      }
    }
  }

  async processAddress(address: string) {
    try {
      logger.info(`Processing all templates for address ${address}`);
      const lastBlock = await this.getLastProcessedBlock(address);
      const actions = await this.midgardClient.getActions(address, lastBlock);

      actions.sort((a, b) => Number(a.date) - Number(b.date));

      // Get all templates for this address
      const addressTemplates = this.templates.filter(t => t.address === address);
      logger.debug(`Processing ${addressTemplates.length} templates for address ${address}`);

      logger.info(`Found ${actions.length} new actions from block ${lastBlock} for address ${address}`);
      // Process each action
      for (const action of actions) {
        await this.processAction(action, addressTemplates);
      }

      // Update last processed block
      if (actions.length > 0) {
        const maxBlock = Math.max(...actions.map(a => a.height));
        await this.updateLastProcessedBlock(address, maxBlock + 1);
        logger.info(`Updated last processed block for address ${address} to ${maxBlock}`);
      }
    } catch (error) {
      logger.error(`Error processing templates for address ${address}: ${(error as Error)?.message}`);
      logger.silly(`Error processing templates for address ${address}:`, error);
      throw error;
    }
  }

  async processAllTemplates() {
    logger.info('Starting to process all templates');
    // Get unique addresses
    const uniqueAddresses = [...new Set(this.templates.map(t => t.address))];
    logger.info(`Found ${uniqueAddresses.length} unique addresses to process`);
    
    for (const address of uniqueAddresses) {
      try {
        await this.processAddress(address);
      } catch (error) {
        logger.error(`Error processing address ${address}: ${(error as Error)?.message}`);
        logger.silly(`Error processing address ${address}:`, error);
      }
    }
    logger.info('Finished processing all templates');
  }
} 