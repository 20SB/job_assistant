/**
 * Constants for dashboard module
 */

export const DASHBOARD_ROUTES = {
  LIST: '/dashboard',
  DETAIL: (id: string) => `/dashboard/${id}`,
  CREATE: '/dashboard/new',
  EDIT: (id: string) => `/dashboard/${id}/edit`,
} as const;

export const DASHBOARD_CONFIG = {
  PAGE_SIZE: 20,
  MAX_NAME_LENGTH: 100,
} as const;
