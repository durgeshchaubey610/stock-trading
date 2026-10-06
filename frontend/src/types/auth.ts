export interface User {
  id: number | string;
  username: string;
  email: string;
  is_premium?: boolean;
  subscription_tier?: string;
  subscription_expiry?: string;
}

export interface AuthResponse {
  status: string;
  token?: string;
  user: User;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}
