import { z } from 'zod';

/**
 * Jobs type definition
 */
export interface Jobs {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Form data for creating/updating Jobs
 */
export interface JobsFormData {
  name: string;
}

/**
 * List response with pagination
 */
export interface JobsListResponse {
  items: Jobs[];
  total: number;
  page: number;
  limit: number;
}
