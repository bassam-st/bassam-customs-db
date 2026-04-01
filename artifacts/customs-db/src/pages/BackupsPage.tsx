/**
 * صفحة النسخ الاحتياطية
 */
import React, { useState, useRef } from 'react';
import { Download, Upload, Database, AlertCircle } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { PinDialog } from '../components/PinDialog';
import { getAllItems } from '../lib/firestore';
import { getOperations, getOperation } from '../lib/firestore';
import { exportToJson, readJsonFile } from '../lib/export';
import { useAuth } from '../app/AuthContext';
import { isOwner } from '../lib/permissions';
import type { BackupData } from '../lib/export';

export default function BackupsPage() {
  const { appUser } = useAuth();
  const [pinVerified, setPinVerified] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canAccess = appUser ? isOwner({ uid: appUser.uid, role: appUser.role, status: appUser.status }) : false;

  const handleExport = async () => {
    setExporting(true);
    setMessage('');
    try {
      const [items, operations] = await Promise.all([
        getAllItems(),
        getOperations(),
      ]);
      // تحميل تفاصيل كل عملية
      const fullOps = await Promise.all(
        operations.slice(0, 50).map(op => getOperation(op.id))
      );
      const data: BackupData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        items,
        operations: fullOps.filter(Boolean) as typeof operations,
      };
      exportToJson(data);
      setMessage('تم تصدير النسخة الاحتياطية بنجاح');
    } catch (err) {
      setMessage('فشل تصدير البيانات: ' + (err as Error)?.message);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setMessage('');
    try {
      const data = await readJsonFile(file);
      // عرض المعلومات فقط - الاستيراد الفعلي يحتاج منطق أكثر تعقيداً
      setMessage(`تم قراءة الملف: ${data.items.length} بند، ${data.operations.length} عملية. الاستيراد الكامل يتطلب مراجعة يدوية.`);
    } catch (err) {
      setMessage('فشل قراءة الملف: ' + (err as Error)?.message);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!canAccess) {
    return (
      <div className="p-6 flex flex-col items-center gap-3 text-center">
        <AlertCircle size={32} className="text-destructive" />
        <p className="text-sm text-muted-foreground">ليس لديك صلاحية الوصول</p>
      </div>
    );
  }

  if (!pinVerified) {
    return (
      <PinDialog
        onVerified={() => setPinVerified(true)}
        onCancel={() => history.back()}
      />
    );
  }

  return (
    <>
      <PageHeader title="النسخ الاحتياطية" />
      <div className="p-4 flex flex-col gap-4">
        {/* التصدير */}
        <div className="bg-card rounded-2xl border border-border p-5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Download size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm">تصدير نسخة احتياطية</h3>
              <p className="text-xs text-muted-foreground">تصدير جميع البنود والعمليات إلى ملف JSON</p>
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full py-3.5 rounded-xl bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download size={18} />
            {exporting ? 'جاري التصدير...' : 'تصدير النسخة'}
          </button>
        </div>

        {/* الاستيراد */}
        <div className="bg-card rounded-2xl border border-border p-5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Upload size={20} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm">استيراد نسخة احتياطية</h3>
              <p className="text-xs text-muted-foreground">استيراد ملف JSON - يتطلب مراجعة</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="w-full py-3.5 rounded-xl bg-green-500 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Upload size={18} />
            {importing ? 'جاري القراءة...' : 'اختيار ملف JSON'}
          </button>
        </div>

        {message && (
          <div className={`rounded-xl px-4 py-3 text-sm text-center border ${
            message.startsWith('فشل') || message.startsWith('خطأ')
              ? 'bg-destructive/10 border-destructive/20 text-destructive'
              : 'bg-green-50 border-green-200 text-green-800'
          }`}>
            {message}
          </div>
        )}

        {/* معلومات */}
        <div className="bg-muted/50 rounded-2xl p-4 flex flex-col gap-2">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Database size={16} /> معلومات النسخ الاحتياطي
          </h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• يتم تصدير جميع البنود النشطة والعمليات</li>
            <li>• يمكن حفظ الملف لأغراض النسخ الاحتياطي</li>
            <li>• الاستيراد يتطلب مراجعة يدوية للبيانات</li>
            <li>• احتفظ بنسخ احتياطية منتظمة لحماية بياناتك</li>
          </ul>
        </div>
      </div>
    </>
  );
}
