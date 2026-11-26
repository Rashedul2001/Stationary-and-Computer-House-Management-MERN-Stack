import { useTranslation } from 'react-i18next';
import { Switch } from '@/components/ui/switch';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const isBn = i18n.language === 'bn';

  const handleToggle = (checked) => {
    const next = checked ? 'bn' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('likph_lang', next);
  };

  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1 text-xs font-semibold shrink-0">
      <span className={!isBn ? 'text-primary' : 'text-muted-foreground'}>EN</span>
      <Switch
        checked={isBn}
        onCheckedChange={handleToggle}
        aria-label="Toggle Bengali and English language"
        className="h-5 w-9"
      />
      <span className={isBn ? 'text-primary' : 'text-muted-foreground'}>বাং</span>
    </div>
  );
}
