export type RoleName = 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  organization?: string;
  phoneNumber?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  organization: string | null;
  phoneNumber: string | null;
  role: {
    id: string;
    name: RoleName;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateMyProfilePayload {
  name: string;
  organization?: string | null;
  phoneNumber?: string | null;
}

export interface ChangeMyPasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface RequestAccountDeletionPayload {
  password: string;
}
