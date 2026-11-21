import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Plus,
  Download,
  LayoutList,
  KanbanSquare,
  X,
  Phone,
  Mail,
  Building2,
  MessageSquare,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  Save,
  RefreshCw,
  Users,
  Inbox,
  CheckCircle2,
  CalendarClock,
  ChevronDown,
  Bell,
  Share2,
} from 'lucide-react';
import { apiFetch, getSessionUser } from '../lib/api';
import { Pagination } from './Pagination';
import { BrandLoader } from './BrandLoader';
import { AdminIcon3D } from './AdminIcon3D';
import { ConfirmModal, FeedbackPopup } from './ConfirmModal';
import {
  CHANNELS,
  Contact,
  INTERACTION_STATUSES,
  InteractionStatus,
  PRIORITIES,
  Priority,
  STAGES,
  Stage,
  initials,
  normalizeContact,
  optionOf,
  relativeTime,
} from '../lib/crm';

interface CrmContactsProps {
  theme?: 'dark' | 'light';
}

type SortKey = 'interactions_desc' | 'interactions_asc' | 'last_interaction' | 'newest' | 'name';

const SORTS: { id: SortKey; label: string }[] = [
  { id: 'interactions_desc', label: 'Mais interações' },
  { id: 'interactions_asc', label: 'Menos interações' },
  { id: 'last_interaction', label: 'Última interação' },
  { id: 'newest', label: 'Mais recentes' },
  { id: 'name', label: 'Nome (A–Z)' },
];

/* ---------- Pequenos componentes ---------- */

function InlineSelect<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string; dot: string; badge: string }[];
  onChange: (v: T) => void;
}) {
  const current = options.find((o) => o.id === value) || options[0];
  return (
    <div className="relative inline-flex" onClick={(e) => e.stopPropagation()}>
      <span className={`badge pr-6 ${current.badge}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />
        {current.label}
      </span>
      <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 opacity-60" />
      <select
        aria-label="Alterar"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border ds-divider ds-surface-2 font-mono font-semibold text-brand ${
        size === 'lg' ? 'h-10 w-10 text-sm' : 'h-8 w-8 text-[11px]'
      }`}
    >
      {initials(name)}
    </span>
  );
}

function Kpi({ icon: Icon, label, value, hint, iconClass }: { icon: typeof Users; label: string; value: string; hint?: string; iconClass: string }) {
  return (
    <div className="ds-card p-4 flex flex-col justify-between gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider ds-muted">{label}</p>
        <Icon className={`h-4 w-4 ${iconClass}`} />
      </div>
      <div>
        <p className="text-2xl font-semibold font-mono tabular-nums leading-tight">{value}</p>
        {hint && <p className="text-[11px] ds-muted mt-1 truncate">{hint}</p>}
      </div>
    </div>
  );
}

/* ---------- Formulário de contacto (novo / editar) ---------- */

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  company: '',
  role: '',
  priority: 'media' as Priority,
  owner: '',
  nextFollowUp: '',
  tags: '',
  notes: '',
  stage: 'novo' as Stage,
};

type FormState = typeof emptyForm;

function ContactFields({ form, setForm }: { form: FormState; setForm: (f: FormState) => void }) {
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <label className="label">Nome *</label>
        <input className="input" value={form.name} onChange={set('name')} placeholder="Nome completo" />
      </div>
      <div>
        <label className="label">Email</label>
        <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="nome@empresa.ao" />
      </div>
      <div>
        <label className="label">Telefone / WhatsApp</label>
        <input className="input" value={form.phone} onChange={set('phone')} placeholder="+244 9xx xxx xxx" />
      </div>
      <div>
        <label className="label">Empresa</label>
        <input className="input" value={form.company} onChange={set('company')} />
      </div>
      <div>
        <label className="label">Cargo</label>
        <input className="input" value={form.role} onChange={set('role')} />
      </div>
      <div>
        <label className="label">Prioridade</label>
        <select className="input" value={form.priority} onChange={set('priority')}>
          {PRIORITIES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Responsável</label>
        <input className="input" value={form.owner} onChange={set('owner')} placeholder="Ex.: Joel Gaspar" />
      </div>
      <div className="col-span-2">
        <label className="label">Próximo follow-up</label>
        <input className="input" type="date" value={form.nextFollowUp} onChange={set('nextFollowUp')} />
      </div>
      <div className="col-span-2">
        <label className="label">Etiquetas (separadas por vírgula)</label>
        <input className="input" value={form.tags} onChange={set('tags')} placeholder="POS, Luanda, Retalho" />
      </div>
      <div className="col-span-2">
        <label className="label">Notas</label>
        <textarea className="input" rows={3} value={form.notes} onChange={set('notes')} />
      </div>
    </div>
  );
}

const toForm = (c: Contact): FormState => ({
  name: c.name,
  email: c.email,
  phone: c.phone,
  company: c.company,
  role: c.role || '',
  priority: c.priority,
  owner: c.owner || '',
  nextFollowUp: c.nextFollowUp ? String(c.nextFollowUp).slice(0, 10) : '',
  tags: c.tags.join(', '),
  notes: c.notes || '',
  stage: c.stage,
});

