import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FaArrowRight, FaBoxes, FaGraduationCap, FaLaptopCode } from 'react-icons/fa';
import { apiClient } from '@/lib/apiClient';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useCurrency } from '@/hooks/useCurrency';
import { pickBilingual } from '@/utils/bilingual';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import storeBannerImg from '@/assets/store-banner.jpeg';

export function LandingPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { formatBDT } = useCurrency();
  const { data: settings } = useSiteSettings();

  const { data: services = [] } = useQuery({
    queryKey: ['public-services', 'landing'],
    queryFn: () => apiClient.get('/api/public/services'),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['public-products', 'landing'],
    queryFn: () => apiClient.get('/api/public/products'),
  });

  const storeName = pickBilingual(settings?.storeName, lang, 'Laksam IT Knowledge & Paper House');
  const heroTitle = pickBilingual(
    settings?.heroTitle,
    lang,
    'Your Trusted Partner for Stationery, IT Hardware, Digital Services & Training'
  );
  const heroSubtitle = pickBilingual(
    settings?.heroSubtitle,
    lang,
    'Dealer & Wholesaler of quality paper, office supplies, routers, CCTV systems, online applications, printing & practical computer courses.'
  );
  const heroImageUrl = settings?.heroImageUrl || '/images/hero-default.jpeg';
  const categories = settings?.productCategories || [];

  return (
    <div className="space-y-12 pb-6">
      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-to-br from-card via-background to-secondary/40">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:py-16">
          <div className="space-y-5 lg:col-span-6">
            <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold">
              {storeName}
            </Badge>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
              {heroTitle}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{heroSubtitle}</p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button asChild>
                <Link to="/products">
                  <FaBoxes className="h-4 w-4" />
                  <span>{t('landing.exploreProducts')}</span>
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/services">
                  <FaLaptopCode className="h-4 w-4" />
                  <span>{t('landing.exploreServices')}</span>
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/courses">
                  <FaGraduationCap className="h-4 w-4" />
                  <span>{t('landing.exploreCourses')}</span>
                </Link>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
              <img
                src={heroImageUrl}
                alt={storeName}
                className="h-64 sm:h-80 lg:h-96 w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">{t('landing.servicesHeading')}</h2>
            <p className="text-sm text-muted-foreground">{t('landing.servicesSub')}</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/services">
              <span>{t('landing.viewAll')}</span>
              <FaArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.slice(0, 6).map((srv) => (
            <Card key={srv._id} className="flex flex-col justify-between hover:border-[var(--brand-accent)]">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{pickBilingual(srv.name, lang)}</CardTitle>
                  <Badge variant="secondary" className="shrink-0 font-semibold">
                    {formatBDT(srv.cost)}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">{pickBilingual(srv.details, lang)}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Goods & Categories Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">{t('landing.goodsHeading')}</h2>
            <p className="text-sm text-muted-foreground">{t('landing.goodsSub')}</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/products">
              <span>{t('landing.viewAll')}</span>
              <FaArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/products?category=${encodeURIComponent(cat.slug)}`}
                className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
              >
                {pickBilingual(cat.name, lang)}
              </Link>
            ))}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-12 items-start">
          <div className="lg:col-span-7 grid gap-4 sm:grid-cols-2">
            {products.slice(0, 4).map((prod) => (
              <Card key={prod._id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base truncate">{pickBilingual(prod.name, lang)}</CardTitle>
                  <CardDescription className="line-clamp-2">{pickBilingual(prod.details, lang)}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between text-xs pt-1">
                  <span>
                    {t('products.retailPrice')}: <strong>{formatBDT(prod.retailPrice)}</strong>
                  </span>
                  <Badge variant={prod.availableUnits > 0 ? 'success' : 'destructive'}>
                    {prod.availableUnits} {t('products.units')}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="lg:col-span-5 overflow-hidden">
            <img
              src={storeBannerImg}
              alt="Store Goods & Categories"
              className="w-full h-auto object-cover"
            />
          </Card>
        </div>
      </section>
    </div>
  );
}
