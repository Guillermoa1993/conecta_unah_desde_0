import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { authService } from '../services/auth.service';
import type { Usuario, LoginPayload, RegistroPayload } from '../types';

interface AuthContextValue {
  usuario: Usuario | null;
  token: string | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<Usuario>;
  registro: (payload: RegistroPayload) => Promise<void>;
  logout: () => void;
  actualizarUsuario: (usuario: Usuario) => void;
  estaAutenticado: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => authService.getUsuarioGuardado());
  const [token, setToken] = useState<string | null>(() => authService.getToken());
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (payload: LoginPayload) => {
    setLoading(true);
    try {
      const data = await authService.login(payload);
      setUsuario(data.usuario);
      setToken(data.token);
      // Sincronizar con el sessionStorage del sidebar
      sessionStorage.setItem('unah_role', data.usuario.rol.toLowerCase());
      return data.usuario;
    } finally {
      setLoading(false);
    }
  }, []);

  const registro = useCallback(async (payload: RegistroPayload) => {
    setLoading(true);
    try {
      await authService.registro(payload);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUsuario(null);
    setToken(null);
  }, []);

  // dentro de AuthProvider, junto a logout:
  const actualizarUsuario = useCallback((nuevoUsuario: Usuario) => {
   setUsuario(nuevoUsuario);
   }, []);

  return (
    <AuthContext.Provider
      value={{ usuario, token, loading, login, registro, logout, actualizarUsuario,estaAutenticado: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
}



export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext debe usarse dentro de <AuthProvider>');
  return ctx;
}
