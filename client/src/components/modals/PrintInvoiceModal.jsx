import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import { FaPrint } from 'react-icons/fa';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/hooks/useAuth';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useCurrency } from '@/hooks/useCurrency';
import { pickBilingual } from '@/utils/bilingual';
import { formatDhakaDateTime } from '@/utils/formatDate';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ThermalReceipt } from '../pos/ThermalReceipt';

export function PrintInvoiceModal({ open, onOpenChange }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { user } = useAuth();
  const { formatBDT } = useCurrency();
  const { data: settings } = useSiteSettings();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const receiptRef = useRef(null);

  const { data: incomes = [] } = useQuery({
    queryKey: ['pos-incomes', search],
    queryFn: () => apiClient.get(`/api/pos/incomes?search=${encodeURIComponent(search)}&limit=60`),
    enabled: open,
  });

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Receipt-${Date.now()}`,
  });

  const toggleId = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectedTransactions = incomes.filter((tx) => selectedIds.includes(tx._id));
  const previewList = selectedTransactions.length > 0 ? selectedTransactions : incomes.slice(0, 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="no-print">
          <DialogTitle>{t('pos.printInvoice')}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Multi-select Recent Income Transactions */}
          <div className="no-print space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-muted-foreground">{t('pos.selectTransactions')}</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedIds.length} {t('pos.selectedCount')}
                </Badge>
                {selectedIds.length > 0 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
                    {t('pos.clearSelection')}
                  </Button>
                )}
              </div>
            </div>

            <Input
              placeholder={t('pos.searchInvoices')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="h-80 overflow-y-auto rounded-lg border border-border bg-muted/40 p-1.5 space-y-1.5">
              {incomes.map((tx) => {
                const checked = selectedIds.includes(tx._id);
                return (
                  <label
                    key={tx._id}
                    className={`flex items-start gap-2.5 rounded-md border p-2.5 text-xs cursor-pointer transition-colors ${
                      checked ? 'border-primary bg-primary/10' : 'border-transparent bg-card hover:bg-secondary'
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleId(tx._id)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold truncate">{pickBilingual(tx.itemTitle, lang)}</span>
                        <span className="font-bold text-primary shrink-0">{formatBDT(tx.finalAmount)}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {tx.invoiceNumber} • {tx.customerName || 'Walk-in'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDhakaDateTime(tx.transactionDate, lang)}
                        {tx.isDiscounted ? ` • ${t('pos.discountedPrice')}` : ''}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Right: Live 80mm Thermal POS Receipt Preview */}
          <div className="space-y-2">
            <p className="no-print text-xs font-semibold text-muted-foreground text-center">
              {t('pos.invoicePreview')}
            </p>
            <div className="max-h-96 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3">
              <ThermalReceipt
                ref={receiptRef}
                transactions={previewList}
                settings={settings}
                currentUser={user}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="no-print">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('pos.cancelBtn')}
          </Button>
          <Button type="button" onClick={handlePrint} disabled={previewList.length === 0}>
            <FaPrint className="h-4 w-4" />
            <span>{t('pos.printBtn')}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
