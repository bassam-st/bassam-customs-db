/**
 * صفحة إضافة / تعديل بند جمركي
 */
import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { LoadingScreen } from '../components/LoadingScreen';
import { getItem, addItem, updateItem } from '../lib/firestore';
import { useAuth } from '../app/AuthContext';
import { useSettings } from '../app/SettingsContext';
import type { CategoryLabel } from '../types/item';
import type { NewItem } from '../types/item';

const CATEGORIES: { label: CategoryLabel; factor: number }[] = [
  { label: '5%', factor: 0.211 },
  { label: '10%', factor: 0.265 },
  { label: '25%', factor: 0.41 },
];

const emptyForm: NewItem = {
  name: '',
  aliases: [],
  hsCode: '',
  usdPrice: 0,
  priceUnit: 'قطعة',
  categoryLabel: '5%',
  categoryFactor: 0.211,
  countryOfOrigin: '',
  shortDescription: '',
  longDescription: '',
  notes: '',
  status: 'active',
  isFavorite: false,
  lastPrice: null,
  lastPriceUpdatedAt: null,
  createdBy: '',
  updatedBy: '',
};

export default function AddEditItemPage() {
  const { id } = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const { appUser } = useAuth();
  const { settings } = useSettings();
  const isEdit = !!id;

  const [form, setForm] = useState<NewItem>(emptyForm);
  const [aliasInput, setAliasInput] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // تحميل البيانات في وضع التعديل
  useEffect(() => {
    if (!isEdit || !id) return;
    getItem(id).then(item => {
      if (item) {
        setForm({
          name: item.name,
          aliases: item.aliases,
          hsCode: item.hsCode,
          usdPrice: item.usdPrice,
          priceUnit: item.priceUnit,
          categoryLabel: item.categoryLabel,
          categoryFactor: item.categoryFactor,
          countryOfOrigin: item.countryOfOrigin,
          shortDescription: item.shortDescription,
          longDescription: item.longDescription,
          notes: item.notes,
          status: item.status,
          isFavorite: item.isFavorite,
          lastPrice: item.lastPrice,
          lastPriceUpdatedAt: item.lastPriceUpdatedAt,
          createdBy: item.createdBy,
          updatedBy: item.updatedBy,
        });
      }
      setLoading(false);
    });
  }, [id, isEdit]);

  const handleCategoryChange = (label: CategoryLabel) => {
    const cat = CATEGORIES.find(c => c.label === label);
    setForm(f => ({
      ...f,
      categoryLabel: label,
      categoryFactor: cat ? cat.factor : settings.factor5,
    }));
  };

  const addAlias = () => {
    const a = aliasInput.trim();
    if (a && !form.aliases.includes(a)) {
      setForm(f => ({ ...f, aliases: [...f.aliases, a] }));
    }
    setAliasInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser) return;
    if (!form.name.trim()) { setError('اسم البند مطلوب'); return; }
    if (form.usdPrice <= 0) { setError('السعر يجب أن يكون أكبر من صفر'); return; }

    setSaving(true);
    setError('');
    try {
      if (isEdit && id) {
        await updateItem(id, form, appUser.uid);
      } else {
        await addItem({ ...form, createdBy: appUser.uid, updatedBy: appUser.uid }, appUser.uid);
      }
      navigate('/inventory');
    } catch (err) {
      setError('حدث خطأ أثناء الحفظ');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <>
      <PageHeader title={isEdit ? 'تعديل البند' : 'إضافة بند جديد'} />

      <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4 pb-8">
        {/* الاسم */}
        <FormSection title="المعلومات الأساسية">
          <Field label="اسم البند *">
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="input-base"
              placeholder="مثال: شاشة LED 32 بوصة"
              required
            />
          </Field>

          <Field label="كود HS">
            <input
              type="text"
              value={form.hsCode}
              onChange={e => setForm(f => ({ ...f, hsCode: e.target.value }))}
              className="input-base"
              placeholder="مثال: 8528.72"
              dir="ltr"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="السعر (USD) *">
              <input
                type="number"
                value={form.usdPrice || ''}
                onChange={e => setForm(f => ({ ...f, usdPrice: parseFloat(e.target.value) || 0 }))}
                className="input-base"
                min="0"
                step="0.01"
                required
              />
            </Field>
            <Field label="وحدة السعر">
              <input
                type="text"
                value={form.priceUnit}
                onChange={e => setForm(f => ({ ...f, priceUnit: e.target.value }))}
                className="input-base"
                placeholder="قطعة / كجم / لتر"
              />
            </Field>
          </div>

          <Field label="الفئة الجمركية *">
            <div className="flex gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => handleCategoryChange(cat.label)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors
                    ${form.categoryLabel === cat.label
                      ? cat.label === '5%' ? 'bg-green-500 text-white border-green-500'
                        : cat.label === '10%' ? 'bg-yellow-500 text-white border-yellow-500'
                        : 'bg-red-500 text-white border-red-500'
                      : 'bg-background border-input text-foreground'
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label={`عامل الفئة (${form.categoryLabel})`}>
            <input
              type="number"
              value={form.categoryFactor}
              onChange={e => setForm(f => ({ ...f, categoryFactor: parseFloat(e.target.value) || 0 }))}
              className="input-base"
              step="0.001"
              min="0"
            />
          </Field>

          <Field label="دولة المنشأ">
            <input
              type="text"
              value={form.countryOfOrigin}
              onChange={e => setForm(f => ({ ...f, countryOfOrigin: e.target.value }))}
              className="input-base"
              placeholder="مثال: الصين"
            />
          </Field>
        </FormSection>

        {/* الأسماء البديلة */}
        <FormSection title="الأسماء البديلة">
          <div className="flex gap-2">
            <input
              type="text"
              value={aliasInput}
              onChange={e => setAliasInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAlias())}
              className="input-base flex-1"
              placeholder="اسم بديل أو مرادف"
            />
            <button type="button" onClick={addAlias} className="px-3 py-2 rounded-xl bg-primary text-primary-foreground">
              <Plus size={18} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.aliases.map((a, i) => (
              <span key={i} className="flex items-center gap-1 bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
                {a}
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, aliases: f.aliases.filter((_, j) => j !== i) }))}
                >
                  <Trash2 size={12} />
                </button>
              </span>
            ))}
          </div>
        </FormSection>

        {/* الوصف والملاحظات */}
        <FormSection title="الوصف والملاحظات">
          <Field label="وصف مختصر">
            <input
              type="text"
              value={form.shortDescription}
              onChange={e => setForm(f => ({ ...f, shortDescription: e.target.value }))}
              className="input-base"
              placeholder="وصف قصير للبند"
            />
          </Field>
          <Field label="وصف تفصيلي">
            <textarea
              value={form.longDescription}
              onChange={e => setForm(f => ({ ...f, longDescription: e.target.value }))}
              className="input-base resize-none"
              rows={3}
              placeholder="وصف تفصيلي..."
            />
          </Field>
          <Field label="ملاحظات">
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="input-base resize-none"
              rows={2}
              placeholder="ملاحظات إضافية..."
            />
          </Field>
        </FormSection>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base disabled:opacity-50"
        >
          {saving ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إضافة البند'}
        </button>
      </form>

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
        .input-base:focus {
          box-shadow: 0 0 0 2px hsl(var(--primary));
        }
      `}</style>
    </>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-3">
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
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
