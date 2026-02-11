import { z } from 'zod';

/**
 * Preferences type definition
 */
export interface Preferences {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Form data for creating/updating Preferences
 */
export interface PreferencesFormData {
  name: string;
}

/**
 * List response with pagination
 */
export interface PreferencesListResponse {
  items: Preferences[];
  total: number;
  page: number;
  limit: number;
}
