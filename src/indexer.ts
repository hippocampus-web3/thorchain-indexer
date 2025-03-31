import { MidgardClient } from './midgardClient';
import { DatabaseManager } from './db';
import { TemplateLoader } from './loadTemplates';
import { getParser } from './parsers';
import { Template, MidgardAction } from './types';

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
    this.templates = this.templateLoader.loadTemplates();
  }

  private async getLastProcessedBlock(address: string): Promise<number> {
    const indexerStateRepo = this.dbManager.getRepository('IndexerState');
    const state = await indexerStateRepo.findOne({ where: { address } });
    return state?.lastBlock || 0;
  }

  private async updateLastProcessedBlock(address: string, block: number) {
    const indexerStateRepo = this.dbManager.getRepository('IndexerState');
    await indexerStateRepo.upsert(
      {
        address,
        lastBlock: block,
        lastUpdated: new Date(),
      },
      ['address']
    );
  }

  private filterActionsByPrefix(actions: MidgardAction[], prefix: string): MidgardAction[] {
    return actions.filter(action => action.metadata.send.memo.startsWith(prefix));
  }

  async processTemplate(template: Template) {
    const lastBlock = await this.getLastProcessedBlock(template.address);
    const actions = await this.midgardClient.getActions(template.address);
    
    // Filter actions by height
    const newActions = actions.filter(action => action.height > lastBlock);
    
    // Process each prefix
    for (const prefix of template.prefix) {
      const filteredActions = this.filterActionsByPrefix(newActions, prefix);
      const parser = getParser(template.parser);
      const repository = this.dbManager.getRepository(template.table);

      for (const action of filteredActions) {
        try {
          const parsedData = parser(action);
          await repository.save(parsedData);
        } catch (error) {
          console.warn(`Error processing action ${action.in[0]?.txID}:`, error);
        }
      }
    }

    // Update last processed block
    if (newActions.length > 0) {
      const maxBlock = Math.max(...newActions.map(a => a.height));
      await this.updateLastProcessedBlock(template.address, maxBlock);
    }
  }

  async processAllTemplates() {
    for (const template of this.templates) {
      try {
        await this.processTemplate(template);
      } catch (error) {
        console.error(`Error processing template for address ${template.address}:`, error);
      }
    }
  }

  async close() {
    await this.dbManager.close();
  }
} 