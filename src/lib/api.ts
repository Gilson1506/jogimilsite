/**
 * Cliente HTTP para o microserviço independente de formulários da JOGIMIL
 *
 * Permite que o website seja hospedado de forma 100% desacoplada
 * (ex: Cloudflare Pages, Vercel, Netlify ou VPS) comunicando via API
 * com o microserviço independente (em http://localhost:3001 ou https://api.jogimil.ao).
 */

const API_BASE = ((import.meta.env.VITE_API_URL as string | undefined) || '').replace(/\/$/, '');

export const API_ENDPOINTS = {
  submitForm: `${API_BASE}/api/forms/submit`,
  health: `${API_BASE}/health`,
  trackVisit: `${API_BASE}/api/v1/analytics/visit`,
  team: `${API_BASE}/api/v1/team`,
  news: `${API_BASE}/api/v1/news`,
  portfolio: `${API_BASE}/api/v1/portfolio`,
  products: `${API_BASE}/api/v1/products`,
};

export interface PublicTeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  bio: string;
  photo: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  linkedin?: string;
  initials: string;
}

export interface PublicNewsPost {
  slug: string;
  title: string;
  tag: string;
  category: string;
  date: string;
  excerpt: string;
  body: string[];
  image?: string;
  author?: string;
}

export interface PublicPortfolioItem {
  slug: string;
  title: string;
  client: string;
  category: string;
  description: string;
  image: string;
  metrics: string;
  tags: string[];
  link?: string;
  year?: string;
}

export interface PublicProduct {
  slug: string;
  name: string;
  category: string;
  tag: string;
  tagline: string;
  description: string;
  fullDescription: string[];
  features: string[];
  image: string;
  gallery?: string[];
  pdfUrl?: string;
  priceStarting: string;
  starterPriceValue: string;
  starterPeriod: string;
}

function makeInitials(name: string): string {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'JM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export async function fetchPublicTeam(): Promise<PublicTeamMember[]> {
  try {
    const res = await fetch(API_ENDPOINTS.team);
    if (!res.ok) return [];
    const json = await res.json();
    const list = Array.isArray(json.team) ? json.team : Array.isArray(json.data) ? json.data : [];
    return list.map((m: Record<string, unknown>, idx: number) => ({
      id: String(m.id || `member_${idx}`),
      name: String(m.name || ''),
      role: String(m.role || ''),
      department: String(m.department || 'Equipa JOGIMIL'),
      bio: String(m.bio || ''),
      photo: String(m.photo || ''),
      email: m.email ? String(m.email) : undefined,
      phone: m.phone ? String(m.phone) : undefined,
      whatsapp: m.whatsapp ? String(m.whatsapp) : m.phone ? String(m.phone) : undefined,
      linkedin: m.linkedin ? String(m.linkedin) : undefined,
      initials: String(m.initials || makeInitials(String(m.name || ''))),
    }));
  } catch {
    return [];
  }
}

export async function fetchPublicNews(): Promise<PublicNewsPost[]> {
  try {
    const res = await fetch(API_ENDPOINTS.news);
    if (!res.ok) return [];
    const json = await res.json();
    const list = Array.isArray(json.news) ? json.news : Array.isArray(json.data) ? json.data : [];
    return list
      .filter((n: Record<string, unknown>) => n.published !== false)
      .map((n: Record<string, unknown>, idx: number) => {
        const rawBody = n.body;
        const rawContent = typeof n.content === 'string' ? n.content : '';
        const paragraphs = Array.isArray(rawBody)
          ? rawBody.map((p) => String(p)).filter(Boolean)
          : rawContent
          ? rawContent.split(/\n\s*\n|\n/).map((p) => p.trim()).filter(Boolean)
          : n.excerpt
          ? [String(n.excerpt)]
          : [];
        const cat = String(n.category || n.tag || 'Tecnologia');
        return {
          slug: String(n.slug || n.id || `post-${idx}`),
          title: String(n.title || ''),
          tag: cat,
          category: cat,
          date: String(n.date || n.created_at || new Date().toISOString().slice(0, 10)),
          excerpt: String(n.excerpt || paragraphs[0] || ''),
          body: paragraphs,
          image: n.image ? String(n.image) : undefined,
          author: n.author ? String(n.author) : 'Equipa JOGIMIL',
        };
      });
  } catch {
    return [];
  }
}

