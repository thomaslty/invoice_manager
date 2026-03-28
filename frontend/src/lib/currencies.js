export const CURRENCIES = {
  HKD: { symbol: 'HK$', label: 'HKD - Hong Kong Dollar' },
  USD: { symbol: 'US$', label: 'USD - US Dollar' },
  RMB: { symbol: '¥', label: 'RMB - Renminbi' },
};

export const CURRENCY_CODES = Object.keys(CURRENCIES);

export function getCurrencySymbol(code) {
  return CURRENCIES[code]?.symbol ?? code;
}
