/** Shared service result type for consistent error handling */
export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: ServiceError };

export type ServiceError = {
  code: string;
  message: string;
  details?: unknown;
};

export type PaginationParams = {
  page: number;
  pageSize: number;
};

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ActorContext = {
  profileId?: string;
  adminUserId?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
};
