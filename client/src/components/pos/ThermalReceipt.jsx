import React from 'react';
import { useTranslation } from 'react-i18next';
import logoImg from '@/assets/logo.png';
import { pickBilingual } from '@/utils/bilingual';
import { formatBDT } from '@/utils/formatCurrency';
import { formatDhakaDateTime } from '@/utils/formatDate';

/**
 * 80mm Thermal POS Receipt Template (supports single or bundled multi-transaction printing).
 */
export const ThermalReceipt = React.forwardRef(({ transactions = [], settings, currentUser }, ref) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const storeName = pickBilingual(settings?.storeName, lang, 'Laksam IT Knowledge & Paper House');
  const proprietor = pickBilingual(settings?.proprietor, lang, 'Md. Abdur Rahman');
  const address = pickBilingual(settings?.address, lang, 'Laksam Upazila Gate, Laksam, Cumilla');
  const phones = settings?.phones?.length ? settings.phones.join(', ') : '01839405184, 01783776936';

  const grandTotal = transactions.reduce((sum, tx) => sum + Number(tx.finalAmount || 0), 0);
  const originalTotal = transactions.reduce(
    (sum, tx) => sum + Number(tx.calculatedTotal ?? tx.finalAmount ?? 0),
    0
  );
  const hasAnyDiscount = transactions.some((tx) => tx.isDiscounted);

  const uniqueCustomers = [...new Set(transactions.map((tx) => tx.customerName).filter(Boolean))];
  const customerDisplay = uniqueCustomers.length > 0 ? uniqueCustomers.join(', ') : 'Walk-in Customer';

  const invoiceNumbers = transactions.map((tx) => tx.invoiceNumber).filter(Boolean);
  const receiptNoDisplay =
    invoiceNumbers.length === 1
      ? invoiceNumbers[0]
      : invoiceNumbers.length > 1
        ? `${invoiceNumbers[0]} (+${invoiceNumbers.length - 1})`
        : '---';

  return (
    <div
      ref={ref}
      className="thermal-receipt-root mx-auto w-full max-w-[302px] rounded border border-dashed border-border bg-white p-3 text-[11px] leading-snug text-black font-mono"
    >
      {/* Store Header */}
      <div className="text-center border-b border-dashed border-black/60 pb-2 mb-2">
        <img src={logoImg} alt={storeName} className="mx-auto h-10 w-auto object-contain mb-1" />
        <p className="text-xs font-bold uppercase tracking-tight">{storeName}</p>
        <p className="text-[10px]">
          {t('landing.proprietor')}: {proprietor}
        </p>
        <p className="text-[10px]">{address}</p>
        <p className="text-[10px]">
          {t('landing.phones')}: {phones}
        </p>
      </div>

      {/* Receipt Metadata */}
      <div className="space-y-0.5 border-b border-dashed border-black/60 pb-2 mb-2 text-[10px]">
        <p className="text-center font-bold text-[11px] tracking-wide mb-1">{t('pos.receiptTitle')}</p>
        <div className="flex justify-between gap-2">
          <span>{t('pos.invoiceNo')}:</span>
          <span className="font-semibold text-right break-all">{receiptNoDisplay}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span>{t('pos.date')}:</span>
          <span className="text-right">
            {formatDhakaDateTime(transactions[0]?.transactionDate || new Date(), lang)}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span>{t('pos.customer')}:</span>
          <span className="font-semibold text-right">{customerDisplay}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span>{t('pos.servedBy')}:</span>
          <span className="text-right">
            {transactions[0]?.enteredBy?.name || currentUser?.name || '---'}
          </span>
        </div>
      </div>

      {/* Line Items */}
      <div className="border-b border-dashed border-black/60 pb-2 mb-2">
        <div className="grid grid-cols-12 font-bold border-b border-black/40 pb-1 mb-1 text-[10px]">
          <span className="col-span-6">{t('pos.item')}</span>
          <span className="col-span-2 text-center">{t('pos.qty')}</span>
          <span className="col-span-4 text-right">{t('pos.amount')}</span>
        </div>

        {transactions.length === 0 ? (
          <p className="py-3 text-center text-[10px] opacity-70">{t('pos.noneSelected')}</p>
        ) : (
          <div className="space-y-1.5">
            {transactions.map((tx) => {
              const title = pickBilingual(tx.itemTitle, lang, 'Item');
              return (
                <div key={tx._id || tx.invoiceNumber} className="text-[10px]">
                  <div className="grid grid-cols-12 items-start gap-1">
                    <div className="col-span-6">
                      <p className="font-semibold break-words">{title}</p>
                      <p className="text-[9px] opacity-80">
                        {tx.invoiceNumber} • {formatBDT(tx.unitPrice, lang)}
                        {tx.priceType === 'wholesale' ? ` (${t('products.wholesalePrice')})` : ''}
                      </p>
                      {tx.details && <p className="text-[9px] opacity-75 break-words">{tx.details}</p>}
                    </div>
                    <span className="col-span-2 text-center">{tx.quantity || 1}</span>
                    <div className="col-span-4 text-right">
                      {tx.isDiscounted ? (
                        <>
                          <span className="block line-through text-[9px] opacity-70">
                            {formatBDT(tx.calculatedTotal, lang)}
                          </span>
                          <span className="font-bold">{formatBDT(tx.finalAmount, lang)}</span>
                        </>
                      ) : (
                        <span className="font-semibold">{formatBDT(tx.finalAmount, lang)}</span>
                      )}
                    </div>
                  </div>
                  {tx.isDiscounted && (
                    <p className="text-[9px] italic">
                      * {t('pos.discountedPrice')}: {formatBDT(tx.discountedPrice ?? tx.finalAmount, lang)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="space-y-1 border-b border-dashed border-black/60 pb-2 mb-2 text-[11px]">
        {hasAnyDiscount && (
          <div className="flex justify-between text-[10px] opacity-80">
            <span>{t('pos.originalTotal')}:</span>
            <span className="line-through">{formatBDT(originalTotal, lang)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-xs">
          <span>{t('pos.grandTotal')}:</span>
          <span>{formatBDT(grandTotal, lang)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] space-y-0.5 pt-1">
        <p className="font-semibold">{t('pos.thankYou')}</p>
        <p className="text-[9px] opacity-75">Software by Laksam IT Knowledge</p>
      </div>
    </div>
  );
});

ThermalReceipt.displayName = 'ThermalReceipt';
