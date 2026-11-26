const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliDigits(value) {
  return String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

export function formatBDT(amount, language = 'en') {
  const num = Number(amount || 0);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(num);

  if (language === 'bn') {
    return `৳${toBengaliDigits(formatted)}`;
  }
  return `৳${formatted}`;
}
