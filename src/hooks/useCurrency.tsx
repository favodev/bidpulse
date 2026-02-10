"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from "react";

// Monedas soportadas
export type CurrencyCode = "CLP" | "USD" | "EUR" | "MXN" | "ARS" | "COP" | "PEN" | "BRL";

export interface CurrencyInfo {
  code: CurrencyCode;
  name: string;
  symbol: string;
  locale: string;
  decimals: number;
}

// Configuración de monedas
export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  CLP: { code: "CLP", name: "Peso Chileno", symbol: "$", locale: "es-CL", decimals: 0 },
  USD: { code: "USD", name: "US Dollar", symbol: "$", locale: "en-US", decimals: 2 },
  EUR: { code: "EUR", name: "Euro", symbol: "€", locale: "es-ES", decimals: 2 },
  MXN: { code: "MXN", name: "Peso Mexicano", symbol: "$", locale: "es-MX", decimals: 2 },
  ARS: { code: "ARS", name: "Peso Argentino", symbol: "$", locale: "es-AR", decimals: 0 },
  COP: { code: "COP", name: "Peso Colombiano", symbol: "$", locale: "es-CO", decimals: 0 },
  PEN: { code: "PEN", name: "Sol Peruano", symbol: "S/", locale: "es-PE", decimals: 2 },
  BRL: { code: "BRL", name: "Real Brasileño", symbol: "R$", locale: "pt-BR", decimals: 2 },
};

// Tasas de cambio de fallback
const FALLBACK_EXCHANGE_RATES: Record<CurrencyCode, number> = {
  CLP: 1,
  USD: 0.00107,
  EUR: 0.00098,
  MXN: 0.018,
  ARS: 0.92,
  COP: 4.3,
  PEN: 0.004,
  BRL: 0.0053,
};

// Cache keys
const STORAGE_KEY = "bidpulse_currency";
const RATES_CACHE_KEY = "bidpulse_exchange_rates";
const RATES_CACHE_TIMESTAMP_KEY = "bidpulse_exchange_rates_timestamp";
const CACHE_DURATION = 1000 * 60 * 60; 

interface ExchangeRatesCache {
  rates: Record<CurrencyCode, number>;
  timestamp: number;
}

