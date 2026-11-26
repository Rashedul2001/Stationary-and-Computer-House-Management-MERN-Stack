import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FaCloudUploadAlt, FaPlus, FaTrash } from 'react-icons/fa';
import { apiClient } from '@/lib/apiClient';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { pickBilingual } from '@/utils/bilingual';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function AdminSiteSettingsPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useSiteSettings();

  const [form, setForm] = useState(null);
  const [heroPreview, setHeroPreview] = useState('');
  const [heroFile, setHeroFile] = useState(null);
  const [newProdCat, setNewProdCat] = useState({ en: '', bn: '' });
  const [newExpCat, setNewExpCat] = useState({ en: '', bn: '' });

  useEffect(() => {
    if (!settings) return;
    setForm({
      storeName: settings.storeName || { en: '', bn: '' },
      proprietor: settings.proprietor || { en: '', bn: '' },
      heroTitle: settings.heroTitle || { en: '', bn: '' },
      heroSubtitle: settings.heroSubtitle || { en: '', bn: '' },
      address: settings.address || { en: '', bn: '' },
      phonesText: (settings.phones || []).join(', '),
      whatsappNumber: settings.whatsappNumber || '',
      email: settings.email || '',
      facebookUrl: settings.facebookUrl || '',
      openingHours: settings.openingHours || { en: '', bn: '' },
      githubUrl: settings.githubUrl || '',
      pageHeaders: settings.pageHeaders || {
        home: { title: { en: '', bn: '' }, subtitle: { en: '', bn: '' } },
        products: { title: { en: '', bn: '' }, subtitle: { en: '', bn: '' } },
        services: { title: { en: '', bn: '' }, subtitle: { en: '', bn: '' } },
        courses: { title: { en: '', bn: '' }, subtitle: { en: '', bn: '' } },
      },
    });
    setHeroPreview(settings.heroImageUrl || '/images/hero-default.jpeg');
  }, [settings]);

  const saveSettingsMutation = useMutation({
    mutationFn: (payload) => apiClient.put('/api/admin/settings', payload),
    onSuccess: () => {
      toast.success('Site settings saved');
      queryClient.invalidateQueries({ queryKey: ['public-settings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (err) => toast.error(err.message),
  });

  const heroUploadMutation = useMutation({
    mutationFn: (fd) => apiClient.post('/api/admin/settings/hero-image', fd),
    onSuccess: (updated) => {
      toast.success('Hero image uploaded to Cloudinary');
      setHeroPreview(updated.heroImageUrl);
      setHeroFile(null);
      queryClient.invalidateQueries({ queryKey: ['public-settings'] });
    },
    onError: (err) => toast.error(err.message),
  });

  const addCatMutation = useMutation({
    mutationFn: ({ type, name }) => apiClient.post(`/api/admin/settings/categories/${type}`, { name }),
    onSuccess: (_data, vars) => {
      toast.success('Category added');
      if (vars.type === 'product') setNewProdCat({ en: '', bn: '' });
      else setNewExpCat({ en: '', bn: '' });
      queryClient.invalidateQueries({ queryKey: ['public-settings'] });
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteCatMutation = useMutation({
    mutationFn: ({ type, catId }) => apiClient.delete(`/api/admin/settings/categories/${type}/${catId}`),
    onSuccess: () => {
      toast.success('Category deleted');
      queryClient.invalidateQueries({ queryKey: ['public-settings'] });
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading || !form) {
    return <div className="p-6 text-sm text-muted-foreground">Loading settings...</div>;
  }

  const handleSave = (e) => {
    e.preventDefault();
    const phones = form.phonesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    saveSettingsMutation.mutate({
      storeName: form.storeName,
      proprietor: form.proprietor,
      heroTitle: form.heroTitle,
      heroSubtitle: form.heroSubtitle,
      address: form.address,
      phones,
      whatsappNumber: form.whatsappNumber,
      email: form.email,
      facebookUrl: form.facebookUrl,
      openingHours: form.openingHours,
      githubUrl: form.githubUrl,
      pageHeaders: form.pageHeaders,
    });
  };

  const handleHeroFile = (file) => {
    if (!file) return;
    setHeroFile(file);
    setHeroPreview(URL.createObjectURL(file));
  };

  const uploadHeroNow = () => {
    if (!heroFile) return;
    const fd = new FormData();
    fd.append('image', heroFile);
    heroUploadMutation.mutate(fd);
  };

  const setPageHeader = (pageKey, field, langKey, val) => {
    setForm((prev) => ({
      ...prev,
      pageHeaders: {
        ...prev.pageHeaders,
        [pageKey]: {
          ...prev.pageHeaders[pageKey],
          [field]: {
            ...prev.pageHeaders[pageKey]?.[field],
            [langKey]: val,
          },
        },
      },
    }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('admin.settings.title')}</h1>

      {/* Hero Image Cloudinary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('admin.settings.heroSection')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 items-center">
          <div className="overflow-hidden rounded-lg border border-border bg-muted h-48">
            <img src={heroPreview} alt="Hero Preview" className="h-full w-full object-cover" />
          </div>
          <div className="space-y-3">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleHeroFile(e.dataTransfer.files?.[0]);
              }}
              className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input bg-muted/40 p-6 text-center"
            >
              <FaCloudUploadAlt className="h-8 w-8 text-primary" />
              <label className="text-xs font-medium text-primary hover:underline cursor-pointer">
                {t('admin.settings.uploadHero')}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleHeroFile(e.target.files?.[0])}
                />
              </label>
            </div>
            <Button type="button" disabled={!heroFile || heroUploadMutation.isPending} onClick={uploadHeroNow}>
              {heroUploadMutation.isPending ? 'Uploading...' : 'Upload Hero Image'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Store & Page Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('admin.settings.storeInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Hero Title (EN)</Label>
                <Input
                  value={form.heroTitle.en}
                  onChange={(e) => setForm({ ...form, heroTitle: { ...form.heroTitle, en: e.target.value } })}
                />
              </div>
              <div className="space-y-1">
                <Label>Hero Title (BN)</Label>
                <Input
                  value={form.heroTitle.bn}
                  onChange={(e) => setForm({ ...form, heroTitle: { ...form.heroTitle, bn: e.target.value } })}
                />
              </div>
              <div className="space-y-1">
                <Label>Hero Subtitle (EN)</Label>
                <Textarea
                  value={form.heroSubtitle.en}
                  onChange={(e) => setForm({ ...form, heroSubtitle: { ...form.heroSubtitle, en: e.target.value } })}
                />
              </div>
              <div className="space-y-1">
                <Label>Hero Subtitle (BN)</Label>
                <Textarea
                  value={form.heroSubtitle.bn}
                  onChange={(e) => setForm({ ...form, heroSubtitle: { ...form.heroSubtitle, bn: e.target.value } })}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Store Name (EN)</Label>
                <Input
                  value={form.storeName.en}
                  onChange={(e) => setForm({ ...form, storeName: { ...form.storeName, en: e.target.value } })}
                />
              </div>
              <div className="space-y-1">
                <Label>Store Name (BN)</Label>
                <Input
                  value={form.storeName.bn}
                  onChange={(e) => setForm({ ...form, storeName: { ...form.storeName, bn: e.target.value } })}
                />
              </div>
              <div className="space-y-1">
                <Label>Proprietor (EN)</Label>
                <Input
                  value={form.proprietor.en}
                  onChange={(e) => setForm({ ...form, proprietor: { ...form.proprietor, en: e.target.value } })}
                />
              </div>
              <div className="space-y-1">
                <Label>Proprietor (BN)</Label>
                <Input
                  value={form.proprietor.bn}
                  onChange={(e) => setForm({ ...form, proprietor: { ...form.proprietor, bn: e.target.value } })}
                />
              </div>
              <div className="space-y-1">
                <Label>Location / Address (EN)</Label>
                <Input
                  value={form.address.en}
                  onChange={(e) => setForm({ ...form, address: { ...form.address, en: e.target.value } })}
                />
              </div>
              <div className="space-y-1">
                <Label>Location / Address (BN)</Label>
                <Input
                  value={form.address.bn}
                  onChange={(e) => setForm({ ...form, address: { ...form.address, bn: e.target.value } })}
                />
              </div>
              <div className="space-y-1">
                <Label>Opening Hours (EN)</Label>
                <Input
                  value={form.openingHours.en}
                  onChange={(e) => setForm({ ...form, openingHours: { ...form.openingHours, en: e.target.value } })}
                />
              </div>
              <div className="space-y-1">
                <Label>Opening Hours (BN)</Label>
                <Input
                  value={form.openingHours.bn}
                  onChange={(e) => setForm({ ...form, openingHours: { ...form.openingHours, bn: e.target.value } })}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Phone Numbers (comma-separated)</Label>
                <Input
                  value={form.phonesText}
                  onChange={(e) => setForm({ ...form, phonesText: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('landing.whatsapp')}</Label>
                <Input
                  value={form.whatsappNumber}
                  onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('landing.email')}</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>{t('landing.facebook')}</Label>
                <Input
                  value={form.facebookUrl}
                  onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Developer GitHub URL</Label>
                <Input value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('admin.settings.pageHeaders')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {['home', 'products', 'services', 'courses'].map((key) => (
              <div key={key} className="rounded-lg border border-border p-3 space-y-2">
                <p className="text-xs font-semibold uppercase text-primary">{key}</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  <Input
                    placeholder="Title (EN)"
                    value={form.pageHeaders?.[key]?.title?.en || ''}
                    onChange={(e) => setPageHeader(key, 'title', 'en', e.target.value)}
                  />
                  <Input
                    placeholder="Title (BN)"
                    value={form.pageHeaders?.[key]?.title?.bn || ''}
                    onChange={(e) => setPageHeader(key, 'title', 'bn', e.target.value)}
                  />
                  <Input
                    placeholder="Subtitle (EN)"
                    value={form.pageHeaders?.[key]?.subtitle?.en || ''}
                    onChange={(e) => setPageHeader(key, 'subtitle', 'en', e.target.value)}
                  />
                  <Input
                    placeholder="Subtitle (BN)"
                    value={form.pageHeaders?.[key]?.subtitle?.bn || ''}
                    onChange={(e) => setPageHeader(key, 'subtitle', 'bn', e.target.value)}
                  />
                </div>
              </div>
            ))}

            <Button type="submit" disabled={saveSettingsMutation.isPending}>
              {saveSettingsMutation.isPending ? '...' : t('admin.settings.saveSettings')}
            </Button>
          </CardContent>
        </Card>
      </form>

      {/* Categories CRUD */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('admin.settings.productCategories')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="EN"
                value={newProdCat.en}
                onChange={(e) => setNewProdCat({ ...newProdCat, en: e.target.value })}
              />
              <Input
                placeholder="BN"
                value={newProdCat.bn}
                onChange={(e) => setNewProdCat({ ...newProdCat, bn: e.target.value })}
              />
              <Button
                type="button"
                size="icon"
                onClick={() => addCatMutation.mutate({ type: 'product', name: newProdCat })}
              >
                <FaPlus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="space-y-1.5">
              {(settings?.productCategories || []).map((c) => (
                <div key={c._id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-xs">
                  <span>
                    {pickBilingual(c.name, lang)} <span className="text-muted-foreground">({c.slug})</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-[var(--status-danger)]"
                    onClick={() => deleteCatMutation.mutate({ type: 'product', catId: c._id })}
                  >
                    <FaTrash className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('admin.settings.expenseCategories')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="EN"
                value={newExpCat.en}
                onChange={(e) => setNewExpCat({ ...newExpCat, en: e.target.value })}
              />
              <Input
                placeholder="BN"
                value={newExpCat.bn}
                onChange={(e) => setNewExpCat({ ...newExpCat, bn: e.target.value })}
              />
              <Button
                type="button"
                size="icon"
                onClick={() => addCatMutation.mutate({ type: 'expense', name: newExpCat })}
              >
                <FaPlus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="space-y-1.5">
              {(settings?.expenseCategories || []).map((c) => (
                <div key={c._id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-xs">
                  <span>
                    {pickBilingual(c.name, lang)} <span className="text-muted-foreground">({c.slug})</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-[var(--status-danger)]"
                    onClick={() => deleteCatMutation.mutate({ type: 'expense', catId: c._id })}
                  >
                    <FaTrash className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
