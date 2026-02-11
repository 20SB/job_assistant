import { z } from 'zod';

/**
 * Notifications type definition
 */
export interface Notifications {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Form data for creating/updating Notifications
 */
export interface NotificationsFormData {
  name: string;
}

/**
 * List response with pagination
 */
export interface NotificationsListResponse {
  items: Notifications[];
  total: number;
  page: number;
  limit: number;
}
