/** نوع بيانات المستخدم */
export type UserRole = 'owner' | 'employee' | 'viewer';
export type UserStatus = 'active' | 'blocked' | 'disabled';

export interface AppUser {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  licenseActive: boolean;
  allowedDevices: string[];
  lastSeenAt: Date | null;
  createdAt: Date;
  createdBy: string;
  notes: string;
}

export type NewAppUser = Omit<AppUser, 'uid' | 'createdAt' | 'lastSeenAt'>;
