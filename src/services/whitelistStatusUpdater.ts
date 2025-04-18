import { AppDataSourceApi } from '../data-source-api';
import { WhitelistRequest } from '../entities/WhitelistRequest';
import { genericCache } from '../utils/genericCache';
import logger from '../utils/logger';
import { WhitelistRequestStatus } from '../api/types/WhitelistDTO';

export class WhitelistStatusUpdater {
  private static instance: WhitelistStatusUpdater;
  private isRunning: boolean = false;
  private updateInterval: number = 3 * 60 * 1000; // 2 minutes
  private readonly DELAY_BETWEEN_UPDATES = 500; // 200ms delay between updates

  private constructor() {}

  public static getInstance(): WhitelistStatusUpdater {
    if (!WhitelistStatusUpdater.instance) {
      WhitelistStatusUpdater.instance = new WhitelistStatusUpdater();
    }
    return WhitelistStatusUpdater.instance;
  }

  public start() {
    if (this.isRunning) {
      logger.warn('WhitelistStatusUpdater is already running');
      return;
    }

    this.isRunning = true;
    this.scheduleNextUpdate();
    logger.info('WhitelistStatusUpdater started');
  }

  public stop() {
    this.isRunning = false;
    logger.info('WhitelistStatusUpdater stopped');
  }

  private scheduleNextUpdate() {
    if (!this.isRunning) return;

    setTimeout(async () => {
      try {
        await this.updateAllStatuses();
      } catch (error) {
        logger.error('Error in WhitelistStatusUpdater:', error);
      } finally {
        this.scheduleNextUpdate();
      }
    }, this.updateInterval);
  }

  private async updateAllStatuses() {
    const requests = await AppDataSourceApi.getRepository(WhitelistRequest).find();
    logger.info(`Starting update of ${requests.length} whitelist requests`);
    
    for (const request of requests) {
      try {
        const bondInfo = await genericCache.getBondInfo(request.nodeAddress, request.userAddress); // TODO: Update all users from a node at once to reduce API calls
        
        let newStatus: WhitelistRequestStatus = "pending";
        if (bondInfo.isBondProvider) {
          newStatus = "approved";
        }
        if (bondInfo.isBondProvider && bondInfo.bond > 0) {
          newStatus = "bonded";
        }

        if (request.status !== newStatus || request.realBond !== bondInfo.bond) {
          request.status = newStatus;
          request.realBond = bondInfo.bond;
          await AppDataSourceApi.getRepository(WhitelistRequest).save(request);
          logger.info(`Updated whitelist request ${request.id} status to ${newStatus} and realBond to ${bondInfo.bond}`);
        }
      } catch (error) {
        logger.error(`Error updating whitelist request ${request.id}:`, error);
      }
      
      // Add delay between updates
      await new Promise(resolve => setTimeout(resolve, this.DELAY_BETWEEN_UPDATES)); // TODO: Remove delay (rate limits)
    }
    
    logger.info('Finished updating all whitelist requests');
  }
} 