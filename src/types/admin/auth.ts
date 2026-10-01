export interface AdminUser {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  role: string;
  status?: string;
  avatarUrl?: string;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AdminRegisterRequest {
  name: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
}

export interface AdminLoginResponse {
  accessToken: string;
  refreshToken?: string;
  user?: AdminUser;
  admin?: AdminUser;
  message?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}
