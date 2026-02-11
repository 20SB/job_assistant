import { z } from 'zod';

/**
 * Admin type definition
 */
export interface Admin {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Form data for creating/updating Admin
 */
export interface AdminFormData {
  name: string;
}

/**
 * List response with pagination
 */
export interface AdminListResponse {
  items: Admin[];
  total: number;
  page: number;
  limit: number;
}
