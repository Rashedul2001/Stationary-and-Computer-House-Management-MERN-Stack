import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FaClock, FaMoneyBillWave, FaSearch } from 'react-icons/fa';
import { apiClient } from '@/lib/apiClient';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useCurrency } from '@/hooks/useCurrency';
import { pickBilingual } from '@/utils/bilingual';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export function CoursesPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { formatBDT } = useCurrency();
  const { data: settings } = useSiteSettings();
  const [search, setSearch] = useState('');

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['public-courses', search],
    queryFn: () => apiClient.get(`/api/public/courses?search=${encodeURIComponent(search)}`),
  });

  const header = settings?.pageHeaders?.courses;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          {pickBilingual(header?.title, lang, t('nav.courses'))}
        </h1>
        <p className="text-sm text-muted-foreground">
          {pickBilingual(header?.subtitle, lang, t('landing.exploreCourses'))}
        </p>
      </div>

      <div className="relative w-full sm:max-w-sm">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('courses.searchPlaceholder')}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 rounded-lg border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">{t('courses.noResults')}</Card>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <Card key={course._id} className="hover:border-[var(--brand-accent)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
                <div className="space-y-1.5 flex-1">
                  <CardTitle className="text-lg">{pickBilingual(course.title, lang)}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {pickBilingual(course.description, lang)}
                  </CardDescription>
                </div>
                <CardContent className="p-0 flex flex-wrap sm:flex-col items-start sm:items-end gap-2 shrink-0">
                  <Badge variant="default" className="gap-1.5 px-3 py-1 text-xs">
                    <FaMoneyBillWave className="h-3.5 w-3.5" />
                    <span>
                      {t('courses.totalFee')}: {formatBDT(course.totalFee)}
                    </span>
                  </Badge>
                  <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs">
                    <FaClock className="h-3.5 w-3.5" />
                    <span>
                      {t('courses.duration')}: {pickBilingual(course.duration, lang)}
                    </span>
                  </Badge>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
