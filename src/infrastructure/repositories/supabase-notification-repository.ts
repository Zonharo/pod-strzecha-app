import type { NotificationRepository } from '@/application/ports/notifications';
import type { SupabaseClient } from '@/infrastructure/supabase/client';

export const makeSupabaseNotificationRepository = (
  supabase: SupabaseClient,
): NotificationRepository => ({
  async list(offset, limit) {
    const { data, error } = await supabase
      .from('customer_notifications')
      .select('id, kind, title, body, link, read_at, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    return data.map((row) => ({
      id: row.id,
      kind: row.kind,
      title: row.title,
      body: row.body,
      link: row.link,
      readAt: row.read_at,
      createdAt: row.created_at,
    }));
  },

  async unreadCount() {
    const { count, error } = await supabase
      .from('customer_notifications')
      .select('id', { count: 'exact', head: true })
      .is('read_at', null);
    if (error) throw new Error(error.message);
    return count ?? 0;
  },

  async markAllRead() {
    const { error } = await supabase
      .from('customer_notifications')
      .update({ read_at: new Date().toISOString() })
      .is('read_at', null);
    if (error) throw new Error(error.message);
  },
});
