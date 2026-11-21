export type Stage = 'novo' | 'contactado' | 'qualificado' | 'proposta' | 'negociacao' | 'ganho' | 'perdido';
export type InteractionStatus =
  | 'sem_contacto'
  | 'por_responder'
  | 'aguardar_cliente'
  | 'em_conversa'
  | 'follow_up'
  | 'sem_resposta'
  | 'concluido';
export type Priority = 'baixa' | 'media' | 'alta';

export interface Interaction {
  id: string;
  channel: string;
  direction: 'inbound' | 'outbound';
  type?: string;
  outcome?: string;
  content: string;
  author?: string;
  timestamp: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role?: string;
  stage: Stage;
  status?: string;
  interactionStatus: InteractionStatus;
  priority: Priority;
  value: number;
  tags: string[];
  owner?: string;
  notes?: string;
  nextFollowUp?: string | null;
  source: string;
  createdAt: string;
  updatedAt?: string;
  lastInteractionAt?: string | null;
  history: Interaction[];
}

interface Option<T extends string> {
  id: T;
  label: string;
  dot: string;
  badge: string;
}

export const STAGES: Option<Stage>[] = [
  { id: 'novo', label: 'Novo lead', dot: 'bg-sky-400', badge: 'bg-sky-500/10 text-sky-500 border-sky-500/20' },
  { id: 'contactado', label: 'Contactado', dot: 'bg-indigo-400', badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  { id: 'qualificado', label: 'Qualificado', dot: 'bg-violet-400', badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  { id: 'proposta', label: 'Proposta', dot: 'bg-amber-400', badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  { id: 'negociacao', label: 'Negociação', dot: 'bg-orange-400', badge: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  { id: 'ganho', label: 'Ganho', dot: 'bg-emerald-400', badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  { id: 'perdido', label: 'Perdido', dot: 'bg-rose-400', badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
];

export const INTERACTION_STATUSES: Option<InteractionStatus>[] = [
  { id: 'sem_contacto', label: 'Sem contacto', dot: 'bg-slate-400', badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  { id: 'por_responder', label: 'Por responder', dot: 'bg-rose-400', badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
  { id: 'aguardar_cliente', label: 'A aguardar cliente', dot: 'bg-amber-400', badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  { id: 'em_conversa', label: 'Em conversa', dot: 'bg-sky-400', badge: 'bg-sky-500/10 text-sky-500 border-sky-500/20' },
  { id: 'follow_up', label: 'Follow-up agendado', dot: 'bg-violet-400', badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  { id: 'sem_resposta', label: 'Sem resposta', dot: 'bg-orange-400', badge: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  { id: 'concluido', label: 'Concluído', dot: 'bg-emerald-400', badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
];

export const PRIORITIES: Option<Priority>[] = [
  { id: 'baixa', label: 'Baixa', dot: 'bg-slate-400', badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  { id: 'media', label: 'Média', dot: 'bg-amber-400', badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  { id: 'alta', label: 'Alta', dot: 'bg-rose-400', badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
];

export const CHANNELS = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'telefone', label: 'Chamada' },
  { id: 'email', label: 'Email' },
  { id: 'reuniao', label: 'Reunião' },
  { id: 'portal', label: 'Portal' },
  { id: 'nota', label: 'Nota interna' },
];

const LEGACY_STAGE: Record<string, Stage> = {
  novo_lead: 'novo',
  em_contacto: 'contactado',
  contacto: 'contactado',
  demonstracao: 'qualificado',
  cliente: 'ganho',
  fechado: 'ganho',
};

export function normalizeContact(raw: Partial<Contact> & Record<string, unknown>): Contact {
  const stageRaw = String(raw.stage || raw.status || 'novo');
  const stage = (STAGES.some((s) => s.id === stageRaw) ? stageRaw : LEGACY_STAGE[stageRaw] || 'novo') as Stage;
  const history = Array.isArray(raw.history) ? (raw.history as Interaction[]) : [];
  return {
    id: String(raw.id),
    name: String(raw.name || raw.email || raw.phone || 'Sem nome'),
    email: String(raw.email || ''),
    phone: String(raw.phone || ''),
    company: String(raw.company || ''),
    role: String(raw.role || ''),
    stage,
    interactionStatus: (raw.interactionStatus as InteractionStatus) || 'sem_contacto',
    priority: (raw.priority as Priority) || 'media',
    value: Number(raw.value || 0),
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
    owner: String(raw.owner || ''),
    notes: String(raw.notes || ''),
    nextFollowUp: (raw.nextFollowUp as string) || null,
    source: String(raw.source || '—'),
    createdAt: String(raw.createdAt || new Date().toISOString()),
    updatedAt: raw.updatedAt as string,
    lastInteractionAt:
      (raw.lastInteractionAt as string) || (history.length ? history[history.length - 1].timestamp : null),
    history,
  };
}

export const optionOf = <T extends string>(list: Option<T>[], id: T) => list.find((o) => o.id === id) || list[0];

export function formatKz(v: number) {
  return `${Math.round(v || 0).toLocaleString('pt-PT')} Kz`;
}

export function relativeTime(iso?: string | null) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `há ${d} d`;
  return new Date(iso).toLocaleDateString('pt-PT');
}

export function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || '?'
  );
}
