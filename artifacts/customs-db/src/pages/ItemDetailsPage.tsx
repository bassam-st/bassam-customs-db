/**
 * صفحة تفاصيل البند الجمركي
 */
import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { Edit, Trash2, Star, StarOff, Copy, Archive, ShoppingCart, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { CategoryBadge } from '../components/CategoryBadge';
import { LoadingScreen } from '../components/LoadingScreen';
import { getItem, updateItem, deleteItem } from '../lib/firestore';
import { useAuth } from '../app/AuthContext';
import { useDraft } from '../app/DraftContext';
import { useSettings } from '../app/SettingsContext';
import { isEmployee, isOwner } from '../lib/permissions';
import type { Item } from '../types/item';

export default function ItemDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { appUser } = useAuth();
  const { settings } = useSettings();
  const { addLine } = useDraft();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canEdit = appUser ? isEmployee({ uid: appUser.uid, role: appUser.role, status: appUser.status }) : false;
  const canDelete = appUser ? isOwner({ uid: appUser.uid, role: appUser.role, status: appUser.status }) : false;

  useEffect(() => {
    if (!id) return;
    getItem(id).then(data => {
      setItem(data);
      setLoading(false);
    }).catch(() => {
      setError('تعذر تحميل البند');
      setLoading(false);
    });
  }, [id]);

  const handleToggleFavorite = async () => {
    if (!item || !appUser) return;
    await updateItem(item.id, { isFavorite: !item.isFavorite }, appUser.uid);
    setItem(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
  };

  const handleArchive = async () => {
    if (!item || !appUser) return;
    if (!confirm('هل تريد أرشفة هذا البند؟')) return;
    await updateItem(item.id, { status: 'archived' }, appUser.uid);
    navigate('/inventory');
  };

  const handleDelete = async () => {
    if (!item) return;
    if (!confirm('هل تريد حذف هذا البند نهائياً؟ لا يمكن التراجع.')) return;
    await deleteItem(item.id);
    navigate('/inventory');
  };

  const handleCopy = () => {
    if (!item) return;
    const text = `${item.name}\nHS: ${item.hsCode}\nالسعر: ${item.usdPrice}$\nالفئة: ${item.categoryLabel}`;
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const handleAddToDraft = () => {
    if (!item) return;
    addLine(item, 1, settings.exchangeRate);
    navigate('/draft');
  };

  if (loading) return <LoadingScreen />;
  if (error || !item) return (
    <div className="p-6 text-center text-destructive">
      <AlertTriangle size={32} className="mx-auto mb-2" />
      <p>{error || 'البند غير موجود'}</p>
    </div>
  );

  const hasMissingData = !item.hsCode || !item.countryOfOrigin || !item.shortDescription;

  return (
    <>
      <PageHeader
        title={item.name}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={handleCopy} className="p-2 rounded-xl hover:bg-muted"><Copy size={18} /></button>
            <button onClick={handleToggleFavorite} className="p-2 rounded-xl hover:bg-muted">
              {item.isFavorite ? <Star size={18} className="text-yellow-500 fill-yellow-500" /> : <StarOff size={18} />}
            </button>
            {canEdit && (
              <button onClick={() => navigate(`/inventory/edit/${item.id}`)} className="p-2 rounded-xl hover:bg-muted">
                <Edit size={18} />
              </button>
            )}
          </div>
        }
      />

      <div className="p-4 flex flex-col gap-4">
        {/* تحذير بيانات ناقصة */}
        {hasMissingData && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 flex items-start gap-2">
            <AlertTriangle size={18} className="text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">بعض البيانات ناقصة - يرجى تحديث البند</p>
          </div>
        )}

        {/* البيانات الأساسية */}
        <div className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <CategoryBadge label={item.categoryLabel} />
            <span className="text-xs text-muted-foreground" dir="ltr">HS: {item.hsCode || 'غير محدد'}</span>
            {item.isFavorite && <Star size={14} className="text-yellow-500 fill-yellow-500" />}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InfoField label="السعر" value={`${item.usdPrice} $ / ${item.priceUnit}`} />
            <InfoField label="عامل الفئة" value={item.categoryFactor.toString()} />
            <InfoField label="دولة المنشأ" value={item.countryOfOrigin || 'غير محدد'} />
            <InfoField label="الحالة" value={item.status === 'active' ? 'نشط' : item.status === 'archived' ? 'مؤرشف' : 'محظور'} />
          </div>
        </div>

        {/* الأسماء البديلة */}
        {item.aliases.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="text-sm font-semibold mb-2">الأسماء البديلة</h3>
            <div className="flex flex-wrap gap-2">
              {item.aliases.map((a, i) => (
                <span key={i} className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">{a}</span>
              ))}
            </div>
          </div>
        )}

        {/* الوصف */}
        {(item.shortDescription || item.longDescription) && (
          <div className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-2">
            {item.shortDescription && (
              <p className="text-sm font-medium">{item.shortDescription}</p>
            )}
            {item.longDescription && (
              <p className="text-sm text-muted-foreground">{item.longDescription}</p>
            )}
          </div>
        )}

        {/* الملاحظات */}
        {item.notes && (
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="text-sm font-semibold mb-1">ملاحظات</h3>
            <p className="text-sm text-muted-foreground">{item.notes}</p>
          </div>
        )}

        {/* إحصائيات */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <h3 className="text-sm font-semibold mb-2">الاستخدام</h3>
          <div className="grid grid-cols-2 gap-2">
            <InfoField label="عدد الاستخدام" value={item.usageCount.toString()} />
            <InfoField
              label="آخر استخدام"
              value={item.lastUsedAt ? new Date(item.lastUsedAt).toLocaleDateString('ar-YE') : 'لم يستخدم'}
            />
          </div>
        </div>

        {/* الإجراءات */}
        <div className="flex flex-col gap-3 pb-4">
          <button
            onClick={handleAddToDraft}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2"
          >
            <ShoppingCart size={20} />
            إضافة إلى المسودة
          </button>

          <button
            onClick={() => navigate(`/calculator?itemId=${item.id}`)}
            className="w-full py-3 rounded-2xl border border-border font-medium text-sm"
          >
            فتح في الحاسبة
          </button>

          {canEdit && (
            <div className="flex gap-2">
              <button
                onClick={handleArchive}
                className="flex-1 py-3 rounded-2xl bg-muted text-muted-foreground font-medium text-sm flex items-center justify-center gap-2"
              >
                <Archive size={16} /> أرشفة
              </button>
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="flex-1 py-3 rounded-2xl bg-destructive/10 text-destructive font-medium text-sm flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} /> حذف
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
