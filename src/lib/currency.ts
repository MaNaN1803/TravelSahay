// ISO-3166 alpha-2 country code -> ISO-4217 currency code.
// Used to localise prices to the searched destination's country.
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: 'USD', CA: 'CAD', MX: 'MXN',
  GB: 'GBP', IE: 'EUR',
  IN: 'INR', PK: 'PKR', BD: 'BDT', LK: 'LKR', NP: 'NPR',
  AE: 'AED', SA: 'SAR', QA: 'QAR', KW: 'KWD', BH: 'BHD', OM: 'OMR', JO: 'JOD', IL: 'ILS', TR: 'TRY',
  CN: 'CNY', HK: 'HKD', TW: 'TWD', JP: 'JPY', KR: 'KRW',
  SG: 'SGD', MY: 'MYR', TH: 'THB', ID: 'IDR', PH: 'PHP', VN: 'VND',
  AU: 'AUD', NZ: 'NZD',
  RU: 'RUB', UA: 'UAH', PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON', BG: 'BGN',
  CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK', IS: 'ISK',
  ZA: 'ZAR', EG: 'EGP', NG: 'NGN', KE: 'KES', MA: 'MAD', GH: 'GHS', TZ: 'TZS',
  BR: 'BRL', AR: 'ARS', CL: 'CLP', CO: 'COP', PE: 'PEN', UY: 'UYU',
  // Eurozone
  DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', PT: 'EUR', NL: 'EUR', BE: 'EUR',
  AT: 'EUR', GR: 'EUR', FI: 'EUR', LU: 'EUR', SK: 'EUR', SI: 'EUR', EE: 'EUR',
  LV: 'EUR', LT: 'EUR', CY: 'EUR', MT: 'EUR', HR: 'EUR',
};

export function currencyForCountry(code?: string | null): string {
  if (!code) return 'USD';
  return COUNTRY_TO_CURRENCY[code.toUpperCase()] ?? 'USD';
}

const SYMBOLS: Record<string, string> = {
  USD: '$', CAD: 'C$', AUD: 'A$', NZD: 'NZ$', SGD: 'S$', HKD: 'HK$', MXN: 'MX$',
  EUR: '€', GBP: '£', INR: '₹', JPY: '¥', CNY: '¥', KRW: '₩', RUB: '₽',
  AED: 'AED', SAR: 'SAR', QAR: 'QAR', THB: '฿', PHP: '₱', VND: '₫', IDR: 'Rp',
  MYR: 'RM', TRY: '₺', ZAR: 'R', BRL: 'R$', CHF: 'CHF', SEK: 'kr', NOK: 'kr',
  DKK: 'kr', PLN: 'zł', ILS: '₪', EGP: 'E£', NGN: '₦', PKR: '₨', LKR: 'Rs',
};

/** Symbol for an ISO currency code (single char where possible). */
export function currencySymbol(code: string): string {
  return SYMBOLS[code?.toUpperCase()] ?? `${code} `;
}
