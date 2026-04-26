/**
 * صفحة الإعدادات - خاصة بالمالك فقط
 */
import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Settings, Save, LogOut, AlertCircle, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { PinDialog } from '../components/PinDialog';
import { useAuth } from '../app/AuthContext';
import { useSettings } from '../app/SettingsContext';
import { saveSettings } from '../lib/firestore';
import { hashPin } from '../lib/pinHash';
import { signOut } from '../lib/auth';
import { isOwner } from '../lib/permissions';

export default function SettingsPage() {
  const [, navigate] = useLocation();
  const { appUser } = useAuth();
  const { settings, refresh } = useSettings();
  const [showPinDialog, setShowPinDialog] = useState(true);
  const [pinVerified, setPinVerified] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    appName: settings.appName,
    exchangeRate: settings.exchangeRate,
    factor5: settings.factor5,
    factor10: settings.factor10,
    factor25: settings.factor25,
    newPin: '',
    confirmPin: '',
  });

  const canAccess = appUser ? isOwner({ uid: appUser.uid, role: appUser.role, status: appUser.status }) : false;

  if (!canAccess) {
    return (
      <div className="p-6 flex flex-col items-center gap-3 text-center">
        <AlertCircle size={32} className="text-destructive" />
        <p className="text-sm text-muted-foreground">ليس لديك صلاحية الوصول لهذه الصفحة</p>
      </div>
    );
  }

  const handleSave = async () => {
    if (!appUser) return;
    if (form.newPin && form.newPin.length < 4) {
      setError('PIN يجب أن يكون 4 أحرف على الأقل');
      return;
    }
    if (form.newPin && form.newPin !== form.confirmPin) {
      setError('كلمتا PIN غير متطابقتين');
      return;
    }
    if (form.exchangeRate <= 0) { setError('سعر الصرف يجب أن يكون أكبر من صفر'); return; }

    setSaving(true);
    setError('');
    try {
      const updates: Record<string, unknown> = {
        appName: form.appName,
        exchangeRate: form.exchangeRate,
        factor5: form.factor5,
        factor10: form.factor10,
        factor25: form.factor25,
      };
      if (form.newPin) {
        updates.ownerPinHash = await hashPin(form.newPin);
      }
      await saveSettings(updates, appUser.uid);
      await refresh();
      setSuccess('تم حفظ الإعدادات بنجاح');
      setForm(f => ({ ...f, newPin: '', confirmPin: '' }));
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('فشل حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (showPinDialog && !pinVerified) {
    return (
      <PinDialog
        onVerified={() => { setPinVerified(true); setShowPinDialog(false); }}
        onCancel={() => navigate('/')}
      />
    );
  }

  return (
    <>
      <PageHeader title="إعدادات التطبيق" subtitle="صلاحية المالك فقط" />

      <div className="p-4 flex flex-col gap-4 pb-8">

        {/* تحذير: PIN غير مضبوط */}
        {(!settings.ownerPinHash || settings.ownerPinHash.trim() === '') && (
          <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3">
            <AlertTriangle size={18} className="text-yellow-600 mt-0.5 shrink-0" />
            <p className="text-sm text-yellow-800 leading-relaxed">
              <strong>لم يتم تعيين PIN بعد.</strong> يُرجى تعيين PIN المالك أدناه وحفظ الإعدادات لتفعيل الحماية.
            </p>
          </div>
        )}

        {/* الإعدادات العامة */}
        <Section title="الإعدادات العامة">
          <Field label="اسم التطبيق">
            <input
              type="text"
              value={form.appName}
              onChange={e => setForm(f => ({ ...f, appName: e.target.value }))}
              className="input-base"
            />
          </Field>
          <Field label="سعر الصرف (ريال مقابل دولار)">
            <input
              type="number"
              value={form.exchangeRate}
              onChange={e => setForm(f => ({ ...f, exchangeRate: parseFloat(e.target.value) || 0 }))}
              className="input-base"
              min="1"
              step="1"
              dir="ltr"
            />
          </Field>
        </Section>

        {/* عوامل الفئات */}
        <Section title="عوامل الفئات الجمركية">
          <Field label="عامل 5%">
            <input
              type="number"
              value={form.factor5}
              onChange={e => setForm(f => ({ ...f, factor5: parseFloat(e.target.value) || 0 }))}
              className="input-base"
              step="0.001"
              dir="ltr"
            />
          </Field>
          <Field label="عامل 10%">
            <input
              type="number"
              value={form.factor10}
              onChange={e => setForm(f => ({ ...f, factor10: parseFloat(e.target.value) || 0 }))}
              className="input-base"
              step="0.001"
              dir="ltr"
            />
          </Field>
          <Field label="عامل 25%">
            <input
              type="number"
              value={form.factor25}
              onChange={e => setForm(f => ({ ...f, factor25: parseFloat(e.target.value) || 0 }))}
              className="input-base"
              step="0.001"
              dir="ltr"
            />
          </Field>
        </Section>

        {/* تغيير PIN */}
        <Section title="تغيير PIN المالك">
          <p className="text-xs text-muted-foreground">اتركه فارغاً إذا لم تريد تغيير PIN</p>
          <Field label="PIN الجديد">
            <input
              type="password"
              value={form.newPin}
              onChange={e => setForm(f => ({ ...f, newPin: e.target.value }))}
              className="input-base"
              placeholder="PIN جديد (8 أحرف على الأقل)"
            />
          </Field>
          <Field label="تأكيد PIN الجديد">
            <input
              type="password"
              value={form.confirmPin}
              onChange={e => setForm(f => ({ ...f, confirmPin: e.target.value }))}
              className="input-base"
              placeholder="أعد كتابة PIN"
            />
          </Field>
        </Section>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800 text-center">
            {success}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save size={20} />
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </button>

        {/* تسجيل الخروج */}
        <button
          onClick={handleLogout}
          className="w-full py-3.5 rounded-2xl border border-destructive/30 text-destructive font-medium text-sm flex items-center justify-center gap-2"
        >
          <LogOut size={18} /> تسجيل الخروج
        </button>

        {/* معلومات المستخدم */}
        {appUser && (
          <div className="bg-muted/50 rounded-2xl p-4 text-sm text-muted-foreground text-center">
            <p>مسجل دخول كـ: {appUser.fullName}</p>
            <p className="text-xs mt-0.5">{appUser.email}</p>
          </div>
        )}
      </div>

      <style>{`
        .input-base {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid hsl(var(--input));
          background: hsl(var(--background));
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          outline: none;
          transition: box-shadow 0.2s;
        }
        .input-base:focus { box-shadow: 0 0 0 2px hsl(var(--primary)); }
      `}</style>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-3">
      <h3 className="text-sm font-bold">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
