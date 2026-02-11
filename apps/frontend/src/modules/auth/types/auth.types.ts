// Auth types and interfaces

export interface User {
  id: string;
  email: string;
  role: string;
  emailVerified?: string;
}

export interface SignupResponse {
  status: string;
  data: {
    user: User;
    verificationToken: string;
  };
}

export interface LoginResponse {
  status: string;
  data: {
    token: string;
    user: User;
  };
}

export interface MessageResponse {
  status: string;
  data: {
    message: string;
  };
}

export interface GetMeResponse {
  status: string;
  data: User;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
}
