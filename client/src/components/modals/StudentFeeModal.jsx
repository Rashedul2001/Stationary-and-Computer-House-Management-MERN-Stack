import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';
import { pickBilingual } from '@/utils/bilingual';
import { useCurrency } from '@/hooks/useCurrency';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export function StudentFeeModal({ open, onOpenChange }) {
  const { t, i18n } = useTranslation();
  const { formatBDT } = useCurrency();
  const lang = i18n.language;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [amount, setAmount] = useState('');
  const [details, setDetails] = useState('');
  const itemRefs = useRef({});

  const { data: students = [] } = useQuery({
    queryKey: ['pos-students'],
    queryFn: () => apiClient.get('/api/pos/students'),
    enabled: open,
  });

  useEffect(() => {
    if (!search.trim() || students.length === 0) return;
    const q = search.trim().toLowerCase();
    const match = students.find(
      (s) => s.name.toLowerCase().includes(q) || s.phone.toLowerCase().includes(q)
    );
    if (match && itemRefs.current[match._id]) {
      itemRefs.current[match._id].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [search, students]);

  const mutation = useMutation({
    mutationFn: (payload) => apiClient.post('/api/pos/incomes/student-fee', payload),
    onSuccess: () => {
      toast.success(t('pos.collectFee') + ' — OK');
      queryClient.invalidateQueries({ queryKey: ['pos-students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      queryClient.invalidateQueries({ queryKey: ['pos-incomes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
      setSelectedStudent(null);
      setAmount('');
      setDetails('');
      setSearch('');
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      toast.error('Please select a student.');
      return;
    }
    const payAmt = Number(amount);
    if (!payAmt || payAmt <= 0) {
      toast.error('Payment amount must be greater than 0.');
      return;
    }
    if (payAmt > selectedStudent.dueFee) {
      toast.error(`Cannot exceed remaining due (${formatBDT(selectedStudent.dueFee)}).`);
      return;
    }
    mutation.mutate({
      studentId: selectedStudent._id,
      amount: payAmt,
      details: details.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('pos.collectFee')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder={t('pos.searchStudent')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="h-44 overflow-y-auto rounded-lg border border-border bg-muted/40 p-1.5 space-y-1">
              {students.map((st) => {
                const isSelected = selectedStudent?._id === st._id;
                const matches =
                  !search.trim() ||
                  st.name.toLowerCase().includes(search.toLowerCase()) ||
                  st.phone.toLowerCase().includes(search.toLowerCase());
                return (
                  <button
                    key={st._id}
                    ref={(el) => {
                      itemRefs.current[st._id] = el;
                    }}
                    type="button"
                    onClick={() => {
                      setSelectedStudent(st);
                      setAmount(st.dueFee > 0 ? String(st.dueFee) : '0');
                    }}
                    className={`w-full flex items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : matches
                          ? 'bg-card hover:bg-secondary'
                          : 'bg-card/40 opacity-50 hover:opacity-80'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {st.name} • {st.phone}
                      </p>
                      <p className={`text-xs truncate ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                        {pickBilingual(st.courseTitleSnapshot, lang)}
                      </p>
                    </div>
                    <Badge variant={st.dueFee > 0 ? 'warning' : 'success'} className="shrink-0">
                      {t('pos.dueAmount')}: {formatBDT(st.dueFee)}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedStudent && (
            <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('pos.studentInfo')}:</span>
                <span className="font-semibold">
                  {selectedStudent.name} ({selectedStudent.phone})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('pos.course')}:</span>
                <span>{pickBilingual(selectedStudent.courseTitleSnapshot, lang)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('pos.dueAmount')}:</span>
                <span className="font-bold text-[var(--status-warning)]">{formatBDT(selectedStudent.dueFee)}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('pos.payAmount')}</Label>
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
              <Input value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Installment note" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('pos.cancelBtn')}
            </Button>
            <Button type="submit" disabled={mutation.isPending || !selectedStudent || selectedStudent.dueFee <= 0}>
              {mutation.isPending ? '...' : t('pos.enterBtn')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
