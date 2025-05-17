import { notificationQueue } from '../queues/notificationQueue';
import { NotificationJob, NotificationType, NotificationPayload } from '../types/NotificationJob';
import logger from '../utils/logger';

export class NotificationService {
  private static instance: NotificationService;
  private notificationsEnabled: boolean;

  private constructor() {
    this.notificationsEnabled = process.env.ENABLE_NOTIFICATIONS === 'true';
    logger.info(`Notifications service initialized. Notifications ${this.notificationsEnabled ? 'enabled' : 'disabled'}`);
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async emitNotification<T extends NotificationType>(
    observableAddress: string,
    type: T,
    payload: NotificationPayload[T]
  ): Promise<void> {
    if (!this.notificationsEnabled) {
      logger.debug(`Notifications disabled. Skipping notification ${type} for address ${observableAddress}`);
      return;
    }

    try {
      const job: NotificationJob = {
        observableAddress,
        type,
        payload,
      };

      await notificationQueue.add('notification', job);
      logger.info(`Notification job added to queue: ${type} for address ${observableAddress}`);
    } catch (error) {
      logger.error(`Error emitting notification ${type} for address ${observableAddress}:`, error);
      throw error;
    }
  }

  public async emitWhitelistRequest(
    nodeAddress: string,
    requesterAddress: string,
    message?: string
  ): Promise<void> {
    await this.emitNotification(nodeAddress, 'whitelist_request', {
      nodeName: nodeAddress,
      nodeDashboardUrl: `https://thorbond.gitbook.io/runebond/sections/markdown#pending`,
      requesterAddress,
      message,
    });
  }

  public async emitWhitelistResponse(
    nodeAddress: string,
    requesterAddress: string,
    type: 'whitelist_accepted' | 'whitelist_rejected',
    reason?: string
  ): Promise<void> {
    await this.emitNotification(requesterAddress, type, {
      nodeName: nodeAddress,
      nodeDashboardUrl: `${process.env.RUNEBOND_URL || "https://runebond.com"}/nodes/${nodeAddress}`,
      reason,
    });
  }

  public async emitChatMessage(
    nodeAddress: string,
    senderAddress: string,
    message: string,
    isWhitelistUser: boolean = false
  ): Promise<void> {
    const observableAddress = isWhitelistUser ? senderAddress : nodeAddress;
    
    await this.emitNotification(observableAddress, 'node_chat_message', {
      nodeName: nodeAddress,
      nodeDashboardUrl: `${process.env.RUNEBOND_URL || "https://runebond.com"}/nodes/${nodeAddress}`,
      senderAddress,
      message,
      nodeChatUrl: `${process.env.RUNEBOND_URL || "https://runebond.com"}/nodes/${nodeAddress}`,
    });
  }
} 