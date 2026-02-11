/**
 * Constants for preferences module
 */

export const PREFERENCES_ROUTES = {
  LIST: '/preferences',
  DETAIL: (id: string) => `/preferences/${id}`,
  CREATE: '/preferences/new',
  EDIT: (id: string) => `/preferences/${id}/edit`,
} as const;

export const PREFERENCES_CONFIG = {
  PAGE_SIZE: 20,
  MAX_NAME_LENGTH: 100,
} as const;
