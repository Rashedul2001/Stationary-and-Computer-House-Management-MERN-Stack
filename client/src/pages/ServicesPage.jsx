import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FaSearch } from 'react-icons/fa';
import { apiClient } from '@/lib/apiClient';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useCurrency } from '@/hooks/useCurrency';
import { pickBilingual } from '@/utils/bilingual';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export function ServicesPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { formatBDT } = useCurrency();
  const { data: settings } = useSiteSettings();
  const [search, setSearch] = useState('');

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['public-services', search],
    queryFn: () => apiClient.get(`/api/public/services?search=${encodeURIComponent(search)}`),
  });

  const header = settings?.pageHeaders?.services;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          {pickBilingual(header?.title, lang, t('nav.services'))}
        </h1>
        <p className="text-sm text-muted-foreground">
          {pickBilingual(header?.subtitle, lang, t('landing.servicesSub'))}
        </p>
      </div>

      <div className="relative w-full sm:max-w-sm">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('services.searchPlaceholder')}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 rounded-lg border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">{t('services.noResults')}</Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {services.map((service) => (
            <Card key={service._id} className="hover:border-[var(--brand-accent)]">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">{pickBilingual(service.name, lang)}</CardTitle>
                  <Badge variant="default" className="shrink-0">
                    {formatBDT(service.cost)}
                  </Badge>
                </div>
                <CardDescription className="text-sm leading-relaxed">
                  {pickBilingual(service.details, lang)}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
