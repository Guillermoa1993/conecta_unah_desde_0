import { api } from './api';
import type { LoginPayload, LoginResponse, RegistroPayload, Usuario } from '../types';

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const data = await api.post<LoginResponse>('/auth/login', payload);
    localStorage.setItem('unah_token', data.token);
    localStorage.setItem('unah_usuario', JSON.stringify(data.usuario));
    return data;
  },

  async registro(payload: RegistroPayload): Promise<Usuario> {
    return api.post<Usuario>('/auth/registro', payload);
  },

  async me(): Promise<{ usuario: { id: string; rol: string } }> {
    return api.get('/auth/me');
  },

  logout(): void {
    localStorage.removeItem('unah_token');
    localStorage.removeItem('unah_usuario');
    sessionStorage.removeItem('unah_role');
  },

  getUsuarioGuardado(): Usuario | null {
    try {
      const raw = localStorage.getItem('unah_usuario');
      return raw ? (JSON.parse(raw) as Usuario) : null;
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem('unah_token');
  },

  estaAutenticado(): boolean {
    return !!localStorage.getItem('unah_token');
  },

  setToken(token: string): void {
    localStorage.setItem('unah_token', token);
  },

  setUsuarioGuardado(usuario: Usuario): void {
    localStorage.setItem('unah_usuario', JSON.stringify(usuario));
  },

  async getMe(token: string): Promise<Usuario> {
    const data = await api.getWithToken<{ usuario: Usuario }>('/auth/me', token);
    return data.usuario;
  },
};
