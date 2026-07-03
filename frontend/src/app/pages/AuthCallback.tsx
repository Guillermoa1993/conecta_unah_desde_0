import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { authService } from '../../services/auth.service';

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

    // Guardar token y obtener perfil del usuario
    authService.setToken(token);
    authService.getMe(token).then((usuario) => {
      authService.setUsuarioGuardado(usuario);
      sessionStorage.setItem('unah_role', usuario.rol.toLowerCase());
      sessionStorage.setItem('unah_session_active', 'true');

      const rol = usuario.rol.toLowerCase();
      if (rol === 'estudiante') window.location.replace('/student');
      else if (rol === 'tutor') window.location.replace('/tutor');
      else if (rol === 'admin') window.location.replace('/admin');
      else if (rol === 'voae')  window.location.replace('/voae');
      else window.location.replace('/');
    }).catch(() => {
      authService.logout();
      navigate('/');
    });
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Iniciando sesión con Microsoft...</p>
    </div>
  );
}
