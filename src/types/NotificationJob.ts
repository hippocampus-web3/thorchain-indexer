export type NotificationType = 
  | 'node_status_changed'
  | 'whitelist_request'
  | 'whitelist_accepted'
  | 'whitelist_rejected'
  | 'node_chat_message'
  | 'subscription_active';

export type BaseNotificationPayload = {
  nodeName: string;
  nodeDashboardUrl: string;
};

export type NodeStatusPayload = BaseNotificationPayload & {
  status: string;
  details?: string;
};

export type WhitelistRequestPayload = BaseNotificationPayload & {
  requesterAddress: string;
  message?: string;
};

export type WhitelistResponsePayload = BaseNotificationPayload & {
  reason?: string;
};

export type ChatMessagePayload = BaseNotificationPayload & {
  senderAddress: string;
  message: string;
  nodeChatUrl: string;
};

export type SubscriptionActivePayload = BaseNotificationPayload & {
  channel: string;
  thorchainAddress: string;
  expirationDate: string;
};

export type NotificationPayload = {
  node_status_changed: NodeStatusPayload;
  whitelist_request: WhitelistRequestPayload;
  whitelist_accepted: WhitelistResponsePayload;
  whitelist_rejected: WhitelistResponsePayload;
  node_chat_message: ChatMessagePayload;
  subscription_active: SubscriptionActivePayload;
};

export type NotificationJob = {
  observableAddress: string;
  type: NotificationType;
  payload: NotificationPayload[NotificationType];
}; 