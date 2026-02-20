import { addMonths } from 'date-fns';
import RNCalendarEvents from 'react-native-calendar-events';

export interface CalendarImportEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  notes: string;
  location: string;
}

export async function requestCalendarAccess(): Promise<boolean> {
  try {
    const status = await RNCalendarEvents.checkPermissions();
    if (status === 'authorized') {
      return true;
    }

    const requested = await RNCalendarEvents.requestPermissions();
    return requested === 'authorized';
  } catch {
    return false;
  }
}

export async function fetchUpcomingCalendarEvents(
  from = new Date(),
  to = addMonths(new Date(), 6),
): Promise<CalendarImportEvent[]> {
  try {
    const events = await RNCalendarEvents.fetchAllEvents(
      from.toISOString(),
      to.toISOString(),
    );

    return events
      .filter(event => Boolean(event.startDate) && Boolean(event.title))
      .map(event => ({
        id: event.id,
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate || event.startDate,
        notes: event.notes || event.description || '',
        location: event.location || '',
      }))
      .sort(
        (first, second) =>
          new Date(first.startDate).getTime() - new Date(second.startDate).getTime(),
      )
      .slice(0, 80);
  } catch {
    return [];
  }
}
