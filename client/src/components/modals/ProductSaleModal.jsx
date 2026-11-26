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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

export function ProductSaleModal({ open, onOpenChange }) {
  const { t, i18n } = useTranslation();
  const { formatBDT } = useCurrency();
  const lang = i18n.language;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isWholesale, setIsWholesale] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [customerName, setCustomerName] = useState('');
  const [details, setDetails] = useState('');
  const [totalAmount, setTotalAmount] = useState('0');
  const itemRefs = useRef({});

  const { data: products = [] } = useQuery({
    queryKey: ['public-products', 'all'],
    queryFn: () => apiClient.get('/api/public/products'),
    enabled: open,
  });

  // Scroll to first search match in the scrollable list
  useEffect(() => {
    if (!search.trim() || products.length === 0) return;
    const q = search.trim().toLowerCase();
    const match = products.find(
      (p) =>
        (p.name?.en || '').toLowerCase().includes(q) ||
        (p.name?.bn || '').toLowerCase().includes(q)
    );
    if (match && itemRefs.current[match._id]) {
      itemRefs.current[match._id].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [search, products]);

  // Auto-calculate total when product, wholesale toggle, or quantity changes
  const unitPrice = selectedProduct
    ? isWholesale
      ? selectedProduct.wholesalePrice
      : selectedProduct.retailPrice
    : 0;
  const qtyNum = Math.max(1, Number.parseInt(quantity, 10) || 1);
  const calculatedTotal = Number((unitPrice * qtyNum).toFixed(2));

  useEffect(() => {
    setTotalAmount(String(calculatedTotal));
  }, [calculatedTotal]);

  const mutation = useMutation({
    mutationFn: (payload) => apiClient.post('/api/pos/incomes/product', payload),
    onSuccess: () => {
      toast.success(t('pos.productSale') + ' — OK');
      queryClient.invalidateQueries({ queryKey: ['public-products'] });
      queryClient.invalidateQueries({ queryKey: ['pos-incomes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
      setSelectedProduct(null);
      setQuantity('1');
      setCustomerName('');
      setDetails('');
      setSearch('');
      onOpenChange(false);
    },
    onError: (err) => {
      // Show toast and keep modal open so user can edit quantity or selection
      toast.error(err.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      toast.error(t('pos.noneSelected'));
      return;
    }
    const parsedQty = Number.parseInt(quantity, 10);
    if (!parsedQty || parsedQty < 1) {
      toast.error('Quantity must be at least 1.');
      return;
    }
    if (selectedProduct.availableUnits <= 0 || parsedQty > selectedProduct.availableUnits) {
      toast.error(
        `Insufficient stock! Available: ${selectedProduct.availableUnits} ${t('products.units')}. Please adjust quantity.`
      );
      return;
    }

    const finalNum = Number(totalAmount);
    if (Number.isNaN(finalNum) || finalNum < 0) {
      toast.error('Enter a valid total amount.');
      return;
    }

    mutation.mutate({
      productId: selectedProduct._id,
      priceType: isWholesale ? 'wholesale' : 'retail',
      quantity: parsedQty,
      customerName: customerName.trim(),
      details: details.trim(),
      totalAmount: finalNum,
    });
  };

  const isDiscounted = selectedProduct && Number(totalAmount) !== calculatedTotal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('pos.productSale')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder={t('pos.searchProduct')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="h-44 overflow-y-auto rounded-lg border border-border bg-muted/40 p-1.5 space-y-1">
              {products.map((p) => {
                const isSelected = selectedProduct?._id === p._id;
                const matches =
                  !search.trim() ||
                  (p.name?.en || '').toLowerCase().includes(search.toLowerCase()) ||
                  (p.name?.bn || '').toLowerCase().includes(search.toLowerCase());
                return (
                  <button
                    key={p._id}
                    ref={(el) => {
                      itemRefs.current[p._id] = el;
                    }}
                    type="button"
                    onClick={() => setSelectedProduct(p)}
                    className={`w-full flex items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : matches
                          ? 'bg-card hover:bg-secondary'
                          : 'bg-card/40 opacity-50 hover:opacity-80'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{pickBilingual(p.name, lang)}</p>
                      <p className={`text-xs ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                        {t('products.retailPrice')}: {formatBDT(p.retailPrice)} • {t('products.wholesalePrice')}:{' '}
                        {formatBDT(p.wholesalePrice)}
                      </p>
                    </div>
                    <Badge variant={p.availableUnits > 0 ? 'secondary' : 'destructive'} className="shrink-0">
                      {p.availableUnits} {t('products.units')}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm flex items-center justify-between">
            <span className="text-muted-foreground">{t('pos.selectedItem')}:</span>
            <span className="font-semibold text-foreground">
              {selectedProduct ? pickBilingual(selectedProduct.name, lang) : t('pos.noneSelected')}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
            <div className="flex items-center gap-2 text-sm">
              <span className={!isWholesale ? 'font-semibold text-primary' : 'text-muted-foreground'}>
                {t('pos.retail')}
              </span>
              <Switch checked={isWholesale} onCheckedChange={setIsWholesale} />
              <span className={isWholesale ? 'font-semibold text-primary' : 'text-muted-foreground'}>
                {t('pos.wholesale')}
              </span>
            </div>
            {selectedProduct && (
              <span className="text-sm font-semibold">
                {formatBDT(unitPrice)} / {t('products.units')}
              </span>
            )}
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
              {isDiscounted && (
                <p className="text-[11px] text-muted-foreground">
                  {t('pos.calculatedTotal')}: {formatBDT(calculatedTotal)} → {t('pos.discountedPrice')}:{' '}
                  {formatBDT(totalAmount)}
                </p>
              )}
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
