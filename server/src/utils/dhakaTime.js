export const DHAKA_TIMEZONE = 'Asia/Dhaka';

/**
 * Formats a Date as YYYY-MM-DD in Asia/Dhaka (+06:00).
 */
export function toDhakaYMD(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: DHAKA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Converts a YYYY-MM-DD Dhaka date string to UTC Date bounds.
 */
export function dhakaDayBounds(ymd) {
  return {
    start: new Date(`${ymd}T00:00:00.000+06:00`),
    end: new Date(`${ymd}T23:59:59.999+06:00`),
  };
}

/**
 * Shifts a YYYY-MM-DD string by deltaDays and returns YYYY-MM-DD.
 */
export function shiftYMD(ymd, deltaDays) {
  const dt = new Date(`${ymd}T12:00:00.000+06:00`);
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return toDhakaYMD(dt);
}

/**
 * Returns { start, end, todayYMD } in UTC representing Asia/Dhaka ranges.
 */
export function resolveDashboardRange(range = 'today', fromYmd, toYmd) {
  const todayYMD = toDhakaYMD(new Date());

  if (range === 'this_week') {
    const startYMD = shiftYMD(todayYMD, -6);
    return {
      start: dhakaDayBounds(startYMD).start,
      end: dhakaDayBounds(todayYMD).end,
      startYMD,
      endYMD: todayYMD,
    };
  }

  if (range === 'this_month') {
    const [year, month] = todayYMD.split('-');
    const startYMD = `${year}-${month}-01`;
    return {
      start: dhakaDayBounds(startYMD).start,
      end: dhakaDayBounds(todayYMD).end,
      startYMD,
      endYMD: todayYMD,
    };
  }

  if (range === 'date_range' && fromYmd && toYmd) {
    const startYMD = fromYmd <= toYmd ? fromYmd : toYmd;
    const endYMD = fromYmd <= toYmd ? toYmd : fromYmd;
    return {
      start: dhakaDayBounds(startYMD).start,
      end: dhakaDayBounds(endYMD).end,
      startYMD,
      endYMD,
    };
  }

  return {
    start: dhakaDayBounds(todayYMD).start,
    end: dhakaDayBounds(todayYMD).end,
    startYMD: todayYMD,
    endYMD: todayYMD,
  };
}

/**
 * Builds an invoice prefix for Asia/Dhaka date: LIKPH-YYYYMMDD
 */
export function getDhakaInvoicePrefix(date = new Date()) {
  const ymd = toDhakaYMD(date).replace(/-/g, '');
  return `LIKPH-${ymd}`;
}
