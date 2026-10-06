const CURRENCY_SYMBOLS = {
  GHS: '₵',
  USD: '$',
  EUR: '€',
  GBP: '£',
  NGN: '₦',
};

export const formatCurrency = (amount, currency = 'GHS') => {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const num = Number(amount) || 0;
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const todayISO = () => new Date().toISOString().split('T')[0];

export const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
