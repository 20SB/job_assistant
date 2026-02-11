import type { AuthPayload } from "../../../src/middleware/auth.js";

export const mockUserPayload: AuthPayload = {
  userId: "user-uuid-1234",
  email: "test@example.com",
  role: "user",
};

export const mockAdminPayload: AuthPayload = {
  userId: "admin-uuid-5678",
  email: "admin@example.com",
  role: "admin",
};