export async function fetchPublicPortfolio(): Promise<PublicPortfolioItem[]> {
  try {
    const res = await fetch(API_ENDPOINTS.portfolio);
    if (!res.ok) return [];
    const json = await res.json();
    const list = Array.isArray(json.portfolio) ? json.portfolio : Array.isArray(json.data) ? json.data : [];
    return list.map((p: Record<string, unknown>, idx: number) => ({
      slug: String(p.slug || p.id || `project-${idx}`),
      title: String(p.title || ''),
      client: String(p.client || ''),
      category: String(p.category || 'Software & ERP'),
      description: String(p.description || ''),
      image: String(p.image || ''),
      metrics: String(p.metrics || p.metricValue || ''),
      tags: Array.isArray(p.tags) ? p.tags.map((t) => String(t)) : [],
      link: p.link ? String(p.link) : undefined,
      year: p.year ? String(p.year) : undefined,
    }));
  } catch {
    return [];
  }
}

export async function fetchPublicProducts(): Promise<PublicProduct[]> {
  try {
    const res = await fetch(API_ENDPOINTS.products);
    if (!res.ok) return [];
    const json = await res.json();
    const list = Array.isArray(json.products) ? json.products : Array.isArray(json.data) ? json.data : [];
    return list
      .filter((p: Record<string, unknown>) => p.published !== false)
      .map((p: Record<string, unknown>, idx: number) => ({
        slug: String(p.slug || `produto-${idx}`),
        name: String(p.name || ''),
        category: String(p.category || 'Software & ERP'),
        tag: String(p.tag || 'JOGIMIL'),
        tagline: String(p.tagline || p.description || ''),
        description: String(p.description || ''),
        fullDescription: Array.isArray(p.fullDescription)
          ? p.fullDescription.map((x) => String(x)).filter(Boolean)
          : p.description
          ? [String(p.description)]
          : [],
        features: Array.isArray(p.features) ? p.features.map((x) => String(x)).filter(Boolean) : [],
        image: String(p.image || (Array.isArray(p.gallery) && p.gallery[0]) || '/logo-original.png'),
        gallery: Array.isArray(p.gallery) ? p.gallery.map((g) => String(g)).filter(Boolean).slice(0, 5) : undefined,
        pdfUrl: p.pdfUrl ? String(p.pdfUrl) : undefined,
        priceStarting: String(p.priceStarting || p.starterPriceValue || 'Sob consulta'),
        starterPriceValue: String(p.starterPriceValue || p.priceStarting || 'Sob consulta'),
        starterPeriod: String(p.starterPeriod || '/mês'),
      }));
  } catch {
    return [];
  }
}

export interface FormSubmissionPayload {
  formType: string;
  formTitle: string;
  data: Record<string, unknown>;
  source?: string;
}

export interface FormSubmissionResponse {
  success: boolean;
  id?: string;
  message?: string;
  error?: string;
  destination?: string;
}

export async function submitToMicroservice(payload: FormSubmissionPayload): Promise<FormSubmissionResponse> {
  const source = payload.source || (typeof window !== 'undefined' ? window.location.href : '');
  const res = await fetch(API_ENDPOINTS.submitForm, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      source,
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Erro na resposta do microserviço.');
  }

  return json as FormSubmissionResponse;
}

function getOrCreateStorageId(storage: Storage, key: string, prefix: string): string {
  try {
    let existing = storage.getItem(key);
    if (!existing) {
      existing = `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      storage.setItem(key, existing);
    }
    return existing;
  } catch {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function trackVisit(page: string, id?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const visitorId = getOrCreateStorageId(window.localStorage, 'jm_visitor_id', 'vis');
    const sessionId = getOrCreateStorageId(window.sessionStorage, 'jm_session_id', 'sess');
    const params = new URLSearchParams(window.location.search || window.location.hash.split('?')[1] || '');

    fetch(API_ENDPOINTS.trackVisit, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        page,
        id: id || null,
        path: window.location.hash || `#/${page}${id ? `/${id}` : ''}`,
        referrer: document.referrer || '',
        screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
        language: navigator.language || 'pt-AO',
        visitorId,
        sessionId,
        utmSource: params.get('utm_source') || '',
        utmMedium: params.get('utm_medium') || '',
        utmCampaign: params.get('utm_campaign') || '',
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {
      // Silencioso para nunca impactar UX do portal
    });
  } catch {
    // ignore
  }
}
