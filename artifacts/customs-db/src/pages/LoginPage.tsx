/**
 * صفحة تسجيل الدخول
 */
import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { signIn } from '../lib/auth';
import { Shield, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { code?: string })?.code;
      if (msg === 'auth/user-not-found' || msg === 'auth/wrong-password' || msg === 'auth/invalid-credential') {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else if (msg === 'auth/too-many-requests') {
        setError('تم حظر الحساب مؤقتاً بسبب محاولات كثيرة. حاول لاحقاً.');
      } else {
        setError('حدث خطأ أثناء تسجيل الدخول');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-6" dir="rtl">
      {/* الشعار */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center shadow-lg">
          <Shield className="text-primary-foreground" size={40} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">مخزن البنود الجمركية</h1>
          <p className="text-sm text-muted-foreground mt-1">نظام إدارة الجمارك</p>
        </div>
      </div>

      {/* بطاقة تسجيل الدخول */}
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-3xl border border-border shadow-lg p-6">
          <h2 className="text-lg font-semibold text-center mb-6">تسجيل الدخول</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@domain.com"
                required
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                dir="ltr"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                dir="ltr"
              />
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-base disabled:opacity-50 transition-opacity mt-2"
            >
              {loading ? 'جاري الدخول...' : 'دخول'}
            </button>
          </form>
        </div>

        {/* زر إنشاء حساب */}
        <button
          onClick={() => navigate('/register')}
          className="w-full flex items-center justify-center gap-2 mt-4 py-3.5 rounded-xl border border-border bg-card text-foreground font-semibold text-sm hover:bg-muted transition-colors"
        >
          <UserPlus size={18} />
          إنشاء حساب جديد
        </button>
      </div>
    </div>
  );
}
