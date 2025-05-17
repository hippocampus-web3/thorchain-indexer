import { AppDataSourceApi } from '../data-source-api';
import { WhitelistRequest } from '../entities/WhitelistRequest';
import { genericCache } from '../utils/genericCache';
import logger from '../utils/logger';
import { WhitelistRequestStatus } from '../api/types/WhitelistDTO';
import { NotificationService } from './notificationService';

export class WhitelistStatusUpdater {
  private static instance: WhitelistStatusUpdater;
  private isRunning: boolean = false;
  private updateInterval: number = 30 * 1000; // 30 secs
  private readonly DELAY_BETWEEN_UPDATES = 500;
  private readonly REJECTION_THRESHOLD_DAYS = 3;
  private notificationService: NotificationService;

  private constructor() {
    this.notificationService = NotificationService.getInstance();
  }

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
        // Skip if request is already rejected
        if (request.status === 'rejected') {
          continue;
        }

        const bondInfo = await genericCache.getBondInfo(request.nodeAddress, request.userAddress);
        
        // First check if request can be approved or bonded
        let newStatus: WhitelistRequestStatus = request.status;
        if (bondInfo.isBondProvider) {
          newStatus = "approved";
        }
        if (bondInfo.isBondProvider && bondInfo.bond > 0) {
          newStatus = "bonded";
        }

        if (request.status !== newStatus || Number(request.realBond) !== Number(bondInfo.bond)) {
          const oldStatus = request.status;
          request.status = newStatus;
          request.realBond = bondInfo.bond;
          await AppDataSourceApi.getRepository(WhitelistRequest).save(request);
          logger.info(`Updated whitelist request ${request.id} status to ${newStatus} and realBond to ${bondInfo.bond}`);

          // Emit notifications for status changes
          if (oldStatus === 'pending' && newStatus === 'approved') {
            await this.notificationService.emitWhitelistResponse(
              request.nodeAddress,
              request.userAddress,
              'whitelist_accepted',
              'Your whitelist request has been approved'
            );
          }
          continue;
        }

        // Only check for rejection if request is still pending
        if (request.status === 'pending') {
          const now = new Date();
          const requestAgeInDays = (now.getTime() - request.timestamp.getTime()) / (1000 * 60 * 60 * 24);
          
          if (requestAgeInDays > this.REJECTION_THRESHOLD_DAYS) {
            request.status = 'rejected';
            await AppDataSourceApi.getRepository(WhitelistRequest).save(request);
            logger.info(`Request ${request.id} automatically rejected after ${requestAgeInDays.toFixed(2)} days`);

            // Emit notification for automatic rejection
            await this.notificationService.emitWhitelistResponse(
              request.nodeAddress,
              request.userAddress,
              'whitelist_rejected',
              `Request automatically rejected after ${this.REJECTION_THRESHOLD_DAYS} days of inactivity`
            );
          }
        }
      } catch (error) {
        logger.error(`Error updating whitelist request ${request.id}:`, error);
      }
      
      // Add delay between updates
      await new Promise(resolve => setTimeout(resolve, this.DELAY_BETWEEN_UPDATES));
    }
    
    logger.info('Finished updating all whitelist requests');
  }
} 