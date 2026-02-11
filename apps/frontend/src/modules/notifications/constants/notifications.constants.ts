/**
 * Constants for notifications module
 */

export const NOTIFICATIONS_ROUTES = {
  LIST: '/notifications',
  DETAIL: (id: string) => `/notifications/${id}`,
  CREATE: '/notifications/new',
  EDIT: (id: string) => `/notifications/${id}/edit`,
} as const;

export const NOTIFICATIONS_CONFIG = {
  PAGE_SIZE: 20,
  MAX_NAME_LENGTH: 100,
} as const;
