/**
 * Constants for cv module
 */

export const CV_ROUTES = {
  LIST: '/cv',
  DETAIL: (id: string) => `/cv/${id}`,
  CREATE: '/cv/new',
  EDIT: (id: string) => `/cv/${id}/edit`,
} as const;

export const CV_CONFIG = {
  PAGE_SIZE: 20,
  MAX_NAME_LENGTH: 100,
} as const;
