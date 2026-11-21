import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Send,
  Smartphone,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  FileText,
  Search,
  CheckSquare,
  Square,
  LayoutTemplate,
  FolderOpen,
  Paperclip,
  X,
  Bookmark,
  Save,
  Trash2,
  Eye,
  XCircle,
  AlertTriangle,
  UserCheck,
  Edit3,
  CalendarClock,
  Calendar,
  ListTodo,
  Play,
  Printer,
  Download,
} from 'lucide-react';
import { apiFetch, apiUrl } from '../lib/api';
import { Pagination } from './Pagination';
import { BrandLoader } from './BrandLoader';
import { AdminIcon3D } from './AdminIcon3D';
import { TemplateStudioModal, type AppliedTemplateMeta } from './TemplateStudioModal';
import { DigitalFilePickerModal } from './DigitalFilePickerModal';
import type { DigitalFileItem } from './DigitalFilesManager';
import { buildBrandedEmailHtml } from '../lib/emailTemplates';

interface BroadcastAttachment {
  name: string;
  type: string;
  size: number;
  url?: string;
  digitalFileId: string;
}

interface DeliveryItem {
  contactId?: string;
  name: string;
  company?: string;
  channel: 'email' | 'whatsapp' | 'sms' | string;
  target: string;
  status: 'delivered' | 'failed' | 'skipped';
  error?: string;
  timestamp?: string;
}

interface BroadcastRecord {
  id: string;
  title: string;
  channels: string[];
  audience: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  skippedCount?: number;
  subject?: string;
  message: string;
  attachments?: BroadcastAttachment[];
  deliveries?: DeliveryItem[];
  status: string;
  createdAt: string;
}

interface SavedCampaign {
  id: string;
  title: string;
  channels: string[];
  subject?: string;
  message: string;
  html?: string;
  templateName?: string | null;
  attachments?: BroadcastAttachment[];
  createdAt: string;
  updatedAt?: string;
}

interface ScheduledBroadcast {
  id: string;
  title: string;
  channels: string[];
  audience: string;
  totalRecipients: number;
  subject?: string;
  message: string;
  attachments?: BroadcastAttachment[];
  scheduledAt: string;
  status: 'pending' | 'processing' | 'sent' | 'partial' | 'failed';
  broadcastId?: string | null;
  deliveredCount?: number;
  failedCount?: number;
  skippedCount?: number;
  error?: string;
  syncToCalendar?: boolean;
  calendarEventId?: string | null;
  syncToTask?: boolean;
  taskId?: string | null;
  createdAt: string;
  sentAt?: string | null;
}

interface ContactSummary {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  stage?: string;
  status?: string;
}

interface MassBroadcastProps {
  theme?: 'dark' | 'light';
}

