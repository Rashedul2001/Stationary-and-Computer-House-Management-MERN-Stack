import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  FaArrowDown,
  FaArrowUp,
  FaBalanceScale,
  FaCloudSun,
  FaMapMarkerAlt,
} from 'react-icons/fa';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/hooks/useAuth';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useCurrency } from '@/hooks/useCurrency';
import { pickBilingual } from '@/utils/bilingual';
import { formatDhakaDateTime, getDhakaLiveClock } from '@/utils/formatDate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function AdminDashboardPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { user } = useAuth();
  const { formatBDT } = useCurrency();
  const { data: settings } = useSiteSettings();

  const [range, setRange] = useState('today');
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');
  const [appliedRange, setAppliedRange] = useState({ from: '', to: '' });
  const [activeTab, setActiveTab] = useState('income');
  const [incomePage, setIncomePage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const [clock, setClock] = useState(() => getDhakaLiveClock(lang));

  useEffect(() => {
    setClock(getDhakaLiveClock(lang));
    const timer = setInterval(() => setClock(getDhakaLiveClock(lang)), 1000);
    return () => clearInterval(timer);
  }, [lang]);

  const rangeQuery =
    range === 'date_range' && appliedRange.from && appliedRange.to
      ? `&from=${encodeURIComponent(appliedRange.from)}&to=${encodeURIComponent(appliedRange.to)}`
      : '';

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['admin-dashboard', range, appliedRange.from, appliedRange.to],
    queryFn: () => apiClient.get(`/api/admin/dashboard/summary?range=${range}${rangeQuery}`),
  });

  const currentPage = activeTab === 'expense' ? expensePage : incomePage;

  const { data: logData, isLoading: logsLoading } = useQuery({
    queryKey: ['admin-logs', activeTab, range, appliedRange.from, appliedRange.to, currentPage],
    queryFn: () =>
      apiClient.get(
        `/api/admin/dashboard/logs?type=${activeTab}&range=${range}${rangeQuery}&page=${currentPage}&limit=30`
      ),
  });

  const selectPreset = (preset) => {
    setRange(preset);
    setIncomePage(1);
    setExpensePage(1);
  };

  const applyCustomDateRange = () => {
    if (!fromInput || !toInput) return;
    setAppliedRange({ from: fromInput, to: toInput });
    setRange('date_range');
    setIncomePage(1);
    setExpensePage(1);
  };

  const totals = summary?.totals || { totalIncome: 0, totalExpense: 0, netBalance: 0 };
  const chartData = (summary?.chartSeries || []).map((item) => ({
    ...item,
    displayLabel: lang === 'bn' ? item.labelBn || item.label : item.label,
  }));
  const weather = summary?.weather;
  const addressText = pickBilingual(settings?.address, lang, 'Laksam, Cumilla');
  const logs = logData?.items || [];
  const pagination = logData?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <div className="space-y-6">
      {/* Top Greeting + Weather + Date Filter Pills */}
      <div className="grid gap-4 lg:grid-cols-12 items-stretch">
        <Card className="lg:col-span-6">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{t('admin.dashboard.greeting')}</p>
              <h1 className="text-xl font-bold text-foreground">{user?.name}</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <FaMapMarkerAlt className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{addressText}</span>
              </p>
            </div>

            <div className="flex sm:flex-col items-start sm:items-end justify-between gap-2 text-xs">
              <div className="sm:text-right">
                <p className="font-bold text-base text-primary tabular-nums">{clock.time}</p>
                <p className="text-muted-foreground">{clock.date}</p>
              </div>
              {weather?.available && (
                <Badge variant="secondary" className="gap-1.5 px-2.5 py-1">
                  <FaCloudSun className="h-3.5 w-3.5 text-[var(--status-warning)]" />
                  <span>
                    {weather.temperatureC}°C • {pickBilingual(weather.condition, lang)}
                  </span>
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-6">
          <CardContent className="p-5 flex flex-col justify-between gap-3 h-full">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'today', label: t('admin.dashboard.today') },
                { key: 'this_week', label: t('admin.dashboard.thisWeek') },
                { key: 'this_month', label: t('admin.dashboard.thisMonth') },
                { key: 'date_range', label: t('admin.dashboard.dateRange') },
              ].map((pill) => (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => selectPreset(pill.key)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                    range === pill.key
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-muted/50 text-foreground hover:bg-secondary'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {range === 'date_range' && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Input
                  type="date"
                  value={fromInput}
                  onChange={(e) => setFromInput(e.target.value)}
                  className="w-auto h-9 text-xs"
                />
                <span className="text-xs text-muted-foreground">→</span>
                <Input
                  type="date"
                  value={toInput}
                  onChange={(e) => setToInput(e.target.value)}
                  className="w-auto h-9 text-xs"
                />
                <Button type="button" size="sm" onClick={applyCustomDateRange}>
                  {t('admin.dashboard.applyRange')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3 Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('admin.dashboard.totalIncome')}
            </CardTitle>
            <FaArrowUp className="h-4 w-4 text-[var(--status-success)]" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[var(--status-success)]">
              {summaryLoading ? '...' : formatBDT(totals.totalIncome)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('admin.dashboard.totalExpense')}
            </CardTitle>
            <FaArrowDown className="h-4 w-4 text-[var(--status-danger)]" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[var(--status-danger)]">
              {summaryLoading ? '...' : formatBDT(totals.totalExpense)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('admin.dashboard.netBalance')}
            </CardTitle>
            <FaBalanceScale className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                totals.netBalance >= 0 ? 'text-primary' : 'text-[var(--status-danger)]'
              }`}
            >
              {summaryLoading ? '...' : formatBDT(totals.netBalance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Graphs Side by Side */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('admin.dashboard.incomeGraph')}</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="displayLabel" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <Tooltip
                  formatter={(value) => formatBDT(value)}
                  contentStyle={{
                    backgroundColor: 'var(--popover)',
                    borderColor: 'var(--border)',
                    color: 'var(--popover-foreground)',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="income" name={t('admin.dashboard.totalIncome')} fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('admin.dashboard.expenseGraph')}</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="displayLabel" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <Tooltip
                  formatter={(value) => formatBDT(value)}
                  contentStyle={{
                    backgroundColor: 'var(--popover)',
                    borderColor: 'var(--border)',
                    color: 'var(--popover-foreground)',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="expense" name={t('admin.dashboard.totalExpense')} fill="var(--chart-4)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 2 Paginated Log Tabs: Income Log & Expense Log */}
      <Card>
        <CardContent className="p-5">
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v);
            }}
          >
            <TabsList>
              <TabsTrigger value="income">{t('admin.dashboard.incomeLog')}</TabsTrigger>
              <TabsTrigger value="expense">{t('admin.dashboard.expenseLog')}</TabsTrigger>
            </TabsList>

            <TabsContent value="income">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.dashboard.dateTime')}</TableHead>
                    <TableHead>{t('admin.dashboard.enteredBy')}</TableHead>
                    <TableHead>{t('admin.dashboard.type')}</TableHead>
                    <TableHead>{t('admin.dashboard.title')}</TableHead>
                    <TableHead>{t('admin.dashboard.customer')}</TableHead>
                    <TableHead>{t('admin.dashboard.qty')}</TableHead>
                    <TableHead>{t('admin.dashboard.amount')}</TableHead>
                    <TableHead>{t('admin.dashboard.details')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logsLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                        {t('admin.dashboard.noRecords')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((row) => (
                      <TableRow key={row._id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {formatDhakaDateTime(row.transactionDate, lang)}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="font-medium block">{row.enteredBy?.name || '---'}</span>
                          <span className="text-muted-foreground">{row.enteredBy?.role || '---'}</span>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="secondary">{row.type || '---'}</Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {pickBilingual(row.itemTitle, lang, '---')}
                          <span className="block text-[11px] text-muted-foreground">
                            {row.invoiceNumber || '---'}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">{row.customerName || '---'}</TableCell>
                        <TableCell className="text-xs">{row.quantity ?? '---'}</TableCell>
                        <TableCell className="text-xs font-semibold">
                          <span>{formatBDT(row.finalAmount)}</span>
                          {row.isDiscounted && (
                            <Badge variant="warning" className="ml-1.5 text-[10px]">
                              {t('pos.discountedPrice')}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {row.details || '---'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="expense">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.dashboard.dateTime')}</TableHead>
                    <TableHead>{t('admin.dashboard.enteredBy')}</TableHead>
                    <TableHead>{t('admin.dashboard.title')}</TableHead>
                    <TableHead>{t('admin.dashboard.amount')}</TableHead>
                    <TableHead>{t('admin.dashboard.details')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        {t('admin.dashboard.noRecords')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((row) => (
                      <TableRow key={row._id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {formatDhakaDateTime(row.transactionDate, lang)}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="font-medium block">{row.enteredBy?.name || '---'}</span>
                          <span className="text-muted-foreground">{row.enteredBy?.role || '---'}</span>
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {pickBilingual(row.title, lang, '---')}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-[var(--status-danger)]">
                          {formatBDT(row.amount)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{row.details || '---'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>

          {/* Pagination */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              {t('admin.dashboard.page')} {pagination.page} {t('admin.dashboard.of')} {pagination.totalPages} (
              {pagination.total})
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() =>
                  activeTab === 'expense'
                    ? setExpensePage((p) => Math.max(1, p - 1))
                    : setIncomePage((p) => Math.max(1, p - 1))
                }
              >
                {t('admin.dashboard.prev')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  activeTab === 'expense'
                    ? setExpensePage((p) => p + 1)
                    : setIncomePage((p) => p + 1)
                }
              >
                {t('admin.dashboard.next')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
