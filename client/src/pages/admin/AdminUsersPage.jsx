import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FaCloudUploadAlt, FaEdit, FaPlus, FaTrash, FaUserCircle } from 'react-icons/fa';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const emptyForm = { name: '', email: '', password: '', role: 'assistant' };

export function AdminUsersPage() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => apiClient.get(`/api/admin/users?search=${encodeURIComponent(search)}`),
  });

  const saveMutation = useMutation({
    mutationFn: (formData) =>
      editing
        ? apiClient.put(`/api/admin/users/${editing.id}`, formData)
        : apiClient.post('/api/admin/users', formData),
    onSuccess: () => {
      toast.success(editing ? 'User updated' : 'User created');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setModalOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/api/admin/users/${id}`),
    onSuccess: () => {
      toast.success('User deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err) => toast.error(err.message),
  });

  const handleFileChange = (file) => {
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setSelectedFile(null);
    setPreviewUrl('');
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role || 'assistant' });
    setSelectedFile(null);
    setPreviewUrl(u.image || '');
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!editing && form.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    const fd = new FormData();
    fd.append('name', form.name.trim());
    fd.append('email', form.email.trim());
    fd.append('role', form.role);
    if (form.password.trim()) fd.append('password', form.password.trim());
    if (selectedFile) fd.append('image', selectedFile);
    saveMutation.mutate(fd);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('admin.sidebar.users')}</h1>
        <Button onClick={openAdd}>
          <FaPlus className="h-3.5 w-3.5" />
          <span>{t('admin.crud.addUser')}</span>
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          placeholder="Search users by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-sm"
        />
        <Badge variant="secondary" className="px-3 py-1 text-xs">
          {t('admin.crud.totalUsers')}: {users.length}
        </Badge>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>{t('auth.email')}</TableHead>
            <TableHead>{t('admin.crud.role')}</TableHead>
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
            users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="flex items-center gap-3">
                  {u.image ? (
                    <img src={u.image} alt={u.name} className="h-9 w-9 rounded-full object-cover border border-border" />
                  ) : (
                    <FaUserCircle className="h-9 w-9 text-muted-foreground" />
                  )}
                  <span className="font-medium text-sm">{u.name}</span>
                </TableCell>
                <TableCell className="text-xs">{u.email}</TableCell>
                <TableCell>
                  <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                    {u.role === 'admin' ? t('nav.roleAdmin') : t('nav.roleAssistant')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-1 whitespace-nowrap">
                  <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                    <FaEdit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={u.id === currentUser?.id}
                    onClick={() => window.confirm(t('admin.crud.confirmDelete')) && deleteMutation.mutate(u.id)}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? t('admin.crud.editUser') : t('admin.crud.addUser')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Cloudinary Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileChange(e.dataTransfer.files?.[0]);
              }}
              className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input bg-muted/40 p-4 text-center"
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="h-20 w-20 rounded-full object-cover border border-border" />
              ) : (
                <FaCloudUploadAlt className="h-8 w-8 text-primary" />
              )}
              <label className="text-xs font-medium text-primary hover:underline cursor-pointer">
                {t('admin.crud.uploadPhoto')}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0])}
                />
              </label>
            </div>

            <div className="space-y-1">
              <Label>Profile Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>

            <div className="space-y-1">
              <Label>{t('auth.email')}</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{editing ? 'New Password (optional)' : t('auth.password')}</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editing}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('admin.crud.role')}</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assistant">{t('nav.roleAssistant')}</SelectItem>
                    <SelectItem value="admin">{t('nav.roleAdmin')}</SelectItem>
                  </SelectContent>
                </Select>
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
