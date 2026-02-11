/**
 * Constants for settings module
 */

export const SETTINGS_ROUTES = {
  LIST: '/settings',
  DETAIL: (id: string) => `/settings/${id}`,
  CREATE: '/settings/new',
  EDIT: (id: string) => `/settings/${id}/edit`,
} as const;

export const SETTINGS_CONFIG = {
  PAGE_SIZE: 20,
  MAX_NAME_LENGTH: 100,
} as const;
