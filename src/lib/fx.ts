import { currencySymbol } from './currency';

// Map of currency symbol -> ISO code, to detect the source currency of an
// API-formatted price string like "₹95,365 - ₹157,353" or "$1,000".
const SYMBOL_TO_CODE: { symbol: string; code: string }[] = [
  { symbol: 'AED', code: 'AED' }, { symbol: 'SAR', code: 'SAR' }, { symbol: 'QAR', code: 'QAR' },
  { symbol: 'R$', code: 'BRL' }, { symbol: 'C$', code: 'CAD' }, { symbol: 'A$', code: 'AUD' },
  { symbol: 'S$', code: 'SGD' }, { symbol: 'HK$', code: 'HKD' }, { symbol: 'NZ$', code: 'NZD' },
  { symbol: 'Rp', code: 'IDR' }, { symbol: 'RM', code: 'MYR' }, { symbol: 'Rs', code: 'LKR' },
  { symbol: '₹', code: 'INR' }, { symbol: '€', code: 'EUR' }, { symbol: '£', code: 'GBP' },
  { symbol: '¥', code: 'JPY' }, { symbol: '₩', code: 'KRW' }, { symbol: '₽', code: 'RUB' },
  { symbol: '฿', code: 'THB' }, { symbol: '₱', code: 'PHP' }, { symbol: '₫', code: 'VND' },
  { symbol: '₺', code: 'TRY' }, { symbol: '₪', code: 'ILS' }, { symbol: '₦', code: 'NGN' },
  { symbol: '$', code: 'USD' },
];

export function detectCurrency(priceStr: string): string {
  for (const { symbol, code } of SYMBOL_TO_CODE) {
    if (priceStr.includes(symbol)) return code;
  }
  return 'USD';
}

function formatMoney(amount: number, code: string): string {
  const sym = currencySymbol(code);
  const rounded = amount >= 100 ? Math.round(amount) : Math.round(amount * 10) / 10;
  const grouped = rounded.toLocaleString('en-US', { maximumFractionDigits: rounded >= 100 ? 0 : 1 });
  return sym.length === 1 ? `${sym}${grouped}` : `${sym} ${grouped}`;
}

/**
 * Convert an API price string to the target currency using USD-based rates.
 * Returns the original string if rates are unavailable.
 */
export function convertPriceString(
  priceStr: string,
  toCode: string,
  rates: Record<string, number> | null,
): string {
  if (!rates) return priceStr;
  const from = detectCurrency(priceStr);
  if (from === toCode) return priceStr;
  const rFrom = rates[from];
  const rTo = rates[toCode];
  if (!rFrom || !rTo) return priceStr;

  const nums = priceStr.match(/[\d][\d,]*/g);
  if (!nums || nums.length === 0) return priceStr;

  const converted = nums.map((n) => formatMoney((parseFloat(n.replace(/,/g, '')) / rFrom) * rTo, toCode));
  return converted.join(' - ');
}

export const RATES_API = 'https://open.er-api.com/v6/latest/USD';
