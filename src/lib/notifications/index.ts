import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export interface NotificationPermission {
  granted: boolean;
  denied: boolean;
}

export const notificationService = {
  async init(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      const permission = await PushNotifications.requestPermissions();
      if (permission.receive === 'granted') {
        await PushNotifications.register();
      }
    } catch (error) {
      console.error('Erreur initialisation notifications:', error);
    }
  },

  async requestPermission(): Promise<NotificationPermission> {
    if (!Capacitor.isNativePlatform()) {
      if ('Notification' in window) {
        const permission = await window.Notification.requestPermission();
        return { granted: permission === 'granted', denied: permission === 'denied' };
      }
      return { granted: false, denied: true };
    }

    try {
      const permission = await PushNotifications.requestPermissions();
      if (permission.receive === 'granted') {
        await PushNotifications.register();
        return { granted: true, denied: false };
      }
      return { granted: false, denied: true };
    } catch {
      return { granted: false, denied: true };
    }
  },

  async getPermissionStatus(): Promise<NotificationPermission> {
    if (!Capacitor.isNativePlatform()) {
      if ('Notification' in window) {
        return {
          granted: window.Notification.permission === 'granted',
          denied: window.Notification.permission === 'denied',
        };
      }
      return { granted: false, denied: false };
    }

    try {
      const permission = await PushNotifications.checkPermissions();
      return {
        granted: permission.receive === 'granted',
        denied: permission.receive === 'denied',
      };
    } catch {
      return { granted: false, denied: false };
    }
  },

  addListener(event: string, callback: (data: any) => void): void {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    if (event === 'registration') {
      PushNotifications.addListener('registration', (token) => {
        callback({ token: token.value });
      });
    } else if (event === 'registrationError') {
      PushNotifications.addListener('registrationError', (error) => {
        callback({ error });
      });
    } else if (event === 'pushNotificationReceived') {
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        callback(notification);
      });
    } else if (event === 'pushNotificationActionPerformed') {
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        callback(action);
      });
    }
  },

  async getDeliveredNotifications(): Promise<any[]> {
    if (!Capacitor.isNativePlatform()) {
      return [];
    }

    try {
      const result = await PushNotifications.getDeliveredNotifications();
      return result.notifications;
    } catch {
      return [];
    }
  },

  async removeDeliveredNotifications(ids: string[]): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await PushNotifications.removeDeliveredNotifications({ notifications: ids as any });
    } catch (error) {
      console.error('Erreur suppression notifications:', error);
    }
  },

  async removeAllDeliveredNotifications(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await PushNotifications.removeAllDeliveredNotifications();
    } catch (error) {
      console.error('Erreur suppression toutes notifications:', error);
    }
  },
};

export function showLocalNotification(title: string, body: string, data?: any): void {
  if ('Notification' in window && window.Notification.permission === 'granted') {
    new window.Notification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data?.type || 'default',
      data,
    });
  }
}
