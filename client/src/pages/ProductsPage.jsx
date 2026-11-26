import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FaSearch } from 'react-icons/fa';
import { apiClient } from '@/lib/apiClient';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useCurrency } from '@/hooks/useCurrency';
import { pickBilingual } from '@/utils/bilingual';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

function getInitials(name = '') {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'PR';
  return words
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function ProductCard({ product, lang, formatBDT, t }) {
  const [imgFailed, setImgFailed] = useState(false);
  const name = pickBilingual(product.name, lang);
  const details = pickBilingual(product.details, lang);
  const showImage = Boolean(product.imageUrl) && !imgFailed;

  return (
    <Card className="flex flex-col overflow-hidden hover:border-[var(--brand-accent)]">
      <div className="h-44 w-full bg-muted flex items-center justify-center overflow-hidden border-b border-border">
        {showImage ? (
          <img
            src={product.imageUrl}
            alt={name}
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-primary text-2xl font-bold">
            {getInitials(name)}
          </div>
        )}
      </div>

      <CardHeader className="pb-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{name}</CardTitle>
          <Badge variant={product.availableUnits > 0 ? 'success' : 'destructive'} className="shrink-0">
            {product.availableUnits > 0
              ? `${product.availableUnits} ${t('products.units')}`
              : t('products.outOfStock')}
          </Badge>
        </div>
        <CardDescription className="text-xs leading-relaxed">{details}</CardDescription>
      </CardHeader>

      <CardContent className="pt-2 border-t border-border flex items-center justify-between text-xs">
        <div>
          <span className="text-muted-foreground block">{t('products.retailPrice')}</span>
          <span className="text-sm font-bold text-foreground">{formatBDT(product.retailPrice)}</span>
        </div>
        <div className="text-right">
          <span className="text-muted-foreground block">{t('products.wholesalePrice')}</span>
          <span className="text-sm font-semibold text-primary">{formatBDT(product.wholesalePrice)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductsPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { formatBDT } = useCurrency();
  const { data: settings } = useSiteSettings();
  const [params, setParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(params.get('category') || 'all');

  useEffect(() => {
    const paramCat = params.get('category');
    if (paramCat) setCategory(paramCat);
  }, [params]);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['public-products', search, category],
    queryFn: () =>
      apiClient.get(
        `/api/public/products?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`
      ),
  });

  const categories = settings?.productCategories || [];
  const header = settings?.pageHeaders?.products;

  const selectCategory = (slug) => {
    setCategory(slug);
    if (slug === 'all') {
      params.delete('category');
    } else {
      params.set('category', slug);
    }
    setParams(params, { replace: true });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          {pickBilingual(header?.title, lang, t('nav.products'))}
        </h1>
        <p className="text-sm text-muted-foreground">
          {pickBilingual(header?.subtitle, lang, t('landing.goodsSub'))}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:max-w-sm">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('products.searchPlaceholder')}
            className="pl-9"
          />
        </div>
      </div>

      {/* Pill Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => selectCategory('all')}
          className={`rounded-full px-3.5 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
            category === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'border border-border bg-card text-foreground hover:bg-secondary'
          }`}
        >
          {t('products.allCategories')}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            onClick={() => selectCategory(cat.slug)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
              category === cat.slug
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-card text-foreground hover:bg-secondary'
            }`}
          >
            {pickBilingual(cat.name, lang)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-72 rounded-lg border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">{t('products.noResults')}</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} lang={lang} formatBDT={formatBDT} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
