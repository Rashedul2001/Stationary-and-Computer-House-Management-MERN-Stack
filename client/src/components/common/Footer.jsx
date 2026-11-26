import { useTranslation } from 'react-i18next';
import {
  FaClock,
  FaEnvelope,
  FaFacebook,
  FaGithub,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaUserTie,
  FaWhatsapp,
} from 'react-icons/fa';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { pickBilingual } from '@/utils/bilingual';
import logoImg from '@/assets/logo.png';

export function Footer() {
  const { t, i18n } = useTranslation();
  const { data: settings } = useSiteSettings();
  const lang = i18n.language;

  const storeName = pickBilingual(settings?.storeName, lang, 'Laksam IT Knowledge & Paper House');
  const proprietor = pickBilingual(settings?.proprietor, lang, 'Md. Abdur Rahman');
  const address = pickBilingual(settings?.address, lang, 'Laksam Upazila Gate, Laksam, Cumilla');
  const openingHours = pickBilingual(settings?.openingHours, lang, 'Sat – Thu: 9:00 AM – 9:00 PM');
  const phones = settings?.phones?.length ? settings.phones : ['01839405184', '01783776936'];
  const whatsapp = settings?.whatsappNumber || '01839405184';
  const email = settings?.email || 'rashedulprogrammer@gmail.com';
  const facebookUrl = settings?.facebookUrl || 'https://www.facebook.com';
  const githubUrl = settings?.githubUrl || 'https://github.com/Rashedul2001';

  return (
    <footer id="contact" className="no-print border-t border-border bg-card text-card-foreground mt-14">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand Summary */}
          <div className="space-y-3">
            <img
              src={logoImg}
              alt={storeName}
              className="h-12 w-auto object-contain rounded bg-white px-2 py-1 border border-border"
            />
            <h3 className="text-base font-semibold text-foreground">{storeName}</h3>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <FaUserTie className="h-4 w-4 shrink-0 text-primary" />
              <span>
                {t('landing.proprietor')}: <strong className="text-foreground">{proprietor}</strong>
              </span>
            </p>
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <FaMapMarkerAlt className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
              <span>{address}</span>
            </p>
          </div>

          {/* Contact Details */}
          <div className="space-y-2.5 text-sm">
            <h4 className="font-semibold text-foreground">{t('landing.contactHeading')}</h4>
            <div className="flex items-center gap-2 text-muted-foreground">
              <FaPhoneAlt className="h-3.5 w-3.5 shrink-0 text-primary" />
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {phones.map((p) => (
                  <a key={p} href={`tel:${p}`} className="hover:text-primary underline-offset-2 hover:underline">
                    {p}
                  </a>
                ))}
              </div>
            </div>
            <p className="flex items-center gap-2 text-muted-foreground">
              <FaWhatsapp className="h-4 w-4 shrink-0 text-[var(--status-success)]" />
              <a
                href={`https://wa.me/88${whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary hover:underline"
              >
                {t('landing.whatsapp')}: {whatsapp}
              </a>
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <FaEnvelope className="h-3.5 w-3.5 shrink-0 text-primary" />
              <a href={`mailto:${email}`} className="hover:text-primary hover:underline break-all">
                {email}
              </a>
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <FaClock className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span>{openingHours}</span>
            </p>
          </div>

          {/* Social & Developer */}
          <div className="space-y-3 text-sm">
            <h4 className="font-semibold text-foreground">{t('landing.facebook')}</h4>
            <div className="flex flex-wrap gap-2">
              <a
                href={facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground hover:bg-accent"
              >
                <FaFacebook className="h-4 w-4 text-primary" />
                {t('landing.facebook')}
              </a>
              <a
                href={`https://wa.me/88${whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground hover:bg-accent"
              >
                <FaWhatsapp className="h-4 w-4 text-[var(--status-success)]" />
                {t('landing.whatsapp')}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border pt-5 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {storeName}
          </p>
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary hover:underline"
          >
            <FaGithub className="h-4 w-4" />
            <span>{t('landing.developedBy')}: Rashedul2001</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
