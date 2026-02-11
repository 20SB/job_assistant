/**
 * Constants for exports module
 */

export const EXPORTS_ROUTES = {
  LIST: '/exports',
  DETAIL: (id: string) => `/exports/${id}`,
  CREATE: '/exports/new',
  EDIT: (id: string) => `/exports/${id}/edit`,
} as const;

export const EXPORTS_CONFIG = {
  PAGE_SIZE: 20,
  MAX_NAME_LENGTH: 100,
} as const;
