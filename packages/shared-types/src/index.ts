export type ApiStatus = 'success' | 'error';

export interface ApiResponse<TData = unknown> {
  readonly status: ApiStatus;
  readonly data: TData;
  readonly message?: string;
  readonly requestId?: string;
}

export interface ApiErrorResponse {
  readonly status: 'error';
  readonly message: string;
  readonly code?: string;
  readonly details?: unknown;
  readonly requestId?: string;
}

export type Nullable<TValue> = TValue | null;

export type MaybePromise<TValue> = TValue | Promise<TValue>;

export type PaginationMeta = {
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly totalPages: number;
};
