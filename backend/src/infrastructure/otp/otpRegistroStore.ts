interface OtpEntry {
  codigo: string;
  expira: number;
}

const store = new Map<string, OtpEntry>();

export function guardarOtpRegistro(correo: string, codigo: string) {
  store.set(correo.toLowerCase(), {
    codigo,
    expira: Date.now() + 5 * 60 * 1000, // 5 minutos
  });
}

export function verificarOtpRegistro(correo: string, codigo: string): boolean {
  const entry = store.get(correo.toLowerCase());
  if (!entry) return false;
  if (Date.now() > entry.expira) {
    store.delete(correo.toLowerCase());
    return false;
  }
  if (entry.codigo !== codigo) return false;
  store.delete(correo.toLowerCase()); // se usa una sola vez
  return true;
}