interface CurrencyContextValue {
  currency: CurrencyCode;
  currencyInfo: CurrencyInfo;
  setCurrency: (code: CurrencyCode) => void;
  formatPrice: (amountInCLP: number) => string;
  convertFromCLP: (amountInCLP: number) => number;
  convertToCLP: (amount: number) => number;
  availableCurrencies: CurrencyInfo[];
  isLoadingRates: boolean;
  lastUpdated: Date | null;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

// Función para obtener tasas de cambio de la API
async function fetchExchangeRates(): Promise<Record<CurrencyCode, number> | null> {
  try {
    // exchangeratesapi.io usa EUR como base en el plan gratuito
    // Obtenemos todas las monedas y calculamos las tasas relativas a CLP
    const API_KEY = process.env.NEXT_PUBLIC_EXCHANGE_RATES_API_KEY;
    
    if (!API_KEY) {
      console.warn("Exchange rates API key not configured, using fallback rates");
      return null;
    }

    const symbols = Object.keys(CURRENCIES).join(",");
    const response = await fetch(
      `https://api.exchangeratesapi.io/v1/latest?access_key=${API_KEY}&symbols=${symbols}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.rates) {
      throw new Error("Invalid API response");
    }

    // La API retorna tasas relativas a EUR
    // Necesitamos convertir a tasas relativas a CLP
    const eurRates = data.rates as Record<string, number>;
    const clpInEur = eurRates.CLP; // Cuántos CLP por 1 EUR

    if (!clpInEur) {
      throw new Error("CLP rate not found in response");
    }

    // Calcular tasas: cuántas unidades de cada moneda por 1 CLP
    const rates: Record<CurrencyCode, number> = {
      CLP: 1,
      USD: eurRates.USD / clpInEur,
      EUR: 1 / clpInEur,
      MXN: eurRates.MXN / clpInEur,
      ARS: eurRates.ARS / clpInEur,
      COP: eurRates.COP / clpInEur,
      PEN: eurRates.PEN / clpInEur,
      BRL: eurRates.BRL / clpInEur,
    };

    return rates;
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    return null;
  }
}

// Función para guardar tasas en cache
function saveRatesToCache(rates: Record<CurrencyCode, number>) {
  try {
    localStorage.setItem(RATES_CACHE_KEY, JSON.stringify(rates));
    localStorage.setItem(RATES_CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error("Error saving rates to cache:", error);
  }
}

// Función para obtener tasas del cache
function getRatesFromCache(): ExchangeRatesCache | null {
  try {
    const ratesStr = localStorage.getItem(RATES_CACHE_KEY);
    const timestampStr = localStorage.getItem(RATES_CACHE_TIMESTAMP_KEY);

    if (!ratesStr || !timestampStr) return null;

    const rates = JSON.parse(ratesStr);
    const timestamp = parseInt(timestampStr, 10);

    return { rates, timestamp };
  } catch (error) {
    console.error("Error reading rates from cache:", error);
    return null;
  }
}

interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("CLP");
  const [exchangeRates, setExchangeRates] = useState<Record<CurrencyCode, number>>(FALLBACK_EXCHANGE_RATES);
  const [isLoadingRates, setIsLoadingRates] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Cargar moneda guardada y tasas de cambio al iniciar
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved in CURRENCIES) {
      setCurrencyState(saved as CurrencyCode);
    }

    // Cargar tasas de cambio
    const loadExchangeRates = async () => {
      setIsLoadingRates(true);

      const cached = getRatesFromCache();
      const now = Date.now();

      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        setExchangeRates(cached.rates);
        setLastUpdated(new Date(cached.timestamp));
        setIsLoadingRates(false);
        return;
      }

      const freshRates = await fetchExchangeRates();

      if (freshRates) {
        setExchangeRates(freshRates);
        saveRatesToCache(freshRates);
        setLastUpdated(new Date());
      } else if (cached) {
        setExchangeRates(cached.rates);
        setLastUpdated(new Date(cached.timestamp));
      }

      setIsLoadingRates(false);
    };

    loadExchangeRates();
  }, []);

  // Cambiar moneda y guardar
  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code);
    localStorage.setItem(STORAGE_KEY, code);
  }, []);

  // Convertir de CLP a la moneda seleccionada
  const convertFromCLP = useCallback(
    (amountInCLP: number): number => {
      const rate = exchangeRates[currency];
      return amountInCLP * rate;
    },
    [currency, exchangeRates]
  );

  // Convertir a CLP desde la moneda seleccionada
  const convertToCLP = useCallback(
    (amount: number): number => {
      const rate = exchangeRates[currency];
      if (!rate || rate === 0) return amount; // guard division by zero
      return amount / rate;
    },
    [currency, exchangeRates]
  );

  // Formatear precio
  const formatPrice = useCallback(
    (amountInCLP: number): string => {
      const info = CURRENCIES[currency];
      const converted = convertFromCLP(amountInCLP);

      const formatted = new Intl.NumberFormat(info.locale, {
        minimumFractionDigits: info.decimals,
        maximumFractionDigits: info.decimals,
      }).format(converted);

      return `${info.symbol}${formatted} ${info.code}`;
    },
    [currency, convertFromCLP]
  );

  const value = useMemo<CurrencyContextValue>(() => ({
    currency,
    currencyInfo: CURRENCIES[currency],
    setCurrency,
    formatPrice,
    convertFromCLP,
    convertToCLP,
    availableCurrencies: Object.values(CURRENCIES),
    isLoadingRates,
    lastUpdated,
  }), [currency, setCurrency, formatPrice, convertFromCLP, convertToCLP, isLoadingRates, lastUpdated]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
