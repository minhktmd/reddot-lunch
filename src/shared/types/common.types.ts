// Shared types used across all features and domains

export type ApiError = {
  message: string;
  code?: string;
  status?: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};
