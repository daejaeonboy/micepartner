export type AdminProvider = 'password' | 'google';

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  provider: AdminProvider;
  createdAt: string;
  approved: boolean;
};

export type AdminAuthResponse = {
  token: string;
  user: AdminUser;
};
