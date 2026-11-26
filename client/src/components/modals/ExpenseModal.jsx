import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { pickBilingual } from '@/utils/bilingual';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ExpenseModal({ open, onOpenChange }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const queryClient = useQueryClient();
  const { data: settings } = useSiteSettings();
  const categories = settings?.expenseCategories || [];

  const [categorySlug, setCategorySlug] = useState('');
  const [details, setDetails] = useState('');
  const [amount, setAmount] = useState('');

  const mutation = useMutation({
    mutationFn: (payload) => apiClient.post('/api/pos/expenses', payload),
    onSuccess: () => {
      toast.success(t('pos.expenseRecord') + ' — OK');
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
      setCategorySlug('');
      setDetails('');
      setAmount('');
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!categorySlug) {
      toast.error('Please select an expense category.');
      return;
    }
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid expense amount.');
      return;
    }
    mutation.mutate({
      categorySlug,
      details: details.trim(),
      amount: amt,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('pos.expenseRecord')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t('pos.expenseCategory')}</Label>
            <Select value={categorySlug} onValueChange={setCategorySlug}>
              <SelectTrigger>
                <SelectValue placeholder={t('pos.expenseCategory')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.slug} value={cat.slug}>
                    {pickBilingual(cat.name, lang, cat.slug)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t('pos.expenseAmount')}</Label>
            <Input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t('pos.details')}</Label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Expense description..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('pos.cancelBtn')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? '...' : t('pos.enterBtn')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
