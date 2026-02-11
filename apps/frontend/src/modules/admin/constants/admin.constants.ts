/**
 * Constants for admin module
 */

export const ADMIN_ROUTES = {
  LIST: '/admin',
  DETAIL: (id: string) => `/admin/${id}`,
  CREATE: '/admin/new',
  EDIT: (id: string) => `/admin/${id}/edit`,
} as const;

export const ADMIN_CONFIG = {
  PAGE_SIZE: 20,
  MAX_NAME_LENGTH: 100,
} as const;
