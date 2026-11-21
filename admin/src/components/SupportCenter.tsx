import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Headphones,
  MessageSquare,
  Mail,
  Send,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  Paperclip,
  Image as ImageIcon,
  FileText,
  X,
  Download,
  Volume2,
  VolumeX,
  Globe,
  LayoutTemplate,
  Trash2,
  Edit3,
  FolderOpen,
  CalendarPlus,
  CalendarClock,
  ListChecks,
  SlidersHorizontal,
  Server,
  Share2,
  Eye,
  Maximize2,
  Code2,
} from 'lucide-react';
import { apiFetch, apiUrl, getSessionUser } from '../lib/api';
import { isSoundEnabled, playMessageSound, setSoundEnabled } from '../lib/sound';
import { Pagination } from './Pagination';
import { BrandLoader } from './BrandLoader';
import { AdminIcon3D } from './AdminIcon3D';
import { TemplateStudioModal, type AppliedTemplateMeta } from './TemplateStudioModal';
import { ConfirmModal, FeedbackPopup } from './ConfirmModal';
import { DigitalFilePickerModal } from './DigitalFilePickerModal';
import { buildBrandedEmailHtml } from '../lib/emailTemplates';

interface AttachmentItem {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  url?: string;
  digitalFileId?: string;
}

interface SupportMessage {
  id: string;
  sender: 'client' | 'customer' | 'agent';
  content: string;
  html?: string;
  channel?: string;
  subject?: string;
  attachments?: AttachmentItem[];
  timestamp: string;
}

interface SupportTicket {
  id: string;
  clientName: string;
  clientContact: string;
  clientEmail?: string;
  channel: 'whatsapp' | 'email' | 'instagram' | 'facebook' | 'portal';
  subject: string;
  status: 'aberto' | 'em_curso' | 'resolvido';
  priority: 'baixa' | 'normal' | 'alta';
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
}

interface SupportCenterProps {
  theme?: 'dark' | 'light';
}

