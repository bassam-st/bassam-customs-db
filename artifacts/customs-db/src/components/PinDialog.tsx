/**
 * نافذة التحقق من PIN المالك
 *
 * إذا لم يتم تعيين PIN بعد (ownerPinHash فارغ) →
 * يُسمح بالدخول مباشرةً مع تنبيه بضرورة تعيين PIN
 */
import React, { useEffect, useState } from 'react';
import { Lock, AlertTriangle } from 'lucide-react';
import { verifyPin } from '../lib/pinHash';
import { useSettings } from '../app/SettingsContext';

interface PinDialogProps {
  onVerified: () => void;
  onCancel: () => void;
}

export function PinDialog({ onVerified, onCancel }: PinDialogProps) {
  const { settings } = useSettings();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const pinNotSet = !settings.ownerPinHash || settings.ownerPinHash.trim() === '';

  // إذا لم يُضبط PIN بعد → أدخل مباشرة
  useEffect(() => {
    if (pinNotSet) {
      onVerified();
    }
  }, [pinNotSet]);

  // أثناء التحقق (إذا كان PIN غير مضبوط يدخل تلقائياً)
  if (pinNotSet) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <AlertTriangle className="text-yellow-600" size={24} />
            </div>
            <p className="text-sm text-muted-foreground">جاري الدخول...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setError('');
    try {
      const ok = await verifyPin(pin, settings.ownerPinHash);
      if (ok) {
        onVerified();
      } else {
        setError('PIN غير صحيح، حاول مرة أخرى');
        setPin('');
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="flex flex-col items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="text-primary" size={24} />
          </div>
          <h2 className="text-lg font-bold">تحقق من PIN المالك</h2>
          <p className="text-sm text-muted-foreground text-center">
            أدخل PIN المالك للمتابعة
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="أدخل PIN"
            value={pin}
            onChange={e => setPin(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
            autoComplete="current-password"
            required
          />

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2 text-sm text-destructive text-center">
              {error}
            </div>
          )}

          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={checking || !pin.trim()}
              className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50 transition-colors"
            >
              {checking ? 'جاري التحقق...' : 'تأكيد'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
