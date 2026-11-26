export const DHAKA_TZ = 'Asia/Dhaka';

export function formatDhakaDateTime(dateInput, language = 'en') {
  if (!dateInput) return '---';
  const dt = new Date(dateInput);
  if (Number.isNaN(dt.getTime())) return '---';

  const locale = language === 'bn' ? 'bn-BD' : 'en-GB';
  return new Intl.DateTimeFormat(locale, {
    timeZone: DHAKA_TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(dt);
}

export function formatDhakaDate(dateInput, language = 'en') {
  if (!dateInput) return '---';
  const dt = new Date(dateInput);
  if (Number.isNaN(dt.getTime())) return '---';

  const locale = language === 'bn' ? 'bn-BD' : 'en-GB';
  return new Intl.DateTimeFormat(locale, {
    timeZone: DHAKA_TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(dt);
}

export function getDhakaLiveClock(language = 'en') {
  const now = new Date();
  const locale = language === 'bn' ? 'bn-BD' : 'en-US';
  const time = new Intl.DateTimeFormat(locale, {
    timeZone: DHAKA_TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(now);
  const date = new Intl.DateTimeFormat(locale, {
    timeZone: DHAKA_TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);
  return { time, date };
}