const STATUS_META: Record<string, { label: string; badge: string }> = {
  aberto: { label: 'Aberto', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  em_curso: { label: 'Em Curso', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  resolvido: { label: 'Resolvido', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeTicket(raw: Record<string, unknown>): SupportTicket {
  const statusRaw = String(raw.status || 'aberto');
  const status: SupportTicket['status'] =
    statusRaw === 'resolved' || statusRaw === 'resolvido'
      ? 'resolvido'
      : statusRaw === 'in_progress' || statusRaw === 'em_curso'
      ? 'em_curso'
      : 'aberto';

  const chRaw = String(raw.channel || 'whatsapp');
  const channel: SupportTicket['channel'] =
    chRaw === 'email'
      ? 'email'
      : chRaw === 'instagram'
      ? 'instagram'
      : chRaw === 'facebook'
      ? 'facebook'
      : chRaw === 'portal'
      ? 'portal'
      : 'whatsapp';

  const msgs = Array.isArray(raw.messages)
    ? (raw.messages as Record<string, unknown>[]).map((m, i) => ({
        id: String(m.id || `m_${i}`),
        sender: (m.sender === 'agent' ? 'agent' : 'client') as 'agent' | 'client',
        content: String(m.content || ''),
        html: m.html ? String(m.html) : undefined,
        channel: String(m.channel || channel),
        subject: m.subject ? String(m.subject) : undefined,
        attachments: Array.isArray(m.attachments) ? (m.attachments as AttachmentItem[]) : [],
        timestamp: String(m.timestamp || raw.updatedAt || new Date().toISOString()),
      }))
    : [];

  return {
    id: String(raw.id),
    clientName: String(raw.clientName || raw.customerName || 'Visitante'),
    clientContact: String(raw.clientContact || raw.contact || ''),
    clientEmail: String(raw.clientEmail || ''),
    channel,
    subject: String(raw.subject || 'Atendimento JOGIMIL'),
    status,
    priority: (raw.priority === 'alta' || raw.priority === 'high'
      ? 'alta'
      : raw.priority === 'baixa' || raw.priority === 'low'
      ? 'baixa'
      : 'normal') as SupportTicket['priority'],
    createdAt: String(raw.createdAt || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || raw.createdAt || new Date().toISOString()),
    messages: msgs,
  };
}

function buildEmailIframeSrcDoc(rawHtml: string): string {
  const html = String(rawHtml || '').trim();
  if (!html) return '';
  if (/<html[\s>]/i.test(html)) {
    if (/<head[\s>]/i.test(html)) {
      return html.replace(/<head([^>]*)>/i, '<head$1><base target="_blank" />');
    }
    return html.replace(/<html([^>]*)>/i, '<html$1><head><base target="_blank" /></head>');
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><base target="_blank" /><style>body{margin:0;padding:18px;background:#ffffff;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;line-height:1.55;}img{max-width:100%;height:auto;}</style></head><body>${html}</body></html>`;
}

export function SupportCenter(_props: SupportCenterProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'aberto' | 'em_curso' | 'resolvido'>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | 'whatsapp' | 'email' | 'instagram' | 'facebook' | 'portal'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Composer state adaptado ao canal
  const [replyChannel, setReplyChannel] = useState<'whatsapp' | 'email' | 'instagram' | 'facebook'>('whatsapp');
  const [replyText, setReplyText] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [emailCc, setEmailCc] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailHtml, setEmailHtml] = useState('');
  const [showEmailHeaders, setShowEmailHeaders] = useState(false);
  const [activeTemplateName, setActiveTemplateName] = useState<string | null>(null);
  const [templateMeta, setTemplateMeta] = useState<AppliedTemplateMeta | null>(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [waPhone, setWaPhone] = useState('');
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [libraryPickerOpen, setLibraryPickerOpen] = useState(false);

  // Agendamento de envio de Email (integrado com o Calendário Corporativo)
  interface ScheduledEmailItem {
    id: string;
    ticketId: string;
    to: string;
    subject: string;
    content: string;
    scheduledAt: string;
    status: 'pending' | 'sent' | 'failed';
    error?: string;
    calendarEventId?: string | null;
  }
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmailItem[]>([]);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [scheduleSyncCalendar, setScheduleSyncCalendar] = useState(true);
  const [schedulingEmail, setSchedulingEmail] = useState(false);
  const [sendingScheduledId, setSendingScheduledId] = useState<string | null>(null);

  // Ações rápidas integradas no cabeçalho da conversa (Calendário, Tarefas/Processos, Config Email/CalDAV)
  const [quickCalendarOpen, setQuickCalendarOpen] = useState(false);
  const [quickCalendarForm, setQuickCalendarForm] = useState({
    title: '',
    type: 'reuniao',
    startAt: '',
    location: '',
    description: '',
    createLinkedTask: true,
  });
  const [savingQuickCalendar, setSavingQuickCalendar] = useState(false);

  const [quickTaskOpen, setQuickTaskOpen] = useState(false);
  const [quickTaskForm, setQuickTaskForm] = useState({
    title: '',
    category: 'suporte',
    priority: 'alta',
    dueDate: '',
    description: '',
    syncToCalendar: true,
  });
  const [savingQuickTask, setSavingQuickTask] = useState(false);

  const [mailConfigOpen, setMailConfigOpen] = useState(false);
  const [mailConfigLoading, setMailConfigLoading] = useState(false);
  const [mailConfigData, setMailConfigData] = useState<{
    email?: { smtp?: { host?: string; port?: number; verified?: boolean }; imap?: { host?: string; port?: number; authenticated?: boolean }; user?: string };
    caldav?: { caldavOnline?: boolean; caldavStatus?: number; server?: string; caldavUrl?: string; carddavUrl?: string; diagnostic?: string };
  }>({});
  const [sending, setSending] = useState(false);
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; title?: string; text: string } | null>(null);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Partilha de atendimento/mensagens pelo Admin com utilizadores inferiores
  const sessionUser = getSessionUser();
  const isAdminUser = !sessionUser || sessionUser.role === 'admin' || sessionUser.role === 'Administrador Executivo';
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUsers, setShareUsers] = useState<Array<{ id: string; name: string; email: string; role: string }>>([]);
  const [shareSelectedIds, setShareSelectedIds] = useState<string[]>([]);
  const [savingShareTicket, setSavingShareTicket] = useState(false);

  // Preview de Templates HTML de emails recebidos e enviados
  const [plainTextMsgIds, setPlainTextMsgIds] = useState<Set<string>>(new Set());
  const [expandedEmailPreview, setExpandedEmailPreview] = useState<{
    subject: string;
    sender: string;
    html: string;
  } | null>(null);

  const openShareTicketModal = async () => {
    if (!active) return;
    const rawShared = (active as unknown as { sharedWith?: string[] }).sharedWith;
    setShareSelectedIds(Array.isArray(rawShared) ? rawShared : []);
    setShareModalOpen(true);
    try {
      const r = await apiFetch<{ users?: Array<{ id: string; name: string; email: string; role: string }> }>('/api/v1/admin/users');
      setShareUsers((r.users || []).filter((u) => u.id !== 'usr_admin_root'));
    } catch {
      setShareUsers([]);
    }
  };

  const handleSaveTicketShare = async () => {
    if (!active) return;
    setSavingShareTicket(true);
    try {
      await apiFetch(`/api/v1/admin/support/${active.id}/share`, {
        method: 'PUT',
        body: JSON.stringify({
          assignedTo: shareSelectedIds[0] || null,
          sharedWith: shareSelectedIds,
        }),
      });
      setShareModalOpen(false);
      showNotice('success', 'Atendimento partilhado com sucesso com os utilizadores selecionados.');
      await loadTickets(true);
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Falha ao partilhar atendimento.');
    } finally {
      setSavingShareTicket(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const knownMsgIdsRef = useRef<Set<string>>(new Set());
  const firstLoadRef = useRef(true);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedTicketIdRef = useRef<string | null>(null);

  const showNotice = useCallback((type: 'success' | 'error', text: string) => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    setNotice({ type, text });
    noticeTimerRef.current = setTimeout(() => {
      setNotice(null);
      noticeTimerRef.current = null;
    }, type === 'error' ? 10000 : 5000);
  }, []);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, []);

  const isEmailMode = replyChannel === 'email';

  const effectiveEmailHtml = useMemo(() => {
    if (!isEmailMode) return '';
    if (templateMeta?.mode === 'visual') {
      return buildBrandedEmailHtml({
        category: templateMeta.category,
        headline: templateMeta.headline || emailSubject || 'Comunicação Oficial',
        body: replyText,
        ctaLabel: templateMeta.ctaLabel,
        ctaUrl: templateMeta.ctaUrl,
        previewLocalLogo: false,
      });
    }
    return emailHtml;
  }, [isEmailMode, templateMeta, emailSubject, replyText, emailHtml]);

  const buildOutboundAttachments = useCallback((items: AttachmentItem[]) => {
    return items.map((att) =>
      att.digitalFileId
        ? {
            name: att.name,
            type: att.type,
            size: att.size,
            url: att.url || '',
            digitalFileId: att.digitalFileId,
          }
        : {
            name: att.name,
            type: att.type,
            size: att.size,
            dataUrl: att.dataUrl,
          }
    );
  }, []);

  const syncComposerWithTicket = useCallback(
    (t: SupportTicket, overrideChannel?: 'whatsapp' | 'email' | 'instagram' | 'facebook') => {
      const ch: 'whatsapp' | 'email' | 'instagram' | 'facebook' =
        overrideChannel ||
        (t.channel === 'email'
          ? 'email'
          : t.channel === 'instagram'
          ? 'instagram'
          : t.channel === 'facebook'
          ? 'facebook'
          : 'whatsapp');
      setReplyChannel(ch);
      setEmailTo(t.clientEmail || (t.clientContact.includes('@') ? t.clientContact : ''));
      setEmailCc('');
      setEmailSubject(t.subject.startsWith('Re:') ? t.subject : `Re: ${t.subject}`);
      setShowEmailHeaders(false);
      setWaPhone(!t.clientContact.includes('@') ? t.clientContact : '');
      setReplyText('');
      setEmailHtml('');
      setActiveTemplateName(null);
      setTemplateMeta(null);
      setAttachments([]);
      lastSyncedTicketIdRef.current = t.id;
    },
    []
  );

  const loadTickets = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await apiFetch<{ tickets?: Record<string, unknown>[]; data?: Record<string, unknown>[] }>(
        '/api/v1/admin/support'
      );
      const list = (res.tickets || res.data || []).map(normalizeTicket);

      // Detetar novas mensagens recebidas de clientes para tocar efeito sonoro
      if (firstLoadRef.current) {
        list.forEach((t) => t.messages.forEach((m) => knownMsgIdsRef.current.add(m.id)));
        firstLoadRef.current = false;
      } else {
        let hasNewInbound = false;
        for (const t of list) {
          for (const m of t.messages) {
            if (!knownMsgIdsRef.current.has(m.id)) {
              knownMsgIdsRef.current.add(m.id);
              if (m.sender !== 'agent') hasNewInbound = true;
            }
          }
        }
        if (hasNewInbound) {
          playMessageSound();
        }
      }

      setTickets(list);
      if (!selectedId && list.length > 0) {
        setSelectedId(list[0].id);
        syncComposerWithTicket(list[0]);
      }
    } catch {
      if (!silent) setTickets([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [selectedId, syncComposerWithTicket]);

  const loadScheduledEmails = useCallback(async (ticketId?: string | null) => {
    if (!ticketId) {
      setScheduledEmails([]);
      return;
    }
    try {
      const res = await fetch(
        apiUrl(`/api/v1/admin/support/scheduled-emails?ticketId=${encodeURIComponent(ticketId)}`)
      );
      const json = await res.json().catch(() => ({}));
      if (json.success && Array.isArray(json.scheduled)) {
        setScheduledEmails(json.scheduled);
      }
    } catch {
      // ignore
    }
  }, []);

  const openScheduleEmailModal = () => {
    if (!active) return;
    if (!replyText.trim() && !effectiveEmailHtml.trim() && attachments.length === 0) {
      setNotice({
        type: 'error',
        title: 'Mensagem vazia',
        text: 'Escreva o conteúdo do email, escolha um template ou anexe um ficheiro antes de agendar.',
      });
      return;
    }
    const inTwoHours = new Date(Date.now() + 2 * 3600 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    setScheduleDateTime(
      `${inTwoHours.getFullYear()}-${pad(inTwoHours.getMonth() + 1)}-${pad(inTwoHours.getDate())}T${pad(inTwoHours.getHours())}:${pad(inTwoHours.getMinutes())}`
    );
    setScheduleSyncCalendar(true);
    setScheduleModalOpen(true);
  };

  const handleScheduleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !scheduleDateTime) return;

    const recipient = String(
      emailTo.trim() || active.clientEmail || (active.clientContact?.includes('@') ? active.clientContact : '')
    ).trim();
    if (!recipient || !/[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+/.test(recipient)) {
      setShowEmailHeaders(true);
      setScheduleModalOpen(false);
      showNotice('error', 'Indique um endereço de email válido para agendar o envio.');
      return;
    }

    const totalSize = attachments.reduce((sum, a) => sum + Number(a.size || 0), 0);
    if (totalSize > 20 * 1024 * 1024) {
      showNotice('error', 'O tamanho total dos anexos excede o limite de 20 MB.');
      return;
    }

    setSchedulingEmail(true);
    try {
      const outboundAttachments = buildOutboundAttachments(attachments);
      const res = await fetch(apiUrl(`/api/v1/admin/support/${active.id}/schedule-email`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipient,
          cc: emailCc.trim() || undefined,
          subject: emailSubject.trim() || `Re: ${active.subject}`,
          content: replyText.trim(),
          html: effectiveEmailHtml.trim() ? effectiveEmailHtml : undefined,
          attachments: outboundAttachments,
          scheduledAt: new Date(scheduleDateTime).toISOString(),
          syncToCalendar: scheduleSyncCalendar,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.message || json.detail || json.error || 'Erro ao agendar email');
      }

      setScheduleModalOpen(false);
      setReplyText('');
      setEmailHtml('');
      setActiveTemplateName(null);
      setTemplateMeta(null);
      setAttachments([]);
      await loadScheduledEmails(active.id);
      setNotice({
        type: 'success',
        title: 'Email agendado com sucesso',
        text: scheduleSyncCalendar
          ? 'O envio foi agendado e registado automaticamente no Calendário Corporativo.'
          : 'O envio foi agendado para a data e hora selecionadas.',
      });
    } catch (err) {
      setNotice({
        type: 'error',
        title: 'Falha ao agendar',
        text: err instanceof Error ? err.message : 'Não foi possível agendar o envio.',
      });
    } finally {
      setSchedulingEmail(false);
    }
  };

  const handleSendScheduledNow = async (scheduleId: string) => {
    setSendingScheduledId(scheduleId);
    try {
      const res = await fetch(apiUrl(`/api/v1/admin/support/scheduled-emails/${scheduleId}/send-now`), {
        method: 'POST',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.message || json.detail || json.error || 'Erro ao enviar');
      }
      await Promise.all([loadTickets(true), loadScheduledEmails(active?.id || selectedId)]);
      setNotice({
        type: 'success',
        title: 'Email enviado',
        text: json.message || 'O email agendado foi disparado imediatamente.',
      });
    } catch (err) {
      setNotice({
        type: 'error',
        title: 'Erro no envio',
        text: err instanceof Error ? err.message : 'Falha ao enviar agora.',
      });
    } finally {
      setSendingScheduledId(null);
    }
  };

  const handleCancelScheduled = async (scheduleId: string) => {
    try {
      const res = await fetch(apiUrl(`/api/v1/admin/support/scheduled-emails/${scheduleId}`), {
        method: 'DELETE',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || json.detail || 'Falha ao cancelar agendamento');
      await loadScheduledEmails(active?.id || selectedId);
      setNotice({
        type: 'success',
        title: 'Agendamento cancelado',
        text: 'O envio agendado e o respetivo evento do Calendário foram removidos.',
      });
    } catch (err) {
      setNotice({
        type: 'error',
        title: 'Erro ao cancelar',
        text: err instanceof Error ? err.message : 'Não foi possível cancelar.',
      });
    }
  };

  useEffect(() => {
    loadTickets(false);
    const id = setInterval(() => loadTickets(true), 4000);
    return () => clearInterval(id);
  }, [loadTickets]);

  const ticketMatchesChannel = useCallback(
    (t: SupportTicket, ch: 'all' | 'whatsapp' | 'email' | 'instagram' | 'facebook' | 'portal') => {
      if (ch === 'all') return true;
      if (t.channel === ch) return true;
      return t.messages.some((m) => (m.channel || t.channel) === ch);
    },
    []
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (!ticketMatchesChannel(t, channelFilter)) return false;
      if (!q) return true;
      return [t.clientName, t.clientContact, t.clientEmail, t.subject].join(' ').toLowerCase().includes(q);
    });
  }, [tickets, search, statusFilter, channelFilter, ticketMatchesChannel]);

  // Garante que a conversa ativa pertence sempre ao canal filtrado
  const active = filtered.find((t) => t.id === selectedId) || filtered[0] || null;

  useEffect(() => {
    loadScheduledEmails(active?.id);
  }, [active?.id, loadScheduledEmails]);

  useEffect(() => {
    if (active && active.id !== lastSyncedTicketIdRef.current) {
      const preferred =
        channelFilter === 'email' ||
        channelFilter === 'whatsapp' ||
        channelFilter === 'instagram' ||
        channelFilter === 'facebook'
          ? channelFilter
          : undefined;
      syncComposerWithTicket(active, preferred);
    }
  }, [active, channelFilter, syncComposerWithTicket]);

  // Filtra as mensagens exibidas estritamente para o canal selecionado
  const visibleMessages = useMemo(() => {
    if (!active) return [];
    if (channelFilter === 'all') return active.messages;
    return active.messages.filter((m) => (m.channel || active.channel) === channelFilter);
  }, [active, channelFilter]);

  useEffect(() => {
    setPage(1);
    if (channelFilter === 'whatsapp' || channelFilter === 'instagram' || channelFilter === 'facebook') {
      setReplyChannel(channelFilter);
      setEmailHtml('');
      setActiveTemplateName(null);
      setTemplateMeta(null);
    } else if (channelFilter === 'email') {
      setReplyChannel('email');
    }
  }, [search, statusFilter, channelFilter]);

  const paginatedTickets = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [active?.id, visibleMessages.length]);

  const channelCounts = useMemo(
    () => ({
      all: tickets.length,
      whatsapp: tickets.filter((t) => ticketMatchesChannel(t, 'whatsapp')).length,
      email: tickets.filter((t) => ticketMatchesChannel(t, 'email')).length,
      instagram: tickets.filter((t) => ticketMatchesChannel(t, 'instagram')).length,
      facebook: tickets.filter((t) => ticketMatchesChannel(t, 'facebook')).length,
      portal: tickets.filter((t) => ticketMatchesChannel(t, 'portal')).length,
    }),
    [tickets, ticketMatchesChannel]
  );

  const stats = useMemo(
    () => ({
      total: tickets.length,
      open: tickets.filter((t) => t.status === 'aberto').length,
      inProgress: tickets.filter((t) => t.status === 'em_curso').length,
      resolved: tickets.filter((t) => t.status === 'resolvido').length,
    }),
    [tickets]
  );

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        showNotice('error', `O ficheiro "${file.name}" excede o limite de 5 MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: file.size,
            dataUrl: String(reader.result || ''),
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active) return;
    if (!replyText.trim() && !effectiveEmailHtml.trim() && attachments.length === 0) {
      showNotice('error', 'Escreva uma mensagem, aplique um template ou anexe um ficheiro.');
      return;
    }

    if (isEmailMode) {
      const cleanEmail = emailTo.trim();
      if (!cleanEmail || !/[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+/.test(cleanEmail)) {
        setShowEmailHeaders(true);
        showNotice('error', 'Indique um endereço de email válido para o destinatário.');
        return;
      }
    } else if (replyChannel === 'instagram' || replyChannel === 'facebook') {
      if (!(active.clientContact || waPhone).trim()) {
        showNotice('error', `ID do contacto (${replyChannel === 'instagram' ? 'IGSID' : 'PSID'}) em falta.`);
        return;
      }
    } else {
      if (!waPhone.trim() || !/\d{7,}/.test(waPhone)) {
        showNotice('error', 'Indique um número de WhatsApp válido para o destinatário.');
        return;
      }
    }

    const totalSize = attachments.reduce((sum, a) => sum + Number(a.size || 0), 0);
    if (totalSize > 20 * 1024 * 1024) {
      showNotice('error', 'O tamanho total dos anexos excede o limite de 20 MB.');
      return;
    }

    setSending(true);
    try {
      const outboundAttachments = buildOutboundAttachments(attachments);
      const payload = {
        content: replyText.trim(),
        html: isEmailMode && effectiveEmailHtml.trim() ? effectiveEmailHtml : undefined,
        channel: replyChannel,
        sender: 'agent',
        to: isEmailMode ? emailTo.trim() : waPhone.trim(),
        cc: isEmailMode ? emailCc.trim() || undefined : undefined,
        subject: isEmailMode ? emailSubject.trim() || `Re: ${active.subject}` : undefined,
        attachments: outboundAttachments,
      };

      const res = await apiFetch<{
        success: boolean;
        message: SupportMessage;
        delivery?: { success?: boolean; error?: string; offline?: boolean };
        error?: string;
      }>(`/api/v1/admin/support/${active.id}/messages`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success === false || res.delivery?.success === false) {
        const errMsg =
          res.delivery?.error ||
          res.error ||
          `Falha no envio externo via ${replyChannel === 'whatsapp' ? 'WhatsApp' : 'Email (SMTP)'}.`;
        showNotice('error', errMsg);
        return;
      }

      const newMsg: SupportMessage = {
        ...(res.message || {
          id: `msg_${Date.now()}`,
          sender: 'agent',
          content: replyText.trim(),
          channel: replyChannel,
          timestamp: new Date().toISOString(),
        }),
        channel: replyChannel,
        html: res.message?.html || payload.html,
        subject: res.message?.subject || payload.subject,
        attachments:
          Array.isArray(res.message?.attachments) && res.message.attachments.length > 0
            ? res.message.attachments
            : outboundAttachments.map((a) => ({
                name: a.name,
                type: a.type,
                size: a.size,
                dataUrl: a.dataUrl || '',
                url: a.url || '',
                digitalFileId: a.digitalFileId,
              })),
      };
      knownMsgIdsRef.current.add(newMsg.id);

      setTickets((prev) =>
        prev.map((t) =>
          t.id === active.id
            ? { ...t, messages: [...t.messages, newMsg], updatedAt: newMsg.timestamp }
            : t
        )
      );
      if (channelFilter !== 'all' && channelFilter !== replyChannel) {
        setChannelFilter(replyChannel);
      }

      const sentAttachmentsCount = attachments.length;
      setReplyText('');
      setEmailHtml('');
      setActiveTemplateName(null);
      setTemplateMeta(null);
      setAttachments([]);

      showNotice(
        'success',
        `Enviado via ${replyChannel === 'whatsapp' ? 'WhatsApp' : 'Email'}${sentAttachmentsCount ? ` com ${sentAttachmentsCount} anexo(s)` : ''}.`
      );
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Falha ao enviar mensagem.');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (ticketId: string, status: SupportTicket['status']) => {
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status } : t)));
    try {
      await apiFetch(`/api/v1/admin/support/${ticketId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      showNotice('success', `Estado atualizado para "${STATUS_META[status]?.label || status}".`);
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Erro ao atualizar estado.');
      loadTickets();
    }
  };

  const handleDeleteTicket = (ticketId: string) => {
    setConfirmState({
      title: 'Eliminar Conversa',
      description: 'Esta ação remove definitivamente esta conversa e todas as suas mensagens do histórico.',
      onConfirm: async () => {
        setDeleting(true);
        try {
          await apiFetch(`/api/v1/admin/support/${ticketId}`, { method: 'DELETE' });
          setTickets((prev) => prev.filter((t) => t.id !== ticketId));
          if (selectedId === ticketId) setSelectedId(null);
          showNotice('success', 'Conversa eliminada com sucesso.');
        } catch (err) {
          showNotice('error', err instanceof Error ? err.message : 'Erro ao eliminar conversa.');
        } finally {
          setDeleting(false);
          setConfirmState(null);
        }
      },
    });
  };

  const handleDeleteMessage = (ticketId: string, messageId: string) => {
    setConfirmState({
      title: 'Eliminar Mensagem',
      description: 'Tem a certeza que pretende remover esta mensagem do histórico da conversa?',
      onConfirm: async () => {
        setDeleting(true);
        try {
          await apiFetch(`/api/v1/admin/support/${ticketId}/messages/${encodeURIComponent(messageId)}`, {
            method: 'DELETE',
          });
          setTickets((prev) =>
            prev.map((t) =>
              t.id === ticketId ? { ...t, messages: t.messages.filter((m) => m.id !== messageId) } : t
            )
          );
          showNotice('success', 'Mensagem eliminada com sucesso.');
        } catch (err) {
          showNotice('error', err instanceof Error ? err.message : 'Erro ao eliminar mensagem.');
        } finally {
          setDeleting(false);
          setConfirmState(null);
        }
      },
    });
  };

  const hasEmailThread = Boolean(
    active &&
      emailTo.trim() &&
      active.messages.some((m) => (m.channel || active.channel) === 'email')
  );

  return (
    <div className="flex flex-col gap-5 animate-fadeIn">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2.5">
            <AdminIcon3D name="support" size={26} />
            <span>Atendimento</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              try {
                const res = await apiFetch<{ imported?: number }>('/api/v1/admin/email/sync-inbox', { method: 'POST' });
                await loadTickets(false);
                showNotice(
                  'success',
                  res.imported
                    ? `${res.imported} novo(s) email(s) sincronizado(s) da caixa de entrada.`
                    : 'Caixa de entrada IMAP verificada (sem novos emails).'
                );
              } catch {
                showNotice('error', 'Não foi possível sincronizar a caixa de entrada IMAP.');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="btn btn-secondary"
            title="Verificar novos emails recebidos via IMAP"
          >
            <Mail className="h-4 w-4 text-brand" />
            <span>Sincronizar IMAP</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const next = !soundOn;
              setSoundOn(next);
              setSoundEnabled(next);
              if (next) playMessageSound();
            }}
            className="btn btn-secondary"
            title={soundOn ? 'Som de mensagens ativo' : 'Som de mensagens desativado'}
          >
            {soundOn ? <Volume2 className="h-4 w-4 text-emerald-500" /> : <VolumeX className="h-4 w-4 ds-subtle" />}
            <span>{soundOn ? 'Som Ativo' : 'Silenciado'}</span>
          </button>
          <button type="button" onClick={() => loadTickets(false)} disabled={loading} className="btn btn-secondary">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* KPIs com Ícones 3D */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="group ds-card ds-card-interactive p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold ds-muted">Total Tickets</p>
            <p className="text-2xl font-semibold font-mono tabular-nums mt-1">{stats.total}</p>
          </div>
          <AdminIcon3D name="chat" size={36} />
        </div>
        <div className="group ds-card ds-card-interactive p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold ds-muted">Em Aberto</p>
            <p className="text-2xl font-semibold font-mono tabular-nums mt-1 text-rose-400">{stats.open}</p>
          </div>
          <AdminIcon3D name="mail" size={36} />
        </div>
        <div className="group ds-card ds-card-interactive p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold ds-muted">Em Curso</p>
            <p className="text-2xl font-semibold font-mono tabular-nums mt-1 text-amber-400">{stats.inProgress}</p>
          </div>
          <AdminIcon3D name="clock" size={36} />
        </div>
        <div className="group ds-card ds-card-interactive p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold ds-muted">Resolvidos</p>
            <p className="text-2xl font-semibold font-mono tabular-nums mt-1 text-emerald-400">{stats.resolved}</p>
          </div>
          <AdminIcon3D name="check" size={36} />
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
          {notice.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Split-pane */}
      <div className="ds-card grid grid-cols-1 lg:grid-cols-12 lg:h-[calc(100vh-245px)] min-h-[560px] overflow-hidden">
        {/* Lista de Conversas Organizada por Canal */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r ds-divider flex flex-col min-h-0 overflow-hidden">
          {/* Abas de Canal com Ícones Oficiais & Contadores */}
          <div className="grid grid-cols-5 border-b ds-divider text-[10px] font-semibold">
            {[
              { id: 'all', label: 'Todos', count: channelCounts.all, iconSrc: '' },
              { id: 'whatsapp', label: 'WhatsApp', count: channelCounts.whatsapp, iconSrc: '/icons/whatsapp.svg' },
              { id: 'email', label: 'Email', count: channelCounts.email, iconSrc: '/icons/email.svg' },
              { id: 'instagram', label: 'IG', count: channelCounts.instagram, iconSrc: '/icons/instagram.svg' },
              { id: 'facebook', label: 'FB', count: channelCounts.facebook, iconSrc: '/icons/messenger.svg' },
            ].map((tab) => {
              const isAct = channelFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setChannelFilter(tab.id as typeof channelFilter)}
                  className={`py-2.5 px-1 flex flex-col items-center justify-center gap-0.5 border-b-2 transition-colors ${
                    isAct
                      ? 'border-b-brand ds-surface-2 text-[rgb(var(--text))]'
                      : 'border-b-transparent ds-muted hover:bg-[rgb(var(--surface-2))]'
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {tab.iconSrc && <img src={tab.iconSrc} alt={tab.label} className="h-3.5 w-3.5 shrink-0" />}
                    <span>{tab.label}</span>
                  </span>
                  <span className="font-mono text-[10px] ds-subtle">{tab.count}</span>
                </button>
              );
            })}
          </div>

          <div className="p-3 border-b ds-divider space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ds-subtle" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar cliente, telefone, email ou assunto..."
                className="input pl-8 h-8 text-xs"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="input h-8 text-xs"
            >
              <option value="all">Todos os estados ({tickets.length})</option>
              <option value="aberto">Em Aberto ({stats.open})</option>
              <option value="em_curso">Em Curso ({stats.inProgress})</option>
              <option value="resolvido">Resolvidos ({stats.resolved})</option>
            </select>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto divide-y ds-divider">
            {loading && tickets.length === 0 ? (
              <BrandLoader size="sm" />
            ) : paginatedTickets.length === 0 ? (
              <p className="text-xs ds-muted text-center py-12 px-4">
                Nenhuma conversa encontrada. Novos pedidos do portal aparecem aqui automaticamente.
              </p>
            ) : (
              paginatedTickets.map((t) => {
                const isSelected = active?.id === t.id;
                const channelMsgs =
                  channelFilter === 'all'
                    ? t.messages
                    : t.messages.filter((m) => (m.channel || t.channel) === channelFilter);
                const lastMsg = channelMsgs[channelMsgs.length - 1];
                const st = STATUS_META[t.status] || STATUS_META.aberto;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(t.id);
                      const preferred =
                        channelFilter === 'email' ||
                        channelFilter === 'whatsapp' ||
                        channelFilter === 'instagram' ||
                        channelFilter === 'facebook'
                          ? channelFilter
                          : undefined;
                      syncComposerWithTicket(t, preferred);
                    }}
                    className={`w-full text-left p-3.5 transition-colors border-l-2 ${
                      isSelected
                        ? 'ds-surface-2 border-l-brand'
                        : 'border-l-transparent hover:bg-[rgb(var(--surface-2))]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold truncate">{t.clientName}</span>
                      <span className={`badge text-[10px] ${st.badge}`}>{st.label}</span>
                    </div>
                    <p className="text-xs ds-muted truncate mt-0.5">{t.subject}</p>
                    <p className="text-[11px] ds-subtle truncate mt-1">{lastMsg?.content || 'Sem mensagens'}</p>
                    <div className="flex items-center justify-between mt-2 text-[10px] font-mono ds-subtle">
                      <span className="inline-flex items-center gap-1.5 uppercase">
                        <img
                          src={
                            t.channel === 'email'
                              ? '/icons/email.svg'
                              : t.channel === 'instagram'
                              ? '/icons/instagram.svg'
                              : t.channel === 'facebook'
                              ? '/icons/messenger.svg'
                              : '/icons/whatsapp.svg'
                          }
                          alt={t.channel}
                          className="h-3.5 w-3.5 shrink-0"
                        />
                        {t.channel}
                      </span>
                      <span>
                        {new Date(t.updatedAt).toLocaleString('pt-PT', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
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
            compact
          />
        </div>

        {/* Área de Atendimento Adaptativa */}
        <div
          className="lg:col-span-8 flex flex-col min-h-0 overflow-hidden"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFilesSelected(e.dataTransfer.files);
          }}
        >
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center ds-muted">
              <Headphones className="h-8 w-8 mb-3 opacity-40" />
              <p className="text-sm font-medium">Selecione uma conversa à esquerda</p>
              <p className="text-xs ds-subtle mt-1">
                Escolha WhatsApp ou Email para responder com suporte a anexos e documentos.
              </p>
            </div>
          ) : (
            <>
              {/* Header da Conversa + Seletor de Canal */}
              <div className="px-5 py-3 border-b ds-divider flex flex-wrap items-center justify-between gap-3 ds-surface-2">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <User className="h-4 w-4 text-brand shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{active.clientName}</p>
                    {(active.clientEmail || active.clientContact) &&
                      (active.clientEmail || active.clientContact) !== active.clientName && (
                        <p className="text-[11px] ds-muted truncate font-mono">
                          {active.clientEmail || active.clientContact}
                        </p>
                      )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isAdminUser && (
                    <button
                      type="button"
                      onClick={openShareTicketModal}
                      className="btn btn-secondary btn-sm h-8 text-xs gap-1.5"
                      title="Partilhar ou atribuir este atendimento/SMS a um utilizador"
                    >
                      <Share2 className="h-3.5 w-3.5 text-brand" />
                      <span>Partilhar</span>
                    </button>
                  )}

                  {/* Alternador de Canal com Ícones Oficiais */}
                  <div className="inline-flex border ds-divider">
                    <button
                      type="button"
                      onClick={() => {
                        setReplyChannel('whatsapp');
                        setChannelFilter('whatsapp');
                        setEmailHtml('');
                        setActiveTemplateName(null);
                        setTemplateMeta(null);
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 h-8 text-xs font-semibold transition-colors ${
                        replyChannel === 'whatsapp' && channelFilter !== 'portal'
                          ? 'bg-emerald-600/20 text-[rgb(var(--text))] border-b-2 border-b-[#25D366]'
                          : 'ds-muted hover:text-[rgb(var(--text))]'
                      }`}
                    >
                      <img src="/icons/whatsapp.svg" alt="WhatsApp" className="h-3.5 w-3.5 shrink-0" />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyChannel('email');
                        setChannelFilter('email');
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 h-8 text-xs font-semibold transition-colors ${
                        replyChannel === 'email'
                          ? 'bg-rose-500/15 text-[rgb(var(--text))] border-b-2 border-b-[#EA4335]'
                          : 'ds-muted hover:text-[rgb(var(--text))]'
                      }`}
                    >
                      <img src="/icons/email.svg" alt="Email" className="h-3.5 w-3.5 shrink-0" />
                      <span>Email</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyChannel('instagram');
                        setChannelFilter('instagram');
                        setEmailHtml('');
                        setActiveTemplateName(null);
                        setTemplateMeta(null);
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 h-8 text-xs font-semibold transition-colors ${
                        replyChannel === 'instagram'
                          ? 'bg-pink-500/15 text-[rgb(var(--text))] border-b-2 border-b-[#E4405F]'
                          : 'ds-muted hover:text-[rgb(var(--text))]'
                      }`}
                    >
                      <img src="/icons/instagram.svg" alt="Instagram" className="h-3.5 w-3.5 shrink-0" />
                      <span>Instagram</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyChannel('facebook');
                        setChannelFilter('facebook');
                        setEmailHtml('');
                        setActiveTemplateName(null);
                        setTemplateMeta(null);
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 h-8 text-xs font-semibold transition-colors ${
                        replyChannel === 'facebook'
                          ? 'bg-sky-500/15 text-[rgb(var(--text))] border-b-2 border-b-[#00B2FF]'
                          : 'ds-muted hover:text-[rgb(var(--text))]'
                      }`}
                    >
                      <img src="/icons/messenger.svg" alt="Facebook" className="h-3.5 w-3.5 shrink-0" />
                      <span>Facebook</span>
                    </button>
                  </div>

                  <select
                    value={active.status}
                    onChange={(e) => handleStatusChange(active.id, e.target.value as SupportTicket['status'])}
                    className="input h-8 w-auto text-xs"
                  >
                    <option value="aberto">Aberto</option>
                    <option value="em_curso">Em Curso</option>
                    <option value="resolvido">Resolvido</option>
                  </select>

                  <div className="flex items-center border ds-divider divide-x ds-divider">
                    <button
                      type="button"
                      onClick={() => {
                        const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
                        const pad = (n: number) => String(n).padStart(2, '0');
                        const defaultStart = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T10:00`;
                        setQuickCalendarForm({
                          title: `${active.subject || 'Reunião'} · ${active.clientName}`,
                          type: 'reuniao',
                          startAt: defaultStart,
                          location: active.clientEmail || active.clientContact || '',
                          description: visibleMessages.slice(-1)[0]?.content?.slice(0, 300) || '',
                          createLinkedTask: true,
                        });
                        setQuickCalendarOpen(true);
                      }}
                      title="Agendar no Calendário a partir desta conversa"
                      className="btn btn-ghost btn-icon h-8 w-8"
                    >
                      <CalendarPlus className="h-3.5 w-3.5 text-sky-500" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const due = new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().slice(0, 10);
                        setQuickTaskForm({
                          title: `${active.subject || 'Atendimento'} — ${active.clientName}`,
                          category: 'suporte',
                          priority: active.priority === 'alta' ? 'alta' : 'media',
                          dueDate: due,
                          description: visibleMessages.slice(-1)[0]?.content?.slice(0, 400) || '',
                          syncToCalendar: true,
                        });
                        setQuickTaskOpen(true);
                      }}
                      title="Criar Tarefa / Processo a partir desta conversa"
                      className="btn btn-ghost btn-icon h-8 w-8"
                    >
                      <ListChecks className="h-3.5 w-3.5 text-indigo-500" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setLibraryPickerOpen(true)}
                      title="Anexar da Biblioteca de Arquivos Digitais (PDF, Excel, Imagens)"
                      className="btn btn-ghost btn-icon h-8 w-8"
                    >
                      <FolderOpen className="h-3.5 w-3.5 text-emerald-500" />
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        setMailConfigOpen(true);
                        setMailConfigLoading(true);
                        try {
                          const [emRes, davRes] = await Promise.all([
                            fetch(apiUrl('/api/v1/admin/email/status')).then((r) => r.json()).catch(() => ({})),
                            fetch(apiUrl('/api/v1/admin/calendar/caldav/status')).then((r) => r.json()).catch(() => ({})),
                          ]);
                          setMailConfigData({ email: emRes, caldav: davRes });
                        } finally {
                          setMailConfigLoading(false);
                        }
                      }}
                      title="Configurações de Email (SMTP/IMAP) & CalDAV / CardDAV"
                      className="btn btn-ghost btn-icon h-8 w-8"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteTicket(active.id)}
                      title="Eliminar esta conversa"
                      className="btn btn-ghost btn-icon h-8 w-8 text-rose-500 hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Histórico de Mensagens (limpo sem bordas fechadas + preview de templates HTML) */}
              <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
                {visibleMessages.length === 0 ? (
                  <p className="text-xs ds-muted text-center py-10">
                    Sem mensagens registadas no canal{' '}
                    <strong className="uppercase">{channelFilter}</strong> para esta conversa.
                  </p>
                ) : (
                  visibleMessages.map((m, idx) => {
                    const isAgent = m.sender === 'agent';
                    const msgIsEmail = (m.channel || active.channel) === 'email';
                    const prevMsg = idx > 0 ? visibleMessages[idx - 1] : null;
                    const sameSenderAsPrev = Boolean(
                      prevMsg &&
                        prevMsg.sender === m.sender &&
                        (prevMsg.channel || active.channel) === (m.channel || active.channel)
                    );
                    const msgDate = new Date(m.timestamp);
                    const prevDate = prevMsg ? new Date(prevMsg.timestamp) : null;
                    const showDateDivider =
                      !prevDate || msgDate.toDateString() !== prevDate.toDateString();
                    const dateLabel = (() => {
                      const today = new Date();
                      const yesterday = new Date();
                      yesterday.setDate(today.getDate() - 1);
                      if (msgDate.toDateString() === today.toDateString()) return 'Hoje';
                      if (msgDate.toDateString() === yesterday.toDateString()) return 'Ontem';
                      return msgDate.toLocaleDateString('pt-PT', {
                        day: '2-digit',
                        month: 'short',
                        year: msgDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
                      });
                    })();
                    const timeLabel = msgDate.toLocaleTimeString('pt-PT', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    // --- LAYOUT WHATSAPP / CHAT (balões limpos sem linhas horizontais) ---
                    if (!msgIsEmail) {
                      return (
                        <div key={m.id} className={sameSenderAsPrev && !showDateDivider ? 'mt-1' : 'mt-3 first:mt-0'}>
                          {showDateDivider && (
                            <div className="flex justify-center my-3">
                              <span className="px-3 py-0.5 rounded-full text-[10px] font-medium ds-muted bg-[rgb(var(--surface-2))]/80">
                                {dateLabel}
                              </span>
                            </div>
                          )}

                          <div className={`group flex items-end gap-1.5 ${isAgent ? 'justify-end' : 'justify-start'}`}>
                            {isAgent && (
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(active.id, m.id)}
                                title="Eliminar mensagem"
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 ds-subtle hover:text-rose-500 self-center"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}

                            <div
                              className={`max-w-[78%] sm:max-w-[70%] px-3.5 py-2 shadow-sm transition-colors ${
                                isAgent
                                  ? 'bg-emerald-600/20 text-[rgb(var(--text))] rounded-2xl rounded-tr-sm'
                                  : 'bg-[rgb(var(--surface-2))] text-[rgb(var(--text))] rounded-2xl rounded-tl-sm'
                              }`}
                            >
                              {!sameSenderAsPrev && (
                                <p
                                  className={`text-[11px] font-semibold mb-0.5 ${
                                    isAgent ? 'text-emerald-400' : 'text-brand'
                                  }`}
                                >
                                  {isAgent ? 'Equipa JOGIMIL' : active.clientName}
                                </p>
                              )}

                              {/* Anexos no balão */}
                              {m.attachments && m.attachments.length > 0 && (
                                <div className="space-y-1.5 mb-1.5">
                                  {m.attachments.map((att, aIdx) => {
                                    const href = att.url || att.dataUrl || '';
                                    if (att.type?.startsWith('image/') && href) {
                                      return (
                                        <a
                                          key={aIdx}
                                          href={href}
                                          target={att.url ? '_blank' : undefined}
                                          rel="noopener noreferrer"
                                          download={att.name}
                                          className="block rounded-xl overflow-hidden"
                                        >
                                          <img
                                            src={href}
                                            alt={att.name}
                                            className="max-h-56 w-auto object-contain bg-black/20 rounded-xl"
                                          />
                                        </a>
                                      );
                                    }
                                    return (
                                      <a
                                        key={aIdx}
                                        href={href || '#'}
                                        target={att.url ? '_blank' : undefined}
                                        rel="noopener noreferrer"
                                        download={att.name}
                                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-black/15 text-xs hover:text-brand transition-colors"
                                      >
                                        <FileText className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                        <span className="truncate max-w-[200px]">{att.name}</span>
                                        <Download className="h-3 w-3 ds-muted shrink-0 ml-auto" />
                                      </a>
                                    );
                                  })}
                                </div>
                              )}

                              {m.content && (
                                <p className="text-[13px] whitespace-pre-wrap break-words leading-relaxed text-left">
                                  {m.content}
                                </p>
                              )}

                              <div className="flex items-center justify-end gap-1 mt-1 -mb-0.5">
                                <span className="font-mono text-[10px] ds-subtle">{timeLabel}</span>
                                {isAgent && (
                                  <CheckCircle2 className="h-3 w-3 text-emerald-400/90" />
                                )}
                              </div>
                            </div>

                            {!isAgent && (
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(active.id, m.id)}
                                title="Eliminar mensagem"
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 ds-subtle hover:text-rose-500 self-center"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // --- LAYOUT EMAIL (suporte a template HTML estilo Gmail) ---
                    const detectedHtml =
                      m.html ||
                      (/<(?:!doctype\s+html|html|table|div|style|body)\b/i.test(m.content || '')
                        ? m.content
                        : '');
                    const hasHtmlTemplate = Boolean(detectedHtml && detectedHtml.trim().length > 0);
                    const showPlain = plainTextMsgIds.has(m.id);

                    return (
                      <div
                        key={m.id}
                        className={`group flex flex-col py-2 px-2 hover:bg-[rgb(var(--surface-2))]/25 transition-colors ${
                          isAgent ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`w-full ${
                            hasHtmlTemplate && !showPlain ? 'max-w-[94%]' : 'max-w-[84%]'
                          } flex flex-col space-y-1.5 ${isAgent ? 'items-end text-right' : 'items-start text-left'}`}
                        >
                          {/* Cabeçalho limpo do remetente + hora + ações */}
                          <div
                            className={`flex items-center gap-2 text-[11px] ${
                              isAgent ? 'flex-row-reverse' : 'flex-row'
                            }`}
                          >
                            <span className={`font-semibold ${isAgent ? 'text-brand' : 'text-[rgb(var(--text))]'}`}>
                              {isAgent ? 'Equipa JOGIMIL' : active.clientName}
                            </span>
                            <span className="font-mono text-[10px] ds-subtle uppercase">
                              EMAIL · {timeLabel}
                            </span>
                            {hasHtmlTemplate && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPlainTextMsgIds((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(m.id)) next.delete(m.id);
                                      else next.add(m.id);
                                      return next;
                                    })
                                  }
                                  className="inline-flex items-center gap-1 text-[10px] text-brand hover:underline"
                                  title={showPlain ? 'Ver template HTML' : 'Ver texto simples'}
                                >
                                  {showPlain ? <Eye className="h-3 w-3" /> : <Code2 className="h-3 w-3" />}
                                  <span>{showPlain ? 'Ver Template' : 'Texto'}</span>
                                </button>
                                {!showPlain && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedEmailPreview({
                                        subject: m.subject || active.subject,
                                        sender: isAgent ? 'Equipa JOGIMIL' : active.clientName,
                                        html: detectedHtml,
                                      })
                                    }
                                    className="inline-flex items-center gap-1 text-[10px] ds-muted hover:text-brand"
                                    title="Expandir preview do email"
                                  >
                                    <Maximize2 className="h-3 w-3" />
                                  </button>
                                )}
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(active.id, m.id)}
                              title="Eliminar mensagem"
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 ds-subtle hover:text-rose-500"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="w-full space-y-2">
                            {m.subject && (
                              <p
                                className={`text-xs font-semibold flex items-center gap-1.5 ${
                                  isAgent ? 'justify-end' : 'justify-start'
                                }`}
                              >
                                <Mail className="h-3.5 w-3.5 text-brand shrink-0" />
                                <span className="truncate">{m.subject}</span>
                              </p>
                            )}

                            {hasHtmlTemplate && !showPlain ? (
                              <div className="w-full rounded-none overflow-hidden bg-white shadow-md">
                                <iframe
                                  title={`Email ${m.id}`}
                                  srcDoc={buildEmailIframeSrcDoc(detectedHtml)}
                                  sandbox="allow-popups allow-popups-to-escape-sandbox"
                                  className="w-full h-[420px] border-0 bg-white block"
                                />
                              </div>
                            ) : (
                              m.content && (
                                <p className="text-[13px] whitespace-pre-wrap break-words leading-relaxed text-[rgb(var(--text))]/95">
                                  {m.content}
                                </p>
                              )
                            )}

                            {/* Anexos limpos em formato pill */}
                            {m.attachments && m.attachments.length > 0 && (
                              <div
                                className={`flex flex-wrap gap-1.5 pt-1 ${
                                  isAgent ? 'justify-end' : 'justify-start'
                                }`}
                              >
                                {m.attachments.map((att, aIdx) => {
                                  const href = att.url || att.dataUrl || '';
                                  if (att.type?.startsWith('image/') && href) {
                                    return (
                                      <a
                                        key={aIdx}
                                        href={href}
                                        target={att.url ? '_blank' : undefined}
                                        rel="noopener noreferrer"
                                        download={att.name}
                                        className="block rounded-xl overflow-hidden shadow-sm"
                                      >
                                        <img
                                          src={href}
                                          alt={att.name}
                                          className="max-h-44 object-contain bg-black/20"
                                        />
                                      </a>
                                    );
                                  }
                                  return (
                                    <a
                                      key={aIdx}
                                      href={href || '#'}
                                      target={att.url ? '_blank' : undefined}
                                      rel="noopener noreferrer"
                                      download={att.name}
                                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full ds-surface-2 text-xs hover:text-brand transition-colors"
                                    >
                                      <FileText className="h-3.5 w-3.5 text-brand shrink-0" />
                                      <span className="truncate max-w-[200px]">{att.name}</span>
                                      <Download className="h-3 w-3 ds-muted shrink-0" />
                                    </a>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer Moderno & Limpo (fixo na base) */}
              <form onSubmit={handleSendReply} className="mt-auto shrink-0 border-t ds-divider px-4 py-3 space-y-2.5" style={{ backgroundColor: 'rgb(var(--surface))' }}>
                {/* Cabeçalho de Email (apenas quando editado ou sem destinatário) */}
                {isEmailMode && (!hasEmailThread || showEmailHeaders) && (
                  <div className="space-y-2 pb-1">
                    {hasEmailThread && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setShowEmailHeaders(false)}
                          className="text-[11px] ds-muted hover:text-[rgb(var(--text))]"
                        >
                          Ocultar cabeçalho
                        </button>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="label mb-1">Para (Email) *</label>
                        <input
                          type="email"
                          value={emailTo}
                          onChange={(e) => setEmailTo(e.target.value)}
                          placeholder="cliente@empresa.ao"
                          className="input h-8 text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="label mb-1">CC (Opcional)</label>
                        <input
                          type="email"
                          value={emailCc}
                          onChange={(e) => setEmailCc(e.target.value)}
                          placeholder="copia@jogimiltecnologias.it.ao"
                          className="input h-8 text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="label mb-1">Assunto do Email</label>
                        <input
                          type="text"
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          placeholder="Assunto da resposta"
                          className="input h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Indicador compacto quando um template HTML/modelo está ativo */}
                {activeTemplateName && (
                  <div
                    className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl border border-brand/35 bg-brand/10 text-xs"
                  >
                    <span className="inline-flex items-center gap-1.5 truncate">
                      <LayoutTemplate className="h-3.5 w-3.5 text-brand shrink-0" />
                      <span>
                        Template ativo: <strong>{activeTemplateName}</strong>
                        {isEmailMode && effectiveEmailHtml ? ' (HTML)' : ''}
                      </span>
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setTemplateModalOpen(true)}
                        className="text-brand font-semibold hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTemplateName(null);
                          setEmailHtml('');
                          setTemplateMeta(null);
                        }}
                        className="text-rose-400 hover:underline"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                )}

                {/* Emails Agendados desta Conversa */}
                {isEmailMode && scheduledEmails.filter((s) => s.status !== 'sent').length > 0 && (
                  <div className="border ds-divider p-2.5 space-y-1.5" style={{ backgroundColor: 'rgb(var(--surface-2))' }}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold uppercase tracking-wider text-violet-500 inline-flex items-center gap-1.5">
                        <CalendarClock className="h-3.5 w-3.5" />
                        Emails Agendados ({scheduledEmails.filter((s) => s.status !== 'sent').length})
                      </span>
                      <span className="ds-muted">Sincronizado com Calendário</span>
                    </div>
                    <div className="divide-y ds-divider">
                      {scheduledEmails
                        .filter((s) => s.status !== 'sent')
                        .map((item) => (
                          <div key={item.id} className="py-1.5 flex items-center justify-between gap-2 text-xs">
                            <div className="min-w-0">
                              <p className="font-medium truncate">{item.subject}</p>
                              <p className="text-[11px] ds-muted">
                                {new Date(item.scheduledAt).toLocaleString('pt-PT', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                                {' · '}
                                {item.to}
                                {item.status === 'failed' && (
                                  <span className="text-rose-500 ml-1">· Erro: {item.error || 'Falha SMTP'}</span>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                disabled={sendingScheduledId === item.id}
                                onClick={() => handleSendScheduledNow(item.id)}
                                className="btn btn-secondary btn-sm h-7 px-2 text-[11px]"
                                title="Enviar imediatamente"
                              >
                                {sendingScheduledId === item.id ? 'A enviar...' : 'Enviar Agora'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCancelScheduled(item.id)}
                                className="btn btn-ghost btn-icon h-7 w-7 text-rose-500"
                                title="Cancelar agendamento"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Anexos Pendentes */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((att, idx) => {
                      const thumbSrc = att.url || att.dataUrl || '';
                      return (
                        <div
                          key={att.digitalFileId || `${att.name}_${idx}`}
                          className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full ds-surface-2 border ds-divider text-xs"
                        >
                          {att.type.startsWith('image/') && thumbSrc ? (
                            <img src={thumbSrc} alt={att.name} className="h-5 w-5 rounded-full object-cover" />
                          ) : (
                            <FileText className="h-3.5 w-3.5 text-brand" />
                          )}
                          <span className="max-w-[160px] truncate">{att.name}</span>
                          <span className="font-mono text-[10px] ds-subtle">{formatFileSize(att.size)}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(idx)}
                            className="text-rose-500 hover:text-rose-400"
                            title="Remover anexo"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Caixa Unificada Moderna de Mensagem */}
                <div
                  className={`flex items-end gap-2 px-3 py-2 rounded-2xl border transition-all duration-200 ${
                    isEmailMode
                      ? 'ds-surface-2 border-[rgb(var(--border))] focus-within:border-brand/70 focus-within:shadow-[0_0_0_3px_rgba(37,117,252,0.14)]'
                      : 'ds-surface-2 border-[rgb(var(--border))] focus-within:border-emerald-500/70 focus-within:shadow-[0_0_0_3px_rgba(16,185,129,0.14)]'
                  }`}
                >
                  {/* Botões rápidos de anexo e template à esquerda */}
                  <div className="flex items-center gap-0.5 pb-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Anexar ficheiro"
                      className="h-8 w-8 rounded-full inline-flex items-center justify-center ds-muted hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-3))] transition-colors"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      title="Anexar imagem"
                      className="h-8 w-8 rounded-full inline-flex items-center justify-center ds-muted hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-3))] transition-colors"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setLibraryPickerOpen(true)}
                      title="Anexar da Biblioteca de Arquivos Digitais"
                      className="h-8 w-8 rounded-full inline-flex items-center justify-center text-sky-400 hover:bg-[rgb(var(--surface-3))] transition-colors"
                    >
                      <FolderOpen className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemplateModalOpen(true)}
                      title="Estúdio de Templates"
                      className="h-8 w-8 rounded-full inline-flex items-center justify-center text-brand hover:bg-[rgb(var(--surface-3))] transition-colors"
                    >
                      <LayoutTemplate className="h-4 w-4" />
                    </button>
                    {isEmailMode && (
                      <button
                        type="button"
                        onClick={() => setShowEmailHeaders((v) => !v)}
                        title={showEmailHeaders ? 'Ocultar cabeçalho' : 'Editar Para / CC / Assunto'}
                        className={`h-8 w-8 rounded-full inline-flex items-center justify-center transition-colors ${
                          showEmailHeaders ? 'text-brand bg-brand/15' : 'ds-muted hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-3))]'
                        }`}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Input de mensagem limpo */}
                  <textarea
                    rows={isEmailMode ? 2 : 1}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (!isEmailMode && e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (!sending && (replyText.trim() || attachments.length > 0)) {
                          handleSendReply(e as unknown as React.FormEvent);
                        }
                      }
                    }}
                    placeholder={
                      isEmailMode
                        ? 'Escreva a sua resposta de email...'
                        : 'Escreva uma mensagem...'
                    }
                    className="flex-1 bg-transparent resize-none outline-none border-0 py-1.5 px-1 text-[13.5px] leading-relaxed text-[rgb(var(--text))] placeholder:text-[rgb(var(--text-subtle))] max-h-36 overflow-y-auto"
                  />

                  {/* Ações de envio à direita */}
                  <div className="flex items-center gap-1.5 pb-0.5 shrink-0">
                    {isEmailMode && (
                      <button
                        type="button"
                        onClick={openScheduleEmailModal}
                        disabled={sending || (!replyText.trim() && !effectiveEmailHtml.trim() && attachments.length === 0)}
                        title="Agendar envio de email"
                        className="h-9 w-9 rounded-full inline-flex items-center justify-center text-violet-400 hover:bg-violet-500/15 disabled:opacity-40 transition-colors"
                      >
                        <CalendarClock className="h-4 w-4" />
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={sending || (!replyText.trim() && !effectiveEmailHtml.trim() && attachments.length === 0)}
                      title={isEmailMode ? 'Enviar Email' : 'Enviar WhatsApp'}
                      className={`h-9 w-9 rounded-full inline-flex items-center justify-center text-white shadow-md transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                        isEmailMode
                          ? 'bg-brand hover:brightness-110 shadow-brand/30'
                          : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/30'
                      }`}
                    >
                      {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => {
                      handleFilesSelected(e.target.files);
                      e.target.value = '';
                    }}
                  />
                  <input
                    ref={imageInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      handleFilesSelected(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Modal Profissional de Templates & Preview */}
      <TemplateStudioModal
        isOpen={templateModalOpen}
        channel={isEmailMode ? 'email' : 'whatsapp'}
        initialSubject={emailSubject}
        initialBody={replyText}
        initialHtml={effectiveEmailHtml}
        initialMeta={templateMeta}
        recipientName={active?.clientName || 'Cliente'}
        onClose={() => setTemplateModalOpen(false)}
        onApply={({ subject, body, html, templateName, mode, templateId, category, headline, ctaLabel, ctaUrl }) => {
          if (subject) setEmailSubject(subject);
          setReplyText(body);
          if (html !== undefined) setEmailHtml(html);
          setActiveTemplateName(templateName);
          setTemplateMeta(
            isEmailMode
              ? {
                  mode: mode || 'visual',
                  templateId,
                  category: category || 'JOGIMIL Tecnologias',
                  headline: headline || subject || 'Comunicação Oficial',
                  ctaLabel: ctaLabel || '',
                  ctaUrl: ctaUrl || '',
                  templateName,
                }
              : null
          );
        }}
      />
      {/* Modal de Seleção de Arquivos Digitais (Biblioteca) */}
      <DigitalFilePickerModal
        open={libraryPickerOpen}
        alreadyAttachedIds={attachments.map((a) => a.digitalFileId).filter((x): x is string => Boolean(x))}
        onClose={() => setLibraryPickerOpen(false)}
        onSelect={(chosen) => {
          setAttachments((prev) => {
            const existingIds = new Set(prev.map((a) => a.digitalFileId).filter(Boolean));
            const additions = chosen
              .filter((f) => !existingIds.has(f.id))
              .map((f) => ({
                name: f.fileName || f.name,
                type: f.mimeType || 'application/octet-stream',
                size: f.size || 0,
                dataUrl: f.dataUrl || '',
                url: f.publicUrl || '',
                digitalFileId: f.id,
              }));
            return [...prev, ...additions];
          });
        }}
      />

      {/* Modal Rápido: Agendar no Calendário a partir do Email/Chat */}
      {quickCalendarOpen &&
        active &&
        createPortal(
          <div className="fixed inset-0 z-[105] bg-black/25 flex items-center justify-center p-4">
            <div
              className="ds-card w-full max-w-md border ds-divider shadow-2xl"
              style={{ backgroundColor: 'rgb(var(--surface))' }}
            >
              <div className="px-4 py-3 border-b ds-divider flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarPlus className="h-4 w-4 text-sky-500" />
                  <h3 className="text-sm font-semibold">Agendar no Calendário</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickCalendarOpen(false)}
                  className="btn btn-ghost btn-icon h-7 w-7"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!quickCalendarForm.title.trim() || !quickCalendarForm.startAt) return;
                  setSavingQuickCalendar(true);
                  try {
                    const startIso = new Date(quickCalendarForm.startAt).toISOString();
                    const endIso = new Date(new Date(quickCalendarForm.startAt).getTime() + 3600000).toISOString();
                    const res = await fetch(apiUrl('/api/v1/admin/calendar/events'), {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        title: quickCalendarForm.title.trim(),
                        type: quickCalendarForm.type,
                        startAt: startIso,
                        endAt: endIso,
                        location: quickCalendarForm.location.trim(),
                        description: quickCalendarForm.description.trim(),
                        contactName: active.clientName,
                        createLinkedTask: quickCalendarForm.createLinkedTask,
                      }),
                    });
                    const json = await res.json();
                    if (!res.ok || !json.success) throw new Error(json.message || 'Falha ao agendar');
                    setQuickCalendarOpen(false);
                    setNotice({
                      type: 'success',
                      title: 'Agendado no Calendário',
                      text: quickCalendarForm.createLinkedTask
                        ? 'Evento criado no Calendário e vinculado em Tarefas & Processos.'
                        : 'Evento criado no Calendário Corporativo.',
                    });
                  } catch (err) {
                    setNotice({
                      type: 'error',
                      title: 'Erro ao agendar',
                      text: err instanceof Error ? err.message : 'Não foi possível criar o evento.',
                    });
                  } finally {
                    setSavingQuickCalendar(false);
                  }
                }}
                className="p-4 space-y-3 text-xs"
              >
                <div>
                  <label className="block text-[11px] font-semibold uppercase ds-muted mb-1">Título *</label>
                  <input
                    required
                    value={quickCalendarForm.title}
                    onChange={(e) => setQuickCalendarForm({ ...quickCalendarForm, title: e.target.value })}
                    className="input w-full text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase ds-muted mb-1">Tipo</label>
                    <select
                      value={quickCalendarForm.type}
                      onChange={(e) => setQuickCalendarForm({ ...quickCalendarForm, type: e.target.value })}
                      className="input w-full text-xs"
                    >
                      <option value="reuniao">Reunião</option>
                      <option value="followup">Follow-up</option>
                      <option value="entrega">Entrega</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase ds-muted mb-1">Data e Hora *</label>
                    <input
                      type="datetime-local"
                      required
                      value={quickCalendarForm.startAt}
                      onChange={(e) => setQuickCalendarForm({ ...quickCalendarForm, startAt: e.target.value })}
                      className="input w-full text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase ds-muted mb-1">Local / Contacto</label>
                  <input
                    value={quickCalendarForm.location}
                    onChange={(e) => setQuickCalendarForm({ ...quickCalendarForm, location: e.target.value })}
                    className="input w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase ds-muted mb-1">Notas</label>
                  <textarea
                    rows={2}
                    value={quickCalendarForm.description}
                    onChange={(e) => setQuickCalendarForm({ ...quickCalendarForm, description: e.target.value })}
                    className="input w-full text-xs"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={quickCalendarForm.createLinkedTask}
                    onChange={(e) =>
                      setQuickCalendarForm({ ...quickCalendarForm, createLinkedTask: e.target.checked })
                    }
                    className="accent-sky-600"
                  />
                  <span>Criar também tarefa vinculada em Tarefas & Processos</span>
                </label>
                <div className="flex justify-end gap-2 pt-2 border-t ds-divider">
                  <button
                    type="button"
                    onClick={() => setQuickCalendarOpen(false)}
                    className="btn btn-secondary btn-sm"
                  >
                    Cancelar
                  </button>
                  <button type="submit" disabled={savingQuickCalendar} className="btn btn-primary btn-sm">
                    {savingQuickCalendar ? 'A agendar...' : 'Agendar Evento'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Modal Rápido: Criar Tarefa / Processo a partir do Email/Chat */}
      {quickTaskOpen &&
        active &&
        createPortal(
          <div className="fixed inset-0 z-[105] bg-black/25 flex items-center justify-center p-4">
            <div
              className="ds-card w-full max-w-md border ds-divider shadow-2xl"
              style={{ backgroundColor: 'rgb(var(--surface))' }}
            >
              <div className="px-4 py-3 border-b ds-divider flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-indigo-500" />
                  <h3 className="text-sm font-semibold">Criar Tarefa / Processo</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickTaskOpen(false)}
                  className="btn btn-ghost btn-icon h-7 w-7"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!quickTaskForm.title.trim()) return;
                  setSavingQuickTask(true);
                  try {
                    const res = await fetch(apiUrl('/api/v1/admin/tasks'), {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        title: quickTaskForm.title.trim(),
                        category: quickTaskForm.category,
                        priority: quickTaskForm.priority,
                        dueDate: quickTaskForm.dueDate ? `${quickTaskForm.dueDate}T09:00:00.000Z` : null,
                        description: quickTaskForm.description.trim(),
                        contactName: active.clientName,
                        syncToCalendar: quickTaskForm.syncToCalendar,
                      }),
                    });
                    const json = await res.json();
                    if (!res.ok || !json.success) throw new Error(json.message || 'Falha ao criar processo');
                    setQuickTaskOpen(false);
                    setNotice({
                      type: 'success',
                      title: 'Processo criado',
                      text: `Processo ${json.task?.code || ''} criado e sincronizado com o Calendário.`,
                    });
                  } catch (err) {
                    setNotice({
                      type: 'error',
                      title: 'Erro ao criar processo',
                      text: err instanceof Error ? err.message : 'Falha ao criar processo.',
                    });
                  } finally {
                    setSavingQuickTask(false);
                  }
                }}
                className="p-4 space-y-3 text-xs"
              >
                <div>
                  <label className="block text-[11px] font-semibold uppercase ds-muted mb-1">Título *</label>
                  <input
                    required
                    value={quickTaskForm.title}
                    onChange={(e) => setQuickTaskForm({ ...quickTaskForm, title: e.target.value })}
                    className="input w-full text-xs"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase ds-muted mb-1">Categoria</label>
                    <select
                      value={quickTaskForm.category}
                      onChange={(e) => setQuickTaskForm({ ...quickTaskForm, category: e.target.value })}
                      className="input w-full text-xs"
                    >
                      <option value="suporte">Suporte</option>
                      <option value="comercial">Comercial</option>
                      <option value="operacao">Operação</option>
                      <option value="entrega">Entrega</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase ds-muted mb-1">Prioridade</label>
                    <select
                      value={quickTaskForm.priority}
                      onChange={(e) => setQuickTaskForm({ ...quickTaskForm, priority: e.target.value })}
                      className="input w-full text-xs"
                    >
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase ds-muted mb-1">Prazo</label>
                    <input
                      type="date"
                      value={quickTaskForm.dueDate}
                      onChange={(e) => setQuickTaskForm({ ...quickTaskForm, dueDate: e.target.value })}
                      className="input w-full text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase ds-muted mb-1">Descrição</label>
                  <textarea
                    rows={3}
                    value={quickTaskForm.description}
                    onChange={(e) => setQuickTaskForm({ ...quickTaskForm, description: e.target.value })}
                    className="input w-full text-xs"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={quickTaskForm.syncToCalendar}
                    onChange={(e) => setQuickTaskForm({ ...quickTaskForm, syncToCalendar: e.target.checked })}
                    className="accent-sky-600"
                  />
                  <span>Sincronizar prazo automaticamente no Calendário</span>
                </label>
                <div className="flex justify-end gap-2 pt-2 border-t ds-divider">
                  <button
                    type="button"
                    onClick={() => setQuickTaskOpen(false)}
                    className="btn btn-secondary btn-sm"
                  >
                    Cancelar
                  </button>
                  <button type="submit" disabled={savingQuickTask} className="btn btn-primary btn-sm">
                    {savingQuickTask ? 'A criar...' : 'Criar Processo'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Modal Rápido: Configurações de Email (SMTP/IMAP) & CalDAV / CardDAV */}
      {mailConfigOpen &&
        createPortal(
          <div className="fixed inset-0 z-[105] bg-black/25 flex items-center justify-center p-4">
            <div
              className="ds-card w-full max-w-lg border ds-divider shadow-2xl"
              style={{ backgroundColor: 'rgb(var(--surface))' }}
            >
              <div className="px-5 py-3.5 border-b ds-divider flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-sky-500" />
                  <h3 className="text-sm font-semibold">Configurações de Email, IMAP & CalDAV</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMailConfigOpen(false)}
                  className="btn btn-ghost btn-icon h-7 w-7"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-5 space-y-3.5 text-xs">
                {mailConfigLoading ? (
                  <p className="ds-muted py-6 text-center">A verificar estado do servidor de correio e CalDAV...</p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2.5 font-mono text-[11px]">
                      <div className="p-2.5 border ds-divider">
                        <p className="ds-muted uppercase text-[10px]">SMTP (Saída SSL/TLS)</p>
                        <p className="mt-0.5">
                          {mailConfigData.email?.smtp?.host || 'mx109.angoweb.net'}:
                          {mailConfigData.email?.smtp?.port || 465}
                        </p>
                        <span
                          className={`text-[10px] ${
                            mailConfigData.email?.smtp?.verified ? 'text-emerald-500' : 'text-amber-500'
                          }`}
                        >
                          {mailConfigData.email?.smtp?.verified ? '● Verificado' : '● Pendente'}
                        </span>
                      </div>
                      <div className="p-2.5 border ds-divider">
                        <p className="ds-muted uppercase text-[10px]">IMAP (Entrada SSL/TLS)</p>
                        <p className="mt-0.5">
                          {mailConfigData.email?.imap?.host || 'mx109.angoweb.net'}:
                          {mailConfigData.email?.imap?.port || 993}
                        </p>
                        <span
                          className={`text-[10px] ${
                            mailConfigData.email?.imap?.authenticated ? 'text-emerald-500' : 'text-amber-500'
                          }`}
                        >
                          {mailConfigData.email?.imap?.authenticated ? '● Autenticado' : '● Pendente'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 border ds-divider space-y-1 font-mono text-[11px]">
                      <p className="ds-muted uppercase text-[10px]">cPanel CalDAV & CardDAV (Porta 2080)</p>
                      <p className="break-all">{mailConfigData.caldav?.caldavUrl || 'https://mx109.angoweb.net:2080/calendars/geral@jogimiltecnologias.it.ao/calendar'}</p>
                      <p className="font-sans text-[11px] ds-muted pt-1">
                        {mailConfigData.caldav?.diagnostic || 'Calendário nativo JOGIMIL ativo.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t ds-divider">
                      <a
                        href={apiUrl('/api/v1/admin/calendar/export.ics')}
                        download="jogimil-calendario.ics"
                        className="btn btn-secondary btn-sm gap-1.5"
                      >
                        <Download className="h-3.5 w-3.5" /> Exportar .ICS
                      </a>
                      <button
                        type="button"
                        onClick={async () => {
                          await fetch(apiUrl('/api/v1/admin/email/sync-inbox'), { method: 'POST' }).catch(() => {});
                          await loadTickets(false);
                          setMailConfigOpen(false);
                          setNotice({
                            type: 'success',
                            title: 'Caixa IMAP sincronizada',
                            text: 'Os emails mais recentes foram atualizados no Atendimento.',
                          });
                        }}
                        className="btn btn-primary btn-sm gap-1.5"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Sincronizar Caixa IMAP
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Modal de Agendamento de Envio de Email (Integrado com Calendário) */}
      {scheduleModalOpen &&
        active &&
        createPortal(
          <div className="fixed inset-0 z-[105] bg-black/25 flex items-center justify-center p-4">
            <div
              className="ds-card w-full max-w-md border ds-divider shadow-2xl"
              style={{ backgroundColor: 'rgb(var(--surface))' }}
            >
              <div className="px-4 py-3 border-b ds-divider flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-violet-500" />
                  <h3 className="text-sm font-semibold">Agendar Envio de Email</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="btn btn-ghost btn-icon h-7 w-7"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleScheduleEmailSubmit} className="p-4 space-y-3.5 text-xs">
                <div className="p-2.5 border ds-divider space-y-1">
                  <p className="ds-muted">
                    <strong>Para:</strong> {emailTo.trim() || active.clientEmail || active.clientContact}
                  </p>
                  <p className="ds-muted truncate">
                    <strong>Assunto:</strong> {emailSubject.trim() || `Re: ${active.subject}`}
                  </p>
                  {attachments.length > 0 && (
                    <p className="ds-muted">
                      <strong>Anexos:</strong> {attachments.length} ficheiro(s) incluído(s)
                    </p>
                  )}
                </div>

                {/* Atalhos Rápidos de Data/Hora */}
                <div>
                  <p className="text-[11px] font-semibold uppercase ds-muted mb-1.5">Atalhos Rápidos</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      {
                        label: 'Em 2 horas',
                        get: () => new Date(Date.now() + 2 * 3600 * 1000),
                      },
                      {
                        label: 'Amanhã 09:00',
                        get: () => {
                          const d = new Date(Date.now() + 24 * 3600 * 1000);
                          d.setHours(9, 0, 0, 0);
                          return d;
                        },
                      },
                      {
                        label: 'Próx. Segunda 09:00',
                        get: () => {
                          const d = new Date();
                          const diff = ((8 - d.getDay()) % 7) || 7;
                          d.setDate(d.getDate() + diff);
                          d.setHours(9, 0, 0, 0);
                          return d;
                        },
                      },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          const d = preset.get();
                          const pad = (n: number) => String(n).padStart(2, '0');
                          setScheduleDateTime(
                            `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
                          );
                        }}
                        className="btn btn-secondary btn-sm text-[11px] justify-center"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase ds-muted mb-1">
                    Data e Hora do Disparo *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduleDateTime}
                    onChange={(e) => setScheduleDateTime(e.target.value)}
                    className="input w-full text-xs"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={scheduleSyncCalendar}
                    onChange={(e) => setScheduleSyncCalendar(e.target.checked)}
                    className="accent-violet-500"
                  />
                  <span>Registar automaticamente no <strong>Calendário Corporativo</strong></span>
                </label>

                <div className="flex justify-end gap-2 pt-2 border-t ds-divider">
                  <button
                    type="button"
                    onClick={() => setScheduleModalOpen(false)}
                    className="btn btn-secondary btn-sm"
                  >
                    Cancelar
                  </button>
                  <button type="submit" disabled={schedulingEmail} className="btn btn-primary btn-sm gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5" />
                    <span>{schedulingEmail ? 'A agendar...' : 'Confirmar Agendamento'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Modal de Partilha de Atendimento / SMS (Admin) */}
      {shareModalOpen && active &&
        createPortal(
          <div className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4">
            <div
              className="ds-card w-full max-w-md border ds-divider shadow-2xl"
              style={{ backgroundColor: 'rgb(var(--surface))' }}
            >
              <div className="px-5 py-3.5 border-b ds-divider flex items-center justify-between">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5">
                    <Share2 className="h-4 w-4 text-brand" />
                    <span>Partilhar Atendimento</span>
                  </h3>
                  <p className="text-[11px] ds-muted truncate">{active.clientName} · {active.subject}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShareModalOpen(false)}
                  className="btn btn-ghost btn-icon h-7 w-7"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-5 space-y-3">
                <p className="text-xs ds-muted">
                  Selecione quais utilizadores poderão ver e responder a esta conversa/mensagens (além dos Administradores):
                </p>
                {shareUsers.length === 0 ? (
                  <p className="text-xs ds-subtle py-4 text-center">
                    Ainda não existem outros utilizadores criados. Adicione perfis em <strong>Utilizadores & Acessos</strong>.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {shareUsers.map((u) => {
                      const checked = shareSelectedIds.includes(u.id);
                      return (
                        <label
                          key={u.id}
                          className="flex items-center justify-between gap-2 px-3 py-2 border ds-divider ds-surface-2 text-xs cursor-pointer"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                setShareSelectedIds((prev) =>
                                  e.target.checked ? [...prev, u.id] : prev.filter((id) => id !== u.id)
                                )
                              }
                              className="h-3.5 w-3.5 accent-[rgb(var(--brand))]"
                            />
                            <span className="min-w-0">
                              <strong className="block truncate">{u.name}</strong>
                              <span className="text-[10px] ds-muted block truncate">{u.email}</span>
                            </span>
                          </span>
                          <span className="text-[10px] font-mono uppercase ds-muted">{u.role}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="px-5 py-3 border-t ds-divider flex justify-end gap-2">
                <button type="button" onClick={() => setShareModalOpen(false)} className="btn btn-secondary btn-sm">
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={savingShareTicket}
                  onClick={handleSaveTicketShare}
                  className="btn btn-primary btn-sm"
                >
                  {savingShareTicket ? 'A guardar...' : 'Guardar Partilha'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Modal Expandido de Preview de Template HTML de Email */}
      {expandedEmailPreview &&
        createPortal(
          <div className="fixed inset-0 z-[115] bg-black/60 flex items-center justify-center p-4">
            <div
              className="ds-card w-full max-w-4xl h-[86vh] border ds-divider shadow-2xl flex flex-col overflow-hidden"
              style={{ backgroundColor: 'rgb(var(--surface))' }}
            >
              <div className="px-5 py-3.5 border-b ds-divider flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{expandedEmailPreview.subject}</p>
                  <p className="text-[11px] ds-muted truncate">De: {expandedEmailPreview.sender}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedEmailPreview(null)}
                  className="btn btn-ghost btn-icon h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 bg-white overflow-hidden">
                <iframe
                  title="Preview Completo de Email"
                  srcDoc={buildEmailIframeSrcDoc(expandedEmailPreview.html)}
                  sandbox="allow-popups allow-popups-to-escape-sandbox"
                  className="w-full h-full border-0 bg-white"
                />
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Modal Personalizado de Confirmação & Popup de Sucesso */}
      <ConfirmModal
        isOpen={Boolean(confirmState)}
        title={confirmState?.title || ''}
        description={confirmState?.description || ''}
        loading={deleting}
        onCancel={() => setConfirmState(null)}
        onConfirm={() => confirmState?.onConfirm()}
      />
      <FeedbackPopup notice={notice} onClose={() => setNotice(null)} />
    </div>
  );
}
