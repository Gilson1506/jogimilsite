import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminIcon3D } from './AdminIcon3D';
import {
  MessageSquareText,
  Hash,
  SendHorizontal,
  Search,
  RefreshCw,
  Users,
  CheckCheck,
  Shield,
  FolderOpen,
  Paperclip,
  X,
  FileText,
  Info,
  Mail,
  Briefcase,
  Circle,
  ExternalLink,
} from 'lucide-react';
import { apiFetch, getSessionUser } from '../lib/api';
import { playMessageSound } from '../lib/sound';
import { BrandLoader } from './BrandLoader';
import { DigitalFilePickerModal } from './DigitalFilePickerModal';
import type { DigitalFileItem } from './DigitalFilesManager';

interface Colleague {
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

interface InternalAttachment {
  name: string;
  type: string;
  size: number;
  url?: string;
  digitalFileId?: string | null;
}

interface InternalMessage {
  id: string;
  channel: 'general' | 'comercial' | 'suporte' | 'direct';
  senderId: string;
  senderName: string;
  senderRole?: string;
  recipientId?: string | null;
  recipientName?: string;
  content: string;
  attachments?: InternalAttachment[];
  readBy?: string[];
  createdAt: string;
}

interface InternalChatProps {
  initialPeerId?: string | null;
  onClearInitialPeer?: () => void;
}

const CORPORATE_CHANNELS = [
  {
    id: 'general' as const,
    name: 'Geral da Equipa',
    desc: 'Comunicados oficiais e alinhamento de toda a empresa',
  },
  {
    id: 'comercial' as const,
    name: 'Comercial & Leads',
    desc: 'Propostas, negociações e coordenação de vendas CRM',
  },
  {
    id: 'suporte' as const,
    name: 'Operações & Suporte',
    desc: 'Acompanhamento de atendimentos, entregas e tickets',
  },
];

const TAB_LABELS: Record<string, string> = {
  dashboard: 'Visão Geral',
  calendar: 'Calendário',
  tasks: 'Tarefas & Processos',
  files: 'Arquivos Digitais',
  crm: 'CRM & Contactos',
  submissions: 'Formulários Portal',
  support: 'Atendimento',
  broadcast: 'Disparo em Massa',
  internal_chat: 'Comunicação Interna',
  news: 'Notícias',
  team: 'Equipa',
  portfolio: 'Portfólio',
  profile: 'Meu Perfil',
  users: 'Utilizadores & Acessos',
  settings: 'Definições',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  gestor: 'Gestor',
  agente: 'Agente',
  visualizador: 'Consultor',
};

function formatDateHeading(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return 'Hoje';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Ontem';
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatBytes(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UserAvatar({
  name,
  avatarUrl,
  status,
  size = 'md',
}: {
  name: string;
  avatarUrl?: string;
  status?: 'online' | 'away' | 'offline';
  size?: 'sm' | 'md' | 'lg';
}) {
  const dim =
    size === 'lg' ? 'h-14 w-14 text-base' : size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-[11px]';
  const dotDim = size === 'lg' ? 'h-3.5 w-3.5' : size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5';
  const dotColor =
    status === 'online' ? 'bg-emerald-500' : status === 'away' ? 'bg-amber-400' : 'bg-zinc-600';
  const initials = (name || 'U')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return (
    <div className={`relative rounded-full shrink-0 ${dim}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className={`rounded-full object-cover border ds-divider ${dim}`}
        />
      ) : (
        <div
          className={`rounded-full ds-surface-2 border ds-divider flex items-center justify-center font-mono font-semibold text-brand ${dim}`}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-[rgb(var(--surface))] ${dotDim} ${dotColor}`}
        />
      )}
    </div>
  );
}

export function InternalChat({ initialPeerId, onClearInitialPeer }: InternalChatProps) {
  const me = getSessionUser();
  const [currentUserId, setCurrentUserId] = useState<string>(me?.id || 'usr_admin_root');
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [unreadByChannel, setUnreadByChannel] = useState<Record<string, number>>({});
  const [unreadByUser, setUnreadByUser] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [activeRoom, setActiveRoom] = useState<
    { type: 'channel'; channelId: 'general' | 'comercial' | 'suporte' } | { type: 'direct'; peerId: string }
  >({ type: 'channel', channelId: 'general' });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online'>('all');
  const [msgSearch, setMsgSearch] = useState('');
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [draft, setDraft] = useState('');
  const [attachments, setAttachments] = useState<InternalAttachment[]>([]);
  const [filePickerOpen, setFilePickerOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const firstLoadRef = useRef(true);

  useEffect(() => {
    if (initialPeerId && initialPeerId !== currentUserId) {
      setActiveRoom({ type: 'direct', peerId: initialPeerId });
      onClearInitialPeer?.();
    }
  }, [initialPeerId, currentUserId, onClearInitialPeer]);

  const loadChat = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await apiFetch<{
          success: boolean;
          currentUserId: string;
          messages: InternalMessage[];
          colleagues: Colleague[];
          unreadByChannel?: Record<string, number>;
          unreadByUser?: Record<string, number>;
        }>('/api/v1/admin/internal-chat/messages');

        if (res.success) {
          setCurrentUserId(res.currentUserId || me?.id || 'usr_admin_root');
          const incoming = Array.isArray(res.messages) ? res.messages : [];

          if (firstLoadRef.current) {
            incoming.forEach((m) => knownIdsRef.current.add(m.id));
            firstLoadRef.current = false;
          } else {
            let hasNewFromColleague = false;
            for (const m of incoming) {
              if (!knownIdsRef.current.has(m.id)) {
                knownIdsRef.current.add(m.id);
                if (m.senderId !== (res.currentUserId || me?.id)) {
                  hasNewFromColleague = true;
                }
              }
            }
            if (hasNewFromColleague) {
              playMessageSound();
            }
          }

          setMessages(incoming);
          setColleagues(Array.isArray(res.colleagues) ? res.colleagues : []);
          setUnreadByChannel(res.unreadByChannel || {});
          setUnreadByUser(res.unreadByUser || {});
        }
      } catch {
        // ignore
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [me?.id]
  );

  useEffect(() => {
    loadChat(false);
    const id = setInterval(() => loadChat(true), 3500);
    return () => clearInterval(id);
  }, [loadChat]);

  // Marcar como lidas quando abre a sala
  useEffect(() => {
    const payload =
      activeRoom.type === 'channel'
        ? { channel: activeRoom.channelId }
        : { channel: 'direct', peerId: activeRoom.peerId };
    apiFetch('/api/v1/admin/internal-chat/read', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
      .then(() => {
        if (activeRoom.type === 'channel') {
          setUnreadByChannel((prev) => ({ ...prev, [activeRoom.channelId]: 0 }));
        } else {
          setUnreadByUser((prev) => ({ ...prev, [activeRoom.peerId]: 0 }));
        }
      })
      .catch(() => {});
  }, [activeRoom, messages.length]);

  const colleagueMap = useMemo(() => {
    const map: Record<string, Colleague> = {};
    for (const c of colleagues) map[c.id] = c;
    return map;
  }, [colleagues]);

  const otherColleagues = useMemo(() => {
    const q = search.trim().toLowerCase();
    return colleagues
      .filter((c) => c.id !== currentUserId)
      .filter((c) => (statusFilter === 'online' ? c.onlineStatus === 'online' : true))
      .filter((c) => !q || `${c.name} ${c.jobTitle || ''} ${c.email}`.toLowerCase().includes(q))
      .sort((a, b) => {
        const order = { online: 0, away: 1, offline: 2 };
        return (order[a.onlineStatus] ?? 2) - (order[b.onlineStatus] ?? 2);
      });
  }, [colleagues, currentUserId, search, statusFilter]);

  const activePeer = useMemo(() => {
    if (activeRoom.type !== 'direct') return null;
    return colleagues.find((c) => c.id === activeRoom.peerId) || null;
  }, [activeRoom, colleagues]);

  const activeChannelMeta = useMemo(() => {
    if (activeRoom.type !== 'channel') return null;
    return CORPORATE_CHANNELS.find((ch) => ch.id === activeRoom.channelId) || CORPORATE_CHANNELS[0];
  }, [activeRoom]);

  const roomMessages = useMemo(() => {
    const base =
      activeRoom.type === 'channel'
        ? messages.filter((m) => m.channel === activeRoom.channelId)
        : messages.filter(
            (m) =>
              m.channel === 'direct' &&
              ((m.senderId === currentUserId && m.recipientId === activeRoom.peerId) ||
                (m.senderId === activeRoom.peerId && m.recipientId === currentUserId))
          );

    const q = msgSearch.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (m) =>
        m.content.toLowerCase().includes(q) ||
        m.senderName.toLowerCase().includes(q) ||
        (m.attachments || []).some((a) => a.name.toLowerCase().includes(q))
    );
  }, [messages, activeRoom, currentUserId, msgSearch]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages.length, activeRoom]);

