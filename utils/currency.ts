import { IndianRupee, DollarSign, Euro, PoundSterling, JapaneseYen, LucideIcon } from 'lucide-react';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  label: string;
  icon: LucideIcon;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee (₹)', icon: IndianRupee },
  { code: 'USD', symbol: '$', label: 'US Dollar ($)', icon: DollarSign },
  { code: 'EUR', symbol: '€', label: 'Euro (€)', icon: Euro },
  { code: 'GBP', symbol: '£', label: 'British Pound (£)', icon: PoundSterling },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen (¥)', icon: JapaneseYen },
];

export function getCurrencySymbol(currency: string): string {
  const found = SUPPORTED_CURRENCIES.find(c => c.code === currency);
  return found ? found.symbol : '₹';
}

export function getCurrencyIcon(currency: string): LucideIcon {
  const found = SUPPORTED_CURRENCIES.find(c => c.code === currency);
  return found ? found.icon : IndianRupee;
}

export function formatCurrency(n: number, currency: string, compact = false): string {
  const symbol = getCurrencySymbol(currency);
  const absN = Math.abs(n);
  
  if (compact) {
    if (currency === 'INR') {
      if (absN >= 10000000) return `${n < 0 ? '-' : ''}${symbol}${(absN / 10000000).toFixed(1)}Cr`;
      if (absN >= 100000) return `${n < 0 ? '-' : ''}${symbol}${(absN / 100000).toFixed(1)}L`;
      if (absN >= 1000) return `${n < 0 ? '-' : ''}${symbol}${(absN / 1000).toFixed(1)}K`;
    } else {
      if (absN >= 1000000000) return `${n < 0 ? '-' : ''}${symbol}${(absN / 1000000000).toFixed(1)}B`;
      if (absN >= 1000000) return `${n < 0 ? '-' : ''}${symbol}${(absN / 1000000).toFixed(1)}M`;
      if (absN >= 1000) return `${n < 0 ? '-' : ''}${symbol}${(absN / 1000).toFixed(1)}K`;
    }
  }
  
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return `${n < 0 ? '-' : ''}${symbol}${absN.toLocaleString(locale, { maximumFractionDigits: 2 })}`;
}

export async function fetchExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`);
    if (!res.ok) throw new Error('Network response not ok');
    const data = await res.json();
    if (data.result === 'success' && data.rates && data.rates[to]) {
      return data.rates[to];
    }
    throw new Error('Exchange rate not found for target currency');
  } catch (e) {
    console.warn(`Failed to fetch exchange rate from ${from} to ${to}, using static fallbacks:`, e);
    // Hardcoded relative rates to USD (1 USD = X of other currency)
    const usdBaseRates: Record<string, number> = {
      USD: 1.0,
      INR: 83.5,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 155.0,
    };
    // Calculate rate (from -> USD -> to)
    const fromInUSD = 1 / (usdBaseRates[from] || 1.0);
    const toRate = usdBaseRates[to] || 1.0;
    return fromInUSD * toRate;
  }
}
