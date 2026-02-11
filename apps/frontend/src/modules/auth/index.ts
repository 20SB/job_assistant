/**
 * Auth Module - Public API
 *
 * This file defines what is exported from the module.
 * Only export what needs to be used outside the module.
 */

// Components
export { LoginPage } from './components/LoginPage';
export { SignupPage } from './components/SignupPage';
export { VerifyPage } from './components/VerifyPage';

// API Client
export { authApi } from './api/auth.api';

// Types (re-export all)
export type * from './types';

// Constants
export * from './constants/auth.constants';

