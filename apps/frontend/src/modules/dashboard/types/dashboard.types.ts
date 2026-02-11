import { z } from 'zod';

/**
 * Dashboard type definition
 */
export interface Dashboard {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Form data for creating/updating Dashboard
 */
export interface DashboardFormData {
  name: string;
}

/**
 * List response with pagination
 */
export interface DashboardListResponse {
  items: Dashboard[];
  total: number;
  page: number;
  limit: number;
}
