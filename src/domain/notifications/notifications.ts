export type NotificationKind =
  | 'welcome'
  | 'points_earned'
  | 'points_refunded'
  | 'points_expiring'
  | 'points_expired'
  | 'reward_expiring'
  | 'reward_expired'
  | 'birthday'
  | 'offer'
  | 'system';

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

const ROUTES: readonly RegExp[] = [
  /^\/$/,
  /^\/coupons$/,
  new RegExp(`^/coupons/${UUID}$`),
  /^\/rewards$/,
  new RegExp(`^/rewards/${UUID}$`),
  new RegExp(`^/rewards/redemptions/${UUID}$`),
  /^\/history$/,
  /^\/history\/points$/,
  new RegExp(`^/history/${UUID}$`),
  /^\/account$/,
  new RegExp(`^/offers/${UUID}$`),
];

export const appRoute = (link: string | null): string | null => {
  if (!link) return null;
  const path = link === '/card' ? '/' : link.toLowerCase();
  return ROUTES.some((route) => route.test(path)) ? path : null;
};

export const unreadCount = (items: readonly Pick<AppNotification, 'readAt'>[]): number =>
  items.filter((item) => item.readAt === null).length;

export const badgeLabel = (count: number): string | null =>
  count <= 0 ? null : count > 9 ? '9+' : String(count);
