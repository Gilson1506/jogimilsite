export const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:3101';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'gestor' | 'agente' | 'visualizador' | string;
  jobTitle?: string;
  whatsapp?: string;
  avatarUrl?: string;
  notifyWhatsapp?: boolean;
  notifyEmail?: boolean;
  reminderMinutesBefore?: number;
  permissions?: string[];
}

export function resizeImageToAvatarDataUrl(file: File, size = 240): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler imagem.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagem inválido.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas indisponível.'));
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

export function getSessionUser(): SessionUser | null {
  try {
    const raw = sessionStorage.getItem('jogimil_admin_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SessionUser>;
    if (!parsed || !parsed.email) return null;
    return {
      id: parsed.id || 'usr_admin_root',
      name: parsed.name || 'Administrador',
      email: parsed.email,
      role: parsed.role === 'Administrador Executivo' ? 'admin' : parsed.role || 'admin',
      jobTitle: parsed.jobTitle || (parsed.role === 'Administrador Executivo' ? 'Administrador Executivo' : ''),
      whatsapp: parsed.whatsapp || '',
      avatarUrl: parsed.avatarUrl || '',
      notifyWhatsapp: parsed.notifyWhatsapp !== false,
      permissions: Array.isArray(parsed.permissions) ? parsed.permissions : ['*'],
    };
  } catch {
    return null;
  }
}

export function authHeaders(): Record<string, string> {
  const user = getSessionUser();
  if (!user) return {};
  return {
    'X-User-Id': user.id,
    'X-User-Role': user.role,
    'X-User-Email': user.email,
  };
}

export function apiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}

export async function apiFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(init?.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errBody = data as { message?: string; detail?: string; error?: string };
    throw new Error(errBody.message || errBody.detail || errBody.error || `HTTP ${res.status}`);
  }
  return data as T;
}