const fromForm = (f: FormState) => ({
  ...f,
  nextFollowUp: f.nextFollowUp || null,
  tags: f.tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean),
});

/* ---------- Componente principal ---------- */

export function CrmContacts(_props: CrmContactsProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [view, setView] = useState<'list' | 'board'>('list');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<Stage | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<InteractionStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('interactions_desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState<FormState>(emptyForm);
  const [dragId, setDragId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ contacts: Record<string, unknown>[] }>('/api/v1/admin/contacts');
      setContacts((res.contacts || []).map((c) => normalizeContact(c)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar contactos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patchContact = async (id: string, patch: Partial<Contact>) => {
    const prev = contacts;
    setContacts((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    try {
      const res = await apiFetch<{ contact: Record<string, unknown> }>(`/api/v1/admin/contacts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(patch),
      });
      setContacts((list) => list.map((c) => (c.id === id ? normalizeContact(res.contact) : c)));
    } catch (e) {
      setContacts(prev);
      notify(`Erro: ${e instanceof Error ? e.message : 'não foi possível atualizar'}`);
    }
  };

  /* --- Métricas --- */
  const metrics = useMemo(() => {
    const open = contacts.filter((c) => c.stage !== 'ganho' && c.stage !== 'perdido');
    const won = contacts.filter((c) => c.stage === 'ganho');
    const lost = contacts.filter((c) => c.stage === 'perdido');
    const closed = won.length + lost.length;
    const totalInteractions = contacts.reduce((a, c) => a + c.history.length, 0);
    return {
      total: contacts.length,
      toReply: contacts.filter((c) => c.interactionStatus === 'por_responder').length,
      openCount: open.length,
      wonCount: won.length,
      totalInteractions,
      conversion: closed ? Math.round((won.length / closed) * 100) : 0,
      followUpsDue: contacts.filter(
        (c) => c.nextFollowUp && new Date(c.nextFollowUp).getTime() <= Date.now() + 86400000 && c.stage !== 'ganho' && c.stage !== 'perdido'
      ).length,
      byStage: STAGES.map((s) => ({ ...s, count: contacts.filter((c) => c.stage === s.id).length })),
    };
  }, [contacts]);

  /* --- Filtro + ordenação --- */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = contacts.filter((c) => {
      if (stageFilter !== 'all' && c.stage !== stageFilter) return false;
      if (statusFilter !== 'all' && c.interactionStatus !== statusFilter) return false;
      if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false;
      if (!q) return true;
      return [c.name, c.email, c.phone, c.company, c.source, c.tags.join(' ')].join(' ').toLowerCase().includes(q);
    });
    const t = (s?: string | null) => (s ? new Date(s).getTime() : 0);
    return [...list].sort((a, b) => {
      switch (sort) {
        case 'interactions_desc':
          return b.history.length - a.history.length || t(b.lastInteractionAt) - t(a.lastInteractionAt);
        case 'interactions_asc':
          return a.history.length - b.history.length;
        case 'last_interaction':
          return t(b.lastInteractionAt) - t(a.lastInteractionAt);
        case 'newest':
          return t(b.createdAt) - t(a.createdAt);
        case 'name':
          return a.name.localeCompare(b.name, 'pt');
      }
    });
  }, [contacts, search, stageFilter, statusFilter, priorityFilter, sort]);

  const maxInteractions = Math.max(1, ...contacts.map((c) => c.history.length));
  const selected = contacts.find((c) => c.id === selectedId) || null;

  useEffect(() => {
    setPage(1);
  }, [search, stageFilter, statusFilter, priorityFilter, sort]);

  const paginatedContacts = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );

  const exportCsv = () => {
    const header = ['Nome', 'Email', 'Telefone', 'Empresa', 'Etapa', 'Estado interação', 'Interações', 'Última interação', 'Prioridade', 'Origem'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = filtered.map((c) =>
      [
        c.name,
        c.email,
        c.phone,
        c.company,
        optionOf(STAGES, c.stage).label,
        optionOf(INTERACTION_STATUSES, c.interactionStatus).label,
        c.history.length,
        c.lastInteractionAt ? new Date(c.lastInteractionAt).toLocaleString('pt-PT') : '',
        optionOf(PRIORITIES, c.priority).label,
        c.source,
      ]
        .map(esc)
        .join(';')
    );
    const blob = new Blob(['\uFEFF' + [header.map(esc).join(';'), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `jogimil-crm-contactos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const createContact = async () => {
    if (!newForm.name.trim()) return notify('Indique pelo menos o nome do contacto.');
    try {
      const res = await apiFetch<{ contact: Record<string, unknown> }>('/api/v1/admin/contacts', {
        method: 'POST',
        body: JSON.stringify({ ...fromForm(newForm), source: 'Painel Admin' }),
      });
      setContacts((l) => [normalizeContact(res.contact), ...l.filter((c) => c.id !== res.contact.id)]);
      setCreating(false);
      setNewForm(emptyForm);
      notify('Contacto criado.');
    } catch (e) {
      notify(`Erro: ${e instanceof Error ? e.message : 'falha ao criar'}`);
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-fadeIn">
      {/* Cabeçalho da página */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2.5">
            <AdminIcon3D name="contacts" size={26} />
            <span>CRM &amp; Contactos</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary" onClick={load} disabled={loading} title="Atualizar">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="btn btn-secondary" onClick={exportCsv}>
            <Download className="h-4 w-4" /> Exportar
          </button>
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Novo contacto
          </button>
        </div>
      </div>

      {/* KPIs com Ícones 3D */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="group ds-card ds-card-interactive p-4 flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold ds-muted">Contactos</p>
            <p className="text-2xl font-semibold font-mono tabular-nums mt-1">{metrics.total}</p>
            <p className="text-[11px] ds-muted mt-0.5">{metrics.openCount} ativos no funil</p>
          </div>
          <AdminIcon3D name="contacts" size={36} />
        </div>
        <div className="group ds-card ds-card-interactive p-4 flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold ds-muted">Por responder</p>
            <p className="text-2xl font-semibold font-mono tabular-nums mt-1 text-rose-400">{metrics.toReply}</p>
            <p className="text-[11px] ds-muted mt-0.5">Aguardam retorno</p>
          </div>
          <AdminIcon3D name="chat" size={36} />
        </div>
        <div className="group ds-card ds-card-interactive p-4 flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold ds-muted">Follow-ups</p>
            <p className="text-2xl font-semibold font-mono tabular-nums mt-1 text-amber-400">{metrics.followUpsDue}</p>
            <p className="text-[11px] ds-muted mt-0.5">Hoje ou em atraso</p>
          </div>
          <AdminIcon3D name="calendar" size={36} />
        </div>
        <div className="group ds-card ds-card-interactive p-4 flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold ds-muted">Interações</p>
            <p className="text-2xl font-semibold font-mono tabular-nums mt-1 text-emerald-400">{metrics.totalInteractions}</p>
            <p className="text-[11px] ds-muted mt-0.5">{metrics.wonCount} convertidos · {metrics.conversion}%</p>
          </div>
          <AdminIcon3D name="check" size={36} />
        </div>
      </div>

      {/* Etapas do funil */}
      <div className="ds-card p-1 flex gap-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setStageFilter('all')}
          className={`flex-1 min-w-[96px] px-3 py-2 text-left transition-colors ${stageFilter === 'all' ? 'ds-surface-2 border-b-2 border-brand' : 'hover:bg-[rgb(var(--surface-2))]'}`}
        >
          <p className="text-[11px] font-medium ds-muted">Todas</p>
          <p className="text-base font-semibold font-mono tabular-nums">{metrics.total}</p>
        </button>
        {metrics.byStage.map((s) => (
          <button
            key={s.id}
            onClick={() => setStageFilter(stageFilter === s.id ? 'all' : s.id)}
            className={`flex-1 min-w-[110px] px-3 py-2 text-left transition-colors ${stageFilter === s.id ? 'ds-surface-2 border-b-2 border-brand' : 'hover:bg-[rgb(var(--surface-2))]'}`}
          >
            <p className="flex items-center gap-1.5 text-[11px] font-medium ds-muted">
              <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </p>
            <p className="text-base font-semibold font-mono tabular-nums">{s.count}</p>
          </button>
        ))}
      </div>

      {/* Barra de ferramentas */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ds-subtle" />
          <input
            className="input pl-9"
            placeholder="Pesquisar por nome, empresa, email, telefone ou etiqueta…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as InteractionStatus | 'all')}>
            <option value="all">Todos os estados</option>
            {INTERACTION_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <select className="input w-auto" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as Priority | 'all')}>
            <option value="all">Todas as prioridades</option>
            {PRIORITIES.map((p) => (
              <option key={p.id} value={p.id}>
                Prioridade {p.label.toLowerCase()}
              </option>
            ))}
          </select>
          <select className="input w-auto" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                Ordenar: {s.label}
              </option>
            ))}
          </select>
          <div className="flex rounded-lg border p-0.5 ds-divider" style={{ background: 'rgb(var(--surface))' }}>
            <button className={`btn btn-sm ${view === 'list' ? 'btn-secondary' : 'btn-ghost'}`} onClick={() => setView('list')}>
              <LayoutList className="h-4 w-4" /> Lista
            </button>
            <button className={`btn btn-sm ${view === 'board' ? 'btn-secondary' : 'btn-ghost'}`} onClick={() => setView('board')}>
              <KanbanSquare className="h-4 w-4" /> Quadro
            </button>
          </div>
        </div>
      </div>

      {error && <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-500">{error}</div>}

      {/* LISTA */}
      {view === 'list' && (
        <div className="ds-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Contacto</th>
                  <th>Empresa</th>
                  <th>Etapa</th>
                  <th>Estado da interação</th>
                  <th className="text-right">Interações</th>
                  <th>Última interação</th>
                  <th>Prioridade</th>
                  <th>Origem</th>
                </tr>
              </thead>
              <tbody>
                {loading && contacts.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <BrandLoader size="md" />
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-14 text-center ds-muted">
                      Nenhum contacto encontrado. Ajuste os filtros, crie um contacto ou importe uma folha Excel em Definições.
                    </td>
                  </tr>
                )}
                {paginatedContacts.map((c) => (
                  <tr key={c.id} className="cursor-pointer" onClick={() => setSelectedId(c.id)}>
                    <td>
                      <div className="flex items-center gap-3 min-w-[220px]">
                        <Avatar name={c.name} />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{c.name}</p>
                          <p className="text-xs ds-muted truncate">{c.email || c.phone || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="ds-muted whitespace-nowrap">{c.company || '—'}</td>
                    <td>
                      <InlineSelect value={c.stage} options={STAGES} onChange={(v) => patchContact(c.id, { stage: v })} />
                    </td>
                    <td>
                      <InlineSelect
                        value={c.interactionStatus}
                        options={INTERACTION_STATUSES}
                        onChange={(v) => patchContact(c.id, { interactionStatus: v })}
                      />
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <div className="hidden md:block h-1.5 w-16 overflow-hidden ds-surface-2">
                          <div className="h-full bg-brand" style={{ width: `${(c.history.length / maxInteractions) * 100}%` }} />
                        </div>
                        <span className="font-semibold font-mono tabular-nums w-6">{c.history.length}</span>
                      </div>
                    </td>
                    <td className="ds-muted whitespace-nowrap">{relativeTime(c.lastInteractionAt)}</td>
                    <td>
                      <InlineSelect value={c.priority} options={PRIORITIES} onChange={(v) => patchContact(c.id, { priority: v })} />
                    </td>
                    <td className="text-xs ds-muted whitespace-nowrap">{c.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      {/* QUADRO (KANBAN) */}
      {view === 'board' && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STAGES.map((s) => {
            const items = filtered.filter((c) => c.stage === s.id);
            return (
              <div
                key={s.id}
                className="w-72 shrink-0 border ds-divider ds-surface-2 flex flex-col max-h-[70vh]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragId) patchContact(dragId, { stage: s.id });
                  setDragId(null);
                }}
              >
                <div className="flex items-center justify-between px-3 py-2.5 border-b ds-divider">
                  <span className="flex items-center gap-2 text-[13px] font-semibold">
                    <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                    {s.label}
                  </span>
                  <span className="text-xs font-mono ds-muted">{items.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {items.map((c) => (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={() => setDragId(c.id)}
                      onClick={() => setSelectedId(c.id)}
                      className="ds-card p-3 cursor-grab active:cursor-grabbing hover:border-[rgb(var(--border-strong))] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium truncate">{c.name}</p>
                          <p className="text-xs ds-muted truncate">{c.company || c.email || c.phone}</p>
                        </div>
                        <span className={`h-2 w-2 mt-1.5 rounded-full shrink-0 ${optionOf(PRIORITIES, c.priority).dot}`} title={`Prioridade ${c.priority}`} />
                      </div>
                      <div className="mt-2.5 flex items-center justify-between">
                        <span className={`badge ${optionOf(INTERACTION_STATUSES, c.interactionStatus).badge}`}>
                          {optionOf(INTERACTION_STATUSES, c.interactionStatus).label}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-mono ds-muted">
                          <MessageSquare className="h-3 w-3" /> {c.history.length}
                        </span>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <p className="py-6 text-center text-xs ds-subtle">Arraste contactos para aqui</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Painel de detalhe */}
      {selected && (
        <ContactDrawer
          key={selected.id}
          contact={selected}
          onClose={() => setSelectedId(null)}
          onPatch={(patch) => patchContact(selected.id, patch)}
          onReplace={(c) => setContacts((l) => l.map((x) => (x.id === c.id ? c : x)))}
          onDelete={() => setDeleteTarget(selected)}
          notify={notify}
        />
      )}

      {/* Modal novo contacto (Portal limpo sem desfoque pesado) */}
      {creating &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/25 p-4"
            onClick={() => setCreating(false)}
          >
            <div
              className="ds-card w-full max-w-xl border-[rgb(var(--border-strong))] animate-fadeIn shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ds-card-header">
                <div>
                  <p className="ds-title">Novo contacto</p>
                  <p className="ds-subtitle">Adicione um lead manualmente ao CRM</p>
                </div>
                <button className="btn btn-ghost btn-icon" onClick={() => setCreating(false)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-5 max-h-[65vh] overflow-y-auto space-y-3">
                <div>
                  <label className="label">Etapa inicial</label>
                  <select
                    className="input"
                    value={newForm.stage}
                    onChange={(e) => setNewForm({ ...newForm, stage: e.target.value as Stage })}
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <ContactFields form={newForm} setForm={setNewForm} />
              </div>
              <div className="flex justify-end gap-2 border-t ds-divider px-5 py-3">
                <button className="btn btn-secondary" onClick={() => setCreating(false)}>
                  Cancelar
                </button>
                <button className="btn btn-primary" onClick={createContact}>
                  <Plus className="h-4 w-4" /> Criar contacto
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Eliminar Contacto"
        description={
          deleteTarget
            ? `Tem a certeza que pretende eliminar "${deleteTarget.name}" e todo o seu histórico de interações? Esta ação é irreversível.`
            : ''
        }
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeleting(true);
          try {
            await apiFetch(`/api/v1/admin/contacts/${deleteTarget.id}`, { method: 'DELETE' });
            setContacts((l) => l.filter((c) => c.id !== deleteTarget.id));
            if (selectedId === deleteTarget.id) setSelectedId(null);
            notify('Contacto eliminado com sucesso.');
          } catch (e) {
            notify(`Erro: ${e instanceof Error ? e.message : 'falha ao eliminar'}`);
          } finally {
            setDeleting(false);
            setDeleteTarget(null);
          }
        }}
      />

      <FeedbackPopup
        notice={
          toast
            ? {
                type: toast.startsWith('Erro:') ? 'error' : 'success',
                text: toast,
              }
            : null
        }
        onClose={() => setToast(null)}
      />
    </div>
  );
}

/* ---------- Drawer de detalhe ---------- */

function ContactDrawer({
  contact,
  onClose,
  onPatch,
  onReplace,
  onDelete,
  notify,
}: {
  contact: Contact;
  onClose: () => void;
  onPatch: (p: Partial<Contact>) => void;
  onReplace: (c: Contact) => void;
  onDelete: () => void;
  notify: (m: string) => void;
}) {
  const sessionUser = getSessionUser();
  const isAdmin = !sessionUser || sessionUser.role === 'admin' || sessionUser.role === 'Administrador Executivo';

  const [tab, setTab] = useState<'activity' | 'events' | 'details'>('activity');
  const [historyChannel, setHistoryChannel] = useState<string>('all');
  const [form, setForm] = useState<FormState>(toForm(contact));
  const [saving, setSaving] = useState(false);
  const [entry, setEntry] = useState({
    channel: 'whatsapp',
    direction: 'outbound' as 'outbound' | 'inbound',
    content: '',
    interactionStatus: '' as InteractionStatus | '',
    nextFollowUp: '',
  });

  // Agendamento de Eventos integrado ao Calendário + Notificação WhatsApp do Perfil
  const [contactEvents, setContactEvents] = useState<
    Array<{ id: string; title: string; type: string; startAt: string; status: string; description?: string }>
  >([]);
  const [schedulingEvent, setSchedulingEvent] = useState(false);
  const [eventForm, setEventForm] = useState(() => {
    const nextHour = new Date(Date.now() + 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      title: `Reunião · ${contact.name}`,
      type: 'reuniao',
      startAt: `${nextHour.getFullYear()}-${pad(nextHour.getMonth() + 1)}-${pad(nextHour.getDate())}T${pad(nextHour.getHours())}:${pad(nextHour.getMinutes())}`,
      durationMinutes: 45,
      priority: 'media',
      location: contact.phone || contact.email || 'Online / Escritório',
      description: '',
      createLinkedTask: false,
    };
  });

  // Partilha de contacto entre utilizadores (Admin)
  const [teamUsers, setTeamUsers] = useState<Array<{ id: string; name: string; email: string; role: string }>>([]);
  const [sharedWithIds, setSharedWithIds] = useState<string[]>(
    Array.isArray((contact as unknown as { sharedWith?: string[] }).sharedWith)
      ? ((contact as unknown as { sharedWith?: string[] }).sharedWith as string[])
      : []
  );
  const [savingShare, setSavingShare] = useState(false);

  const loadContactEvents = useCallback(async () => {
    try {
      const res = await apiFetch<{
        events?: Array<{ id: string; title: string; type: string; startAt: string; status: string; contactId?: string; description?: string }>;
      }>('/api/v1/admin/calendar/events');
      const linked = (res.events || []).filter((ev) => ev.contactId === contact.id);
      setContactEvents(linked);
    } catch {
      // ignore
    }
  }, [contact.id]);

  useEffect(() => {
    loadContactEvents();
    if (isAdmin) {
      apiFetch<{ users?: Array<{ id: string; name: string; email: string; role: string }> }>('/api/v1/admin/users')
        .then((r) => setTeamUsers((r.users || []).filter((u) => u.id !== 'usr_admin_root')))
        .catch(() => {});
    }
  }, [loadContactEvents, isAdmin]);

  const handleScheduleContactEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title.trim() || !eventForm.startAt) {
      return notify('Erro: Preencha o título e a data/hora do evento.');
    }
    setSchedulingEvent(true);
    try {
      const startIso = new Date(eventForm.startAt).toISOString();
      const endIso = new Date(
        new Date(eventForm.startAt).getTime() + Number(eventForm.durationMinutes || 45) * 60 * 1000
      ).toISOString();

      const res = await apiFetch<{
        success: boolean;
        whatsappNotification?: { sent: boolean; phone?: string; error?: string };
      }>('/api/v1/admin/calendar/events', {
        method: 'POST',
        body: JSON.stringify({
          title: eventForm.title.trim(),
          type: eventForm.type,
          priority: eventForm.priority,
          startAt: startIso,
          endAt: endIso,
          location: eventForm.location.trim(),
          description: eventForm.description.trim(),
          contactId: contact.id,
          contactName: contact.name,
          createLinkedTask: eventForm.createLinkedTask,
          notifyWhatsapp: true,
        }),
      });

      if (res.success) {
        await loadContactEvents();
        setEventForm((prev) => ({ ...prev, description: '' }));
        const wa = res.whatsappNotification;
        if (wa?.sent) {
          notify(`Evento agendado no Calendário e notificação enviada para o seu WhatsApp (${wa.phone}).`);
        } else if (wa?.error) {
          notify(`Evento agendado no Calendário! Aviso WhatsApp: ${wa.error}`);
        } else {
          notify('Evento agendado e integrado ao Calendário Corporativo.');
        }
      }
    } catch (err) {
      notify(`Erro: ${err instanceof Error ? err.message : 'falha ao agendar evento'}`);
    } finally {
      setSchedulingEvent(false);
    }
  };

  const handleSaveShare = async () => {
    setSavingShare(true);
    try {
      await apiFetch(`/api/v1/admin/contacts/${contact.id}/share`, {
        method: 'PUT',
        body: JSON.stringify({ sharedWith: sharedWithIds }),
      });
      notify('Partilha do contacto atualizada com sucesso.');
    } catch (err) {
      notify(`Erro: ${err instanceof Error ? err.message : 'falha ao partilhar contacto'}`);
    } finally {
      setSavingShare(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const saveDetails = async () => {
    setSaving(true);
    try {
      const res = await apiFetch<{ contact: Record<string, unknown> }>(`/api/v1/admin/contacts/${contact.id}`, {
        method: 'PUT',
        body: JSON.stringify(fromForm(form)),
      });
      onReplace(normalizeContact(res.contact));
      notify('Detalhes guardados.');
    } catch (e) {
      notify(`Erro: ${e instanceof Error ? e.message : 'falha ao guardar'}`);
    } finally {
      setSaving(false);
    }
  };

  const addInteraction = async () => {
    if (!entry.content.trim()) return notify('Escreva um resumo da interação.');
    try {
      await apiFetch(`/api/v1/admin/contacts/${contact.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          channel: entry.channel,
          direction: entry.direction,
          type: CHANNELS.find((c) => c.id === entry.channel)?.label,
          content: entry.content.trim(),
          interactionStatus: entry.interactionStatus || undefined,
          nextFollowUp: entry.nextFollowUp || undefined,
        }),
      });
      const res = await apiFetch<{ contacts: Record<string, unknown>[] }>('/api/v1/admin/contacts');
      const fresh = res.contacts.find((c) => c.id === contact.id);
      if (fresh) onReplace(normalizeContact(fresh));
      setEntry({ ...entry, content: '', interactionStatus: '', nextFollowUp: '' });
      notify('Interação registada.');
    } catch (e) {
      notify(`Erro: ${e instanceof Error ? e.message : 'falha ao registar'}`);
    }
  };

  const history = [...contact.history].reverse();
  const filteredHistory =
    historyChannel === 'all'
      ? history
      : history.filter((h) => (h.channel || 'nota') === historyChannel);

  const channelCounts: Record<string, number> = { all: history.length };
  for (const h of history) {
    const ch = h.channel || 'nota';
    channelCounts[ch] = (channelCounts[ch] || 0) + 1;
  }

  return createPortal(
    <div className="fixed inset-0 z-[85] flex justify-end bg-black/25" onClick={onClose}>
      <aside
        className="h-full w-full max-w-[560px] flex flex-col border-l ds-divider shadow-2xl animate-slideIn app-bg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="px-6 pt-5 pb-4 border-b ds-divider" style={{ background: 'rgb(var(--surface))' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar name={contact.name} size="lg" />
              <div className="min-w-0">
                <h2 className="text-base font-semibold truncate">{contact.name}</h2>
                <p className="text-xs ds-muted truncate">
                  {[contact.role, contact.company].filter(Boolean).join(' · ') || contact.source}
                </p>
              </div>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Fechar">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTab('events')}
              className="btn btn-primary btn-sm"
            >
              <CalendarClock className="h-3.5 w-3.5" /> Agendar Evento
            </button>
            {contact.phone && (
              <a className="btn btn-secondary btn-sm" href={`https://wa.me/${contact.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                <Phone className="h-3.5 w-3.5" /> {contact.phone}
              </a>
            )}
            {contact.email && (
              <a className="btn btn-secondary btn-sm" href={`mailto:${contact.email}`}>
                <Mail className="h-3.5 w-3.5" /> {contact.email}
              </a>
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div>
              <p className="label">Etapa</p>
              <InlineSelect value={contact.stage} options={STAGES} onChange={(v) => onPatch({ stage: v })} />
            </div>
            <div>
              <p className="label">Estado</p>
              <InlineSelect value={contact.interactionStatus} options={INTERACTION_STATUSES} onChange={(v) => onPatch({ interactionStatus: v })} />
            </div>
            <div>
              <p className="label">Interações</p>
              <p className="text-sm font-semibold tabular-nums">
                {contact.history.length} <span className="text-xs font-normal ds-muted">· {relativeTime(contact.lastInteractionAt)}</span>
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-1 -mb-4">
            {(
              [
                { id: 'activity', label: 'Atividade' },
                { id: 'events', label: `Agendar Evento (${contactEvents.length})` },
                { id: 'details', label: 'Detalhes' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-2 text-[13px] font-medium border-b-2 transition-colors ${
                  tab === t.id ? 'border-brand text-[rgb(var(--text))]' : 'border-transparent ds-muted hover:text-[rgb(var(--text))]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'activity' ? (
            <div className="space-y-5">
              {/* Registar interação */}
              <div className="ds-card p-4 space-y-3">
                <p className="text-[13px] font-semibold">Registar interação</p>
                <div className="grid grid-cols-2 gap-2">
                  <select className="input" value={entry.channel} onChange={(e) => setEntry({ ...entry, channel: e.target.value })}>
                    {CHANNELS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <select className="input" value={entry.direction} onChange={(e) => setEntry({ ...entry, direction: e.target.value as 'inbound' | 'outbound' })}>
                    <option value="outbound">Enviado pela equipa</option>
                    <option value="inbound">Recebido do cliente</option>
                  </select>
                </div>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Resumo da conversa, próximos passos…"
                  value={entry.content}
                  onChange={(e) => setEntry({ ...entry, content: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label">Atualizar estado para</label>
                    <select className="input" value={entry.interactionStatus} onChange={(e) => setEntry({ ...entry, interactionStatus: e.target.value as InteractionStatus | '' })}>
                      <option value="">Manter estado atual</option>
                      {INTERACTION_STATUSES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Próximo follow-up</label>
                    <input className="input" type="date" value={entry.nextFollowUp} onChange={(e) => setEntry({ ...entry, nextFollowUp: e.target.value })} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button className="btn btn-primary" onClick={addInteraction}>
                    <Plus className="h-4 w-4" /> Registar
                  </button>
                </div>
              </div>

              {/* Linha temporal organizada por canal */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider ds-subtle">
                    Histórico por Canal ({filteredHistory.length})
                  </p>
                </div>

                {/* Abas de Canal do Histórico */}
                <div className="flex flex-wrap gap-1 border-b ds-divider pb-2">
                  {[{ id: 'all', label: 'Todos' }, ...CHANNELS].map((ch) => {
                    const count = channelCounts[ch.id] || 0;
                    if (ch.id !== 'all' && count === 0) return null;
                    const isAct = historyChannel === ch.id;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => setHistoryChannel(ch.id)}
                        className={`px-2.5 py-1 text-[11px] font-medium border transition-colors ${
                          isAct
                            ? 'bg-brand text-white border-brand'
                            : 'ds-surface-2 ds-divider ds-muted hover:text-[rgb(var(--text))]'
                        }`}
                      >
                        {ch.label} <span className="font-mono opacity-80">({count})</span>
                      </button>
                    );
                  })}
                </div>

                {filteredHistory.length === 0 ? (
                  <p className="text-[13px] ds-muted">
                    Ainda não existem interações registadas neste canal.
                  </p>
                ) : (
                  <ol className="relative space-y-4 border-l ds-divider pl-5">
                    {filteredHistory.map((h) => (
                      <li key={h.id} className="relative">
                        <span
                          className={`absolute -left-[27px] top-0.5 flex h-[14px] w-[14px] items-center justify-center rounded-full ring-4 ring-[rgb(var(--bg))] ${
                            h.direction === 'inbound' ? 'bg-sky-500' : 'bg-emerald-500'
                          }`}
                        >
                          {h.direction === 'inbound' ? (
                            <ArrowDownLeft className="h-2.5 w-2.5 text-white" />
                          ) : (
                            <ArrowUpRight className="h-2.5 w-2.5 text-white" />
                          )}
                        </span>
                        <div className="flex items-center gap-2 text-xs ds-muted">
                          <span className="font-medium text-[rgb(var(--text))]">
                            {CHANNELS.find((c) => c.id === h.channel)?.label || h.channel}
                          </span>
                          <span>·</span>
                          <span>{h.direction === 'inbound' ? 'Recebido' : h.author || 'Equipa'}</span>
                          <span className="ml-auto whitespace-nowrap">{new Date(h.timestamp).toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="mt-1 text-[13px] whitespace-pre-wrap break-words">{h.content}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          ) : tab === 'events' ? (
            <div className="space-y-5">
              <form onSubmit={handleScheduleContactEvent} className="ds-card p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold flex items-center gap-1.5">
                    <CalendarClock className="h-4 w-4 text-brand" />
                    <span>Agendar Evento no Calendário</span>
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                    <Bell className="h-3 w-3" /> Alerta WhatsApp ativo
                  </span>
                </div>

                <div>
                  <label className="label">Título do Evento *</label>
                  <input
                    required
                    className="input"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    placeholder={`Reunião com ${contact.name}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label">Tipo</label>
                    <select
                      className="input"
                      value={eventForm.type}
                      onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                    >
                      <option value="reuniao">Reunião</option>
                      <option value="chamada">Chamada / Telefone</option>
                      <option value="visita">Visita Presencial</option>
                      <option value="followup">Follow-up Comercial</option>
                      <option value="entrega">Entrega / Demo</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Prioridade</label>
                    <select
                      className="input"
                      value={eventForm.priority}
                      onChange={(e) => setEventForm({ ...eventForm, priority: e.target.value })}
                    >
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label">Data e Hora *</label>
                    <input
                      required
                      type="datetime-local"
                      className="input"
                      value={eventForm.startAt}
                      onChange={(e) => setEventForm({ ...eventForm, startAt: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Duração (min)</label>
                    <input
                      type="number"
                      min={15}
                      step={15}
                      className="input"
                      value={eventForm.durationMinutes}
                      onChange={(e) => setEventForm({ ...eventForm, durationMinutes: Number(e.target.value || 45) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Local / Link / Canal</label>
                  <input
                    className="input"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    placeholder="Escritório Nova Vida, Google Meet ou Telefone"
                  />
                </div>

                <div>
                  <label className="label">Notas do Evento</label>
                  <textarea
                    rows={2}
                    className="input"
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    placeholder="Objetivos da reunião, documentos a apresentar..."
                  />
                </div>

                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eventForm.createLinkedTask}
                    onChange={(e) => setEventForm({ ...eventForm, createLinkedTask: e.target.checked })}
                    className="h-3.5 w-3.5 accent-[rgb(var(--brand))]"
                  />
                  <span>Criar também tarefa vinculada em Tarefas & Processos</span>
                </label>

                <p className="text-[11px] ds-muted">
                  Ao confirmar, o evento entra automaticamente no <strong>Calendário</strong> e envia notificação para o WhatsApp configurado no seu <strong>Perfil</strong>.
                </p>

                <div className="flex justify-end">
                  <button type="submit" disabled={schedulingEvent} className="btn btn-primary">
                    {schedulingEvent ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
                    <span>{schedulingEvent ? 'A agendar...' : 'Agendar & Notificar WhatsApp'}</span>
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider ds-subtle">
                  Eventos Vinculados a este Contacto ({contactEvents.length})
                </p>
                {contactEvents.length === 0 ? (
                  <p className="text-xs ds-muted">Nenhum evento agendado para este contacto ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {contactEvents.map((ev) => (
                      <div key={ev.id} className="ds-card p-3 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{ev.title}</p>
                          <p className="text-[11px] font-mono ds-muted mt-0.5">
                            {new Date(ev.startAt).toLocaleString('pt-PT', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          {ev.description && <p className="text-[11px] ds-subtle mt-1">{ev.description}</p>}
                        </div>
                        <span className="badge ds-surface-2 ds-divider uppercase font-mono text-[10px]">
                          {ev.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <ContactFields form={form} setForm={setForm} />
              <div className="flex items-center gap-2 text-xs ds-muted">
                <Building2 className="h-3.5 w-3.5" /> Origem: {contact.source} · Criado {relativeTime(contact.createdAt)}
              </div>

              {isAdmin && teamUsers.length > 0 && (
                <div className="ds-card p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold flex items-center gap-1.5">
                      <Share2 className="h-3.5 w-3.5 text-brand" />
                      <span>Partilhar Contacto com Utilizadores (Admin)</span>
                    </p>
                    <button
                      type="button"
                      disabled={savingShare}
                      onClick={handleSaveShare}
                      className="btn btn-primary btn-sm h-7 text-[11px]"
                    >
                      {savingShare ? 'A guardar...' : 'Guardar Partilha'}
                    </button>
                  </div>
                  <p className="text-[11px] ds-muted">
                    Apenas os utilizadores marcados abaixo (além dos Administradores) poderão visualizar este contacto.
                  </p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {teamUsers.map((u) => {
                      const checked = sharedWithIds.includes(u.id);
                      return (
                        <label
                          key={u.id}
                          className="flex items-center justify-between gap-2 px-2.5 py-1.5 border ds-divider ds-surface-2 text-xs cursor-pointer"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                setSharedWithIds((prev) =>
                                  e.target.checked ? [...prev, u.id] : prev.filter((id) => id !== u.id)
                                )
                              }
                              className="h-3.5 w-3.5 accent-[rgb(var(--brand))]"
                            />
                            <span className="truncate font-medium">{u.name}</span>
                          </span>
                          <span className="text-[10px] font-mono uppercase ds-muted">{u.role}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-between border-t ds-divider px-6 py-3" style={{ background: 'rgb(var(--surface))' }}>
          <button className="btn btn-ghost text-rose-500" onClick={onDelete}>
            <Trash2 className="h-4 w-4" /> Eliminar
          </button>
          {tab === 'details' && (
            <button className="btn btn-primary" onClick={saveDetails} disabled={saving}>
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar alterações
            </button>
          )}
        </div>
      </aside>
    </div>,
    document.body
  );
}
