import { useEffect, useState } from 'react';
import { AdminIcon3D } from './AdminIcon3D';
import {
  Inbox,
  RefreshCw,
  Search,
  Mail,
  Phone,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { Pagination } from './Pagination';
import { BrandLoader } from './BrandLoader';

interface FormSubmissionItem {
  id: string;
  formType: string;
  formTitle: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  source?: string;
  status: string;
  createdAt?: string;
  receivedAt?: string;
  data?: Record<string, unknown>;
}

interface PortalSubmissionsPanelProps {
  theme?: 'dark' | 'light';
}

export function PortalSubmissionsPanel(_props: PortalSubmissionsPanelProps) {
  const [submissions, setSubmissions] = useState<FormSubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selected, setSelected] = useState<FormSubmissionItem | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; submissions: FormSubmissionItem[] }>(
        '/api/v1/admin/submissions?limit=150'
      );
      if (res.success) {
        setSubmissions(res.submissions || []);
        if (!selected && res.submissions?.length) {
          setSelected(res.submissions[0]);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
    const id = setInterval(loadSubmissions, 30000);
    return () => clearInterval(id);
  }, []);

  const types = Array.from(new Set(submissions.map((s) => s.formType).filter(Boolean)));

  const filtered = submissions.filter((item) => {
    if (typeFilter !== 'all' && item.formType !== typeFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (item.clientName || '').toLowerCase().includes(q) ||
      (item.clientEmail || '').toLowerCase().includes(q) ||
      (item.clientPhone || '').toLowerCase().includes(q) ||
      (item.formTitle || '').toLowerCase().includes(q) ||
      JSON.stringify(item.data || {}).toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter]);

  const paginatedSubmissions = filtered.slice((page - 1) * pageSize, page * pageSize);

  const statusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'DISPATCHED') {
      return (
        <span className="badge bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
          <CheckCircle2 className="h-3 w-3" /> Enviado
        </span>
      );
    }
    if (s === 'FAILED') {
      return (
        <span className="badge bg-rose-500/10 text-rose-400 border-rose-500/30">
          <AlertCircle className="h-3 w-3" /> Falha Email
        </span>
      );
    }
    return (
      <span className="badge bg-sky-500/10 text-sky-400 border-sky-500/30">
        <Clock className="h-3 w-3" /> {s || 'RECEBIDO'}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-5 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2.5">
            <AdminIcon3D name="inbox" size={26} />
            <span>Formulários do Portal</span>
          </h1>
        </div>

        <button type="button" onClick={loadSubmissions} disabled={loading} className="btn btn-secondary">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar ({submissions.length})</span>
        </button>
      </div>

      {/* Filtros Retangulares */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ds-subtle" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome, email, telefone ou conteúdo..."
            className="input pl-9"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input sm:w-64"
        >
          <option value="all">Todos os formulários ({submissions.length})</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Split-pane Retangular */}
      <div className="ds-card grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-[520px]">
        <div className="lg:col-span-7 border-b lg:border-b-0 lg:border-r ds-divider flex flex-col">
          <div className="flex-1 divide-y ds-divider overflow-y-auto">
          {loading && submissions.length === 0 ? (
            <BrandLoader size="md" />
          ) : paginatedSubmissions.length === 0 ? (
            <p className="text-xs ds-muted text-center py-14">Nenhuma submissão encontrada.</p>
          ) : (
            paginatedSubmissions.map((item) => {
              const isSelected = selected?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelected(item)}
                  className={`w-full text-left p-4 transition-colors border-l-2 ${
                    isSelected
                      ? 'ds-surface-2 border-l-brand'
                      : 'border-l-transparent hover:bg-[rgb(var(--surface-2))]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-brand font-semibold">
                      {item.formTitle || item.formType}
                    </span>
                    {statusBadge(item.status)}
                  </div>
                  <p className="font-semibold text-sm mt-1">
                    {item.clientName || item.clientEmail || 'Visitante do Portal'}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs ds-muted">
                    {item.clientEmail && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {item.clientEmail}
                      </span>
                    )}
                    {item.clientPhone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {item.clientPhone}
                      </span>
                    )}
                    <span className="ml-auto font-mono text-[11px]">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString('pt-PT', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                  </div>
                </button>
              );
            })
          )}
          </div>
          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>

        {/* Detalhe */}
        <div className="lg:col-span-5 p-5 ds-surface-2">
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono ds-muted">{selected.id}</span>
                {statusBadge(selected.status)}
              </div>
              <div>
                <h3 className="text-base font-semibold">{selected.formTitle || selected.formType}</h3>
                <p className="text-xs ds-muted mt-0.5">
                  Recebido em{' '}
                  {selected.createdAt ? new Date(selected.createdAt).toLocaleString('pt-PT') : '—'}
                </p>
              </div>

              {(selected.clientPhone || selected.clientEmail) && (
                <div className="flex flex-wrap gap-2">
                  {selected.clientPhone && (
                    <a
                      href={`https://wa.me/${selected.clientPhone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary btn-sm"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Responder WhatsApp
                    </a>
                  )}
                  {selected.clientEmail && (
                    <a href={`mailto:${selected.clientEmail}`} className="btn btn-secondary btn-sm">
                      <Mail className="h-3.5 w-3.5" /> Responder Email
                    </a>
                  )}
                </div>
              )}

              <div className="space-y-2.5 pt-3 border-t ds-divider text-xs">
                {Object.entries(selected.data || {}).map(([key, val]) => (
                  <div key={key} className="flex flex-col gap-0.5">
                    <span className="uppercase tracking-wider ds-subtle font-semibold text-[10px]">{key}</span>
                    <span className="text-[13px] whitespace-pre-wrap break-words">
                      {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '—')}
                    </span>
                  </div>
                ))}
              </div>

              {selected.source && (
                <div className="pt-3 border-t ds-divider text-xs ds-muted flex items-center gap-1.5 break-all">
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  <span>Origem: {selected.source}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs ds-muted text-center py-14">
              Selecione uma submissão à esquerda para ver todos os campos.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
