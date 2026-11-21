import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Users,
  UserPlus,
  Shield,
  Phone,
  Mail,
  Activity,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  Radio,
  Camera,
  ShieldAlert,
  FileSearch,
} from 'lucide-react';
import { apiFetch, resizeImageToAvatarDataUrl } from '../lib/api';
import { BrandLoader } from './BrandLoader';
import { AdminIcon3D } from './AdminIcon3D';
import { AuditLogsPanel } from './AuditLogsPanel';

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'gestor' | 'agente' | 'visualizador';
  jobTitle?: string;
  whatsapp?: string;
  avatarUrl?: string;
  notifyWhatsapp?: boolean;
  active: boolean;
  permissions?: string[];
  onlineStatus?: 'online' | 'away' | 'offline';
  activeTab?: string;
  lastSeenAt?: string | null;
  createdAt?: string;
}

const ROLE_OPTIONS = [
  {
    id: 'admin',
    label: 'Administrador Geral',
    badge: 'border-brand/40 bg-brand/15 text-brand',
    desc: 'Controlo total, vê tudo, partilha contactos/atendimentos e monitoriza equipa online.',
  },
  {
    id: 'gestor',
    label: 'Gestor Comercial',
    badge: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
    desc: 'Gere os seus contactos, campanhas, tarefas e atendimentos atribuídos.',
  },
  {
    id: 'agente',
    label: 'Agente / Operador',
    badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    desc: 'Vê exclusivamente os seus contactos e mensagens/SMS partilhados pelo Admin.',
  },
  {
    id: 'visualizador',
    label: 'Consultor (Leitura)',
    badge: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    desc: 'Acesso limitado apenas aos itens atribuídos.',
  },
] as const;

const TAB_NAMES: Record<string, string> = {
  dashboard: 'Visão Geral',
  calendar: 'Calendário',
  tasks: 'Tarefas & Processos',
  files: 'Arquivos Digitais',
  crm: 'CRM & Contactos',
  submissions: 'Formulários Portal',
  support: 'Atendimento',
  broadcast: 'Disparo em Massa',
  news: 'Notícias',
  team: 'Equipa',
  portfolio: 'Portfólio',
  settings: 'Definições',
  profile: 'Meu Perfil',
  users: 'Utilizadores & Acessos',
};

