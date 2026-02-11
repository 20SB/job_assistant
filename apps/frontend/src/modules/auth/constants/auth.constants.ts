/**
 * Constants for auth module
 */

export const AUTH_ROUTES = {
  LIST: '/auth',
  DETAIL: (id: string) => `/auth/${id}`,
  CREATE: '/auth/new',
  EDIT: (id: string) => `/auth/${id}/edit`,
} as const;

export const AUTH_CONFIG = {
  PAGE_SIZE: 20,
  MAX_NAME_LENGTH: 100,
} as const;
