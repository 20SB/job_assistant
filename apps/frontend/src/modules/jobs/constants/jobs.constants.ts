/**
 * Constants for jobs module
 */

export const JOBS_ROUTES = {
  LIST: '/jobs',
  DETAIL: (id: string) => `/jobs/${id}`,
  CREATE: '/jobs/new',
  EDIT: (id: string) => `/jobs/${id}/edit`,
} as const;

export const JOBS_CONFIG = {
  PAGE_SIZE: 20,
  MAX_NAME_LENGTH: 100,
} as const;
