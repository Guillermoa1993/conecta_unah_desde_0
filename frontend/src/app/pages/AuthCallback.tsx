import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { authService } from '../../services/auth.service';

const ROL_MAP: Record<string, string> = {
  estudiante:        'student',
  tutor:             'tutor',
  empleado:          'tutor',
  docente:           'tutor',
  admin:             'admin',
  voae:              'voae',
  voae_direccion:    'voae',
  voae_departamento: 'voae_depto',
  voae_depto:        'voae_depto',
  coordinacion:      'voae_depto',
  departamento:      'voae_depto',
  dev:               'dev',
  student:           'student',
};

const ROL_PATH: Record<string, string> = {
  student:    '/student/feed',
  tutor:      '/tutor',
  admin:      '/admin',
  voae:       '/voae',
  voae_depto: '/voae-depto',
  dev:        '/student/feed',
};
export function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    const error = params.get('error');

    if (error) {
      navigate(`/?error=${encodeURIComponent(error)}`);
      return;
    }

    if (!token) {
      navigate('/');
      return;
    }

    // Guardar token primero
    authService.setToken(token);

    // Llamar al backend para obtener el perfil completo
    authService.getMe(token)
      .then((usuario) => {
        authService.setUsuarioGuardado(usuario);
        const rolRaw = usuario.rol.toLowerCase();
        const rol = ROL_MAP[rolRaw] ?? 'student';
        sessionStorage.setItem('unah_role', rol);
        sessionStorage.setItem('unah_session_active', 'true');
        const guardada = sessionStorage.getItem('unah_redirect_after_login');
        sessionStorage.removeItem('unah_redirect_after_login');
        navigate(guardada ?? ROL_PATH[rol] ?? '/student', { replace: true });
      })
      .catch(() => {
        // Si falla el backend no borramos el token, solo mandamos al login
        navigate('/');
      });
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Iniciando sesión con Microsoft...</p>
    </div>
  );
}
