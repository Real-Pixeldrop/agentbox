/**
 * Converts a cron expression to a human-readable string.
 * Supports both 5-field cron and shorthand formats.
 */

type Language = 'FR' | 'EN';

const DAYS_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function padHour(h: number): string {
  return `${h}h`;
}

function padHourEN(h: number): string {
  if (h === 0) return '12 AM';
  if (h === 12) return '12 PM';
  if (h > 12) return `${h - 12} PM`;
  return `${h} AM`;
}

function formatHourList(hours: number[], lang: Language): string {
  const formatter = lang === 'FR' ? padHour : padHourEN;
  if (hours.length === 1) return formatter(hours[0]);
  const last = hours[hours.length - 1];
  const rest = hours.slice(0, -1);
  const sep = lang === 'FR' ? ' et ' : ' and ';
  return rest.map(formatter).join(', ') + sep + formatter(last);
}

export function cronToHuman(expression: string, lang: Language = 'FR'): string {
  if (!expression || expression.trim() === '') return expression;

  // Handle shorthand formats like "every 30m", "every 1h", etc.
  const shorthandMatch = expression.match(/^every\s+(\d+)\s*(m|min|minutes?|h|hours?)$/i);
  if (shorthandMatch) {
    const value = parseInt(shorthandMatch[1]);
    const unit = shorthandMatch[2].toLowerCase();
    if (unit.startsWith('m')) {
      return lang === 'FR' ? `Toutes les ${value} minutes` : `Every ${value} minutes`;
    }
    if (unit.startsWith('h')) {
      return lang === 'FR'
        ? value === 1 ? 'Toutes les heures' : `Toutes les ${value} heures`
        : value === 1 ? 'Every hour' : `Every ${value} hours`;
    }
  }

  const parts = expression.trim().split(/\s+/);
  if (parts.length < 5) return expression; // Can't parse, return raw

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  try {
    // Every N minutes: */N * * * *
    const everyMinMatch = minute.match(/^\*\/(\d+)$/);
    if (everyMinMatch && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      const n = parseInt(everyMinMatch[1]);
      return lang === 'FR' ? `Toutes les ${n} minutes` : `Every ${n} minutes`;
    }

    // Every N hours: 0 */N * * *
    const everyHourMatch = hour.match(/^\*\/(\d+)$/);
    if (minute === '0' && everyHourMatch && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      const n = parseInt(everyHourMatch[1]);
      return lang === 'FR'
        ? n === 1 ? 'Toutes les heures' : `Toutes les ${n} heures`
        : n === 1 ? 'Every hour' : `Every ${n} hours`;
    }

    // Specific hours, every day: M H1,H2,... * * *
    if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*' && !hour.includes('/') && !minute.includes('/')) {
      const hours = hour.split(',').map(Number);
      const min = parseInt(minute);
      if (hours.every(h => !isNaN(h)) && !isNaN(min)) {
        const hourStr = formatHourList(hours.map(h => h), lang);
        const minStr = min > 0 ? (min < 10 ? `${min.toString().padStart(2, '0')}` : `${min}`) : '';

        if (hours.length === 1) {
          const h = hours[0];
          if (lang === 'FR') {
            return min > 0 ? `Tous les jours à ${h}h${minStr}` : `Tous les jours à ${h}h`;
          }
          return min > 0 ? `Every day at ${padHourEN(h).replace(/ (AM|PM)/, `:${minStr.padStart(2, '0')} $1`)}` : `Every day at ${padHourEN(h)}`;
        }

        if (lang === 'FR') {
          return `Tous les jours à ${hourStr}`;
        }
        return `Every day at ${hourStr}`;
      }
    }

    // Specific day of week: M H * * D
    if (dayOfMonth === '*' && month === '*' && dayOfWeek !== '*' && !hour.includes('/') && !minute.includes('/')) {
      const days = dayOfWeek.split(',').map(Number);
      const h = parseInt(hour);
      const min = parseInt(minute);
      const daysMap = lang === 'FR' ? DAYS_FR : DAYS_EN;

      if (days.every(d => !isNaN(d) && d >= 0 && d <= 6) && !isNaN(h) && !isNaN(min)) {
        const dayNames = days.map(d => daysMap[d]);
        const dayStr = dayNames.length === 1 ? dayNames[0] : dayNames.join(', ');
        const minStr = min > 0 ? (min < 10 ? min.toString().padStart(2, '0') : `${min}`) : '';

        if (lang === 'FR') {
          const prefix = days.length === 1 ? 'Tous les' : 'Chaque';
          return min > 0
            ? `${prefix} ${dayStr} à ${h}h${minStr}`
            : `${prefix} ${dayStr} à ${h}h`;
        }
        return min > 0
          ? `Every ${dayStr} at ${padHourEN(h).replace(/ (AM|PM)/, `:${minStr.padStart(2, '0')} $1`)}`
          : `Every ${dayStr} at ${padHourEN(h)}`;
      }
    }

    // Specific day of month: M H D * *
    if (dayOfMonth !== '*' && month === '*' && dayOfWeek === '*' && !hour.includes('/') && !minute.includes('/')) {
      const d = parseInt(dayOfMonth);
      const h = parseInt(hour);
      const min = parseInt(minute);
      if (!isNaN(d) && !isNaN(h) && !isNaN(min)) {
        if (lang === 'FR') {
          const minStr = min > 0 ? (min < 10 ? min.toString().padStart(2, '0') : `${min}`) : '';
          return min > 0
            ? `Le ${d} de chaque mois à ${h}h${minStr}`
            : `Le ${d} de chaque mois à ${h}h`;
        }
        return `On the ${d}${ordinalSuffix(d)} of every month at ${padHourEN(h)}`;
      }
    }
  } catch {
    // Fall through to raw
  }

  return expression;
}

function ordinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

/**
 * Compute next execution time from a cron expression.
 * Returns an ISO string or null if unparseable.
 * This is a simple forward-looking computation for common patterns.
 */
export function getNextRun(expression: string): Date | null {
  if (!expression) return null;

  const parts = expression.trim().split(/\s+/);
  if (parts.length < 5) return null;

  const [minuteStr, hourStr, , , dayOfWeekStr] = parts;
  const now = new Date();

  try {
    // Simple case: specific hour/minute, every day
    if (!minuteStr.includes('/') && !minuteStr.includes('*') &&
        !hourStr.includes('/') && !hourStr.includes('*')) {
      const min = parseInt(minuteStr);
      const hours = hourStr.split(',').map(Number);

      if (hours.some(isNaN) || isNaN(min)) return null;

      // Find next occurrence
      for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
        for (const h of hours) {
          const candidate = new Date(now);
          candidate.setDate(candidate.getDate() + dayOffset);
          candidate.setHours(h, min, 0, 0);

          if (candidate > now) {
            // Check day of week constraint
            if (dayOfWeekStr !== '*') {
              const allowedDays = dayOfWeekStr.split(',').map(Number);
              if (!allowedDays.includes(candidate.getDay())) continue;
            }
            return candidate;
          }
        }
      }
    }

    // Interval case: */N minutes
    const everyMin = minuteStr.match(/^\*\/(\d+)$/);
    if (everyMin && hourStr === '*') {
      const interval = parseInt(everyMin[1]);
      const next = new Date(now);
      const currentMin = next.getMinutes();
      const nextMin = Math.ceil((currentMin + 1) / interval) * interval;
      if (nextMin >= 60) {
        next.setHours(next.getHours() + 1);
        next.setMinutes(nextMin - 60, 0, 0);
      } else {
        next.setMinutes(nextMin, 0, 0);
      }
      return next;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Format a date as relative time ("il y a 2h", "yesterday", etc.)
 */
export function formatRelativeTime(dateStr: string | null, lang: Language = 'FR'): string {
  if (!dateStr) return lang === 'FR' ? 'Jamais' : 'Never';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr; // Return raw if not a valid date

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (lang === 'FR') {
    if (diffSec < 60) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

/**
 * Format a future date as relative time ("dans 2h", "demain", etc.)
 */
export function formatFutureTime(date: Date | null, lang: Language = 'FR'): string {
  if (!date) return lang === 'FR' ? 'Inconnu' : 'Unknown';

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (lang === 'FR') {
    if (diffMin < 1) return "Imminent";
    if (diffMin < 60) return `Dans ${diffMin} min`;
    if (diffHours < 24) return `Dans ${diffHours}h`;
    if (diffDays === 1) return 'Demain';
    if (diffDays < 7) return `Dans ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  if (diffMin < 1) return 'Imminent';
  if (diffMin < 60) return `In ${diffMin} min`;
  if (diffHours < 24) return `In ${diffHours}h`;
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
