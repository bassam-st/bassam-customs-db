/**
 * صلاحيات المستخدمين
 */
import type { UserRole, UserStatus } from '../types/user';

export interface UserContext {
  uid: string;
  role: UserRole;
  status: UserStatus;
}

/** هل المستخدم نشط */
export const isActive = (user: UserContext): boolean =>
  user.status === 'active';

/** هل المستخدم مالك */
export const isOwner = (user: UserContext): boolean =>
  user.role === 'owner';

/** هل المستخدم موظف أو مالك */
export const isEmployee = (user: UserContext): boolean =>
  user.role === 'employee' || user.role === 'owner';

/** هل يمكنه إضافة/تعديل بنود */
export const canEditItems = (user: UserContext): boolean =>
  isActive(user) && isEmployee(user);

/** هل يمكنه حذف بند */
export const canDeleteItems = (user: UserContext): boolean =>
  isActive(user) && isOwner(user);

/** هل يمكنه إدارة العمليات */
export const canManageOperations = (user: UserContext): boolean =>
  isActive(user) && isEmployee(user);

/** هل يمكنه الوصول للإعدادات */
export const canAccessSettings = (user: UserContext): boolean =>
  isActive(user) && isOwner(user);

/** هل يمكنه إدارة المستخدمين */
export const canManageUsers = (user: UserContext): boolean =>
  isActive(user) && isOwner(user);

/** هل يمكنه تصدير/استيراد النسخ الاحتياطية */
export const canManageBackups = (user: UserContext): boolean =>
  isActive(user) && isOwner(user);

/** هل يمكنه رؤية سجلات المراجعة */
export const canViewAuditLogs = (user: UserContext): boolean =>
  isActive(user) && isOwner(user);

/** ترجمة الدور للعربية */
export const roleLabel: Record<UserRole, string> = {
  owner: 'مالك',
  employee: 'موظف',
  viewer: 'مشاهد',
};

/** ترجمة حالة المستخدم للعربية */
export const statusLabel: Record<UserStatus, string> = {
  active: 'نشط',
  blocked: 'محظور',
  disabled: 'معطل',
};
