import api from './index';
import { User } from '../types/user';

export const login = async (email: string, password: string): Promise<User> => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

export const getMe = async (): Promise<User> => {
  const res = await api.get('/auth/me');
  return res.data;
};

export const logout = async () => {
  await api.post('/auth/logout');
};
