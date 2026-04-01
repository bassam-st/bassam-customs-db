/**
 * صفحة إدارة المستخدمين - خاصة بالمالك
 */
import React, { useEffect, useState } from 'react';
import { Users, UserPlus, Shield, AlertCircle } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { EmptyState, LoadingScreen } from '../components/LoadingScreen';
import { PinDialog } from '../components/PinDialog';
import { getAllUsers, updateUserStatus, updateUserRole } from '../lib/firestore';
import { createUser } from '../lib/auth';
import { useAuth } from '../app/AuthContext';
import { isOwner, roleLabel, statusLabel } from '../lib/permissions';
import type { AppUser, UserRole, UserStatus } from '../types/user';

export default function UsersPage() {
  const { appUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinVerified, setPinVerified] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: '', email: '', password: '', role: 'employee' as UserRole });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const canAccess = appUser ? isOwner({ uid: appUser.uid, role: appUser.role, status: appUser.status }) : false;

  useEffect(() => {
    if (!canAccess || !pinVerified) return;
    getAllUsers().then(data => { setUsers(data); setLoading(false); });
  }, [canAccess, pinVerified]);

  const handleStatusChange = async (uid: string, status: UserStatus) => {
    if (!appUser) return;
    await updateUserStatus(uid, status, appUser.uid);
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, status } : u));
  };

  const handleRoleChange = async (uid: string, role: UserRole) => {
    if (!appUser) return;
    await updateUserRole(uid, role, appUser.uid);
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role } : u));
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser) return;
    setAdding(true);
    setError('');
    try {
      await createUser({ ...newUser, createdBy: appUser.uid });
      const updated = await getAllUsers();
      setUsers(updated);
      setShowAddForm(false);
      setNewUser({ fullName: '', email: '', password: '', role: 'employee' });
    } catch (err: unknown) {
      setError('فشل إنشاء المستخدم: ' + (err as Error)?.message);
    } finally {
      setAdding(false);
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

  if (loading) return <LoadingScreen />;

  return (
    <>
      <PageHeader
        title="إدارة المستخدمين"
        actions={
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
          >
            <UserPlus size={16} /> جديد
          </button>
        }
      />

      <div className="p-4 flex flex-col gap-4 pb-8">
        {/* نموذج إضافة مستخدم */}
        {showAddForm && (
          <form onSubmit={handleAddUser} className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-3">
            <h3 className="text-sm font-bold">إضافة مستخدم جديد</h3>
            <input
              type="text"
              placeholder="الاسم الكامل"
              value={newUser.fullName}
              onChange={e => setNewUser(f => ({ ...f, fullName: e.target.value }))}
              className="input-base"
              required
            />
            <input
              type="email"
              placeholder="البريد الإلكتروني"
              value={newUser.email}
              onChange={e => setNewUser(f => ({ ...f, email: e.target.value }))}
              className="input-base"
              required
              dir="ltr"
            />
            <input
              type="password"
              placeholder="كلمة المرور"
              value={newUser.password}
              onChange={e => setNewUser(f => ({ ...f, password: e.target.value }))}
              className="input-base"
              required
              dir="ltr"
            />
            <select
              value={newUser.role}
              onChange={e => setNewUser(f => ({ ...f, role: e.target.value as UserRole }))}
              className="input-base"
            >
              <option value="employee">موظف</option>
              <option value="viewer">مشاهد</option>
            </select>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm">إلغاء</button>
              <button type="submit" disabled={adding} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50">
                {adding ? 'جاري الإنشاء...' : 'إنشاء'}
              </button>
            </div>
          </form>
        )}

        {users.length === 0 && (
          <EmptyState icon={<Users size={48} />} title="لا يوجد مستخدمون" />
        )}

        <div className="flex flex-col gap-3">
          {users.map(user => (
            <div key={user.uid} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">{user.fullName}</p>
                    {user.role === 'owner' && <Shield size={14} className="text-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusPill status={user.status} />
                  <span className="text-xs text-muted-foreground">{roleLabel[user.role]}</span>
                </div>
              </div>

              {user.uid !== appUser?.uid && (
                <div className="flex gap-2 border-t border-border/50 pt-3">
                  <select
                    value={user.role}
                    onChange={e => handleRoleChange(user.uid, e.target.value as UserRole)}
                    className="flex-1 text-xs rounded-lg border border-input bg-background px-2 py-1.5 focus:outline-none"
                  >
                    <option value="owner">مالك</option>
                    <option value="employee">موظف</option>
                    <option value="viewer">مشاهد</option>
                  </select>
                  <select
                    value={user.status}
                    onChange={e => handleStatusChange(user.uid, e.target.value as UserStatus)}
                    className="flex-1 text-xs rounded-lg border border-input bg-background px-2 py-1.5 focus:outline-none"
                  >
                    <option value="active">نشط</option>
                    <option value="blocked">محظور</option>
                    <option value="disabled">معطل</option>
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
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
        }
        .input-base:focus { box-shadow: 0 0 0 2px hsl(var(--primary)); }
      `}</style>
    </>
  );
}

function StatusPill({ status }: { status: AppUser['status'] }) {
  const styles = {
    active: 'bg-green-100 text-green-700',
    blocked: 'bg-red-100 text-red-700',
    disabled: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${styles[status]}`}>
      {statusLabel[status]}
    </span>
  );
}
