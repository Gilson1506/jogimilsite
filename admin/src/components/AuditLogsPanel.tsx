import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Download,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { BrandLoader } from './BrandLoader';
import { Pagination } from './Pagination';
import { AdminIcon3D } from './AdminIcon3D';
import type { SystemUser } from './UsersManager';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  method: string;
  path: string;
  module: string;
  action: string;
  summary: string;
  statusCode: number;
  ip: string;
  durationMs: number;
}

interface AuditLogsPanelProps {
  users: SystemUser[];
  initialUserId?: string;
  onBack?: () => void;
}

const MODULES = [
  'Autenticação',
  'CRM & Contactos',
  'Atendimento',
  'Disparo em Massa',
  'Calendário',
  'Tarefas & Processos',
  'Arquivos Digitais',
  'Comunicação Interna',
  'Utilizadores',
  'Perfil',
  'Definições & Canais',
  'Website',
];

export function AuditLogsPanel({ users, initialUserId = '', onBack }: AuditLogsPanelProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState(initialUserId);
  const [moduleFilter, setModuleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'success' | 'error'>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  useEffect(() => {
    setUserFilter(initialUserId);
  }, [initialUserId]);

  const loadLogs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; logs?: AuditLogEntry[] }>(
        '/api/v1/admin/audit-logs?limit=500'
      );
      if (res.success && Array.isArray(res.logs)) {
        setLogs(res.logs);
      }
    } catch {
      // ignore
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs(false);
    const id = setInterval(() => loadLogs(true), 15000);
    return () => clearInterval(id);
  }, [loadLogs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((l) => {
      if (userFilter && l.userId !== userFilter && l.userEmail !== userFilter) return false;
      if (moduleFilter && l.module !== moduleFilter) return false;
      if (statusFilter === 'success' && l.statusCode >= 400) return false;
      if (statusFilter === 'error' && l.statusCode < 400) return false;
      if (!q) return true;
      return [l.userName, l.userEmail, l.module, l.action, l.summary, l.path, l.ip]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [logs, userFilter, moduleFilter, statusFilter, search]);

  useEffect(() => {
    setPage(1);
  }, [userFilter, moduleFilter, statusFilter, search]);

  const stats = useMemo(() => {
    const ok = filtered.filter((l) => l.statusCode < 400).length;
    const err = filtered.filter((l) => l.statusCode >= 400).length;
    const uniqueUsers = new Set(filtered.map((l) => l.userId).filter(Boolean)).size;
    return { total: filtered.length, ok, err, uniqueUsers };
  }, [filtered]);

  const exportCsv = () => {
    const headers = ['Data/Hora', 'Utilizador', 'Email', 'Nivel', 'Modulo', 'Acao', 'Detalhe', 'Metodo', 'Rota', 'Estado', 'IP', 'Latencia(ms)'];
    const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = filtered.map((l) => [
      new Date(l.timestamp).toLocaleString('pt-PT'),
      l.userName,
      l.userEmail,
      l.userRole,
      l.module,
      l.action,
      l.summary,
      l.method,
      l.path,
      l.statusCode,
      l.ip,
      l.durationMs,
    ]);
    const csv = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jogimil-auditoria-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button type="button" onClick={onBack} className="btn btn-secondary btn-sm">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Voltar</span>
            </button>
          )}
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2.5">
            <AdminIcon3D name="shield" size={26} />
            <span>Auditoria &amp; Logs</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="btn btn-secondary btn-sm"
          >
            <Download className="h-3.5 w-3.5 text-brand" />
            <span>Exportar CSV</span>
          </button>
          <button type="button" onClick={() => loadLogs(false)} disabled={loading} className="btn btn-primary btn-sm">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* KPIs 3D */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="group ds-card ds-card-interactive p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold ds-muted">Eventos Registados</p>
            <p className="text-2xl font-mono font-semibold mt-1">{stats.total}</p>
          </div>
          <AdminIcon3D name="shield" size={36} />
        </div>
        <div className="group ds-card ds-card-interactive p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold ds-muted">Bem-Sucedidos</p>
            <p className="text-2xl font-mono font-semibold text-emerald-400 mt-1">{stats.ok}</p>
          </div>
          <AdminIcon3D name="check" size={36} />
        </div>
        <div className="group ds-card ds-card-interactive p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold ds-muted">Falhas / Bloqueios</p>
            <p className="text-2xl font-mono font-semibold text-rose-400 mt-1">{stats.err}</p>
          </div>
          <AdminIcon3D name="clock" size={36} />
        </div>
        <div className="group ds-card ds-card-interactive p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold ds-muted">Utilizadores Ativos</p>
            <p className="text-2xl font-mono font-semibold mt-1">{stats.uniqueUsers}</p>
          </div>
          <AdminIcon3D name="users" size={36} />
        </div>
      </div>

      {/* Filtros */}
      <div className="ds-card p-3.5 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ds-subtle" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por utilizador, ação, rota, detalhe ou IP..."
            className="input h-9 pl-9 text-xs"
          />
        </div>

        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="input h-9 w-auto text-xs"
        >
          <option value="">Todos os utilizadores</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.role})
            </option>
          ))}
        </select>

        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="input h-9 w-auto text-xs"
        >
          <option value="">Todos os módulos</option>
          {MODULES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as '' | 'success' | 'error')}
          className="input h-9 w-auto text-xs"
        >
          <option value="">Todos os estados</option>
          <option value="success">Sucesso (2xx/3xx)</option>
          <option value="error">Falha / Bloqueado (4xx/5xx)</option>
        </select>
      </div>

      {/* Tabela de Auditoria */}
      <div className="ds-card overflow-hidden">
        {loading && logs.length === 0 ? (
          <BrandLoader size="md" />
        ) : filtered.length === 0 ? (
          <p className="text-xs ds-muted text-center py-14">
            Nenhum evento de auditoria registado para os filtros selecionados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Data / Hora</th>
                  <th>Utilizador</th>
                  <th>Módulo</th>
                  <th>Ação & Detalhe</th>
                  <th>Estado</th>
                  <th>IP / Latência</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice((page - 1) * pageSize, page * pageSize).map((l) => {
                  const isOk = l.statusCode < 400;
                  return (
                    <tr key={l.id}>
                      <td className="font-mono text-[11px] ds-muted whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3 ds-subtle" />
                          {new Date(l.timestamp).toLocaleString('pt-PT', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </td>
                      <td>
                        <p className="text-xs font-semibold">{l.userName || 'Sistema'}</p>
                        <p className="text-[10px] ds-muted font-mono">
                          {l.userEmail || l.userId} {l.userRole ? `· ${l.userRole}` : ''}
                        </p>
                      </td>
                      <td>
                        <span className="badge ds-surface-2 ds-divider text-[10px] font-semibold">
                          {l.module}
                        </span>
                      </td>
                      <td className="max-w-[320px]">
                        <p className="text-xs font-medium">{l.action}</p>
                        {l.summary ? (
                          <p className="text-[11px] ds-muted truncate" title={l.summary}>
                            {l.summary}
                          </p>
                        ) : (
                          <p className="text-[10px] font-mono ds-subtle truncate">
                            {l.method} {l.path}
                          </p>
                        )}
                      </td>
                      <td className="whitespace-nowrap">
                        {isOk ? (
                          <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> {l.statusCode}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-mono text-rose-400">
                            <XCircle className="h-3.5 w-3.5" /> {l.statusCode}
                          </span>
                        )}
                      </td>
                      <td className="font-mono text-[11px] ds-subtle whitespace-nowrap">
                        {l.ip || 'local'} · {l.durationMs}ms
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          page={page}
          pageSize={pageSize}
          totalItems={filtered.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}
