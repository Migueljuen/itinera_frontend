// utils/notificationEvents.ts
import { DeviceEventEmitter } from 'react-native';

export const NotificationEvents = {
  NOTIFICATION_RECEIVED: 'NOTIFICATION_RECEIVED',
  NOTIFICATIONS_UPDATED: 'NOTIFICATIONS_UPDATED',
  REFRESH_NOTIFICATIONS: 'REFRESH_NOTIFICATIONS'
};

export const emitNotificationUpdate = () => {
  DeviceEventEmitter.emit(NotificationEvents.NOTIFICATIONS_UPDATED);
};

export const emitRefreshNotifications = () => {
  DeviceEventEmitter.emit(NotificationEvents.REFRESH_NOTIFICATIONS);
};