import { Income } from '../models/Income.js';
import { Expense } from '../models/Expense.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { fetchCurrentWeather } from '../services/weatherService.js';
import { dhakaDayBounds, resolveDashboardRange, shiftYMD, toDhakaYMD } from '../utils/dhakaTime.js';
import { sendSuccess } from '../utils/apiResponse.js';

async function buildChartSeries(range, endYMD) {
  const todayYMD = toDhakaYMD(new Date());

  if (range === 'this_month') {
    const [year, month] = todayYMD.split('-');
    const monthStart = dhakaDayBounds(`${year}-${month}-01`).start;
    const monthEnd = dhakaDayBounds(todayYMD).end;

    const [incRows, expRows] = await Promise.all([
      Income.aggregate([
        { $match: { transactionDate: { $gte: monthStart, $lte: monthEnd } } },
        {
          $group: {
            _id: { $dateToString: { format: '%d', date: '$transactionDate', timezone: 'Asia/Dhaka' } },
            total: { $sum: '$finalAmount' },
          },
        },
      ]),
      Expense.aggregate([
        { $match: { transactionDate: { $gte: monthStart, $lte: monthEnd } } },
        {
          $group: {
            _id: { $dateToString: { format: '%d', date: '$transactionDate', timezone: 'Asia/Dhaka' } },
            total: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const buckets = [
      { key: 'W1', label: 'Week 1 (1-7)', labelBn: 'সপ্তাহ ১ (১-৭)', income: 0, expense: 0 },
      { key: 'W2', label: 'Week 2 (8-14)', labelBn: 'সপ্তাহ ২ (৮-১৪)', income: 0, expense: 0 },
      { key: 'W3', label: 'Week 3 (15-21)', labelBn: 'সপ্তাহ ৩ (১৫-২১)', income: 0, expense: 0 },
      { key: 'W4', label: 'Week 4 (22+)', labelBn: 'সপ্তাহ ৪ (২২+)', income: 0, expense: 0 },
    ];

    const weekIdx = (dayStr) => {
      const d = Number.parseInt(dayStr, 10);
      if (d <= 7) return 0;
      if (d <= 14) return 1;
      if (d <= 21) return 2;
      return 3;
    };

    for (const r of incRows) buckets[weekIdx(r._id)].income += r.total;
    for (const r of expRows) buckets[weekIdx(r._id)].expense += r.total;
    return buckets;
  }

  if (range === 'date_range') {
    const anchorYMD = endYMD || todayYMD;
    const [y, m] = anchorYMD.split('-').map(Number);
    const months = [];
    for (let i = 5; i >= 0; i -= 1) {
      const dt = new Date(Date.UTC(y, m - 1 - i, 15));
      const ym = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}`;
      const label = dt.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });
      const labelBn = dt.toLocaleDateString('bn-BD', { month: 'short', year: '2-digit', timeZone: 'UTC' });
      months.push({ key: ym, label, labelBn, income: 0, expense: 0 });
    }

    const firstStart = dhakaDayBounds(`${months[0].key}-01`).start;
    const lastEnd = dhakaDayBounds(anchorYMD).end;

    const [incRows, expRows] = await Promise.all([
      Income.aggregate([
        { $match: { transactionDate: { $gte: firstStart, $lte: lastEnd } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$transactionDate', timezone: 'Asia/Dhaka' } },
            total: { $sum: '$finalAmount' },
          },
        },
      ]),
      Expense.aggregate([
        { $match: { transactionDate: { $gte: firstStart, $lte: lastEnd } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$transactionDate', timezone: 'Asia/Dhaka' } },
            total: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const map = Object.fromEntries(months.map((item) => [item.key, item]));
    for (const r of incRows) if (map[r._id]) map[r._id].income = r.total;
    for (const r of expRows) if (map[r._id]) map[r._id].expense = r.total;
    return months;
  }

  // Default for 'today' and 'this_week': rolling 7 days (today + previous 6 days in Asia/Dhaka)
  const startYMD = shiftYMD(todayYMD, -6);
  const start = dhakaDayBounds(startYMD).start;
  const end = dhakaDayBounds(todayYMD).end;

  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const ymd = shiftYMD(todayYMD, -i);
    const dt = new Date(`${ymd}T12:00:00.000+06:00`);
    days.push({
      key: ymd,
      label: dt.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', timeZone: 'Asia/Dhaka' }),
      labelBn: dt.toLocaleDateString('bn-BD', { weekday: 'short', day: 'numeric', timeZone: 'Asia/Dhaka' }),
      income: 0,
      expense: 0,
    });
  }

  const [incRows, expRows] = await Promise.all([
    Income.aggregate([
      { $match: { transactionDate: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$transactionDate', timezone: 'Asia/Dhaka' } },
          total: { $sum: '$finalAmount' },
        },
      },
    ]),
    Expense.aggregate([
      { $match: { transactionDate: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$transactionDate', timezone: 'Asia/Dhaka' } },
          total: { $sum: '$amount' },
        },
      },
    ]),
  ]);

  const map = Object.fromEntries(days.map((item) => [item.key, item]));
  for (const r of incRows) if (map[r._id]) map[r._id].income = r.total;
  for (const r of expRows) if (map[r._id]) map[r._id].expense = r.total;
  return days;
}

export async function getDashboardSummary(req, res, next) {
  try {
    const { range = 'today', from, to } = req.query;
    const { start, end, startYMD, endYMD } = resolveDashboardRange(range, from, to);

    const [incAgg, expAgg, chartSeries, settings] = await Promise.all([
      Income.aggregate([
        { $match: { transactionDate: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$finalAmount' }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        { $match: { transactionDate: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      buildChartSeries(range, endYMD),
      SiteSettings.findOne({ singletonKey: 'main' }).lean(),
    ]);

    const totalIncome = incAgg[0]?.total || 0;
    const totalExpense = expAgg[0]?.total || 0;
    const netBalance = totalIncome - totalExpense;

    const coords = settings?.coordinates || { lat: 23.24, lng: 91.1214 };
    const weather = await fetchCurrentWeather(coords.lat, coords.lng);

    return sendSuccess(res, {
      range,
      startYMD,
      endYMD,
      totals: {
        totalIncome,
        totalExpense,
        netBalance,
        incomeCount: incAgg[0]?.count || 0,
        expenseCount: expAgg[0]?.count || 0,
      },
      chartSeries,
      weather,
    });
  } catch (err) {
    return next(err);
  }
}

export async function getDashboardLogs(req, res, next) {
  try {
    const { type = 'income', range = 'today', from, to, page = 1, limit = 30 } = req.query;
    const { start, end } = resolveDashboardRange(range, from, to);

    const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 30));
    const skip = (pageNum - 1) * limitNum;

    const Model = type === 'expense' ? Expense : Income;
    const filter = { transactionDate: { $gte: start, $lte: end } };

    const [items, total] = await Promise.all([
      Model.find(filter).sort({ transactionDate: -1, createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Model.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.max(1, Math.ceil(total / limitNum)),
      },
    });
  } catch (err) {
    return next(err);
  }
}
