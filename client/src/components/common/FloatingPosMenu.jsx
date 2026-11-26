import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FaBoxes, FaFileInvoiceDollar, FaGraduationCap, FaPlus, FaReceipt, FaTools, FaTimes } from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';
import { ProductSaleModal } from '../modals/ProductSaleModal';
import { ServiceSaleModal } from '../modals/ServiceSaleModal';
import { ExpenseModal } from '../modals/ExpenseModal';
import { StudentFeeModal } from '../modals/StudentFeeModal';
import { PrintInvoiceModal } from '../modals/PrintInvoiceModal';

export function FloatingPosMenu() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  if (!isAuthenticated) return null;

  const actions = [
    { id: 'product', label: t('pos.productSale'), icon: FaBoxes },
    { id: 'service', label: t('pos.serviceSale'), icon: FaTools },
    { id: 'expense', label: t('pos.expenseRecord'), icon: FaFileInvoiceDollar },
    { id: 'student-fee', label: t('pos.collectFee'), icon: FaGraduationCap },
    { id: 'invoice', label: t('pos.printInvoice'), icon: FaReceipt },
  ];

  const openModal = (id) => {
    setExpanded(false);
    setActiveModal(id);
  };

  return (
    <>
      <div className="no-print fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2.5">
        {expanded && (
          <div className="flex flex-col items-end gap-2 mb-1">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => openModal(action.id)}
                  className="flex items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-lg hover:bg-secondary cursor-pointer transition-transform hover:-translate-x-0.5"
                >
                  <span>{action.label}</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-label="Quick POS Actions"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl hover:bg-[var(--primary-hover)] cursor-pointer transition-transform active:scale-95"
        >
          {expanded ? <FaTimes className="h-5 w-5" /> : <FaPlus className="h-5 w-5" />}
        </button>
      </div>

      <ProductSaleModal
        open={activeModal === 'product'}
        onOpenChange={(v) => !v && setActiveModal(null)}
        onSuccess={() => toast.success(t('pos.productSale') + ' — OK')}
      />
      <ServiceSaleModal
        open={activeModal === 'service'}
        onOpenChange={(v) => !v && setActiveModal(null)}
      />
      <ExpenseModal
        open={activeModal === 'expense'}
        onOpenChange={(v) => !v && setActiveModal(null)}
      />
      <StudentFeeModal
        open={activeModal === 'student-fee'}
        onOpenChange={(v) => !v && setActiveModal(null)}
      />
      <PrintInvoiceModal
        open={activeModal === 'invoice'}
        onOpenChange={(v) => !v && setActiveModal(null)}
      />
    </>
  );
}
