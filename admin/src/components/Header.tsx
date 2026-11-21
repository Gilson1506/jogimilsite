import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
  Bell,
  MessageSquare,
  Mail,
  Inbox,
  CheckCheck,
  Volume2,
  VolumeX,
  UserCircle2,
  ShieldCheck,
  Radio,
  MessageSquareText,
} from 'lucide-react';
import { apiFetch, getSessionUser } from '../lib/api';
import { isSoundEnabled, playMessageSound, setSoundEnabled } from '../lib/sound';

interface NotificationItem {
  id: string;
  ticketId?: string;
  type: 'whatsapp' | 'email' | 'portal';
  tab: string;
  title: string;
  description: string;
  timestamp: string;
}

interface OnlineColleague {
  id: string;
  name: string;
  email: string;
  role: string;
  jobTitle?: string;
  avatarUrl?: string;
  onlineStatus: 'online' | 'away' | 'offline';
  activeTab?: string;
  lastSeenAt?: string | null;
}

interface HeaderProps {
  theme?: 'dark' | 'light';
  activeTab?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  userAvatar?: string;
  onSetTheme?: (theme: 'dark' | 'light') => void;
  onOpenTab?: (tab: string) => void;
  onOpenInternalChat?: (peerId?: string) => void;
  onLogout?: () => void;
}

const TAB_TITLES: Record<string, { section: string; title: string }> = {
  dashboard: { section: 'Operação', title: 'Visão Geral' },
  calendar: { section: 'Operação', title: 'Calendário' },
  tasks: { section: 'Operação', title: 'Tarefas & Processos' },
  files: { section: 'Operação', title: 'Arquivos Digitais' },
  crm: { section: 'Comunicação & Leads', title: 'CRM & Contactos' },
  submissions: { section: 'Comunicação & Leads', title: 'Formulários do Portal' },
  support: { section: 'Comunicação & Leads', title: 'Atendimento' },
  broadcast: { section: 'Comunicação & Leads', title: 'Disparo em Massa' },
  internal_chat: { section: 'Comunicação & Leads', title: 'Comunicação Interna' },
  products: { section: 'Conteúdo do Website', title: 'Produtos' },
  news: { section: 'Conteúdo do Website', title: 'Notícias' },
  team: { section: 'Conteúdo do Website', title: 'Equipa' },
  portfolio: { section: 'Conteúdo do Website', title: 'Portfólio' },
  profile: { section: 'Sistema & Conta', title: 'Meu Perfil' },
  users: { section: 'Sistema & Conta', title: 'Utilizadores & Acessos' },
  settings: { section: 'Sistema & Conta', title: 'Definições & Canais' },
};

const MOBILE_TABS = [
  { id: 'dashboard', label: 'Visão Geral' },
  { id: 'calendar', label: 'Calendário' },
  { id: 'tasks', label: 'Tarefas & Processos' },
  { id: 'files', label: 'Arquivos Digitais' },
  { id: 'crm', label: 'CRM & Contactos' },
  { id: 'submissions', label: 'Formulários Portal' },
  { id: 'support', label: 'Atendimento' },
  { id: 'broadcast', label: 'Disparo em Massa' },
  { id: 'internal_chat', label: 'Comunicação Interna' },
  { id: 'products', label: 'Produtos' },
  { id: 'news', label: 'Notícias' },
  { id: 'team', label: 'Equipa' },
  { id: 'portfolio', label: 'Portfólio' },
  { id: 'settings', label: 'Definições & Canais' },
];

const READ_STORAGE_KEY = 'jogimil_admin_read_notifs';

function loadReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(ids).slice(-200)));
  } catch {
    // ignore
  }
}

