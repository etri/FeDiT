export interface AdminRole {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  organization: string | null;
  phoneNumber: string | null;
  role: AdminRole;
  roleId: string;
  isActive: boolean;
  deactivatedAt: string | null;
  deletionRequestedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrganization {
  id: string;
  name: string;
}

export interface PaginationMeta {
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface AdminPaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface UsersListParams {
  page: number;
  size: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  pendingDeletion?: boolean;
}

export interface UpdateUserPayload {
  name?: string;
  organization?: string | null;
  phoneNumber?: string | null;
  roleId?: string;
  isActive?: boolean;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  name: string;
  organization?: string | null;
  phoneNumber?: string | null;
  roleId: string;
  isActive?: boolean;
}
