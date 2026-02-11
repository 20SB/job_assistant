import { z } from 'zod';

/**
 * Exports type definition
 */
export interface Exports {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Form data for creating/updating Exports
 */
export interface ExportsFormData {
  name: string;
}

/**
 * List response with pagination
 */
export interface ExportsListResponse {
  items: Exports[];
  total: number;
  page: number;
  limit: number;
}