export function UsersManager() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SystemUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [viewMode, setViewMode] = useState<'users' | 'audit'>('users');
  const [auditTargetUserId, setAuditTargetUserId] = useState<string>('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'agente' as SystemUser['role'],
    jobTitle: '',
    whatsapp: '',
    avatarUrl: '',
    active: true,
  });

  const loadUsers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; users: SystemUser[] }>('/api/v1/admin/users');
      if (res.success && Array.isArray(res.users)) {
        setUsers(res.users);
      }
    } catch (err) {
      if (!silent) {
        setNotice({
          type: 'error',
          text: err instanceof Error ? err.message : 'Sem permissão ou erro ao listar utilizadores.',
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers(false);
    const id = setInterval(() => loadUsers(true), 10000);
    return () => clearInterval(id);
  }, [loadUsers]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      email: '',
      password: '',
      role: 'agente',
      jobTitle: '',
      whatsapp: '',
      avatarUrl: '',
      active: true,
    });
    setModalOpen(true);
  };

  const openEdit = (u: SystemUser) => {
    setEditing(u);
    setForm({
      name: u.name || '',
      email: u.email || '',
      password: '',
      role: u.role || 'agente',
      jobTitle: u.jobTitle || '',
      whatsapp: u.whatsapp || '',
      avatarUrl: u.avatarUrl || '',
      active: u.active !== false,
    });
    setModalOpen(true);
  };

  const handleUserPhotoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const dataUrl = await resizeImageToAvatarDataUrl(file, 240);
      setForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
    } catch {
      // ignore
    } finally {
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setSaving(true);
    try {
      if (editing) {
        const res = await apiFetch<{ success: boolean; message?: string }>(
          `/api/v1/admin/users/${editing.id}`,
          {
            method: 'PUT',
            body: JSON.stringify({
              name: form.name.trim(),
              email: form.email.trim(),
              role: form.role,
              jobTitle: form.jobTitle.trim(),
              whatsapp: form.whatsapp.trim(),
              avatarUrl: form.avatarUrl,
              active: form.active,
              password: form.password.trim() || undefined,
            }),
          }
        );
        setNotice({ type: 'success', text: res.message || 'Utilizador atualizado.' });
      } else {
        const res = await apiFetch<{ success: boolean; message?: string }>('/api/v1/admin/users', {
          method: 'POST',
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password.trim(),
            role: form.role,
            jobTitle: form.jobTitle.trim(),
            whatsapp: form.whatsapp.trim(),
            avatarUrl: form.avatarUrl,
          }),
        });
        setNotice({ type: 'success', text: res.message || 'Utilizador criado com sucesso.' });
      }
      setModalOpen(false);
      await loadUsers(false);
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro ao guardar utilizador.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: SystemUser) => {
    if (u.id === 'usr_admin_root') return;
    if (!window.confirm(`Eliminar o utilizador "${u.name}" (${u.email})?`)) return;
    try {
      await apiFetch(`/api/v1/admin/users/${u.id}`, { method: 'DELETE' });
      setNotice({ type: 'success', text: `Utilizador "${u.name}" eliminado.` });
      await loadUsers(false);
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Falha ao eliminar utilizador.',
      });
    }
  };

  const onlineUsers = users.filter((u) => u.onlineStatus === 'online');
  const awayUsers = users.filter((u) => u.onlineStatus === 'away');

  if (viewMode === 'audit') {
    return (
      <AuditLogsPanel
        users={users}
        initialUserId={auditTargetUserId}
        onBack={() => {
          setAuditTargetUserId('');
          setViewMode('users');
        }}
      />
    );
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2.5">
            <AdminIcon3D name="shield" size={26} />
            <span>Utilizadores &amp; Acessos</span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setAuditTargetUserId('');
              setViewMode('audit');
            }}
            className="btn btn-secondary"
            title="Abrir página de Auditoria & Logs de todos os utilizadores"
          >
            <ShieldAlert className="h-4 w-4 text-brand" />
            <span>Auditoria & Logs</span>
          </button>
          <button type="button" onClick={() => loadUsers(false)} disabled={loading} className="btn btn-secondary">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
          <button type="button" onClick={openCreate} className="btn btn-primary">
            <UserPlus className="h-4 w-4" />
            <span>Adicionar Perfil</span>
          </button>
        </div>
      </div>

      {/* KPIs + Monitorização em Tempo Real com Ícones 3D */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="group ds-card ds-card-interactive p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold ds-muted">Online Agora</p>
            <p className="text-2xl font-mono font-semibold text-emerald-400 mt-1">{onlineUsers.length}</p>
          </div>
          <AdminIcon3D name="radio" size={36} />
        </div>
        <div className="group ds-card ds-card-interactive p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold ds-muted">Ausentes</p>
            <p className="text-2xl font-mono font-semibold text-amber-400 mt-1">{awayUsers.length}</p>
          </div>
          <AdminIcon3D name="clock" size={36} />
        </div>
        <div className="group ds-card ds-card-interactive p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold ds-muted">Total de Perfis</p>
            <p className="text-2xl font-mono font-semibold mt-1">{users.length}</p>
          </div>
          <AdminIcon3D name="users" size={36} />
        </div>
        <div className="group ds-card ds-card-interactive p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold ds-muted">Administradores</p>
            <p className="text-2xl font-mono font-semibold mt-1">
              {users.filter((u) => u.role === 'admin').length}
            </p>
          </div>
          <AdminIcon3D name="shield" size={36} />
        </div>
      </div>

      {notice && (
        <div
          className={`flex items-center gap-2 px-4 py-2.5 border text-xs ${
            notice.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Faixa Ao Vivo: Quem está a trabalhar agora */}
      <div className="ds-card p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Equipa Online em Tempo Real (atualização automática a cada 10s)</span>
          </p>
          <span className="text-[11px] font-mono ds-muted">{onlineUsers.length} ativo(s)</span>
        </div>
        {onlineUsers.length === 0 ? (
          <p className="text-xs ds-muted">Nenhum utilizador ativo detetado nos últimos 45 segundos.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {onlineUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-2.5 px-3 py-2 border border-emerald-500/30 bg-emerald-500/5 text-xs"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <div>
                  <p className="font-semibold leading-tight">{u.name}</p>
                  <p className="text-[10px] ds-muted">
                    A trabalhar em: <strong>{TAB_NAMES[u.activeTab || 'dashboard'] || u.activeTab}</strong>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabela de Utilizadores */}
      <div className="ds-card overflow-hidden">
        <div className="ds-card-header">
          <div>
            <h2 className="ds-title">Perfis & Níveis de Acesso</h2>
            <p className="ds-subtitle">
              Cada utilizador vê apenas os seus próprios contactos e atendimentos, exceto Administradores (que têm acesso total e podem partilhar itens)
            </p>
          </div>
        </div>
        {loading && users.length === 0 ? (
          <BrandLoader size="md" />
        ) : (
          <div className="overflow-x-auto">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Utilizador</th>
                  <th>Nível de Acesso</th>
                  <th>WhatsApp (Alertas)</th>
                  <th>Estado Ao Vivo</th>
                  <th>Módulo Atual</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const roleMeta = ROLE_OPTIONS.find((r) => r.id === u.role) || ROLE_OPTIONS[2];
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="relative h-8 w-8 rounded-full shrink-0">
                            {u.avatarUrl ? (
                              <img
                                src={u.avatarUrl}
                                alt={u.name}
                                className="h-8 w-8 rounded-full object-cover border ds-divider"
                              />
                            ) : (
                              <span className="h-8 w-8 rounded-full ds-surface-2 border ds-divider flex items-center justify-center text-[10px] font-mono font-semibold">
                                {u.name
                                  .split(/\s+/)
                                  .slice(0, 2)
                                  .map((p) => p[0])
                                  .join('')
                                  .toUpperCase()}
                              </span>
                            )}
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[rgb(var(--surface))] ${
                                u.onlineStatus === 'online'
                                  ? 'bg-emerald-500'
                                  : u.onlineStatus === 'away'
                                  ? 'bg-amber-400'
                                  : 'bg-zinc-600'
                              }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-xs flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {u.active === false && (
                                <span className="text-[10px] text-rose-400 font-mono uppercase">(Inativo)</span>
                              )}
                            </p>
                            <p className="text-[11px] ds-muted flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {u.email}
                              {u.jobTitle ? ` · ${u.jobTitle}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase border ${roleMeta.badge}`}>
                          {roleMeta.label}
                        </span>
                      </td>
                      <td className="font-mono text-xs ds-muted">
                        {u.whatsapp ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400">
                            <Phone className="h-3 w-3" /> {u.whatsapp}
                          </span>
                        ) : (
                          <span className="text-amber-400 text-[11px]">Não configurado</span>
                        )}
                      </td>
                      <td className="text-xs">
                        {u.onlineStatus === 'online' ? (
                          <span className="text-emerald-400 font-medium">Online agora</span>
                        ) : u.onlineStatus === 'away' ? (
                          <span className="text-amber-400">Ausente</span>
                        ) : (
                          <span className="ds-subtle">
                            {u.lastSeenAt
                              ? `Visto ${new Date(u.lastSeenAt).toLocaleTimeString('pt-PT', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}`
                              : 'Offline'}
                          </span>
                        )}
                      </td>
                      <td className="text-xs ds-muted">
                        {u.onlineStatus === 'online' || u.onlineStatus === 'away'
                          ? TAB_NAMES[u.activeTab || 'dashboard'] || u.activeTab
                          : '—'}
                      </td>
                      <td className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setAuditTargetUserId(u.id);
                              setViewMode('audit');
                            }}
                            className="btn btn-ghost btn-icon h-7 w-7 text-brand"
                            title={`Ver logs de auditoria de ${u.name}`}
                          >
                            <FileSearch className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(u)}
                            className="btn btn-ghost btn-icon h-7 w-7"
                            title="Editar perfil e nível de acesso"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          {u.id !== 'usr_admin_root' && (
                            <button
                              type="button"
                              onClick={() => handleDelete(u)}
                              className="btn btn-ghost btn-icon h-7 w-7 text-rose-400 hover:text-rose-300"
                              title="Eliminar utilizador"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Adicionar / Editar Perfil */}
      {modalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4">
            <div
              className="ds-card w-full max-w-lg border ds-divider shadow-2xl"
              style={{ backgroundColor: 'rgb(var(--surface))' }}
            >
              <div className="px-5 py-4 border-b ds-divider flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">
                    {editing ? `Editar Perfil · ${editing.name}` : 'Adicionar Novo Perfil de Utilizador'}
                  </h3>
                  <p className="text-[11px] ds-muted">
                    Defina credenciais, nível de acesso e número de WhatsApp para notificações
                  </p>
                </div>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost btn-icon h-7 w-7">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Foto de Perfil do Utilizador */}
                <div className="flex items-center gap-4 pb-3 border-b ds-divider">
                  {form.avatarUrl ? (
                    <img
                      src={form.avatarUrl}
                      alt={form.name || 'Foto'}
                      className="h-14 w-14 rounded-full object-cover border-2 border-brand/40 shrink-0"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full ds-surface-2 border ds-divider flex items-center justify-center text-sm font-mono font-semibold text-brand shrink-0">
                      {(form.name || 'U')
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((p) => p[0])
                        .join('')
                        .toUpperCase()}
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium">Foto de Perfil</p>
                    <div className="flex items-center gap-2">
                      <label className="btn btn-secondary btn-sm h-7 text-[11px] cursor-pointer">
                        <Camera className="h-3.5 w-3.5 text-brand" />
                        <span>{form.avatarUrl ? 'Trocar Foto' : 'Carregar Foto'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUserPhotoPick}
                          className="hidden"
                        />
                      </label>
                      {form.avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, avatarUrl: '' }))}
                          className="text-[11px] text-rose-400 hover:underline"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Nome Completo *</label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Ex.: Maria Silva"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Cargo / Função</label>
                    <input
                      value={form.jobTitle}
                      onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                      placeholder="Ex.: Comercial"
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Email Corporativo *</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="maria@jogimiltecnologias.it.ao"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">WhatsApp (Notificações)</label>
                    <input
                      value={form.whatsapp}
                      onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                      placeholder="2449XXXXXXXX"
                      className="input font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Nível de Acesso *</label>
                  <select
                    value={form.role}
                    disabled={editing?.id === 'usr_admin_root'}
                    onChange={(e) => setForm({ ...form, role: e.target.value as SystemUser['role'] })}
                    className="input"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] ds-muted mt-1">
                    {ROLE_OPTIONS.find((r) => r.id === form.role)?.desc}
                  </p>
                </div>

                <div>
                  <label className="label">
                    {editing ? 'Nova Palavra-passe (opcional)' : 'Palavra-passe Inicial *'}
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ds-subtle" />
                    <input
                      type="password"
                      required={!editing}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder={editing ? 'Deixe vazio para manter atual' : 'Mínimo 4 caracteres'}
                      className="input pl-9"
                    />
                  </div>
                </div>

                {editing && editing.id !== 'usr_admin_root' && (
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => setForm({ ...form, active: e.target.checked })}
                      className="h-4 w-4 accent-[rgb(var(--brand))]"
                    />
                    <span>Conta ativa (pode iniciar sessão no sistema)</span>
                  </label>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t ds-divider">
                  <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving} className="btn btn-primary">
                    {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                    <span>{editing ? 'Guardar Alterações' : 'Criar Perfil'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
