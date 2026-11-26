import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
import { apiClient } from '@/lib/apiClient';
import { useCurrency } from '@/hooks/useCurrency';
import { pickBilingual } from '@/utils/bilingual';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const emptyForm = { nameEn: '', nameBn: '', detailsEn: '', detailsBn: '', cost: '' };

export function AdminServicesPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { formatBDT } = useCurrency();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['public-services', search],
    queryFn: () => apiClient.get(`/api/public/services?search=${encodeURIComponent(search)}`),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editing
        ? apiClient.put(`/api/admin/services/${editing._id}`, payload)
        : apiClient.post('/api/admin/services', payload),
    onSuccess: () => {
      toast.success(editing ? 'Service updated' : 'Service created');
      queryClient.invalidateQueries({ queryKey: ['public-services'] });
      setModalOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/api/admin/services/${id}`),
    onSuccess: () => {
      toast.success('Service deleted');
      queryClient.invalidateQueries({ queryKey: ['public-services'] });
    },
    onError: (err) => toast.error(err.message),
  });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      nameEn: s.name?.en || '',
      nameBn: s.name?.bn || '',
      detailsEn: s.details?.en || '',
      detailsBn: s.details?.bn || '',
      cost: String(s.cost),
    });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({
      name: { en: form.nameEn, bn: form.nameBn },
      details: { en: form.detailsEn, bn: form.detailsBn },
      cost: Number(form.cost),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('admin.sidebar.services')}</h1>
        <Button onClick={openAdd}>
          <FaPlus className="h-3.5 w-3.5" />
          <span>{t('admin.crud.addService')}</span>
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          placeholder={t('services.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-sm"
        />
        <Badge variant="secondary" className="px-3 py-1 text-xs">
          {t('admin.crud.totalServices')}: {services.length}
        </Badge>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('pos.item')}</TableHead>
            <TableHead>{t('services.serviceCost')}</TableHead>
            <TableHead className="text-right">{t('admin.crud.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
          ) : (
            services.map((s) => (
              <TableRow key={s._id}>
                <TableCell>
                  <p className="font-medium text-sm">{pickBilingual(s.name, lang)}</p>
                  <p className="text-xs text-muted-foreground max-w-md truncate">
                    {pickBilingual(s.details, lang)}
                  </p>
                </TableCell>
                <TableCell className="text-sm font-semibold">{formatBDT(s.cost)}</TableCell>
                <TableCell className="text-right space-x-1 whitespace-nowrap">
                  <Button variant="outline" size="sm" onClick={() => openEdit(s)}>
                    <FaEdit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => window.confirm(t('admin.crud.confirmDelete')) && deleteMutation.mutate(s._id)}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t('admin.crud.editService') : t('admin.crud.addService')}</DialogTitle>
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

            <div className="space-y-1">
              <Label>{t('services.serviceCost')}</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                required
              />
            </div>

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
