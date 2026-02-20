import { Platform } from 'react-native';
import PushNotificationIOS, {
  PushNotificationPermissions,
} from '@react-native-community/push-notification-ios';
import { addDays, addHours } from 'date-fns';
import { CountdownItem } from '../domain/types';
import { addRecurrence, getActiveWindow } from './date';

interface ScheduledRequest {
  id: string;
  title: string;
  body: string;
  fireDate: Date;
}

const NOTIFICATION_THREAD_ID = 'pretty-progress';

function buildRequestId(itemId: string, kind: string): string {
  return `countdown:${itemId}:${kind}`;
}

function isFutureDate(date: Date, now: Date): boolean {
  return date.getTime() > now.getTime() + 10_000;
}

function hasPermission(permissions: PushNotificationPermissions): boolean {
  return Boolean(permissions.alert || permissions.sound || permissions.badge);
}

export function checkNotificationPermissions(): Promise<PushNotificationPermissions> {
  return new Promise(resolve => {
    if (Platform.OS !== 'ios') {
      resolve({ alert: false, sound: false, badge: false });
      return;
    }

    PushNotificationIOS.checkPermissions(resolve);
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return false;
  }

  const current = await checkNotificationPermissions();
  if (hasPermission(current)) {
    return true;
  }

  const requested = await PushNotificationIOS.requestPermissions();
  return hasPermission(requested);
}

function nextRecurringMilestone(item: CountdownItem, now: Date): Date | null {
  if (item.recurrence === 'none') {
    return null;
  }

  const activeWindow = getActiveWindow(item, now);

  if (item.mode === 'countdown') {
    let candidate = addRecurrence(activeWindow.windowEnd, item.recurrence);
    let guard = 0;

    while (!isFutureDate(candidate, now) && guard < 200) {
      candidate = addRecurrence(candidate, item.recurrence);
      guard += 1;
    }

    return candidate;
  }

  let candidate = addRecurrence(activeWindow.windowStart, item.recurrence);
  let guard = 0;

  while (!isFutureDate(candidate, now) && guard < 200) {
    candidate = addRecurrence(candidate, item.recurrence);
    guard += 1;
  }

  return candidate;
}

function requestsForCountdown(item: CountdownItem, now: Date): ScheduledRequest[] {
  if (item.archived) {
    return [];
  }

  const requests: ScheduledRequest[] = [];
  const activeWindow = getActiveWindow(item, now);

  if (item.mode === 'countdown') {
    if (item.notifications.weekBefore) {
      const fireDate = addDays(activeWindow.windowEnd, -7);
      if (isFutureDate(fireDate, now)) {
        requests.push({
          id: buildRequestId(item.id, 'week-before'),
          title: `${item.icon} ${item.title}`,
          body: '1 week left on your countdown.',
          fireDate,
        });
      }
    }

    if (item.notifications.dayBefore) {
      const fireDate = addDays(activeWindow.windowEnd, -1);
      if (isFutureDate(fireDate, now)) {
        requests.push({
          id: buildRequestId(item.id, 'day-before'),
          title: `${item.icon} ${item.title}`,
          body: '1 day left on your countdown.',
          fireDate,
        });
      }
    }

    if (item.notifications.atEnd && isFutureDate(activeWindow.windowEnd, now)) {
      requests.push({
        id: buildRequestId(item.id, 'at-end'),
        title: `${item.icon} ${item.title}`,
        body: 'Your countdown just reached the target.',
        fireDate: activeWindow.windowEnd,
      });
    }
  } else {
    if (item.notifications.atEnd && isFutureDate(activeWindow.windowEnd, now)) {
      requests.push({
        id: buildRequestId(item.id, 'target-hit'),
        title: `${item.icon} ${item.title}`,
        body: 'Your count-up reached the target date.',
        fireDate: activeWindow.windowEnd,
      });
    }
  }

  if (item.notifications.repeatingMilestones) {
    const milestoneDate = nextRecurringMilestone(item, now);
    if (milestoneDate && isFutureDate(milestoneDate, now)) {
      requests.push({
        id: buildRequestId(item.id, 'milestone'),
        title: `${item.icon} ${item.title}`,
        body: item.mode === 'countdown'
          ? 'Recurring milestone reached.'
          : 'Time for your next streak milestone.',
        fireDate: milestoneDate,
      });
    }
  }

  return requests;
}

export function syncLocalNotifications(countdowns: CountdownItem[]): void {
  if (Platform.OS !== 'ios') {
    return;
  }

  const now = new Date();
  const allKnownIds = countdowns.flatMap(item => [
    buildRequestId(item.id, 'week-before'),
    buildRequestId(item.id, 'day-before'),
    buildRequestId(item.id, 'at-end'),
    buildRequestId(item.id, 'target-hit'),
    buildRequestId(item.id, 'milestone'),
  ]);

  if (allKnownIds.length > 0) {
    PushNotificationIOS.removePendingNotificationRequests(allKnownIds);
  }

  const requests = countdowns.flatMap(item => requestsForCountdown(item, now));
  requests.forEach(request => {
    PushNotificationIOS.addNotificationRequest({
      id: request.id,
      title: request.title,
      body: request.body,
      fireDate: request.fireDate,
      isTimeZoneAgnostic: false,
      threadId: NOTIFICATION_THREAD_ID,
      interruptionLevel: 'timeSensitive',
    });
  });
}

export function clearAllNotificationBadges(): void {
  if (Platform.OS !== 'ios') {
    return;
  }

  PushNotificationIOS.setApplicationIconBadgeNumber(0);
}

export function fireDebugNotification(): void {
  if (Platform.OS !== 'ios') {
    return;
  }

  PushNotificationIOS.addNotificationRequest({
    id: `debug-notification-${Date.now()}`,
    title: 'Pretty Progress',
    body: 'Notifications are enabled for this app.',
    fireDate: addHours(new Date(), 1 / 60),
    threadId: NOTIFICATION_THREAD_ID,
    interruptionLevel: 'active',
  });
}
