/**
 * Generic pagination response structure
 * This matches the API pagination format from the backend
 */
export interface IPaginatedResponse<T> {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: T[];
}

/**
 * Pagination parameters for API requests
 */
export interface IPaginationParams {
  page: number;
  limit?: number;
}