  const submitMessage = async () => {
    if ((!draft.trim() && attachments.length === 0) || sending) return;
    setSending(true);
    try {
      const res = await apiFetch<{ success: boolean; message?: InternalMessage }>(
        '/api/v1/admin/internal-chat/messages',
        {
          method: 'POST',
          body: JSON.stringify(
            activeRoom.type === 'channel'
              ? {
                  channel: activeRoom.channelId,
                  content: draft.trim(),
                  attachments,
                }
              : {
                  channel: 'direct',
                  recipientId: activeRoom.peerId,
                  content: draft.trim(),
                  attachments,
                }
          ),
        }
      );
      if (res.success && res.message) {
        knownIdsRef.current.add(res.message.id);
        setMessages((prev) => [...prev, res.message!]);
        setDraft('');
        setAttachments([]);
      }
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  };

  const onlineCount = colleagues.filter((c) => c.onlineStatus === 'online').length;
  const canSend = (draft.trim().length > 0 || attachments.length > 0) && !sending;

  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2.5">
            <AdminIcon3D name="chat" size={26} />
            <span>Comunicação Interna</span>
          </h1>
        </div>
        <button type="button" onClick={() => loadChat(false)} disabled={loading} className="btn btn-secondary">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Workspace de Comunicação Interna */}
      <div className="grid grid-cols-1 lg:grid-cols-12 ds-card overflow-hidden h-[calc(100vh-155px)] min-h-[540px]">
        {/* Coluna Esquerda: Canais + Diretório da Equipa */}
        <div className="lg:col-span-3 border-r ds-divider flex flex-col overflow-hidden">
          <div className="p-3.5 border-b ds-divider space-y-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold uppercase tracking-wider ds-muted flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-brand" /> Equipa ({colleagues.length})
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-mono">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {onlineCount} online
              </span>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ds-subtle" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar colega..."
                className="input h-8 pl-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 border ds-divider">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`py-1 text-[11px] font-medium transition-colors ${
                  statusFilter === 'all' ? 'bg-brand text-white' : 'ds-muted hover:text-current'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('online')}
                className={`py-1 text-[11px] font-medium transition-colors ${
                  statusFilter === 'online' ? 'bg-brand text-white' : 'ds-muted hover:text-current'
                }`}
              >
                Online ({onlineCount})
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y ds-divider">
            {/* Canais Corporativos */}
            <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] ds-subtle ds-surface-2">
              Canais Corporativos
            </div>
            {CORPORATE_CHANNELS.map((ch) => {
              const isSelected = activeRoom.type === 'channel' && activeRoom.channelId === ch.id;
              const unread = unreadByChannel[ch.id] || 0;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setActiveRoom({ type: 'channel', channelId: ch.id })}
                  className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-2 transition-colors border-l-2 ${
                    isSelected
                      ? 'ds-surface-2 border-l-brand'
                      : 'border-l-transparent hover:bg-[rgb(var(--surface-2))]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Hash
                      className={`h-4 w-4 shrink-0 ${isSelected ? 'text-brand' : 'ds-muted'}`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{ch.name}</p>
                      <p className="text-[10px] ds-muted truncate">{ch.desc}</p>
                    </div>
                  </div>
                  {unread > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 bg-brand text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                      {unread}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Mensagens Diretas */}
            <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] ds-subtle ds-surface-2">
              Mensagens Diretas ({otherColleagues.length})
            </div>

            {loading && colleagues.length === 0 ? (
              <BrandLoader size="sm" />
            ) : otherColleagues.length === 0 ? (
              <p className="text-xs ds-muted text-center py-8 px-4">
                {statusFilter === 'online'
                  ? 'Nenhum colega online neste momento.'
                  : 'Nenhum outro utilizador encontrado. Adicione perfis em Utilizadores & Acessos.'}
              </p>
            ) : (
              otherColleagues.map((c) => {
                const isSelected = activeRoom.type === 'direct' && activeRoom.peerId === c.id;
                const unread = unreadByUser[c.id] || 0;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveRoom({ type: 'direct', peerId: c.id })}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-2 transition-colors border-l-2 ${
                      isSelected
                        ? 'ds-surface-2 border-l-brand'
                        : 'border-l-transparent hover:bg-[rgb(var(--surface-2))]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar name={c.name} avatarUrl={c.avatarUrl} status={c.onlineStatus} size="md" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate flex items-center gap-1.5">
                          <span>{c.name}</span>
                          <span className="text-[9px] font-mono uppercase ds-subtle">
                            {ROLE_LABELS[c.role] || c.role}
                          </span>
                        </p>
                        <p className="text-[10px] ds-muted truncate">
                          {c.onlineStatus === 'online'
                            ? `Online · ${TAB_LABELS[c.activeTab || 'dashboard'] || c.activeTab}`
                            : c.onlineStatus === 'away'
                            ? 'Ausente'
                            : c.jobTitle || 'Offline'}
                        </p>
                      </div>
                    </div>
                    {unread > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 bg-brand text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Coluna Central: Conversa Ativa */}
        <div
          className={`${
            showInfoPanel ? 'lg:col-span-6' : 'lg:col-span-9'
          } flex flex-col overflow-hidden transition-all`}
        >
          {/* Header da Sala */}
          <div className="px-5 py-3 border-b ds-divider ds-surface-2 flex items-center justify-between gap-3">
            {activeRoom.type === 'channel' && activeChannelMeta ? (
              <div className="flex items-center gap-2.5 min-w-0">
                <Hash className="h-5 w-5 text-brand shrink-0" />
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold truncate">{activeChannelMeta.name}</h2>
                  <p className="text-[11px] ds-muted truncate">{activeChannelMeta.desc}</p>
                </div>
              </div>
            ) : activePeer ? (
              <div className="flex items-center gap-3 min-w-0">
                <UserAvatar
                  name={activePeer.name}
                  avatarUrl={activePeer.avatarUrl}
                  status={activePeer.onlineStatus}
                  size="md"
                />
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold truncate flex items-center gap-1.5">
                    <span>{activePeer.name}</span>
                    {activePeer.role === 'admin' && <Shield className="h-3.5 w-3.5 text-brand" />}
                  </h2>
                  <p className="text-[11px] ds-muted truncate">
                    {activePeer.onlineStatus === 'online'
                      ? `Online agora · ${TAB_LABELS[activePeer.activeTab || 'dashboard'] || activePeer.activeTab}`
                      : activePeer.onlineStatus === 'away'
                      ? 'Ausente'
                      : 'Offline'}
                    {activePeer.jobTitle ? ` · ${activePeer.jobTitle}` : ''}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs ds-muted">Selecione uma conversa</p>
            )}

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowMsgSearch((prev) => !prev);
                  setMsgSearch('');
                }}
                title="Pesquisar nesta conversa"
                className={`btn btn-ghost btn-icon h-8 w-8 ${showMsgSearch ? 'text-brand' : ''}`}
              >
                <Search className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowInfoPanel((prev) => !prev)}
                title="Mostrar / ocultar painel de detalhes"
                className={`hidden lg:inline-flex btn btn-ghost btn-icon h-8 w-8 ${showInfoPanel ? 'text-brand' : ''}`}
              >
                <Info className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Barra de pesquisa interna na conversa */}
          {showMsgSearch && (
            <div className="px-5 py-2 border-b ds-divider flex items-center gap-2">
              <Search className="h-3.5 w-3.5 ds-subtle shrink-0" />
              <input
                type="text"
                autoFocus
                value={msgSearch}
                onChange={(e) => setMsgSearch(e.target.value)}
                placeholder="Filtrar mensagens por palavra ou nome de anexo..."
                className="w-full bg-transparent text-xs outline-none"
              />
              {msgSearch && (
                <button type="button" onClick={() => setMsgSearch('')} className="ds-muted hover:text-current">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Lista de Mensagens com Separadores de Data e Fotos */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {roomMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 ds-muted">
                <div className="h-12 w-12 rounded-full bg-brand/10 text-brand flex items-center justify-center mb-3">
                  <MessageSquareText className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold">
                  {msgSearch ? 'Nenhuma mensagem encontrada.' : 'Inicie a conversa interna'}
                </p>
                <p className="text-xs ds-subtle mt-1 max-w-xs">
                  {msgSearch
                    ? 'Tente pesquisar por outro termo.'
                    : 'Envie mensagens de texto ou partilhe documentos da Biblioteca diretamente com a equipa.'}
                </p>
              </div>
            ) : (
              roomMessages.map((m, idx) => {
                const isMine = m.senderId === currentUserId;
                const senderUser = colleagueMap[m.senderId];
                const prev = idx > 0 ? roomMessages[idx - 1] : null;
                const currentDay = formatDateHeading(m.createdAt);
                const prevDay = prev ? formatDateHeading(prev.createdAt) : null;
                const showDateDivider = currentDay !== prevDay;

                return (
                  <div key={m.id} className="space-y-3">
                    {showDateDivider && (
                      <div className="flex items-center gap-3 my-3">
                        <div className="flex-1 h-px bg-[rgb(var(--border))]" />
                        <span className="text-[10px] font-mono uppercase tracking-wider ds-subtle px-2.5 py-0.5 rounded-full">
                          {currentDay}
                        </span>
                        <div className="flex-1 h-px bg-[rgb(var(--border))]" />
                      </div>
                    )}

                    <div
                      className={`flex items-start gap-3 py-1 px-2 rounded-xl hover:bg-[rgb(var(--surface-2))]/40 transition-colors ${
                        isMine ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {!isMine && (
                        <div className="pt-0.5 shrink-0">
                          <UserAvatar
                            name={senderUser?.name || m.senderName}
                            avatarUrl={senderUser?.avatarUrl}
                            size="sm"
                          />
                        </div>
                      )}

                      <div
                        className={`max-w-[78%] flex flex-col space-y-1 ${
                          isMine ? 'items-end text-right' : 'items-start text-left'
                        }`}
                      >
                        <div
                          className={`flex items-center gap-2 ${
                            isMine ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          <span
                            className={`text-xs font-semibold ${
                              isMine ? 'text-brand' : 'text-[rgb(var(--text))]'
                            }`}
                          >
                            {isMine ? 'Você' : m.senderName}
                          </span>
                          {!isMine && m.senderRole && (
                            <span className="text-[10px] font-mono uppercase ds-subtle">
                              {ROLE_LABELS[m.senderRole] || m.senderRole}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono ds-subtle">
                            {new Date(m.createdAt).toLocaleTimeString('pt-PT', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {isMine && <CheckCheck className="h-3 w-3 text-brand" />}
                          </span>
                        </div>

                        {m.content && (
                          <p
                            className={`text-[13px] whitespace-pre-wrap break-words leading-relaxed pt-1.5 border-t ${
                              isMine
                                ? 'border-brand/40 text-[rgb(var(--text))]'
                                : 'ds-divider text-[rgb(var(--text))]/90'
                            }`}
                          >
                            {m.content}
                          </p>
                        )}

                        {m.attachments && m.attachments.length > 0 && (
                          <div
                            className={`flex flex-wrap gap-1.5 pt-1 ${
                              isMine ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            {m.attachments.map((att, aIdx) => (
                              <a
                                key={`${att.name}_${aIdx}`}
                                href={att.url || '#'}
                                target={att.url ? '_blank' : undefined}
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full ds-surface-2 text-[11px] hover:text-brand transition-colors"
                              >
                                <FileText className="h-3.5 w-3.5 text-brand shrink-0" />
                                <span className="truncate max-w-[180px] font-medium">{att.name}</span>
                                {att.size > 0 && (
                                  <span className="font-mono text-[10px] ds-subtle">
                                    {formatBytes(att.size)}
                                  </span>
                                )}
                                {att.url && <ExternalLink className="h-3 w-3 ds-muted shrink-0" />}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      {isMine && (
                        <div className="pt-0.5 shrink-0">
                          <UserAvatar
                            name={senderUser?.name || me?.name || 'Você'}
                            avatarUrl={senderUser?.avatarUrl || me?.avatarUrl}
                            size="sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Anexos pendentes */}
          {attachments.length > 0 && (
            <div className="px-4 py-2 border-t ds-divider ds-surface-2 flex flex-wrap items-center gap-1.5">
              {attachments.map((att, idx) => (
                <span
                  key={`${att.digitalFileId || att.name}_${idx}`}
                  className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] border ds-divider"
                  style={{ backgroundColor: 'rgb(var(--surface))' }}
                >
                  <Paperclip className="h-3 w-3 text-brand shrink-0" />
                  <span className="truncate max-w-[160px]">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-rose-400 hover:text-rose-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Compositor Profissional com Botão de Envio Refinado */}
          <form onSubmit={handleSend} className="p-3.5 border-t ds-divider ds-surface-2">
            <div
              className="flex items-end gap-2 rounded-2xl border ds-divider p-2 focus-within:border-brand transition-colors"
              style={{ backgroundColor: 'rgb(var(--surface))' }}
            >
              <button
                type="button"
                onClick={() => setFilePickerOpen(true)}
                title="Partilhar documento da Biblioteca Interna"
                className="btn btn-ghost btn-icon h-9 w-9 shrink-0"
              >
                <FolderOpen className="h-4 w-4 text-sky-400" />
              </button>

              <textarea
                rows={1}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  activeRoom.type === 'channel' && activeChannelMeta
                    ? `Escrever em #${activeChannelMeta.name}... (Enter para enviar)`
                    : `Mensagem privada para ${activePeer?.name || 'colega'}... (Enter para enviar)`
                }
                className="flex-1 bg-transparent text-[13px] outline-none resize-none max-h-28 py-2 px-1 placeholder:opacity-55"
              />

              <button
                type="submit"
                disabled={!canSend}
                title="Enviar mensagem (Enter)"
                aria-label="Enviar mensagem"
                className={`h-9 w-9 rounded-full shrink-0 inline-flex items-center justify-center transition-all duration-150 ${
                  canSend
                    ? 'bg-brand text-white hover:brightness-110 active:scale-95 shadow-md'
                    : 'ds-surface-2 ds-subtle cursor-not-allowed opacity-60'
                }`}
              >
                <SendHorizontal className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Coluna Direita (Opcional): Detalhes do Colega ou Membros do Canal */}
        {showInfoPanel && (
          <div className="hidden lg:flex lg:col-span-3 border-l ds-divider flex-col overflow-hidden">
            {activeRoom.type === 'direct' && activePeer ? (
              <div className="p-5 space-y-5 overflow-y-auto">
                <div className="flex flex-col items-center text-center space-y-2.5 pt-2">
                  <UserAvatar
                    name={activePeer.name}
                    avatarUrl={activePeer.avatarUrl}
                    status={activePeer.onlineStatus}
                    size="lg"
                  />
                  <div>
                    <h3 className="text-sm font-semibold">{activePeer.name}</h3>
                    <p className="text-xs ds-muted">{activePeer.jobTitle || ROLE_LABELS[activePeer.role] || activePeer.role}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-mono uppercase border ${
                      activePeer.onlineStatus === 'online'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : activePeer.onlineStatus === 'away'
                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                        : 'ds-divider ds-surface-2 ds-muted'
                    }`}
                  >
                    <Circle className="h-2 w-2 fill-current" />
                    {activePeer.onlineStatus === 'online'
                      ? 'Online agora'
                      : activePeer.onlineStatus === 'away'
                      ? 'Ausente'
                      : 'Offline'}
                  </span>
                </div>

                <div className="space-y-3 pt-3 border-t ds-divider text-xs">
                  <div className="flex items-start gap-2.5">
                    <Mail className="h-3.5 w-3.5 ds-subtle mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider ds-subtle">Email</p>
                      <p className="truncate font-mono text-[11px]">{activePeer.email}</p>
                    </div>
                  </div>
                  {activePeer.jobTitle && (
                    <div className="flex items-start gap-2.5">
                      <Briefcase className="h-3.5 w-3.5 ds-subtle mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider ds-subtle">Função</p>
                        <p>{activePeer.jobTitle}</p>
                      </div>
                    </div>
                  )}
                  {activePeer.onlineStatus === 'online' && activePeer.activeTab && (
                    <div className="p-3 border ds-divider ds-surface-2">
                      <p className="text-[10px] uppercase tracking-wider ds-subtle">A trabalhar em</p>
                      <p className="font-semibold text-brand mt-0.5">
                        {TAB_LABELS[activePeer.activeTab] || activePeer.activeTab}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="px-4 py-3.5 border-b ds-divider ds-surface-2">
                  <p className="text-xs font-semibold">Membros do Canal ({colleagues.length})</p>
                  <p className="text-[11px] ds-muted">{onlineCount} online neste momento</p>
                </div>
                <div className="flex-1 overflow-y-auto divide-y ds-divider">
                  {colleagues.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      disabled={c.id === currentUserId}
                      onClick={() => c.id !== currentUserId && setActiveRoom({ type: 'direct', peerId: c.id })}
                      className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 hover:bg-[rgb(var(--surface-2))] transition-colors disabled:opacity-80 disabled:cursor-default"
                    >
                      <UserAvatar name={c.name} avatarUrl={c.avatarUrl} status={c.onlineStatus} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">
                          {c.name} {c.id === currentUserId && <span className="text-[10px] ds-subtle">(Você)</span>}
                        </p>
                        <p className="text-[10px] ds-muted truncate">
                          {c.onlineStatus === 'online'
                            ? TAB_LABELS[c.activeTab || 'dashboard'] || 'Online'
                            : c.jobTitle || ROLE_LABELS[c.role] || c.role}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Seleção de Arquivos da Biblioteca Interna */}
      <DigitalFilePickerModal
        open={filePickerOpen}
        alreadyAttachedIds={attachments.map((a) => a.digitalFileId).filter((x): x is string => Boolean(x))}
        onClose={() => setFilePickerOpen(false)}
        onSelect={(chosen: DigitalFileItem[]) => {
          setAttachments((prev) => [
            ...prev,
            ...chosen.map((f) => ({
              name: f.fileName || f.name,
              type: f.mimeType || 'application/octet-stream',
              size: f.size || 0,
              url: f.publicUrl || '',
              digitalFileId: f.id,
            })),
          ]);
        }}
      />
    </div>
  );
}
