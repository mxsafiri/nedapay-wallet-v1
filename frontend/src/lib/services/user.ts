import { api } from '../api';

export interface User {
  id: string;
  email: string;
  fullName: string;
  companyName: string;
  role: string;
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserData {
  fullName?: string;
  email?: string;
  companyName?: string;
  status?: User['status'];
}

export const userService = {
  async getUsers(params?: { page?: number; limit?: number }): Promise<{ users: User[]; total: number }> {
    const { data } = await api.get('/users', { params });
    return data;
  },

  async getUser(id: string): Promise<User> {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },

  async updateUser(id: string, userData: UpdateUserData): Promise<User> {
    const { data } = await api.patch(`/users/${id}`, userData);
    return data;
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async suspendUser(id: string): Promise<User> {
    const { data } = await api.post(`/users/${id}/suspend`);
    return data;
  },

  async activateUser(id: string): Promise<User> {
    const { data } = await api.post(`/users/${id}/activate`);
    return data;
  },
};
