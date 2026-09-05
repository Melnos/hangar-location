import { db } from '../lib/db';
import { syncService } from '../lib/sync';
import { generateId, now } from '../lib/utils';
import type { Notification, TypeNotification } from '../models';

export interface CreateNotificationInput {
  type: TypeNotification;
  reference_id: string;
}

export const notificationRepository = {
  async getAll(): Promise<Notification[]> {
    return db.notifications.orderBy('date_declenchement').reverse().toArray();
  },

  async getNonLues(): Promise<Notification[]> {
    return db.notifications.filter((n) => !n.lue).toArray();
  },

  async getById(id: string): Promise<Notification | undefined> {
    return db.notifications.get(id);
  },

  async getByType(type: TypeNotification): Promise<Notification[]> {
    return db.notifications.where('type').equals(type).toArray();
  },

  async create(input: CreateNotificationInput): Promise<Notification> {
    const notification: Notification = {
      id: generateId(),
      type: input.type,
      reference_id: input.reference_id,
      date_declenchement: now(),
      lue: false,
      updated_at: now(),
    };
    await db.notifications.add(notification);
    return notification;
  },

  async marquerLue(id: string): Promise<void> {
    await db.notifications.update(id, { lue: true, updated_at: now() });
  },

  async marquerToutesLues(): Promise<void> {
    const notifications = await db.notifications.toArray();
    for (const notification of notifications) {
      await db.notifications.update(notification.id, { lue: true, updated_at: now() });
    }
  },

  async delete(id: string): Promise<void> {
    await db.notifications.delete(id);
    syncService.markDeleted('notifications', id);
  },

  async deleteByReference(referenceId: string): Promise<void> {
    const notifications = await db.notifications.where('reference_id').equals(referenceId).toArray();
    await db.notifications.bulkDelete(notifications.map((notification) => notification.id));
    notifications.forEach((notification) => syncService.markDeleted('notifications', notification.id));
  },
};
