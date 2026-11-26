/**
 * Resolves a bilingual field ({ en, bn }) or plain string for the active language.
 */
export function pickBilingual(value, language = 'en', fallback = '') {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  const primary = value[language];
  const secondary = value[language === 'bn' ? 'en' : 'bn'];
  return (primary && primary.trim()) || (secondary && secondary.trim()) || fallback;
}
