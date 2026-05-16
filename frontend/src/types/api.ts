/** Standard API response wrapper */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  success: boolean;
}

/** Pagination request */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/** Pagination response */
export interface PaginationResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
