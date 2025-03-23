import { api } from '../api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData extends LoginCredentials {
  fullName: string;
  companyName: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('token', data.token);
    return data;
  },

  async signup(signupData: SignupData): Promise<AuthResponse> {
    const { data } = await api.post('/auth/signup', signupData);
    localStorage.setItem('token', data.token);
    return data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
  },

  async setup2FA(): Promise<{ qrCode: string; secret: string }> {
    const { data } = await api.post('/auth/2fa/setup');
    return data;
  },

  async verify2FA(code: string): Promise<{ verified: boolean }> {
    const { data } = await api.post('/auth/2fa/verify', { code });
    return data;
  },

  async getProfile(): Promise<AuthResponse['user']> {
    const { data } = await api.get('/auth/profile');
    return data;
  },
};
