import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';
import { CountdownItem, CountdownMetrics, Recurrence } from '../domain/types';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const DURATION_UNITS: Array<{ label: string; ms: number }> = [
  { label: 'y', ms: 365 * DAY_MS },
  { label: 'mo', ms: 30 * DAY_MS },
  { label: 'w', ms: 7 * DAY_MS },
  { label: 'd', ms: DAY_MS },
  { label: 'h', ms: HOUR_MS },
  { label: 'm', ms: MINUTE_MS },
];

function toDate(value: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
}

function ensureWindow(start: Date, end: Date): { start: Date; end: Date } {
  if (end.getTime() <= start.getTime()) {
    return { start, end: addDays(start, 1) };
  }

  return { start, end };
}

export function addRecurrence(date: Date, recurrence: Recurrence): Date {
  switch (recurrence) {
    case 'daily':
      return addDays(date, 1);
    case 'weekly':
      return addWeeks(date, 1);
    case 'monthly':
      return addMonths(date, 1);
    case 'yearly':
      return addYears(date, 1);
    case 'none':
    default:
      return date;
  }
}

export function getActiveWindow(
  item: CountdownItem,
  now: Date,
): { windowStart: Date; windowEnd: Date; isRecurringWindow: boolean } {
  const normalized = ensureWindow(toDate(item.startDate), toDate(item.targetDate));

  if (item.recurrence === 'none') {
    return {
      windowStart: normalized.start,
      windowEnd: normalized.end,
      isRecurringWindow: false,
    };
  }

  let windowStart = normalized.start;
  let windowEnd = normalized.end;
  let guard = 0;

  while (now.getTime() > windowEnd.getTime() && guard < 600) {
    windowStart = windowEnd;
    windowEnd = addRecurrence(windowEnd, item.recurrence);
    guard += 1;
  }

  return {
    windowStart,
    windowEnd,
    isRecurringWindow: true,
  };
}

export function clampProgress(value: number): number {
  if (value < 0) {
    return 0;
  }

  if (value > 1) {
    return 1;
  }

  return value;
}

export function formatDurationShort(rawMs: number, maxUnits = 2): string {
  const ms = Math.abs(rawMs);

  if (ms < MINUTE_MS) {
    return '<1m';
  }

  let remaining = ms;
  const parts: string[] = [];

  DURATION_UNITS.forEach(unit => {
    if (parts.length >= maxUnits) {
      return;
    }

    const value = Math.floor(remaining / unit.ms);
    if (value <= 0) {
      return;
    }

    parts.push(`${value}${unit.label}`);
    remaining -= value * unit.ms;
  });

  if (parts.length === 0) {
    return '0m';
  }

  return parts.join(' ');
}

export function formatFullDate(rawDate: Date | string): string {
  const date = rawDate instanceof Date ? rawDate : toDate(rawDate);
  return format(date, 'EEE, MMM d, yyyy');
}

export function formatTime(rawDate: Date | string): string {
  const date = rawDate instanceof Date ? rawDate : toDate(rawDate);
  return format(date, 'HH:mm');
}

export function recurrenceLabel(recurrence: Recurrence): string {
  switch (recurrence) {
    case 'daily':
      return 'Repeats daily';
    case 'weekly':
      return 'Repeats weekly';
    case 'monthly':
      return 'Repeats monthly';
    case 'yearly':
      return 'Repeats yearly';
    case 'none':
    default:
      return 'One-time event';
  }
}

export function calculateCountdownMetrics(
  item: CountdownItem,
  now = new Date(),
): CountdownMetrics {
  const { windowStart, windowEnd, isRecurringWindow } = getActiveWindow(item, now);

  const totalMs = Math.max(windowEnd.getTime() - windowStart.getTime(), MINUTE_MS);
  const elapsedMs = now.getTime() - windowStart.getTime();
  const remainingMs = windowEnd.getTime() - now.getTime();
  const progress = clampProgress(elapsedMs / totalMs);

  if (item.mode === 'countup') {
    if (now.getTime() < windowStart.getTime()) {
      const untilStart = windowStart.getTime() - now.getTime();

      return {
        windowStart,
        windowEnd,
        totalMs,
        elapsedMs: 0,
        remainingMs: untilStart,
        progress: 0,
        isPastTarget: false,
        isRecurringWindow,
        displayDurationMs: untilStart,
        primaryLabel: formatDurationShort(untilStart, 3),
        secondaryLabel: 'until start',
        percentageLabel: '0%',
      };
    }

    const sinceStart = now.getTime() - windowStart.getTime();
    const isPastTarget = item.recurrence === 'none' && now.getTime() > windowEnd.getTime();

    return {
      windowStart,
      windowEnd,
      totalMs,
      elapsedMs: sinceStart,
      remainingMs,
      progress,
      isPastTarget,
      isRecurringWindow,
      displayDurationMs: sinceStart,
      primaryLabel: formatDurationShort(sinceStart, 3),
      secondaryLabel: isPastTarget
        ? `${formatDurationShort(Math.abs(remainingMs), 2)} past goal`
        : 'elapsed',
      percentageLabel: `${Math.round(progress * 100)}%`,
    };
  }

  const isPastTarget = item.recurrence === 'none' && remainingMs < 0;
  const countdownLabel = remainingMs >= 0 ? 'remaining' : 'overdue';

  return {
    windowStart,
    windowEnd,
    totalMs,
    elapsedMs,
    remainingMs,
    progress,
    isPastTarget,
    isRecurringWindow,
    displayDurationMs: Math.abs(remainingMs),
    primaryLabel: formatDurationShort(remainingMs, 3),
    secondaryLabel: countdownLabel,
    percentageLabel: `${Math.round(progress * 100)}%`,
  };
}

export interface PeriodProgress {
  period: 'day' | 'week' | 'month' | 'year';
  label: string;
  progress: number;
  remainingMs: number;
}

function getPeriodBoundaries(
  period: 'day' | 'week' | 'month' | 'year',
  now: Date,
  weekStartsOnMonday: boolean,
): { start: Date; end: Date } {
  switch (period) {
    case 'day':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'week':
      return {
        start: startOfWeek(now, { weekStartsOn: weekStartsOnMonday ? 1 : 0 }),
        end: endOfWeek(now, { weekStartsOn: weekStartsOnMonday ? 1 : 0 }),
      };
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'year':
    default:
      return { start: startOfYear(now), end: endOfYear(now) };
  }
}

export function getPeriodProgress(
  period: 'day' | 'week' | 'month' | 'year',
  now = new Date(),
  weekStartsOnMonday = true,
): PeriodProgress {
  const { start, end } = getPeriodBoundaries(period, now, weekStartsOnMonday);
  const totalMs = Math.max(end.getTime() - start.getTime(), MINUTE_MS);
  const elapsedMs = now.getTime() - start.getTime();
  const remainingMs = end.getTime() - now.getTime();

  return {
    period,
    label: period[0].toUpperCase() + period.slice(1),
    progress: clampProgress(elapsedMs / totalMs),
    remainingMs,
  };
}
