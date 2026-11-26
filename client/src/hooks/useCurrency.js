import { useTranslation } from 'react-i18next';
import { formatBDT } from '../utils/formatCurrency';

export function useCurrency() {
  const { i18n } = useTranslation();
  return {
    formatBDT: (amount) => formatBDT(amount, i18n.language),
    language: i18n.language,
  };
}
