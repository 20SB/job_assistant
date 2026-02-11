import { z } from 'zod';

/**
 * Settings type definition
 */
export interface Settings {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Form data for creating/updating Settings
 */
export interface SettingsFormData {
  name: string;
}

/**
 * List response with pagination
 */
export interface SettingsListResponse {
  items: Settings[];
  total: number;
  page: number;
  limit: number;
}
