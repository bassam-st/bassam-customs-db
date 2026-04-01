/**
 * سياق الإعدادات - يوفر إعدادات التطبيق
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AppSettings } from '../types/settings';
import { getSettings } from '../lib/firestore';
import { cacheSettings, getCachedSettings, cacheExchangeRate } from '../lib/storage';

const DEFAULT_SETTINGS: AppSettings = {
  appName: 'مخزن البنود الجمركية',
  exchangeRate: 250,
  factor5: 0.211,
  factor10: 0.265,
  factor25: 0.41,
  ownerPinHash: '',
  currencyCode: 'YER',
  defaultCountry: 'اليمن',
  licenseCheckHours: 24,
  allowOfflineMode: true,
  lastUpdatedAt: null,
  lastUpdatedBy: '',
};

interface SettingsContextType {
  settings: AppSettings;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  loading: true,
  refresh: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const cached = getCachedSettings<AppSettings>();
    return cached ?? DEFAULT_SETTINGS;
  });
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const data = await getSettings();
      if (data) {
        setSettings(data);
        cacheSettings(data);
        cacheExchangeRate(data.exchangeRate);
      }
    } catch (e) {
      console.warn('تعذر تحميل الإعدادات، سيتم استخدام القيم المؤقتة', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refresh }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
