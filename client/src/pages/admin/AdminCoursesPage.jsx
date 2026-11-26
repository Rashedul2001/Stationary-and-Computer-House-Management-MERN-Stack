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

const emptyForm = {
  titleEn: '',
  titleBn: '',
  descriptionEn: '',
  descriptionBn: '',
  totalFee: '',
  durationEn: '',
  durationBn: '',
};

export function AdminCoursesPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { formatBDT } = useCurrency();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['public-courses', search],
    queryFn: () => apiClient.get(`/api/public/courses?search=${encodeURIComponent(search)}`),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editing
        ? apiClient.put(`/api/admin/courses/${editing._id}`, payload)
        : apiClient.post('/api/admin/courses', payload),
    onSuccess: () => {
      toast.success(editing ? 'Course updated' : 'Course created');
      queryClient.invalidateQueries({ queryKey: ['public-courses'] });
      setModalOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/api/admin/courses/${id}`),
    onSuccess: () => {
      toast.success('Course deleted');
      queryClient.invalidateQueries({ queryKey: ['public-courses'] });
    },
    onError: (err) => toast.error(err.message),
  });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      titleEn: c.title?.en || '',
      titleBn: c.title?.bn || '',
      descriptionEn: c.description?.en || '',
      descriptionBn: c.description?.bn || '',
      totalFee: String(c.totalFee),
      durationEn: c.duration?.en || '',
      durationBn: c.duration?.bn || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({
      title: { en: form.titleEn, bn: form.titleBn },
      description: { en: form.descriptionEn, bn: form.descriptionBn },
      totalFee: Number(form.totalFee),
      duration: { en: form.durationEn, bn: form.durationBn },
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('admin.sidebar.courses')}</h1>
        <Button onClick={openAdd}>
          <FaPlus className="h-3.5 w-3.5" />
          <span>{t('admin.crud.addCourse')}</span>
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          placeholder={t('courses.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-sm"
        />
        <Badge variant="secondary" className="px-3 py-1 text-xs">
          {t('admin.crud.totalCourses')}: {courses.length}
        </Badge>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('pos.course')}</TableHead>
            <TableHead>{t('courses.duration')}</TableHead>
            <TableHead>{t('courses.totalFee')}</TableHead>
            <TableHead className="text-right">{t('admin.crud.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
          ) : (
            courses.map((c) => (
              <TableRow key={c._id}>
                <TableCell>
                  <p className="font-medium text-sm">{pickBilingual(c.title, lang)}</p>
                  <p className="text-xs text-muted-foreground max-w-md truncate">
                    {pickBilingual(c.description, lang)}
                  </p>
                </TableCell>
                <TableCell className="text-xs">{pickBilingual(c.duration, lang)}</TableCell>
                <TableCell className="text-sm font-semibold">{formatBDT(c.totalFee)}</TableCell>
                <TableCell className="text-right space-x-1 whitespace-nowrap">
                  <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                    <FaEdit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => window.confirm(t('admin.crud.confirmDelete')) && deleteMutation.mutate(c._id)}
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
            <DialogTitle>{editing ? t('admin.crud.editCourse') : t('admin.crud.addCourse')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t('admin.crud.titleEn')}</Label>
                <Input value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label>{t('admin.crud.titleBn')}</Label>
                <Input value={form.titleBn} onChange={(e) => setForm({ ...form, titleBn: e.target.value })} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t('admin.crud.detailsEn')}</Label>
                <Textarea
                  value={form.descriptionEn}
                  onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('admin.crud.detailsBn')}</Label>
                <Textarea
                  value={form.descriptionBn}
                  onChange={(e) => setForm({ ...form, descriptionBn: e.target.value })}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>{t('courses.totalFee')}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.totalFee}
                  onChange={(e) => setForm({ ...form, totalFee: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>{t('admin.crud.durationEn')}</Label>
                <Input
                  value={form.durationEn}
                  onChange={(e) => setForm({ ...form, durationEn: e.target.value })}
                  placeholder="3 Months"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>{t('admin.crud.durationBn')}</Label>
                <Input
                  value={form.durationBn}
                  onChange={(e) => setForm({ ...form, durationBn: e.target.value })}
                  placeholder="৩ মাস"
                />
              </div>
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
