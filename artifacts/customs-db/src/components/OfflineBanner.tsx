/**
 * شريط إعلام عدم الاتصال بالإنترنت
 */
import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[100] bg-destructive text-destructive-foreground px-4 py-2 flex items-center gap-2 text-sm font-medium justify-center">
      <WifiOff size={16} />
      <span>أنت غير متصل بالإنترنت - عمل بوضع دون اتصال</span>
    </div>
  );
}
