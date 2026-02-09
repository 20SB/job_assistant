import { fetchApi } from "./client";

interface User {
    id: string;
    email: string;
    role: string;
    emailVerified?: string;
}

interface SignupResponse {
    status: string;
    data: {
        user: User;
        verificationToken: string;
    };
}

interface LoginResponse {
    status: string;
    data: {
        token: string;
        user: User;
    };
}

interface MessageResponse {
    status: string;
    data: {
        message: string;
    };
}

interface GetMeResponse {
    status: string;
    data: User;
}

export const authApi = {
    signup: (email: string, password: string) =>
        fetchApi<SignupResponse>("/api/users/signup", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        }),

    login: (email: string, password: string) =>
        fetchApi<LoginResponse>("/api/users/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        }),

    verifyEmail: (token: string) =>
        fetchApi<MessageResponse>("/api/users/verify-email", {
            method: "POST",
            body: JSON.stringify({ token }),
        }),

    forgotPassword: (email: string) =>
        fetchApi<MessageResponse>("/api/users/forgot-password", {
            method: "POST",
            body: JSON.stringify({ email }),
        }),

    resetPassword: (token: string, password: string) =>
        fetchApi<MessageResponse>("/api/users/reset-password", {
            method: "POST",
            body: JSON.stringify({ token, password }),
        }),

    getMe: (token: string) =>
        fetchApi<GetMeResponse>("/api/users/me", {
            method: "GET",
            token,
        }),
};
