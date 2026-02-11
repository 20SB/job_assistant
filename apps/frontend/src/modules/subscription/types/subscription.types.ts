import { z } from 'zod';

/**
 * Subscription type definition
 */
export interface Subscription {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Form data for creating/updating Subscription
 */
export interface SubscriptionFormData {
  name: string;
}

/**
 * List response with pagination
 */
export interface SubscriptionListResponse {
  items: Subscription[];
  total: number;
  page: number;
  limit: number;
}