function formatAttachmentBytes(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function MassBroadcast(_props: MassBroadcastProps) {
  const [campaigns, setCampaigns] = useState<BroadcastRecord[]>([]);
  const [savedCampaigns, setSavedCampaigns] = useState<SavedCampaign[]>([]);
  const [scheduledBroadcasts, setScheduledBroadcasts] = useState<ScheduledBroadcast[]>([]);
  const [contacts, setContacts] = useState<ContactSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [dispatchingScheduleId, setDispatchingScheduleId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [rightTab, setRightTab] = useState<'history' | 'scheduled' | 'saved'>('history');

  // Agendamento automático (opcional) + Integrações opcionais (Agenda & Processos)
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [syncToCalendar, setSyncToCalendar] = useState(false);
  const [syncToTask, setSyncToTask] = useState(false);

  // Estado do Compositor
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [channels, setChannels] = useState<string[]>(['email', 'whatsapp']);
  const [audience, setAudience] = useState<'all' | 'novos' | 'negociacao' | 'whatsapp' | 'email' | 'custom'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [emailHtml, setEmailHtml] = useState('');
  const [activeTemplateName, setActiveTemplateName] = useState<string | null>(null);
  const [templateMeta, setTemplateMeta] = useState<AppliedTemplateMeta | null>(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [attachments, setAttachments] = useState<BroadcastAttachment[]>([]);
  const [filePickerOpen, setFilePickerOpen] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal de Relatório Detalhado de Entregas
  const [reportCampaign, setReportCampaign] = useState<BroadcastRecord | null>(null);
  const [reportStatusFilter, setReportStatusFilter] = useState<'all' | 'delivered' | 'failed' | 'skipped'>('all');
  const [reportChannelFilter, setReportChannelFilter] = useState<'all' | 'email' | 'whatsapp' | 'sms'>('all');

  const composerRef = useRef<HTMLFormElement | null>(null);

  const effectiveEmailHtml = useMemo(() => {
    if (!channels.includes('email')) return '';
    if (templateMeta?.mode === 'visual') {
      return buildBrandedEmailHtml({
        category: templateMeta.category,
        headline: templateMeta.headline || subject || title || 'Comunicação Oficial',
        body: message,
        ctaLabel: templateMeta.ctaLabel,
        ctaUrl: templateMeta.ctaUrl,
        previewLocalLogo: false,
      });
    }
    return emailHtml;
  }, [channels, templateMeta, subject, title, message, emailHtml]);

  const showNotice = (type: 'success' | 'error', text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 6000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [bcRes, savedRes, schedRes, ctRes] = await Promise.all([
        apiFetch<{ broadcasts?: BroadcastRecord[]; data?: BroadcastRecord[] }>('/api/v1/admin/broadcast'),
        apiFetch<{ campaigns?: SavedCampaign[]; data?: SavedCampaign[] }>('/api/v1/admin/broadcast/campaigns').catch(
          () => ({ campaigns: [] })
        ),
        apiFetch<{ scheduled?: ScheduledBroadcast[]; data?: ScheduledBroadcast[] }>('/api/v1/admin/broadcast/scheduled').catch(
          () => ({ scheduled: [] })
        ),
        apiFetch<{ contacts?: ContactSummary[] }>('/api/v1/admin/contacts'),
      ]);
      setCampaigns(bcRes.broadcasts || bcRes.data || []);
      setSavedCampaigns(savedRes.campaigns || (savedRes as { data?: SavedCampaign[] }).data || []);
      setScheduledBroadcasts(schedRes.scheduled || (schedRes as { data?: ScheduledBroadcast[] }).data || []);
      setContacts(ctRes.contacts || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const visibleContacts = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) =>
      [c.name, c.company, c.email, c.phone].join(' ').toLowerCase().includes(q)
    );
  }, [contacts, contactSearch]);

  const targetRecipients = useMemo(() => {
    if (audience === 'custom') {
      const set = new Set(selectedIds);
      return contacts.filter((c) => set.has(c.id));
    }
    return contacts.filter((c) => {
      if (audience === 'novos') return (c.stage || c.status) === 'novo';
      if (audience === 'negociacao')
        return (c.stage || c.status) === 'negociacao' || (c.stage || c.status) === 'proposta';
      if (audience === 'whatsapp') return Boolean(c.phone);
      if (audience === 'email') return Boolean(c.email);
      return true;
    });
  }, [contacts, audience, selectedIds]);

  const recipientChannelStats = useMemo(() => {
    const emailRegex = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
    const withEmail = targetRecipients.filter((r) => emailRegex.test(String(r.email || '').trim())).length;
    const withPhone = targetRecipients.filter((r) => /\d{7,}/.test(String(r.phone || '').trim())).length;
    return {
      withEmail,
      missingEmail: targetRecipients.length - withEmail,
      withPhone,
      missingPhone: targetRecipients.length - withPhone,
    };
  }, [targetRecipients]);

  const toggleContact = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      visibleContacts.forEach((c) => next.add(c.id));
      return Array.from(next);
    });
  };

  const clearSelection = () => setSelectedIds([]);

  const toggleChannel = (ch: string) => {
    setChannels((prev) => (prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]));
  };

  const clearComposer = () => {
    setEditingCampaignId(null);
    setTitle('');
    setSubject('');
    setMessage('');
    setEmailHtml('');
    setActiveTemplateName(null);
    setTemplateMeta(null);
    setAttachments([]);
    setScheduleEnabled(false);
    setScheduledAt('');
    setSyncToCalendar(false);
    setSyncToTask(false);
  };

  const loadSavedCampaignIntoComposer = (
    cmp: SavedCampaign,
    mode: 'mass' | 'individual' | 'edit' | 'schedule'
  ) => {
    setTitle(cmp.title || '');
    setChannels(Array.isArray(cmp.channels) && cmp.channels.length > 0 ? cmp.channels : ['email']);
    setSubject(cmp.subject || '');
    setMessage(cmp.message || '');
    setEmailHtml(cmp.html || '');
    setActiveTemplateName(cmp.templateName || null);
    setTemplateMeta(null);
    setAttachments(
      Array.isArray(cmp.attachments)
        ? cmp.attachments.filter((a) => Boolean(a?.digitalFileId || a?.url || a?.name))
        : []
    );

    if (mode === 'edit') {
      setEditingCampaignId(cmp.id);
      setScheduleEnabled(false);
      showNotice('success', `A editar a campanha "${cmp.title}". Guarde as alterações quando terminar.`);
    } else if (mode === 'schedule') {
      setEditingCampaignId(null);
      setScheduleEnabled(true);
      if (!scheduledAt) {
        const nextHour = new Date(Date.now() + 60 * 60 * 1000);
        const pad = (n: number) => String(n).padStart(2, '0');
        setScheduledAt(
          `${nextHour.getFullYear()}-${pad(nextHour.getMonth() + 1)}-${pad(nextHour.getDate())}T${pad(nextHour.getHours())}:${pad(nextHour.getMinutes())}`
        );
      }
      showNotice(
        'success',
        `Campanha "${cmp.title}" carregada para agendamento automático. Defina data/hora e integrações opcionais.`
      );
    } else if (mode === 'individual') {
      setEditingCampaignId(null);
      setAudience('custom');
      showNotice(
        'success',
        `Campanha "${cmp.title}" carregada para envio individual. Selecione 1 ou mais contactos na lista.`
      );
    } else {
      setEditingCampaignId(null);
      setAudience('all');
      showNotice(
        'success',
        `Campanha "${cmp.title}" carregada para envio em massa. Escolha o segmento e clique em Disparar.`
      );
    }

    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSaveCampaign = async () => {
    if (!title.trim()) {
      showNotice('error', 'Informe o título da campanha antes de guardar.');
      return;
    }
    if (!message.trim() && attachments.length === 0) {
      showNotice('error', 'Escreva uma mensagem ou anexe um arquivo da biblioteca para guardar a campanha.');
      return;
    }

    setSavingCampaign(true);
    try {
      const payload = {
        title: title.trim(),
        channels: channels.length > 0 ? channels : ['email'],
        subject: subject.trim(),
        message: message.trim(),
        html: effectiveEmailHtml || '',
        templateName: activeTemplateName,
        attachments: attachments.map((a) => ({
          name: a.name,
          type: a.type,
          size: a.size,
          url: a.url || '',
          digitalFileId: a.digitalFileId,
        })),
      };

      const url = editingCampaignId
        ? `/api/v1/admin/broadcast/campaigns/${editingCampaignId}`
        : '/api/v1/admin/broadcast/campaigns';
      const method = editingCampaignId ? 'PUT' : 'POST';

      const res = await apiFetch<{ success: boolean; campaign?: SavedCampaign; message?: string }>(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (res.success) {
        showNotice(
          'success',
          editingCampaignId
            ? `Campanha "${title.trim()}" atualizada com sucesso.`
            : `Campanha "${title.trim()}" guardada! Já pode reutilizá-la em envios individuais ou em massa.`
        );
        setEditingCampaignId(null);
        setRightTab('saved');
        await loadData();
      }
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Falha ao guardar campanha.');
    } finally {
      setSavingCampaign(false);
    }
  };

  const handleDeleteSavedCampaign = async (cmp: SavedCampaign) => {
    try {
      await apiFetch(`/api/v1/admin/broadcast/campaigns/${cmp.id}`, { method: 'DELETE' });
      if (editingCampaignId === cmp.id) setEditingCampaignId(null);
      showNotice('success', `Campanha "${cmp.title}" eliminada.`);
      await loadData();
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Falha ao eliminar campanha.');
    }
  };

  const handleSendScheduledNow = async (item: ScheduledBroadcast) => {
    setDispatchingScheduleId(item.id);
    try {
      const res = await apiFetch<{ success: boolean; campaign?: BroadcastRecord; message?: string }>(
        `/api/v1/admin/broadcast/scheduled/${item.id}/send-now`,
        { method: 'POST' }
      );
      showNotice(
        res.success ? 'success' : 'error',
        res.message || (res.success ? 'Campanha agendada disparada com sucesso.' : 'Falha ao disparar campanha.')
      );
      if (res.campaign) {
        setReportStatusFilter('all');
        setReportChannelFilter('all');
        setReportCampaign(res.campaign);
      }
      await loadData();
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Falha ao disparar campanha agendada.');
    } finally {
      setDispatchingScheduleId(null);
    }
  };

  const handleDeleteScheduled = async (item: ScheduledBroadcast) => {
    try {
      await apiFetch(`/api/v1/admin/broadcast/scheduled/${item.id}`, { method: 'DELETE' });
      showNotice('success', `Agendamento "${item.title}" removido.`);
      await loadData();
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Falha ao remover agendamento.');
    }
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || (!message.trim() && attachments.length === 0) || channels.length === 0) {
      showNotice('error', 'Preencha o título, escreva uma mensagem ou anexe um arquivo e selecione pelo menos um canal.');
      return;
    }
    if (audience === 'custom' && targetRecipients.length === 0) {
      showNotice('error', 'Selecione pelo menos um contacto na lista individual.');
      return;
    }
    if (scheduleEnabled && !scheduledAt) {
      showNotice('error', 'Indique a data e hora para o envio automático da campanha.');
      return;
    }

    setSending(true);
    try {
      const audienceLabels: Record<typeof audience, string> = {
        all: 'Todos os Contactos CRM',
        novos: 'Novos Leads',
        negociacao: 'Em Proposta / Negociação',
        whatsapp: 'Contactos com WhatsApp',
        email: 'Contactos com Email',
        custom: `Seleção Individual (${targetRecipients.length})`,
      };

      const basePayload = {
        title: title.trim(),
        channels,
        audience: audienceLabels[audience],
        totalRecipients: targetRecipients.length,
        recipients: targetRecipients.map((r) => ({
          id: r.id,
          name: r.name,
          company: r.company || '',
          email: r.email || '',
          phone: r.phone || '',
        })),
        subject: subject.trim(),
        message: message.trim(),
        html: channels.includes('email') && effectiveEmailHtml.trim() ? effectiveEmailHtml : undefined,
        attachments: attachments.map((a) => ({
          name: a.name,
          type: a.type,
          size: a.size,
          url: a.url || '',
          digitalFileId: a.digitalFileId,
        })),
      };

      if (scheduleEnabled) {
        const res = await apiFetch<{ success: boolean; message?: string }>('/api/v1/admin/broadcast/scheduled', {
          method: 'POST',
          body: JSON.stringify({
            ...basePayload,
            scheduledAt: new Date(scheduledAt).toISOString(),
            syncToCalendar,
            syncToTask,
          }),
        });
        if (res.success) {
          showNotice('success', res.message || `Campanha "${title.trim()}" agendada com sucesso.`);
          setRightTab('scheduled');
          if (!editingCampaignId) clearComposer();
          if (audience === 'custom') setSelectedIds([]);
          await loadData();
        }
        return;
      }

      const res = await apiFetch<{ success: boolean; campaign?: BroadcastRecord; data?: BroadcastRecord }>(
        '/api/v1/admin/broadcast',
        {
          method: 'POST',
          body: JSON.stringify(basePayload),
        }
      );

      if (res.success) {
        const c = res.campaign || res.data;
        const ok = c?.deliveredCount ?? 0;
        const fail = c?.failedCount ?? 0;
        const skip = c?.skippedCount ?? 0;
        showNotice(
          fail > 0 && ok === 0 ? 'error' : 'success',
          `Campanha "${title.trim()}": ${ok} enviado(s) com sucesso, ${fail} falharam, ${skip} não enviado(s).`
        );
        if (c) {
          setReportStatusFilter('all');
          setReportChannelFilter('all');
          setReportCampaign(c);
        }
        setRightTab('history');
        if (!editingCampaignId) {
          clearComposer();
        }
        if (audience === 'custom') setSelectedIds([]);
        await loadData();
      }
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Falha ao processar campanha.');
    } finally {
      setSending(false);
    }
  };

  const filteredReportDeliveries = useMemo(() => {
    const list = reportCampaign?.deliveries || [];
    return list.filter((d) => {
      if (reportStatusFilter !== 'all' && d.status !== reportStatusFilter) return false;
      if (reportChannelFilter !== 'all' && d.channel !== reportChannelFilter) return false;
      return true;
    });
  }, [reportCampaign, reportStatusFilter, reportChannelFilter]);

  const exportReportPdf = async (mode: 'print' | 'pdf') => {
    if (!reportCampaign) return;
    try {
      const qs = new URLSearchParams({
        status: reportStatusFilter,
        channel: reportChannelFilter,
        download: mode === 'pdf' ? '1' : '0',
      });
      const url = apiUrl(`/api/v1/admin/broadcast/${encodeURIComponent(reportCampaign.id)}/report.pdf?${qs.toString()}`);
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Não foi possível gerar o relatório PDF no servidor.');
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      if (mode === 'pdf') {
        const safeName = (reportCampaign.title || 'Campanha')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9-_]+/g, '-')
          .replace(/(^-|-$)/g, '') || 'Campanha';
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `Relatorio-${safeName}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
        showNotice('success', 'Relatório PDF gerado pelo servidor e transferido com sucesso!');
      } else {
        // Imprimir diretamente o PDF vetorial real (via iframe nativo)
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.src = blobUrl;
        document.body.appendChild(iframe);
        iframe.onload = () => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch {
            window.open(blobUrl, '_blank');
          }
          setTimeout(() => {
            iframe.remove();
            URL.revokeObjectURL(blobUrl);
          }, 60000);
        };
      }
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Erro ao exportar relatório PDF.');
    }
  };

  const totalSent = campaigns.reduce((acc, c) => acc + Number(c.sentCount || 0), 0);
  const totalDelivered = campaigns.reduce((acc, c) => acc + Number(c.deliveredCount || 0), 0);
  const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;

  return (
    <div className="flex flex-col gap-5 animate-fadeIn">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2.5">
            <AdminIcon3D name="send" size={26} />
            <span>Disparo em Massa</span>
          </h1>
        </div>
        <button type="button" onClick={loadData} disabled={loading} className="btn btn-secondary">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* KPIs com Ícones 3D */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="group ds-card ds-card-interactive p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold ds-muted">Campanhas Guardadas</p>
            <p className="text-2xl font-semibold font-mono tabular-nums mt-1">{savedCampaigns.length}</p>
          </div>
          <AdminIcon3D name="campaigns" size={36} />
        </div>
        <div className="group ds-card ds-card-interactive p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold ds-muted">Base CRM Ativa</p>
            <p className="text-2xl font-semibold font-mono tabular-nums mt-1">{contacts.length}</p>
          </div>
          <AdminIcon3D name="contacts" size={36} />
        </div>
        <div className="group ds-card ds-card-interactive p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold ds-muted">Envios Realizados</p>
            <p className="text-2xl font-semibold font-mono tabular-nums mt-1">{totalSent.toLocaleString('pt-PT')}</p>
          </div>
          <AdminIcon3D name="send" size={36} />
        </div>
        <div className="group ds-card ds-card-interactive p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold ds-muted">Taxa de Entrega</p>
            <p className="text-2xl font-semibold font-mono tabular-nums mt-1 text-emerald-400">{deliveryRate}%</p>
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

      {/* Grid Principal: Compositor + Histórico / Campanhas Guardadas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Formulário de Nova Campanha / Edição */}
        <form ref={composerRef} onSubmit={handleDispatch} className="lg:col-span-5 ds-card flex flex-col">
          <div className="ds-card-header">
            <div>
              <h2 className="ds-title">
                {editingCampaignId ? 'Editar Campanha Guardada' : 'Nova Campanha'}
              </h2>
              <p className="ds-subtitle">Configure canais, anexos da biblioteca e destinatários</p>
            </div>
            <div className="flex items-center gap-2">
              {editingCampaignId && (
                <button
                  type="button"
                  onClick={clearComposer}
                  className="text-[11px] text-rose-400 hover:underline"
                >
                  Cancelar edição
                </button>
              )}
              <span className="text-xs font-mono text-brand font-semibold">
                {targetRecipients.length} destinatário(s)
              </span>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <label className="label">Título da Campanha *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Proposta Comercial JOGIMIL · Novembro"
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Canais de Envio *</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'whatsapp', label: 'WhatsApp', iconSrc: '/icons/whatsapp.svg' },
                  { id: 'email', label: 'Email', iconSrc: '/icons/email.svg' },
                  { id: 'sms', label: 'SMS', iconSrc: '' },
                ].map((ch) => {
                  const active = channels.includes(ch.id);
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => toggleChannel(ch.id)}
                      className={`btn btn-sm ${active ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      {ch.iconSrc ? (
                        <img src={ch.iconSrc} alt={ch.label} className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <Smartphone className="h-3.5 w-3.5" />
                      )}
                      <span>{ch.label}</span>
                    </button>
                  );
                })}
              </div>
              {targetRecipients.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] ds-muted">
                  {channels.includes('email') && (
                    <span>
                      Email: <strong className="text-emerald-400">{recipientChannelStats.withEmail}</strong> prontos
                      {recipientChannelStats.missingEmail > 0 && (
                        <span className="text-amber-400"> · {recipientChannelStats.missingEmail} sem email</span>
                      )}
                    </span>
                  )}
                  {channels.includes('whatsapp') && (
                    <span>
                      WhatsApp: <strong className="text-emerald-400">{recipientChannelStats.withPhone}</strong> prontos
                      {recipientChannelStats.missingPhone > 0 && (
                        <span className="text-amber-400"> · {recipientChannelStats.missingPhone} sem telefone</span>
                      )}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="label">Modo & Destinatários (Individual ou Massa)</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as typeof audience)}
                className="input"
              >
                <option value="all">Em Massa · Todos os Contactos ({contacts.length})</option>
                <option value="novos">Em Massa · Apenas Novos Leads</option>
                <option value="negociacao">Em Massa · Em Proposta / Negociação</option>
                <option value="whatsapp">Em Massa · Contactos com Telefone / WhatsApp</option>
                <option value="email">Em Massa · Contactos com Email</option>
                <option value="custom">Envio Individual / Seleção Manual ({selectedIds.length} selecionado(s))</option>
              </select>
            </div>

            {/* Seleção Individual de Utilizadores/Contactos */}
            {audience === 'custom' && (
              <div className="border ds-divider ds-surface-2 p-3 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ds-subtle" />
                    <input
                      type="text"
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      placeholder="Filtrar contactos por nome, telefone ou email..."
                      className="input h-8 pl-8 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="ds-muted font-mono">{selectedIds.length} selecionado(s)</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={selectAllVisible} className="text-brand hover:underline">
                      Selecionar visíveis
                    </button>
                    <span className="ds-subtle">·</span>
                    <button type="button" onClick={clearSelection} className="text-rose-400 hover:underline">
                      Limpar
                    </button>
                  </div>
                </div>

                <div
                  className="max-h-48 overflow-y-auto divide-y ds-divider border ds-divider"
                  style={{ backgroundColor: 'rgb(var(--surface))' }}
                >
                  {visibleContacts.length === 0 ? (
                    <p className="text-xs ds-muted text-center py-4">Nenhum contacto encontrado.</p>
                  ) : (
                    visibleContacts.map((c) => {
                      const checked = selectedIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleContact(c.id)}
                          className={`w-full text-left px-3 py-2 flex items-center gap-2.5 text-xs transition-colors ${
                            checked ? 'bg-brand/10' : 'hover:bg-[rgb(var(--surface-2))]'
                          }`}
                        >
                          {checked ? (
                            <CheckSquare className="h-4 w-4 text-brand shrink-0" />
                          ) : (
                            <Square className="h-4 w-4 ds-subtle shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">
                              {c.name}{' '}
                              {c.company ? <span className="ds-muted font-normal">· {c.company}</span> : null}
                            </p>
                            <p className="text-[11px] font-mono ds-subtle truncate">
                              {[c.phone, c.email].filter(Boolean).join(' · ') || 'Sem contacto'}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {channels.includes('email') && (
              <div>
                <label className="label">Assunto do Email</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Assunto apresentado na caixa de entrada (suporta {nome}, {empresa})"
                  className="input"
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="label mb-0">Mensagem {attachments.length === 0 ? '*' : ''}</label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFilePickerOpen(true)}
                    className="btn btn-secondary btn-sm h-7 text-[11px]"
                    title="Anexar PDFs, Excel ou imagens da Biblioteca Interna"
                  >
                    <FolderOpen className="h-3.5 w-3.5 text-sky-500" />
                    <span>Biblioteca{attachments.length > 0 ? ` (${attachments.length})` : ''}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateModalOpen(true)}
                    className="btn btn-secondary btn-sm h-7 text-[11px]"
                  >
                    <LayoutTemplate className="h-3.5 w-3.5 text-brand" />
                    <span>Templates & Preview</span>
                  </button>
                </div>
              </div>

              {attachments.length > 0 && (
                <div className="space-y-1.5 p-2.5 border ds-divider ds-surface-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <Paperclip className="h-3 w-3 text-sky-500" />
                      <span>Anexos da Biblioteca ({attachments.length})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttachments([])}
                      className="text-rose-400 hover:underline"
                    >
                      Remover todos
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {attachments.map((att, attIdx) => (
                      <span
                        key={att.digitalFileId || `${att.name}_${attIdx}`}
                        className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] border ds-divider"
                        style={{ backgroundColor: 'rgb(var(--surface))' }}
                      >
                        <FileText className="h-3 w-3 text-sky-500 shrink-0" />
                        <span className="truncate max-w-[180px]" title={att.name}>
                          {att.name}
                        </span>
                        <span className="font-mono text-[10px] ds-subtle">
                          {formatAttachmentBytes(att.size)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setAttachments((prev) => prev.filter((_, i) => i !== attIdx))
                          }
                          className="text-rose-400 hover:text-rose-300"
                          title="Remover anexo"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  {channels.includes('sms') && (
                    <p className="text-[10px] ds-muted">
                      Nota: os anexos são enviados nos canais Email e WhatsApp (SMS envia apenas texto).
                    </p>
                  )}
                </div>
              )}

              {activeTemplateName && (
                <div className="flex items-center justify-between gap-2 px-3 py-1.5 border border-brand/40 bg-brand/10 text-xs">
                  <span className="truncate">
                    Template ativo: <strong>{activeTemplateName}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTemplateName(null);
                      setEmailHtml('');
                      setTemplateMeta(null);
                    }}
                    className="text-rose-400 hover:underline shrink-0"
                  >
                    Limpar
                  </button>
                </div>
              )}

              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escreva a mensagem ou clique em 'Templates & Preview' (variáveis: {nome}, {empresa})..."
                className="input"
                required={attachments.length === 0}
              />
              <div className="flex items-center justify-between text-[11px] ds-subtle">
                <span>Variáveis: {'{nome}'}, {'{empresa}'}</span>
                <span className="font-mono">{message.length} caracteres</span>
              </div>
            </div>

            {/* Agendamento Automático (Opcional) + Integração Opcional com Agenda & Processos */}
            <div className="border ds-divider ds-surface-2 p-3 space-y-2.5">
              <label className="flex items-center justify-between gap-2 cursor-pointer">
                <span className="inline-flex items-center gap-2 text-xs font-medium">
                  <CalendarClock className="h-4 w-4 text-brand shrink-0" />
                  <span>Agendar envio automático</span>
                </span>
                <input
                  type="checkbox"
                  checked={scheduleEnabled}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setScheduleEnabled(checked);
                    if (checked && !scheduledAt) {
                      const nextHour = new Date(Date.now() + 60 * 60 * 1000);
                      const pad = (n: number) => String(n).padStart(2, '0');
                      setScheduledAt(
                        `${nextHour.getFullYear()}-${pad(nextHour.getMonth() + 1)}-${pad(nextHour.getDate())}T${pad(nextHour.getHours())}:${pad(nextHour.getMinutes())}`
                      );
                    }
                  }}
                  className="h-4 w-4 accent-[rgb(var(--brand))]"
                />
              </label>

              {scheduleEnabled && (
                <div className="space-y-2.5 pt-2 border-t ds-divider">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider ds-muted mb-1">
                      Data e Hora do Disparo Automático *
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      required={scheduleEnabled}
                      className="input h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider ds-muted">
                      Integrações Opcionais
                    </p>
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={syncToCalendar}
                        onChange={(e) => setSyncToCalendar(e.target.checked)}
                        className="h-3.5 w-3.5 accent-[rgb(var(--brand))]"
                      />
                      <Calendar className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                      <span>Integrar na Agenda (Calendário Corporativo)</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={syncToTask}
                        onChange={(e) => setSyncToTask(e.target.checked)}
                        className="h-3.5 w-3.5 accent-[rgb(var(--brand))]"
                      />
                      <ListTodo className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>Criar Processo / Tarefa em Tarefas & Processos</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleSaveCampaign}
                disabled={savingCampaign || !title.trim() || (!message.trim() && attachments.length === 0)}
                className="btn btn-secondary w-full"
                title="Guarda a campanha (com anexos da biblioteca) para reutilizar em envios individuais ou em massa"
              >
                {savingCampaign ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-brand" />}
                <span>{editingCampaignId ? 'Atualizar Campanha' : 'Guardar Campanha'}</span>
              </button>

              <button
                type="submit"
                disabled={
                  sending ||
                  !title.trim() ||
                  (!message.trim() && attachments.length === 0) ||
                  channels.length === 0 ||
                  targetRecipients.length === 0 ||
                  (scheduleEnabled && !scheduledAt)
                }
                className="btn btn-primary w-full"
              >
                {sending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : scheduleEnabled ? (
                  <CalendarClock className="h-4 w-4" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span>
                  {scheduleEnabled
                    ? `Agendar (${targetRecipients.length})`
                    : `Disparar (${targetRecipients.length})`}
                </span>
              </button>
            </div>
          </div>
        </form>

        {/* Painel Direito: Abas Histórico de Envios & Campanhas Guardadas */}
        <div className="lg:col-span-7 ds-card flex flex-col overflow-hidden">
          <div className="ds-card-header flex-wrap gap-3">
            <div className="flex flex-wrap items-center border ds-divider">
              <button
                type="button"
                onClick={() => setRightTab('history')}
                className={`px-3 py-1.5 text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                  rightTab === 'history' ? 'bg-brand text-white' : 'ds-muted hover:text-current'
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Histórico ({campaigns.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setRightTab('scheduled')}
                className={`px-3 py-1.5 text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                  rightTab === 'scheduled' ? 'bg-brand text-white' : 'ds-muted hover:text-current'
                }`}
              >
                <CalendarClock className="h-3.5 w-3.5" />
                <span>
                  Agendadas ({scheduledBroadcasts.filter((s) => s.status === 'pending').length})
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRightTab('saved')}
                className={`px-3 py-1.5 text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                  rightTab === 'saved' ? 'bg-brand text-white' : 'ds-muted hover:text-current'
                }`}
              >
                <Bookmark className="h-3.5 w-3.5" />
                <span>Guardadas ({savedCampaigns.length})</span>
              </button>
            </div>
          </div>

          {rightTab === 'history' ? (
            <>
              {loading && campaigns.length === 0 ? (
                <BrandLoader size="md" />
              ) : campaigns.length === 0 ? (
                <p className="text-xs ds-muted text-center py-14">
                  Nenhum envio disparado até ao momento.
                </p>
              ) : (
                <div className="overflow-x-auto flex-1">
                  <table className="ds-table">
                    <thead>
                      <tr>
                        <th>Campanha</th>
                        <th>Canais</th>
                        <th className="text-right">Sucesso</th>
                        <th className="text-right">Falharam</th>
                        <th className="text-right">Não Env.</th>
                        <th>Data</th>
                        <th className="text-right">Relatório</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.slice((page - 1) * pageSize, page * pageSize).map((c) => (
                        <tr key={c.id}>
                          <td>
                            <p className="font-medium flex items-center gap-1.5">
                              <span>{c.title}</span>
                              {c.attachments && c.attachments.length > 0 && (
                                <span
                                  className="inline-flex items-center gap-0.5 text-[10px] font-mono text-sky-400"
                                  title={`${c.attachments.length} anexo(s) da biblioteca`}
                                >
                                  <Paperclip className="h-3 w-3" />
                                  {c.attachments.length}
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] ds-muted line-clamp-1">{c.audience}</p>
                          </td>
                          <td>
                            <div className="flex flex-wrap gap-1">
                              {(c.channels || []).map((ch) => (
                                <span
                                  key={ch}
                                  className="badge ds-surface-2 ds-divider uppercase font-mono text-[10px]"
                                >
                                  {ch === 'whatsapp' ? (
                                    <img src="/icons/whatsapp.svg" alt="WhatsApp" className="h-3 w-3 shrink-0" />
                                  ) : ch === 'email' ? (
                                    <img src="/icons/email.svg" alt="Email" className="h-3 w-3 shrink-0" />
                                  ) : (
                                    <Smartphone className="h-3 w-3 shrink-0" />
                                  )}
                                  {ch}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="text-right font-mono tabular-nums text-emerald-400 font-semibold">
                            {c.deliveredCount ?? 0}
                          </td>
                          <td className="text-right font-mono tabular-nums text-rose-400 font-semibold">
                            {c.failedCount ?? 0}
                          </td>
                          <td className="text-right font-mono tabular-nums text-amber-400 font-semibold">
                            {c.skippedCount ?? 0}
                          </td>
                          <td className="text-xs font-mono ds-muted whitespace-nowrap">
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString('pt-PT') : '—'}
                          </td>
                          <td className="text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setReportStatusFilter('all');
                                setReportChannelFilter('all');
                                setReportCampaign(c);
                              }}
                              className="btn btn-secondary btn-sm h-7 text-[11px] gap-1"
                              title="Ver destinatários enviados com sucesso, falhados e não enviados"
                            >
                              <Eye className="h-3.5 w-3.5 text-brand" />
                              <span>Detalhes</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Pagination
                page={page}
                pageSize={pageSize}
                totalItems={campaigns.length}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </>
          ) : rightTab === 'scheduled' ? (
            <div className="flex-1 overflow-y-auto divide-y ds-divider">
              {scheduledBroadcasts.length === 0 ? (
                <div className="py-14 px-6 text-center space-y-2">
                  <CalendarClock className="h-7 w-7 ds-subtle mx-auto" />
                  <p className="text-xs font-medium">Nenhuma campanha agendada.</p>
                  <p className="text-[11px] ds-muted max-w-sm mx-auto">
                    Ative <strong>Agendar envio automático</strong> no formulário ao lado para programar disparos por data e hora, com integração opcional na Agenda e em Tarefas & Processos.
                  </p>
                </div>
              ) : (
                scheduledBroadcasts.map((item) => {
                  const linkedBroadcast = item.broadcastId
                    ? campaigns.find((c) => c.id === item.broadcastId)
                    : null;
                  const statusCfg =
                    item.status === 'sent'
                      ? { label: 'Enviada', cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' }
                      : item.status === 'partial'
                      ? { label: 'Parcial', cls: 'border-amber-500/30 bg-amber-500/10 text-amber-400' }
                      : item.status === 'failed'
                      ? { label: 'Falhou', cls: 'border-rose-500/30 bg-rose-500/10 text-rose-400' }
                      : item.status === 'processing'
                      ? { label: 'A enviar...', cls: 'border-sky-500/30 bg-sky-500/10 text-sky-400' }
                      : { label: 'Agendada', cls: 'border-brand/40 bg-brand/10 text-brand' };

                  return (
                    <div key={item.id} className="p-4 space-y-2.5 hover:bg-[rgb(var(--surface-2))]/40 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold truncate">{item.title}</h3>
                            <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase border ${statusCfg.cls}`}>
                              {statusCfg.label}
                            </span>
                          </div>
                          <p className="text-[11px] ds-muted mt-0.5">
                            {item.audience} · {item.totalRecipients} destinatário(s)
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {(item.channels || []).map((ch) => (
                            <span
                              key={ch}
                              className="badge ds-surface-2 ds-divider uppercase font-mono text-[10px]"
                            >
                              {ch === 'whatsapp' ? (
                                <img src="/icons/whatsapp.svg" alt="WhatsApp" className="h-3 w-3 shrink-0" />
                              ) : ch === 'email' ? (
                                <img src="/icons/email.svg" alt="Email" className="h-3 w-3 shrink-0" />
                              ) : (
                                <Smartphone className="h-3 w-3 shrink-0" />
                              )}
                              {ch}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="inline-flex items-center gap-1 font-mono ds-muted">
                          <CalendarClock className="h-3.5 w-3.5 text-brand" />
                          {new Date(item.scheduledAt).toLocaleString('pt-PT', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {item.syncToCalendar && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] border border-sky-500/30 bg-sky-500/10 text-sky-400">
                            <Calendar className="h-3 w-3" /> Agenda
                          </span>
                        )}
                        {item.syncToTask && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                            <ListTodo className="h-3 w-3" /> Processo
                          </span>
                        )}
                        {item.attachments && item.attachments.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] border ds-divider ds-surface-2">
                            <Paperclip className="h-3 w-3 text-sky-400" /> {item.attachments.length} anexo(s)
                          </span>
                        )}
                      </div>

                      {item.status !== 'pending' && (
                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
                          <span className="text-emerald-400">Sucesso: {item.deliveredCount ?? 0}</span>
                          <span className="text-rose-400">Falharam: {item.failedCount ?? 0}</span>
                          <span className="text-amber-400">Não env.: {item.skippedCount ?? 0}</span>
                        </div>
                      )}

                      {item.error && (
                        <p className="text-[11px] text-rose-400">{item.error}</p>
                      )}

                      <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1">
                        {(item.status === 'pending' || item.status === 'failed') && (
                          <button
                            type="button"
                            disabled={dispatchingScheduleId === item.id}
                            onClick={() => handleSendScheduledNow(item)}
                            className="btn btn-primary btn-sm h-7 text-[11px] gap-1"
                            title="Disparar imediatamente sem aguardar a hora agendada"
                          >
                            {dispatchingScheduleId === item.id ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Play className="h-3.5 w-3.5" />
                            )}
                            <span>Enviar Agora</span>
                          </button>
                        )}
                        {linkedBroadcast && (
                          <button
                            type="button"
                            onClick={() => {
                              setReportStatusFilter('all');
                              setReportChannelFilter('all');
                              setReportCampaign(linkedBroadcast);
                            }}
                            className="btn btn-secondary btn-sm h-7 text-[11px] gap-1"
                          >
                            <Eye className="h-3.5 w-3.5 text-brand" />
                            <span>Ver Relatório</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteScheduled(item)}
                          className="btn btn-ghost btn-icon h-7 w-7 text-rose-400 hover:text-rose-300"
                          title="Cancelar / Eliminar agendamento"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y ds-divider">
              {savedCampaigns.length === 0 ? (
                <div className="py-14 px-6 text-center space-y-2">
                  <Bookmark className="h-7 w-7 ds-subtle mx-auto" />
                  <p className="text-xs font-medium">Ainda não tem campanhas guardadas.</p>
                  <p className="text-[11px] ds-muted max-w-sm mx-auto">
                    Preencha o formulário ao lado, anexe arquivos da Biblioteca se desejar e clique em{' '}
                    <strong>Guardar Campanha</strong> para reutilizá-la em envios individuais ou em massa.
                  </p>
                </div>
              ) : (
                savedCampaigns.map((cmp) => (
                  <div key={cmp.id} className="p-4 space-y-2.5 hover:bg-[rgb(var(--surface-2))]/40 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold truncate">{cmp.title}</h3>
                        {cmp.subject && (
                          <p className="text-[11px] ds-muted truncate">Assunto: {cmp.subject}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {(cmp.channels || []).map((ch) => (
                          <span
                            key={ch}
                            className="badge ds-surface-2 ds-divider uppercase font-mono text-[10px]"
                          >
                            {ch}
                          </span>
                        ))}
                      </div>
                    </div>

                    {cmp.message && (
                      <p className="text-xs ds-muted line-clamp-2 whitespace-pre-line">{cmp.message}</p>
                    )}

                    {cmp.attachments && cmp.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {cmp.attachments.map((att, idx) => (
                          <span
                            key={att.digitalFileId || `${att.name}_${idx}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] border ds-divider ds-surface-2"
                          >
                            <Paperclip className="h-3 w-3 text-sky-400" />
                            <span className="truncate max-w-[160px]">{att.name}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="text-[10px] font-mono ds-subtle">
                        Atualizada em{' '}
                        {new Date(cmp.updatedAt || cmp.createdAt).toLocaleString('pt-PT', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => loadSavedCampaignIntoComposer(cmp, 'individual')}
                          className="btn btn-secondary btn-sm h-7 text-[11px] gap-1"
                          title="Carregar campanha para enviar a 1 ou mais contactos selecionados"
                        >
                          <UserCheck className="h-3.5 w-3.5 text-sky-400" />
                          <span>Individual</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => loadSavedCampaignIntoComposer(cmp, 'mass')}
                          className="btn btn-primary btn-sm h-7 text-[11px] gap-1"
                          title="Carregar campanha para envio em massa"
                        >
                          <Users className="h-3.5 w-3.5" />
                          <span>Em Massa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => loadSavedCampaignIntoComposer(cmp, 'schedule')}
                          className="btn btn-secondary btn-sm h-7 text-[11px] gap-1"
                          title="Agendar envio automático desta campanha"
                        >
                          <CalendarClock className="h-3.5 w-3.5 text-brand" />
                          <span>Agendar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => loadSavedCampaignIntoComposer(cmp, 'edit')}
                          className="btn btn-ghost btn-icon h-7 w-7"
                          title="Editar campanha"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSavedCampaign(cmp)}
                          className="btn btn-ghost btn-icon h-7 w-7 text-rose-400 hover:text-rose-300"
                          title="Eliminar campanha guardada"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Relatório Detalhado de Entregas (Sucesso / Falharam / Não Enviados) */}
      {reportCampaign &&
        createPortal(
          <div
            className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setReportCampaign(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="ds-card w-full max-w-5xl max-h-[90vh] border ds-divider shadow-2xl flex flex-col animate-fadeIn"
              style={{ backgroundColor: 'rgb(var(--surface))' }}
            >
              <div className="px-5 py-4 border-b ds-divider flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-brand shrink-0" />
                    <h3 className="text-sm font-semibold truncate">
                      Relatório de Entregas · {reportCampaign.title}
                    </h3>
                  </div>
                  <p className="text-[11px] ds-muted mt-0.5">
                    {reportCampaign.audience} ·{' '}
                    {reportCampaign.createdAt
                      ? new Date(reportCampaign.createdAt).toLocaleString('pt-PT')
                      : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => exportReportPdf('print')}
                    className="btn btn-secondary btn-icon h-10 w-10"
                    title="Imprimir relatório formatado A4"
                  >
                    <Printer className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => exportReportPdf('pdf')}
                    className="btn btn-primary btn-icon h-10 w-10"
                    title="Baixar relatório executivo em PDF"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportCampaign(null)}
                    className="btn btn-ghost btn-icon h-10 w-10"
                    title="Fechar"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Resumo Numérico (Cards limpos sem fundos coloridos, com destaque superior elegante e taxa de entrega) */}
              {(() => {
                const total = (reportCampaign.deliveries || []).length || reportCampaign.sentCount || 0;
                const delivered = reportCampaign.deliveredCount ?? 0;
                const failed = reportCampaign.failedCount ?? 0;
                const skipped = reportCampaign.skippedCount ?? 0;
                const pct = (n: number) => (total > 0 ? `${Math.round((n / total) * 1000) / 10}%` : '0%');
                const successRate = total > 0 ? Math.min(100, Math.round((delivered / total) * 1000) / 10) : 0;

                return (
                  <div className="p-4 border-b ds-divider space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 border ds-divider border-t-2 border-t-brand ds-surface-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] uppercase tracking-wider font-semibold ds-muted">Total Processado</p>
                          <Users className="h-3.5 w-3.5 text-brand" />
                        </div>
                        <p className="text-2xl font-mono font-bold mt-1.5 tracking-tight">{total}</p>
                        <p className="text-[11px] ds-subtle mt-0.5">100% da audiência</p>
                      </div>

                      <div className="p-3.5 border ds-divider border-t-2 border-t-emerald-500 ds-surface-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] uppercase tracking-wider font-semibold ds-muted">Enviados com Sucesso</p>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        </div>
                        <p className="text-2xl font-mono font-bold mt-1.5 tracking-tight text-emerald-400">
                          {delivered}
                        </p>
                        <p className="text-[11px] ds-subtle mt-0.5">{pct(delivered)} entregues</p>
                      </div>

                      <div className="p-3.5 border ds-divider border-t-2 border-t-rose-500 ds-surface-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] uppercase tracking-wider font-semibold ds-muted">Falharam</p>
                          <XCircle className="h-3.5 w-3.5 text-rose-500" />
                        </div>
                        <p className="text-2xl font-mono font-bold mt-1.5 tracking-tight text-rose-400">
                          {failed}
                        </p>
                        <p className="text-[11px] ds-subtle mt-0.5">{pct(failed)} com erro</p>
                      </div>

                      <div className="p-3.5 border ds-divider border-t-2 border-t-amber-500 ds-surface-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] uppercase tracking-wider font-semibold ds-muted">Não Enviados</p>
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        </div>
                        <p className="text-2xl font-mono font-bold mt-1.5 tracking-tight text-amber-400">
                          {skipped}
                        </p>
                        <p className="text-[11px] ds-subtle mt-0.5">{pct(skipped)} ignorados</p>
                      </div>
                    </div>

                    {/* Barra fina de taxa global de sucesso */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="ds-muted">Taxa de Sucesso Global</span>
                        <span className="font-mono font-semibold text-emerald-400">{successRate}%</span>
                      </div>
                      <div className="h-1.5 w-full ds-surface-2 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${successRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Anexos usados & Filtros */}
              <div className="px-4 py-3 border-b ds-divider flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { id: 'all', label: 'Todos' },
                      { id: 'delivered', label: `Sucesso (${reportCampaign.deliveredCount ?? 0})` },
                      { id: 'failed', label: `Falharam (${reportCampaign.failedCount ?? 0})` },
                      { id: 'skipped', label: `Não Enviados (${reportCampaign.skippedCount ?? 0})` },
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setReportStatusFilter(st.id)}
                      className={`px-2.5 py-1 text-xs border transition-colors ${
                        reportStatusFilter === st.id
                          ? 'bg-brand border-brand text-white'
                          : 'ds-divider ds-muted hover:text-current'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  {(['all', 'email', 'whatsapp', 'sms'] as const).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setReportChannelFilter(ch)}
                      className={`px-2 py-1 text-[11px] uppercase font-mono border ${
                        reportChannelFilter === ch
                          ? 'bg-sky-600 border-sky-600 text-white'
                          : 'ds-divider ds-muted'
                      }`}
                    >
                      {ch === 'all' ? 'Todos Canais' : ch}
                    </button>
                  ))}
                </div>
              </div>

              {reportCampaign.attachments && reportCampaign.attachments.length > 0 && (
                <div className="px-4 py-2 border-b ds-divider ds-surface-2 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1 font-medium ds-muted">
                    <Paperclip className="h-3 w-3 text-sky-400" /> Anexos enviados:
                  </span>
                  {reportCampaign.attachments.map((att, idx) => (
                    <span
                      key={att.digitalFileId || `${att.name}_${idx}`}
                      className="px-2 py-0.5 border ds-divider"
                      style={{ backgroundColor: 'rgb(var(--surface))' }}
                    >
                      {att.name} ({formatAttachmentBytes(att.size)})
                    </span>
                  ))}
                </div>
              )}

              {/* Lista Detalhada por Destinatário */}
              <div className="flex-1 overflow-y-auto">
                {!reportCampaign.deliveries || reportCampaign.deliveries.length === 0 ? (
                  <p className="text-xs ds-muted text-center py-12">
                    Esta campanha é anterior ao registo detalhado por destinatário. Os novos envios mostram cada contacto individualmente.
                  </p>
                ) : filteredReportDeliveries.length === 0 ? (
                  <p className="text-xs ds-muted text-center py-12">
                    Nenhum registo corresponde aos filtros selecionados.
                  </p>
                ) : (
                  <table className="ds-table">
                    <thead>
                      <tr>
                        <th>Destinatário</th>
                        <th>Canal</th>
                        <th>Destino</th>
                        <th>Estado</th>
                        <th>Detalhe / Motivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReportDeliveries.map((item, idx) => (
                        <tr key={`${item.contactId || item.name}_${item.channel}_${idx}`}>
                          <td>
                            <p className="font-medium text-xs">{item.name}</p>
                            {item.company && <p className="text-[11px] ds-muted">{item.company}</p>}
                          </td>
                          <td>
                            <span className="badge ds-surface-2 ds-divider uppercase font-mono text-[10px]">
                              {item.channel === 'whatsapp' ? (
                                <img src="/icons/whatsapp.svg" alt="WhatsApp" className="h-3 w-3 shrink-0" />
                              ) : item.channel === 'email' ? (
                                <img src="/icons/email.svg" alt="Email" className="h-3 w-3 shrink-0" />
                              ) : (
                                <Smartphone className="h-3 w-3 shrink-0" />
                              )}
                              {item.channel}
                            </span>
                          </td>
                          <td className="font-mono text-xs ds-muted">{item.target || '—'}</td>
                          <td>
                            {item.status === 'delivered' ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Enviado
                              </span>
                            ) : item.status === 'failed' ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-400">
                                <XCircle className="h-3.5 w-3.5" /> Falhou
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400">
                                <AlertTriangle className="h-3.5 w-3.5" /> Não enviado
                              </span>
                            )}
                          </td>
                          <td className="text-xs ds-muted max-w-[260px]">
                            {item.error || (item.status === 'delivered' ? 'Entregue com sucesso' : '—')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="px-5 py-3 border-t ds-divider flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] ds-muted">
                  A mostrar <strong className="font-mono">{filteredReportDeliveries.length}</strong> registo(s)
                </span>
                <button
                  type="button"
                  onClick={() => setReportCampaign(null)}
                  className="btn btn-primary text-xs h-8 px-4"
                >
                  Fechar Relatório
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Modal Profissional de Templates & Preview */}
      <TemplateStudioModal
        isOpen={templateModalOpen}
        channel={channels.includes('email') ? 'email' : 'whatsapp'}
        initialSubject={subject}
        initialBody={message}
        initialHtml={effectiveEmailHtml}
        initialMeta={templateMeta}
        onClose={() => setTemplateModalOpen(false)}
        onApply={({ subject: s, body: b, html, templateName, mode, templateId, category, headline, ctaLabel, ctaUrl }) => {
          if (s) setSubject(s);
          setMessage(b);
          if (html !== undefined) setEmailHtml(html);
          setActiveTemplateName(templateName);
          setTemplateMeta({
            mode: mode || 'visual',
            templateId,
            category: category || 'JOGIMIL Tecnologias',
            headline: headline || s || title || 'Comunicação Oficial',
            ctaLabel: ctaLabel || '',
            ctaUrl: ctaUrl || '',
            templateName,
          });
        }}
      />

      {/* Modal de Seleção de Arquivos da Biblioteca Interna */}
      <DigitalFilePickerModal
        open={filePickerOpen}
        alreadyAttachedIds={attachments.map((a) => a.digitalFileId)}
        onClose={() => setFilePickerOpen(false)}
        onSelect={(chosen: DigitalFileItem[]) => {
          setAttachments((prev) => {
            const existing = new Set(prev.map((p) => p.digitalFileId));
            const added: BroadcastAttachment[] = chosen
              .filter((f) => !existing.has(f.id))
              .map((f) => ({
                name: f.fileName || f.name,
                type: f.mimeType || 'application/octet-stream',
                size: f.size || 0,
                url: f.publicUrl || '',
                digitalFileId: f.id,
              }));
            return [...prev, ...added];
          });
        }}
      />
    </div>
  );
}
