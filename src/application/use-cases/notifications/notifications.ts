import type { NotificationRepository } from '@/application/ports/notifications';
import type { AppNotification } from '@/domain/notifications/notifications';
import { PAGE_SIZE, toPage, type Page } from '@/domain/purchases/purchase';

export const makeListNotifications =
  ({ notifications }: { notifications: NotificationRepository }) =>
  async (page: number): Promise<Page<AppNotification>> =>
    toPage(await notifications.list(page * PAGE_SIZE, PAGE_SIZE + 1), page);

export const makeUnreadCount =
  ({ notifications }: { notifications: NotificationRepository }) =>
  (): Promise<number> =>
    notifications.unreadCount();

export const makeMarkAllRead =
  ({ notifications }: { notifications: NotificationRepository }) =>
  (): Promise<void> =>
    notifications.markAllRead();
