import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.5,
  CAD: 1.36,
  AUD: 1.52,
  JPY: 155.0,
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  CAD: 'CA$',
  AUD: 'A$',
  JPY: '¥',
};

export const convertCurrencyCents = (
  cents: number,
  fromCurrency = 'USD',
  toCurrency = 'USD'
): number => {
  if (!cents || isNaN(cents)) return 0;
  const fromUpper = (fromCurrency || 'USD').toUpperCase();
  const toUpper = (toCurrency || 'USD').toUpperCase();
  if (fromUpper === toUpper) return cents;

  const fromRate = EXCHANGE_RATES[fromUpper] || 1.0;
  const toRate = EXCHANGE_RATES[toUpper] || 1.0;

  // Amount in base USD cents
  const usdCents = cents / fromRate;
  // Convert to target currency cents
  return Math.round(usdCents * toRate);
};

export const formatMoney = (cents: number, currency = 'USD'): string => {
  const curr = (currency || 'USD').toUpperCase();
  const symbol = CURRENCY_SYMBOLS[curr] || `${curr} `;
  const amount = Math.abs(cents || 0) / 100;
  const sign = cents < 0 ? '-' : '';
  return `${sign}${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export interface ConversionResult {
  isDifferent: boolean;
  docCurrency: string;
  homeCurrency: string;
  originalFormatted: string;
  convertedCents: number;
  convertedFormatted: string;
  rateText: string;
}

export const getConversionDetails = (
  cents: number,
  docCurrency = 'USD',
  homeCurrency = 'USD'
): ConversionResult => {
  const docUpper = (docCurrency || 'USD').toUpperCase();
  const homeUpper = (homeCurrency || 'USD').toUpperCase();
  const isDifferent = docUpper !== homeUpper;

  const convertedCents = isDifferent
    ? convertCurrencyCents(cents, docUpper, homeUpper)
    : cents;

  const docRate = EXCHANGE_RATES[docUpper] || 1.0;
  const homeRate = EXCHANGE_RATES[homeUpper] || 1.0;
  const rate = homeRate / docRate;

  return {
    isDifferent,
    docCurrency: docUpper,
    homeCurrency: homeUpper,
    originalFormatted: formatMoney(cents, docUpper),
    convertedCents,
    convertedFormatted: formatMoney(convertedCents, homeUpper),
    rateText: `1 ${docUpper} ≈ ${rate >= 10 ? rate.toFixed(1) : rate.toFixed(3)} ${homeUpper}`,
  };
};

interface CurrencyContextType {
  homeCurrency: string;
  setHomeCurrencyState: (curr: string) => void;
  formatHome: (cents: number, fromCurrency?: string) => string;
  formatDoc: (cents: number, docCurrency?: string) => string;
  convert: (cents: number, fromCurrency?: string, toCurrency?: string) => number;
  getConversion: (cents: number, docCurrency?: string) => ConversionResult;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [homeCurrency, setHomeCurrencyState] = useState<string>('USD');

  // Load active user account profile
  const { data: account } = useQuery({
    queryKey: ['userAccount'],
    queryFn: api.getAccount,
  });

  useEffect(() => {
    if (account?.home_currency) {
      setHomeCurrencyState(account.home_currency);
    }
  }, [account?.home_currency]);

  const formatHome = (cents: number, fromCurrency = 'USD'): string => {
    const converted = convertCurrencyCents(cents, fromCurrency, homeCurrency);
    return formatMoney(converted, homeCurrency);
  };

  const formatDoc = (cents: number, docCurrency = 'USD'): string => {
    return formatMoney(cents, docCurrency);
  };

  const convert = (cents: number, fromCurrency = 'USD', toCurrency = homeCurrency): number => {
    return convertCurrencyCents(cents, fromCurrency, toCurrency);
  };

  const getConversion = (cents: number, docCurrency = 'USD'): ConversionResult => {
    return getConversionDetails(cents, docCurrency, homeCurrency);
  };

  return (
    <CurrencyContext.Provider
      value={{
        homeCurrency,
        setHomeCurrencyState,
        formatHome,
        formatDoc,
        convert,
        getConversion,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    // Graceful fallback if invoked outside provider
    return {
      homeCurrency: 'USD',
      setHomeCurrencyState: () => {},
      formatHome: (cents: number) => formatMoney(cents, 'USD'),
      formatDoc: (cents: number, curr = 'USD') => formatMoney(cents, curr),
      convert: (cents: number) => cents,
      getConversion: (cents: number, curr = 'USD') => getConversionDetails(cents, curr, 'USD'),
    };
  }
  return context;
};