export function Header({
  theme = 'dark',
  activeTab = 'dashboard',
  userName = 'Joel Gaspar',
  userEmail = 'admin@jogimiltecnologias.it.ao',
  userRole = 'admin',
  userAvatar = '',
  onSetTheme,
  onOpenTab,
  onOpenInternalChat,
  onLogout,
}: HeaderProps) {
  const isAdmin = userRole === 'admin' || userRole === 'Administrador Executivo';
  const currentSessionUser = getSessionUser();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [userAvatar]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [presenceOpen, setPresenceOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => loadReadIds());
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [teamPresence, setTeamPresence] = useState<OnlineColleague[]>([]);
  const [unreadInternal, setUnreadInternal] = useState<number>(0);

  useEffect(() => {
    const loadPresenceAndChat = () => {
      apiFetch<{ success: boolean; onlineCount?: number; users?: OnlineColleague[] }>(
        '/api/v1/admin/users/online'
      )
        .then((r) => {
          if (typeof r.onlineCount === 'number') setOnlineCount(r.onlineCount);
          if (Array.isArray(r.users)) setTeamPresence(r.users);
        })
        .catch(() => {});

      apiFetch<{ success: boolean; unreadTotal?: number }>('/api/v1/admin/internal-chat/messages')
        .then((r) => {
          if (typeof r.unreadTotal === 'number') setUnreadInternal(r.unreadTotal);
        })
        .catch(() => {});
    };
    loadPresenceAndChat();
    const id = setInterval(loadPresenceAndChat, 10000);
    return () => clearInterval(id);
  }, []);

  const knownIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiFetch<{ success: boolean; notifications: NotificationItem[] }>(
        '/api/v1/admin/notifications'
      );
      const list = res.notifications || [];
      setNotifications(list);

      if (!initializedRef.current) {
        list.forEach((n) => knownIdsRef.current.add(n.id));
        initializedRef.current = true;
      } else {
        let hasBrandNew = false;
        for (const n of list) {
          if (!knownIdsRef.current.has(n.id)) {
            knownIdsRef.current.add(n.id);
            hasBrandNew = true;
          }
        }
        if (hasBrandNew) {
          playMessageSound();
        }
      }
    } catch {
      // ignore offline
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 10000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveReadIds(next);
      return next;
    });
  };

  const markAllAsRead = () => {
    setReadIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      saveReadIds(next);
      return next;
    });
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playMessageSound();
  };

  const current = TAB_TITLES[activeTab] || TAB_TITLES.dashboard;

  return (
    <header
      className="h-14 shrink-0 border-b ds-divider px-4 sm:px-6 flex items-center justify-between gap-4 relative z-30 select-none"
      style={{ backgroundColor: 'rgb(var(--surface))' }}
    >
      {/* Esquerda: Menu Mobile + Breadcrumb limpo */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => setMobileMenu(!mobileMenu)}
          className="md:hidden btn btn-ghost btn-icon h-8 w-8"
          aria-label="Menu"
        >
          {mobileMenu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>

        <div className="flex items-center gap-2 text-xs min-w-0">
          <span className="hidden sm:inline ds-subtle uppercase tracking-[0.1em] font-semibold text-[10px]">
            {current.section}
          </span>
          <span className="hidden sm:inline ds-subtle">/</span>
          <h2 className="text-[13px] font-semibold tracking-tight truncate">{current.title}</h2>
        </div>
      </div>

      {/* Direita: Alternador de Tema Simplificado + Notificações + Definições + Perfil */}
      <div className="flex items-center gap-2">
        {/* Ícone de Modo Claro / Escuro Simplificado */}
        <button
          type="button"
          onClick={() => onSetTheme?.(theme === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          aria-label="Alternar tema"
          className="btn btn-ghost btn-icon h-8 w-8"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Sino de Notificações em Tempo Real */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen(!notifOpen);
              setUserMenu(false);
            }}
            title="Notificações em tempo real"
            className="btn btn-ghost btn-icon h-8 w-8 relative"
            aria-label="Notificações"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-rose-600 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 ds-card shadow-2xl z-50 animate-fadeIn">
              <div className="px-4 py-3 border-b ds-divider flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-brand" />
                  <span className="text-xs font-semibold">Notificações</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-rose-500/15 text-rose-400">
                      {unreadCount} nova(s)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={toggleSound}
                    title={soundOn ? 'Desativar som de mensagens' : 'Ativar som de mensagens'}
                    className="btn btn-ghost btn-icon h-7 w-7"
                  >
                    {soundOn ? <Volume2 className="h-3.5 w-3.5 text-emerald-500" /> : <VolumeX className="h-3.5 w-3.5 ds-subtle" />}
                  </button>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      title="Marcar todas como lidas"
                      className="btn btn-ghost btn-sm h-7 text-[11px]"
                    >
                      <CheckCheck className="h-3.5 w-3.5" /> Lidas
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y ds-divider">
                {notifications.length === 0 ? (
                  <p className="text-xs ds-muted text-center py-8 px-4">
                    Sem novas mensagens ou pedidos no momento.
                  </p>
                ) : (
                  notifications.map((n) => {
                    const isUnread = !readIds.has(n.id);
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          markAsRead(n.id);
                          setNotifOpen(false);
                          onOpenTab?.(n.tab);
                        }}
                        className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-[rgb(var(--surface-2))] ${
                          isUnread ? 'border-l-2 border-l-brand ds-surface-2' : ''
                        }`}
                      >
                        <span className="mt-0.5 shrink-0">
                          {n.type === 'whatsapp' ? (
                            <MessageSquare className="h-4 w-4 text-emerald-500" />
                          ) : n.type === 'email' ? (
                            <Mail className="h-4 w-4 text-brand" />
                          ) : (
                            <Inbox className="h-4 w-4 text-sky-400" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold truncate">{n.title}</p>
                            <span className="text-[10px] font-mono ds-subtle shrink-0">
                              {n.timestamp
                                ? new Date(n.timestamp).toLocaleTimeString('pt-PT', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                            </span>
                          </div>
                          <p className="text-[11px] ds-muted line-clamp-2 mt-0.5">{n.description}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Estado Online da Equipa (visível a TODOS, sem borda no sinal) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setPresenceOpen((prev) => !prev);
              setNotifOpen(false);
              setUserMenu(false);
            }}
            title="Ver estado online da equipa em tempo real"
            className="inline-flex items-center gap-1.5 h-8 px-2 text-emerald-400 text-xs font-mono hover:opacity-85 transition-opacity"
          >
            <Radio className="h-4 w-4 animate-pulse shrink-0" />
            <span className="hidden sm:inline">{onlineCount} online</span>
          </button>

          {presenceOpen && (
            <div
              className="absolute right-0 mt-2 w-80 ds-card shadow-2xl z-50 overflow-hidden"
              onMouseLeave={() => setPresenceOpen(false)}
            >
              <div className="px-4 py-3 border-b ds-divider flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold">Equipa em Tempo Real</p>
                  <p className="text-[11px] ds-muted">
                    {onlineCount} online de {teamPresence.length} utilizador(es)
                  </p>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setPresenceOpen(false);
                      onOpenTab?.('users');
                    }}
                    className="text-[11px] text-brand hover:underline"
                  >
                    Gerir perfis
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y ds-divider">
                {teamPresence.length === 0 ? (
                  <p className="text-xs ds-muted text-center py-6">A carregar estado da equipa...</p>
                ) : (
                  teamPresence.map((u) => {
                    const isSelf = u.id === currentSessionUser?.id;
                    const dotColor =
                      u.onlineStatus === 'online'
                        ? 'bg-emerald-500'
                        : u.onlineStatus === 'away'
                        ? 'bg-amber-400'
                        : 'bg-zinc-600';
                    const statusLabel =
                      u.onlineStatus === 'online'
                        ? 'Online'
                        : u.onlineStatus === 'away'
                        ? 'Ausente'
                        : 'Offline';
                    return (
                      <div key={u.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
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
                              className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[rgb(var(--surface))] ${dotColor}`}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate">
                              {u.name} {isSelf && <span className="text-[10px] ds-subtle font-normal">(Você)</span>}
                            </p>
                            <p className="text-[10px] ds-muted truncate">
                              {statusLabel}
                              {u.onlineStatus === 'online' && u.activeTab
                                ? ` · ${TAB_TITLES[u.activeTab]?.title?.split('·')[0].trim() || u.activeTab}`
                                : u.jobTitle
                                ? ` · ${u.jobTitle}`
                                : ''}
                            </p>
                          </div>
                        </div>
                        {!isSelf && (
                          <button
                            type="button"
                            onClick={() => {
                              setPresenceOpen(false);
                              if (onOpenInternalChat) onOpenInternalChat(u.id);
                              else onOpenTab?.('internal_chat');
                            }}
                            className="btn btn-ghost btn-sm h-7 px-2 text-[11px] text-brand shrink-0"
                            title={`Enviar mensagem interna para ${u.name}`}
                          >
                            <MessageSquareText className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="px-4 py-2.5 border-t ds-divider ds-surface-2 flex justify-between items-center">
                <span className="text-[10px] ds-muted">Chat corporativo interno</span>
                <button
                  type="button"
                  onClick={() => {
                    setPresenceOpen(false);
                    if (onOpenInternalChat) onOpenInternalChat(undefined);
                    else onOpenTab?.('internal_chat');
                  }}
                  className="text-[11px] font-semibold text-brand hover:underline"
                >
                  Abrir Comunicação Interna →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Atalho Comunicação Interna */}
        <button
          type="button"
          onClick={() => {
            if (onOpenInternalChat) onOpenInternalChat(undefined);
            else onOpenTab?.('internal_chat');
          }}
          title="Comunicação Interna da Equipa"
          className="relative btn btn-ghost btn-icon h-8 w-8"
        >
          <MessageSquareText className="h-4 w-4" />
          {unreadInternal > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-brand text-white text-[10px] font-mono font-bold flex items-center justify-center">
              {unreadInternal > 9 ? '9+' : unreadInternal}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onOpenTab?.('settings')}
          title="Definições"
          className="btn btn-ghost btn-icon h-8 w-8"
        >
          <Settings className="h-4 w-4" />
        </button>

        {/* Perfil */}
        <div className="relative pl-3 border-l ds-divider">
          <button
            type="button"
            onClick={() => {
              setUserMenu(!userMenu);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2.5 text-left hover:opacity-90 transition"
          >
            {userAvatar && !avatarError ? (
              <img
                src={userAvatar}
                alt={userName}
                onError={() => setAvatarError(true)}
                className="h-8 w-8 rounded-full object-cover border ds-divider shrink-0"
              />
            ) : (
              <span className="h-8 w-8 rounded-full border ds-divider ds-surface-2 flex items-center justify-center text-[11px] font-mono font-semibold shrink-0">
                {(userName || 'AD')
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join('')
                  .toUpperCase()}
              </span>
            )}
            <div className="hidden sm:block min-w-0 max-w-[150px]">
              <p className="text-xs font-semibold leading-tight truncate">{userName}</p>
              <p className="text-[10px] ds-muted leading-tight truncate">{userEmail}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 ds-muted hidden sm:block shrink-0" />
          </button>

          {userMenu && (
            <div
              className="absolute right-0 mt-2 w-52 ds-card shadow-xl py-1 z-50"
              onMouseLeave={() => setUserMenu(false)}
            >
              <div className="px-3 py-2 border-b ds-divider">
                <p className="text-xs font-semibold truncate">{userName}</p>
                <p className="text-[11px] ds-muted truncate">{userEmail}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUserMenu(false);
                  onOpenTab?.('profile');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs ds-muted hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-2))]"
              >
                <UserCircle2 className="h-3.5 w-3.5 text-brand" /> Meu Perfil & WhatsApp
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setUserMenu(false);
                    onOpenTab?.('users');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs ds-muted hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-2))]"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Utilizadores & Acessos
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setUserMenu(false);
                  onOpenTab?.('settings');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs ds-muted hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-2))]"
              >
                <Settings className="h-3.5 w-3.5" /> Definições & Canais
              </button>
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    setUserMenu(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-500 hover:bg-[rgb(var(--surface-2))]"
                >
                  <LogOut className="h-3.5 w-3.5" /> Terminar Sessão
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Menu Mobile */}
      {mobileMenu && (
        <div
          className="md:hidden absolute top-14 left-0 right-0 border-b ds-divider p-2 z-40 shadow-xl"
          style={{ backgroundColor: 'rgb(var(--surface))' }}
        >
          <div className="grid grid-cols-2 gap-1">
            {MOBILE_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onOpenTab?.(t.id);
                  setMobileMenu(false);
                }}
                className={`px-3 py-2 text-left text-xs font-medium ${
                  activeTab === t.id ? 'ds-surface-2 text-brand border-l-2 border-brand' : 'ds-muted'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
