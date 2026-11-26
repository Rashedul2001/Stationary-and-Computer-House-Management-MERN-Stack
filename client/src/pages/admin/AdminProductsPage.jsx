import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
import { apiClient } from '@/lib/apiClient';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useCurrency } from '@/hooks/useCurrency';
import { pickBilingual } from '@/utils/bilingual';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const emptyForm = {
  nameEn: '',
  nameBn: '',
  detailsEn: '',
  detailsBn: '',
  categorySlug: '',
  imageUrl: '',
  retailPrice: '',
  wholesalePrice: '',
  availableUnits: '0',
  addUnits: '0',
};

export function AdminProductsPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { formatBDT } = useCurrency();
  const queryClient = useQueryClient();
  const { data: settings } = useSiteSettings();
  const categories = settings?.productCategories || [];

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['public-products', search],
    queryFn: () => apiClient.get(`/api/public/products?search=${encodeURIComponent(search)}`),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editing
        ? apiClient.put(`/api/admin/products/${editing._id}`, payload)
        : apiClient.post('/api/admin/products', payload),
    onSuccess: () => {
      toast.success(editing ? 'Product updated' : 'Product created');
      queryClient.invalidateQueries({ queryKey: ['public-products'] });
      setModalOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/api/admin/products/${id}`),
    onSuccess: () => {
      toast.success('Product deleted');
      queryClient.invalidateQueries({ queryKey: ['public-products'] });
    },
    onError: (err) => toast.error(err.message),
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, categorySlug: categories[0]?.slug || 'paper' });
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      nameEn: p.name?.en || '',
      nameBn: p.name?.bn || '',
      detailsEn: p.details?.en || '',
      detailsBn: p.details?.bn || '',
      categorySlug: p.categorySlug || '',
      imageUrl: p.imageUrl || '',
      retailPrice: String(p.retailPrice),
      wholesalePrice: String(p.wholesalePrice),
      availableUnits: String(p.availableUnits),
      addUnits: '0',
    });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({
      name: { en: form.nameEn, bn: form.nameBn },
      details: { en: form.detailsEn, bn: form.detailsBn },
      categorySlug: form.categorySlug,
      imageUrl: form.imageUrl,
      retailPrice: Number(form.retailPrice),
      wholesalePrice: Number(form.wholesalePrice),
      availableUnits: Number(form.availableUnits),
      ...(editing ? { addUnits: Number(form.addUnits || 0) } : {}),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('admin.sidebar.products')}</h1>
        <Button onClick={openAdd}>
          <FaPlus className="h-3.5 w-3.5" />
          <span>{t('admin.crud.addProduct')}</span>
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          placeholder={t('products.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-sm"
        />
        <Badge variant="secondary" className="px-3 py-1 text-xs">
          {t('admin.crud.totalProducts')}: {products.length}
        </Badge>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('pos.item')}</TableHead>
            <TableHead>{t('admin.crud.category')}</TableHead>
            <TableHead>{t('products.retailPrice')}</TableHead>
            <TableHead>{t('products.wholesalePrice')}</TableHead>
            <TableHead>{t('products.inStock')}</TableHead>
            <TableHead className="text-right">{t('admin.crud.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
          ) : (
            products.map((p) => (
              <TableRow key={p._id}>
                <TableCell>
                  <p className="font-medium text-sm">{pickBilingual(p.name, lang)}</p>
                  <p className="text-xs text-muted-foreground max-w-xs truncate">
                    {pickBilingual(p.details, lang)}
                  </p>
                </TableCell>
                <TableCell className="text-xs">{p.categorySlug}</TableCell>
                <TableCell className="text-sm font-medium">{formatBDT(p.retailPrice)}</TableCell>
                <TableCell className="text-sm">{formatBDT(p.wholesalePrice)}</TableCell>
                <TableCell>
                  <Badge variant={p.availableUnits > 0 ? 'success' : 'destructive'}>
                    {p.availableUnits} {t('products.units')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-1 whitespace-nowrap">
                  <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                    <FaEdit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => window.confirm(t('admin.crud.confirmDelete')) && deleteMutation.mutate(p._id)}
                  >
                    <FaTrash className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? t('admin.crud.editProduct') : t('admin.crud.addProduct')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t('admin.crud.nameEn')}</Label>
                <Input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label>{t('admin.crud.nameBn')}</Label>
                <Input value={form.nameBn} onChange={(e) => setForm({ ...form, nameBn: e.target.value })} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t('admin.crud.detailsEn')}</Label>
                <Textarea value={form.detailsEn} onChange={(e) => setForm({ ...form, detailsEn: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>{t('admin.crud.detailsBn')}</Label>
                <Textarea value={form.detailsBn} onChange={(e) => setForm({ ...form, detailsBn: e.target.value })} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t('admin.crud.category')}</Label>
                <Select value={form.categorySlug} onValueChange={(v) => setForm({ ...form, categorySlug: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.slug} value={c.slug}>
                        {pickBilingual(c.name, lang)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t('admin.crud.imageLink')}</Label>
                <Input
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>{t('products.retailPrice')}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.retailPrice}
                  onChange={(e) => setForm({ ...form, retailPrice: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>{t('products.wholesalePrice')}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.wholesalePrice}
                  onChange={(e) => setForm({ ...form, wholesalePrice: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>{t('products.inStock')}</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.availableUnits}
                  onChange={(e) => setForm({ ...form, availableUnits: e.target.value })}
                  required
                />
              </div>
            </div>

            {editing && (
              <div className="space-y-1 rounded-lg border border-border bg-muted/40 p-3">
                <Label>{t('admin.crud.addUnits')}</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.addUnits}
                  onChange={(e) => setForm({ ...form, addUnits: e.target.value })}
                />
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                {t('pos.cancelBtn')}
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? '...' : t('admin.crud.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
