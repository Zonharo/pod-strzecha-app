import type { AppNotification } from '@/domain/notifications/notifications';

export type NotificationRepository = {
  list(offset: number, limit: number): Promise<AppNotification[]>;
  unreadCount(): Promise<number>;
  markAllRead(): Promise<void>;
};
