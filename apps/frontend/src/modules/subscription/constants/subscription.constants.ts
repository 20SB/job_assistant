/**
 * Constants for subscription module
 */

export const SUBSCRIPTION_ROUTES = {
  LIST: '/subscription',
  DETAIL: (id: string) => `/subscription/${id}`,
  CREATE: '/subscription/new',
  EDIT: (id: string) => `/subscription/${id}/edit`,
} as const;

export const SUBSCRIPTION_CONFIG = {
  PAGE_SIZE: 20,
  MAX_NAME_LENGTH: 100,
} as const;
