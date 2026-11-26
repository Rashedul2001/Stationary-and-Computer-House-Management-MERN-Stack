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

export function ServiceSaleModal({ open, onOpenChange }) {
  const { t, i18n } = useTranslation();
  const { formatBDT } = useCurrency();
  const lang = i18n.language;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [customerName, setCustomerName] = useState('');
  const [details, setDetails] = useState('');
  const [totalAmount, setTotalAmount] = useState('0');
  const itemRefs = useRef({});

  const { data: services = [] } = useQuery({
    queryKey: ['public-services', 'all'],
    queryFn: () => apiClient.get('/api/public/services'),
    enabled: open,
  });

  useEffect(() => {
    if (!search.trim() || services.length === 0) return;
    const q = search.trim().toLowerCase();
    const match = services.find(
      (s) =>
        (s.name?.en || '').toLowerCase().includes(q) ||
        (s.name?.bn || '').toLowerCase().includes(q)
    );
    if (match && itemRefs.current[match._id]) {
      itemRefs.current[match._id].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [search, services]);

  const qtyNum = Math.max(1, Number.parseInt(quantity, 10) || 1);
  const calculatedTotal = selectedService ? Number((selectedService.cost * qtyNum).toFixed(2)) : 0;

  useEffect(() => {
    setTotalAmount(String(calculatedTotal));
  }, [calculatedTotal]);

  const mutation = useMutation({
    mutationFn: (payload) => apiClient.post('/api/pos/incomes/service', payload),
    onSuccess: () => {
      toast.success(t('pos.serviceSale') + ' — OK');
      queryClient.invalidateQueries({ queryKey: ['pos-incomes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
      setSelectedService(null);
      setQuantity('1');
      setCustomerName('');
      setDetails('');
      setSearch('');
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedService) {
      toast.error(t('pos.noneSelected'));
      return;
    }
    const finalNum = Number(totalAmount);
    if (Number.isNaN(finalNum) || finalNum < 0) {
      toast.error('Enter a valid total amount.');
      return;
    }
    mutation.mutate({
      serviceId: selectedService._id,
      quantity: qtyNum,
      customerName: customerName.trim(),
      details: details.trim(),
      totalAmount: finalNum,
    });
  };

  const isDiscounted = selectedService && Number(totalAmount) !== calculatedTotal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('pos.serviceSale')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder={t('pos.searchService')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="h-44 overflow-y-auto rounded-lg border border-border bg-muted/40 p-1.5 space-y-1">
              {services.map((s) => {
                const isSelected = selectedService?._id === s._id;
                const matches =
                  !search.trim() ||
                  (s.name?.en || '').toLowerCase().includes(search.toLowerCase()) ||
                  (s.name?.bn || '').toLowerCase().includes(search.toLowerCase());
                return (
                  <button
                    key={s._id}
                    ref={(el) => {
                      itemRefs.current[s._id] = el;
                    }}
                    type="button"
                    onClick={() => setSelectedService(s)}
                    className={`w-full flex items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : matches
                          ? 'bg-card hover:bg-secondary'
                          : 'bg-card/40 opacity-50 hover:opacity-80'
                    }`}
                  >
                    <span className="font-medium truncate">{pickBilingual(s.name, lang)}</span>
                    <Badge variant="secondary" className="shrink-0">
                      {formatBDT(s.cost)}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm flex items-center justify-between">
            <span className="text-muted-foreground">{t('pos.selectedItem')}:</span>
            <span className="font-semibold">
              {selectedService ? pickBilingual(selectedService.name, lang) : t('pos.noneSelected')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('pos.quantity')}</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center justify-between">
                <span>{t('pos.totalAmount')}</span>
                {isDiscounted && (
                  <Badge variant="warning" className="text-[10px]">
                    {t('pos.discountedPrice')}
                  </Badge>
                )}
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('pos.customerName')}</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-1.5">
              <Label>{t('pos.details')}</Label>
              <Input value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Optional" />
            </div>
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
