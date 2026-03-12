export type AdminProvider = 'password' | 'google';

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  provider: AdminProvider;
  createdAt: string;
};

export type AdminAuthResponse = {
  token: string;
  user: AdminUser;
};
