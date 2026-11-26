import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
import { apiClient } from '@/lib/apiClient';
import { useCurrency } from '@/hooks/useCurrency';
import { pickBilingual } from '@/utils/bilingual';
import { formatDhakaDate } from '@/utils/formatDate';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  courseId: '',
  enrolledAt: '',
  initialPayment: '0',
  dueFee: '0',
};

export function AdminStudentsPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { formatBDT } = useCurrency();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['admin-students', search],
    queryFn: () => apiClient.get(`/api/admin/students?search=${encodeURIComponent(search)}`),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['public-courses', 'all'],
    queryFn: () => apiClient.get('/api/public/courses'),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editing
        ? apiClient.put(`/api/admin/students/${editing._id}`, payload)
        : apiClient.post('/api/admin/students', payload),
    onSuccess: () => {
      toast.success(editing ? 'Student updated' : 'Student enrolled');
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      queryClient.invalidateQueries({ queryKey: ['pos-students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
      setModalOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/api/admin/students/${id}`),
    onSuccess: () => {
      toast.success('Student deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      queryClient.invalidateQueries({ queryKey: ['pos-students'] });
    },
    onError: (err) => toast.error(err.message),
  });

  const openAdd = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      courseId: courses[0]?._id || '',
      enrolledAt: new Date().toISOString().slice(0, 10),
    });
    setModalOpen(true);
  };

  const openEdit = (st) => {
    setEditing(st);
    setForm({
      name: st.name || '',
      phone: st.phone || '',
      email: st.email || '',
      address: st.address || '',
      courseId: st.courseId || '',
      enrolledAt: st.enrolledAt ? new Date(st.enrolledAt).toISOString().slice(0, 10) : '',
      initialPayment: '0',
      dueFee: String(st.dueFee),
    });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) {
      saveMutation.mutate({
        name: form.name,
        phone: form.phone,
        email: form.email,
        address: form.address,
        courseId: form.courseId,
        enrolledAt: form.enrolledAt || undefined,
        dueFee: Number(form.dueFee || 0),
      });
    } else {
      saveMutation.mutate({
        name: form.name,
        phone: form.phone,
        email: form.email,
        address: form.address,
        courseId: form.courseId,
        enrolledAt: form.enrolledAt || undefined,
        initialPayment: Number(form.initialPayment || 0),
      });
    }
  };

  const selectedCourse = courses.find((c) => c._id === form.courseId);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('admin.sidebar.students')}</h1>
        <Button onClick={openAdd}>
          <FaPlus className="h-3.5 w-3.5" />
          <span>{t('admin.crud.addStudent')}</span>
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          placeholder={t('pos.searchStudent')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-sm"
        />
        <Badge variant="secondary" className="px-3 py-1 text-xs">
          {t('admin.crud.totalStudents')}: {students.length}
        </Badge>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('pos.studentInfo')}</TableHead>
            <TableHead>{t('landing.address')}</TableHead>
            <TableHead>{t('pos.course')}</TableHead>
            <TableHead>{t('admin.crud.enrolledAt')}</TableHead>
            <TableHead>{t('pos.dueAmount')}</TableHead>
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
            students.map((st) => (
              <TableRow key={st._id}>
                <TableCell>
                  <p className="font-medium text-sm">{st.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {st.phone} {st.email ? `• ${st.email}` : ''}
                  </p>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{st.address || '---'}</TableCell>
                <TableCell className="text-xs font-medium">
                  {pickBilingual(st.courseTitleSnapshot, lang)}
                  <span className="block text-muted-foreground">
                    {t('courses.totalFee')}: {formatBDT(st.totalFee)}
                  </span>
                </TableCell>
                <TableCell className="text-xs whitespace-nowrap">{formatDhakaDate(st.enrolledAt, lang)}</TableCell>
                <TableCell>
                  <Badge variant={st.dueFee > 0 ? 'warning' : 'success'}>
                    {formatBDT(st.dueFee)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-1 whitespace-nowrap">
                  <Button variant="outline" size="sm" onClick={() => openEdit(st)}>
                    <FaEdit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => window.confirm(t('admin.crud.confirmDelete')) && deleteMutation.mutate(st._id)}
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
            <DialogTitle>{editing ? t('admin.crud.editStudent') : t('admin.crud.addStudent')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label>{t('landing.phones')}</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t('landing.email')}</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>{t('admin.crud.enrolledAt')}</Label>
                <Input
                  type="date"
                  value={form.enrolledAt}
                  onChange={(e) => setForm({ ...form, enrolledAt: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>{t('landing.address')}</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t('pos.course')}</Label>
                <Select value={form.courseId} onValueChange={(v) => setForm({ ...form, courseId: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {pickBilingual(c.title, lang)} ({formatBDT(c.totalFee)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editing ? (
                <div className="space-y-1">
                  <Label>{t('pos.dueAmount')}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.dueFee}
                    onChange={(e) => setForm({ ...form, dueFee: e.target.value })}
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <Label>{t('admin.crud.initialPayment')}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.initialPayment}
                    onChange={(e) => setForm({ ...form, initialPayment: e.target.value })}
                  />
                  {selectedCourse && (
                    <p className="text-[11px] text-muted-foreground">
                      {t('pos.dueAmount')}: {formatBDT(Math.max(0, selectedCourse.totalFee - Number(form.initialPayment || 0)))}
                    </p>
                  )}
                </div>
              )}
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
