import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Download,
  Clock,
  MapPin,
  User,
  CheckSquare,
  Trash2,
  Edit3,
  X,
  Server,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { apiFetch, apiUrl } from '../lib/api';
import { BrandLoader } from './BrandLoader';
import { ConfirmModal, FeedbackPopup } from './ConfirmModal';
import { AdminIcon3D } from './AdminIcon3D';

export interface CalendarEventItem {
  id: string;
  title: string;
  description?: string;
  type: 'reuniao' | 'entrega' | 'tarefa' | 'followup' | 'interno' | 'email_agendado';
  status: 'agendado' | 'em_curso' | 'concluido' | 'cancelado';
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  startAt: string;
  endAt: string;
  allDay?: boolean;
  location?: string;
  contactId?: string | null;
  contactName?: string;
  taskId?: string | null;
  owner?: string;
  source?: 'admin' | 'task' | 'crm' | 'caldav';
  readOnly?: boolean;
}

interface CalDavStatus {
  configured: boolean;
  caldavOnline: boolean;
  carddavOnline: boolean;
  caldavStatus?: number;
  carddavStatus?: number;
  server: string;
  caldavUrl: string;
  carddavUrl: string;
  user: string;
  diagnostic: string;
}

interface ContactOpt {
  id: string;
  name: string;
  company?: string;
}

interface CalendarManagerProps {
  onNavigate?: (tab: string) => void;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const TYPE_META: Record<string, { label: string; dot: string; border: string; text: string }> = {
  reuniao: { label: 'Reunião', dot: 'bg-sky-500', border: 'border-l-sky-500', text: 'text-sky-500' },
  entrega: { label: 'Entrega', dot: 'bg-emerald-500', border: 'border-l-emerald-500', text: 'text-emerald-500' },
  tarefa: { label: 'Tarefa / Processo', dot: 'bg-indigo-500', border: 'border-l-indigo-500', text: 'text-indigo-500' },
  followup: { label: 'Follow-up CRM', dot: 'bg-amber-500', border: 'border-l-amber-500', text: 'text-amber-500' },
  email_agendado: { label: 'Email Agendado', dot: 'bg-violet-500', border: 'border-l-violet-500', text: 'text-violet-500' },
  interno: { label: 'Interno', dot: 'bg-slate-400', border: 'border-l-slate-400', text: 'text-slate-400' },
};

function toDateKey(d: Date | string): string {
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return '';
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function toInputDateTime(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CalendarManager({ onNavigate }: CalendarManagerProps) {
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [contacts, setContacts] = useState<ContactOpt[]>([]);
  const [caldavStatus, setCaldavStatus] = useState<CalDavStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingCaldav, setSyncingCaldav] = useState(false);

  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(new Date()));

  const [showEvents, setShowEvents] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [showFollowUps, setShowFollowUps] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [davModalOpen, setDavModalOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEventItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<CalendarEventItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ open: boolean; type: 'success' | 'error'; title: string; message: string }>({
    open: false,
    type: 'success',
    title: '',
    message: '',
  });

  const [form, setForm] = useState({
    title: '',
    type: 'reuniao' as CalendarEventItem['type'],
    priority: 'media' as CalendarEventItem['priority'],
    status: 'agendado' as CalendarEventItem['status'],
    startAt: '',
    endAt: '',
    allDay: false,
    location: '',
    contactId: '',
    owner: 'Equipa JOGIMIL',
    description: '',
    createLinkedTask: false,
  });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [evRes, ctRes, davRes] = await Promise.all([
        fetch(apiUrl('/api/v1/admin/calendar/events')),
        fetch(apiUrl('/api/v1/admin/contacts')),
        fetch(apiUrl('/api/v1/admin/calendar/caldav/status')),
      ]);
      const evJson = await evRes.json().catch(() => ({}));
      const ctJson = await ctRes.json().catch(() => ({}));
      const davJson = await davRes.json().catch(() => ({}));

      if (evJson.success && Array.isArray(evJson.events)) setEvents(evJson.events);
      if (ctJson.success && Array.isArray(ctJson.contacts)) setContacts(ctJson.contacts);
      if (davJson.success) setCaldavStatus(davJson);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (e.source === 'task' || e.type === 'tarefa') return showTasks;
      if (e.source === 'crm' || e.type === 'followup') return showFollowUps;
      return showEvents;
    });
  }, [events, showEvents, showTasks, showFollowUps]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEventItem[]>();
    for (const ev of filteredEvents) {
      const key = toDateKey(ev.startAt);
      if (!key) continue;
      const list = map.get(key) || [];
      list.push(ev);
      map.set(key, list);
    }
    return map;
  }, [filteredEvents]);

  const calendarGrid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: { date: Date; inMonth: boolean; key: string }[] = [];

    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      cells.push({ date: d, inMonth: false, key: toDateKey(d) });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      cells.push({ date: d, inMonth: true, key: toDateKey(d) });
    }
    while (cells.length % 7 !== 0) {
      const nextIdx = cells.length - (startWeekday + daysInMonth) + 1;
      const d = new Date(year, month + 1, nextIdx);
      cells.push({ date: d, inMonth: false, key: toDateKey(d) });
    }
    return cells;
  }, [cursor]);

  const selectedDayEvents = useMemo(
    () => eventsByDay.get(selectedDateKey) || [],
    [eventsByDay, selectedDateKey]
  );

  const openNewModal = (dateKey?: string) => {
    const baseDate = dateKey || selectedDateKey || toDateKey(new Date());
    setEditing(null);
    setForm({
      title: '',
      type: 'reuniao',
      priority: 'media',
      status: 'agendado',
      startAt: `${baseDate}T09:00`,
      endAt: `${baseDate}T10:00`,
      allDay: false,
      location: '',
      contactId: '',
      owner: 'Equipa JOGIMIL',
      description: '',
      createLinkedTask: false,
    });
    setModalOpen(true);
  };

  const openEditModal = (ev: CalendarEventItem) => {
    if (ev.readOnly || ev.id.startsWith('task_evt_') || ev.id.startsWith('crm_fu_')) return;
    setEditing(ev);
    setForm({
      title: ev.title,
      type: ev.type || 'reuniao',
      priority: ev.priority || 'media',
      status: ev.status || 'agendado',
      startAt: toInputDateTime(ev.startAt),
      endAt: toInputDateTime(ev.endAt || ev.startAt),
      allDay: Boolean(ev.allDay),
      location: ev.location || '',
      contactId: ev.contactId || '',
      owner: ev.owner || 'Equipa JOGIMIL',
      description: ev.description || '',
      createLinkedTask: false,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.startAt) return;
    setSaving(true);
    try {
      const contact = contacts.find((c) => c.id === form.contactId);
      const body = {
        ...form,
        startAt: new Date(form.startAt).toISOString(),
        endAt: form.endAt ? new Date(form.endAt).toISOString() : new Date(form.startAt).toISOString(),
        contactId: form.contactId || null,
        contactName: contact?.name || '',
      };

      const url = editing
        ? apiUrl(`/api/v1/admin/calendar/events/${editing.id}`)
        : apiUrl('/api/v1/admin/calendar/events');
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Erro ao guardar evento');

      setModalOpen(false);
      await loadAll();
      setFeedback({
        open: true,
        type: 'success',
        title: editing ? 'Evento atualizado' : 'Evento agendado',
        message: form.createLinkedTask
          ? 'Evento criado no calendário e vinculado automaticamente em Tarefas & Processos.'
          : 'O evento foi guardado com sucesso no calendário corporativo.',
      });
    } catch (err) {
      setFeedback({
        open: true,
        type: 'error',
        title: 'Erro ao guardar',
        message: err instanceof Error ? err.message : 'Falha ao guardar evento.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(apiUrl(`/api/v1/admin/calendar/events/${confirmDelete.id}`), {
        method: 'DELETE',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || 'Falha ao eliminar');
      setConfirmDelete(null);
      await loadAll();
      setFeedback({
        open: true,
        type: 'success',
        title: 'Evento eliminado',
        message: 'O evento foi removido do calendário.',
      });
    } catch (err) {
      setFeedback({
        open: true,
        type: 'error',
        title: 'Erro ao eliminar',
        message: err instanceof Error ? err.message : 'Não foi possível eliminar o evento.',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleSyncCalDav = async () => {
    setSyncingCaldav(true);
    try {
      const res = await fetch(apiUrl('/api/v1/admin/calendar/caldav/sync'), { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setFeedback({
          open: true,
          type: 'error',
          title: 'CalDAV cPanel (porta 2080)',
          message: json.message || 'O servidor cPanel recusou a sincronização CalDAV.',
        });
      } else {
        await loadAll();
        setFeedback({
          open: true,
          type: 'success',
          title: 'Sincronização CalDAV concluída',
          message: json.message || 'Eventos sincronizados com sucesso.',
        });
      }
    } catch {
      setFeedback({
        open: true,
        type: 'error',
        title: 'Erro de ligação',
        message: 'Não foi possível contactar o servidor CalDAV.',
      });
    } finally {
      setSyncingCaldav(false);
    }
  };

  const todayKey = toDateKey(new Date());

  // Modal rápido de Agendamento de Publicação (Portal / Facebook / Instagram / Threads) diretamente no Calendário
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [savingPost, setSavingPost] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postCaption, setPostCaption] = useState('');
  const [postPlatforms, setPostPlatforms] = useState<string[]>(['portal', 'facebook', 'instagram']);
  const [postType, setPostType] = useState<'post' | 'reel' | 'story' | 'carousel'>('post');
  const [postMediaUrl, setPostMediaUrl] = useState('');
  const [postScheduledAt, setPostScheduledAt] = useState('');

  const openSchedulePostModal = () => {
    const baseDate = selectedDateKey || todayKey;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const nextHour = pad(Math.min(23, now.getHours() + 1));
    setPostTitle('');
    setPostCaption('');
    setPostPlatforms(['portal', 'facebook', 'instagram']);
    setPostType('post');
    setPostMediaUrl('');
    setPostScheduledAt(`${baseDate}T${nextHour}:00`);
    setPostModalOpen(true);
  };

  const handleSchedulePostFromCalendar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || postPlatforms.length === 0 || !postScheduledAt) return;
    setSavingPost(true);
    try {
      await apiFetch('/api/v1/admin/meta/publish', {
        method: 'POST',
        body: JSON.stringify({
          title: postTitle.trim(),
          caption: postCaption.trim(),
          excerpt: postCaption.trim().slice(0, 180),
          content: postCaption.trim(),
          platforms: postPlatforms,
          postType,
          mediaUrl: postMediaUrl.trim(),
          image: postMediaUrl.trim(),
          scheduledAt: new Date(postScheduledAt).toISOString(),
          syncCalendar: true,
        }),
      });
      setPostModalOpen(false);
      setFeedback({
        open: true,
        type: 'success',
        title: 'Publicação Agendada',
        message: 'A publicação foi agendada e adicionada automaticamente ao Calendário.',
      });
      await loadAll();
    } catch (err) {
      setFeedback({
        open: true,
        type: 'error',
        title: 'Erro ao agendar',
        message: err instanceof Error ? err.message : 'Não foi possível agendar a publicação.',
      });
    } finally {
      setSavingPost(false);
    }
  };

  if (loading && events.length === 0) {
    return (
      <div className="py-20 flex items-center justify-center">
        <BrandLoader />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Cabeçalho e Ações */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2.5">
            <AdminIcon3D name="calendar" size={26} />
            <span>Calendário</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setDavModalOpen(true)}
            className="btn btn-secondary text-xs h-9 px-3 gap-1.5"
          >
            <Server className="h-3.5 w-3.5" />
            <span>cPanel CalDAV</span>
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                caldavStatus?.caldavOnline ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </button>

          <a
            href={apiUrl('/api/v1/admin/calendar/export.ics')}
            download="jogimil-calendario.ics"
            className="btn btn-secondary text-xs h-9 px-3 gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar .ICS</span>
          </a>

          <button
            type="button"
            onClick={openSchedulePostModal}
            className="btn btn-secondary text-xs h-9 px-3.5 gap-1.5 border-violet-500/40 text-violet-300 hover:text-white"
          >
            <CalendarDays className="h-3.5 w-3.5 text-violet-400" />
            <span>Agendar Post</span>
          </button>

          <button
            type="button"
            onClick={() => openNewModal()}
            className="btn btn-primary text-xs h-9 px-3.5 gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Novo Evento</span>
          </button>
        </div>
      </div>

      {/* Barra de Controlo: Mês + Filtros de Integração */}
      <div className="ds-card p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="btn btn-ghost btn-icon h-8 w-8"
            title="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold min-w-[155px] text-center">
            {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
          </span>
          <button
            type="button"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="btn btn-ghost btn-icon h-8 w-8"
            title="Próximo mês"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              setCursor(now);
              setSelectedDateKey(toDateKey(now));
            }}
            className="btn btn-secondary text-xs h-8 px-2.5 ml-1"
          >
            Hoje
          </button>
        </div>

        {/* Filtros de Origem (Integração Calendário + Tarefas + CRM) */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showEvents}
              onChange={(e) => setShowEvents(e.target.checked)}
              className="accent-sky-500"
            />
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            <span>Eventos</span>
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showTasks}
              onChange={(e) => setShowTasks(e.target.checked)}
              className="accent-indigo-500"
            />
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            <span>Tarefas & Processos</span>
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showFollowUps}
              onChange={(e) => setShowFollowUps(e.target.checked)}
              className="accent-amber-500"
            />
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Follow-ups CRM</span>
          </label>

          <div className="flex border ds-divider ml-1">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-2.5 py-1 text-xs font-medium ${
                viewMode === 'month' ? 'bg-sky-600 text-white' : 'ds-muted'
              }`}
            >
              Mês
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`px-2.5 py-1 text-xs font-medium ${
                viewMode === 'agenda' ? 'bg-sky-600 text-white' : 'ds-muted'
              }`}
            >
              Agenda
            </button>
          </div>
        </div>
      </div>

      {/* Área Principal: Grid Mensal + Painel Lateral do Dia */}
      {viewMode === 'month' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-8 ds-card overflow-hidden">
            <div className="grid grid-cols-7 border-b ds-divider">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider ds-muted border-r last:border-r-0 ds-divider"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarGrid.map((cell) => {
                const dayEvents = eventsByDay.get(cell.key) || [];
                const isToday = cell.key === todayKey;
                const isSelected = cell.key === selectedDateKey;
                return (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => setSelectedDateKey(cell.key)}
                    onDoubleClick={() => openNewModal(cell.key)}
                    className={`min-h-[96px] p-1.5 text-left border-b border-r ds-divider flex flex-col gap-1 transition-colors ${
                      !cell.inMonth ? 'opacity-40' : ''
                    } ${isSelected ? 'ring-1 ring-inset ring-sky-500 bg-sky-500/5' : 'hover:bg-sky-500/[0.03]'}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-mono px-1.5 py-0.5 ${
                          isToday ? 'bg-sky-600 text-white font-semibold' : ''
                        }`}
                      >
                        {cell.date.getDate()}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-mono ds-muted">{dayEvents.length}</span>
                      )}
                    </div>
                    <div className="space-y-0.5 w-full overflow-hidden">
                      {dayEvents.slice(0, 3).map((ev) => {
                        const meta = TYPE_META[ev.type] || TYPE_META.reuniao;
                        return (
                          <div
                            key={ev.id}
                            className={`text-[10px] leading-tight truncate px-1 py-0.5 border-l-2 ${meta.border} bg-slate-500/10`}
                            title={ev.title}
                          >
                            {ev.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <div className="text-[10px] ds-muted pl-1">+{dayEvents.length - 3} mais</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Painel Lateral do Dia Selecionado */}
          <div className="xl:col-span-4 ds-card flex flex-col">
            <div className="p-4 border-b ds-divider flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider ds-muted font-semibold">
                  Agenda do Dia
                </p>
                <p className="text-sm font-semibold mt-0.5">{selectedDateKey}</p>
              </div>
              <button
                type="button"
                onClick={() => openNewModal(selectedDateKey)}
                className="btn btn-primary text-xs h-8 px-2.5 gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Agendar</span>
              </button>
            </div>

            <div className="p-4 flex-1 space-y-2.5 overflow-y-auto max-h-[540px]">
              {selectedDayEvents.length === 0 ? (
                <div className="py-10 text-center">
                  <CalendarDays className="h-8 w-8 mx-auto ds-subtle mb-2" />
                  <p className="text-xs ds-muted">Sem eventos ou prazos para este dia.</p>
                </div>
              ) : (
                selectedDayEvents.map((ev) => {
                  const meta = TYPE_META[ev.type] || TYPE_META.reuniao;
                  const timeStr = ev.allDay
                    ? 'Dia inteiro'
                    : new Date(ev.startAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
                  const isLinkedTask = Boolean(ev.taskId) || ev.source === 'task';
                  const isNative = !ev.readOnly && !ev.id.startsWith('task_evt_') && !ev.id.startsWith('crm_fu_');

                  return (
                    <div
                      key={ev.id}
                      className={`p-3 border ds-divider border-l-2 ${meta.border} space-y-1.5`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className={`text-[10px] font-semibold uppercase tracking-wider ${meta.text}`}>
                            {meta.label}
                          </span>
                          <p className="text-sm font-medium leading-snug">{ev.title}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isLinkedTask && onNavigate && (
                            <button
                              type="button"
                              onClick={() => onNavigate('tasks')}
                              title="Abrir em Tarefas & Processos"
                              className="btn btn-ghost btn-icon h-7 w-7"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {isNative && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditModal(ev)}
                                title="Editar evento"
                                className="btn btn-ghost btn-icon h-7 w-7"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDelete(ev)}
                                title="Eliminar evento"
                                className="btn btn-ghost btn-icon h-7 w-7 text-rose-500"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {ev.description && (
                        <p className="text-xs ds-muted line-clamp-2">{ev.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] ds-muted">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {timeStr}
                        </span>
                        {ev.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {ev.location}
                          </span>
                        )}
                        {ev.contactName && (
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3 w-3" /> {ev.contactName}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Vista de Agenda Cronológica */
        <div className="ds-card divide-y ds-divider">
          {filteredEvents.length === 0 ? (
            <div className="p-10 text-center text-xs ds-muted">
              Nenhum evento ou prazo registado.
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const meta = TYPE_META[ev.type] || TYPE_META.reuniao;
              const isNative = !ev.readOnly && !ev.id.startsWith('task_evt_') && !ev.id.startsWith('crm_fu_');
              return (
                <div
                  key={ev.id}
                  className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-2 ${meta.border}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] ds-muted">
                      <span className="font-mono font-semibold">{toDateKey(ev.startAt)}</span>
                      <span>·</span>
                      <span className={`font-semibold uppercase ${meta.text}`}>{meta.label}</span>
                      {ev.contactName && (
                        <>
                          <span>·</span>
                          <span>{ev.contactName}</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm font-medium mt-0.5">{ev.title}</p>
                    {ev.description && <p className="text-xs ds-muted mt-0.5">{ev.description}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {(ev.taskId || ev.source === 'task') && onNavigate && (
                      <button
                        type="button"
                        onClick={() => onNavigate('tasks')}
                        className="btn btn-secondary text-xs h-8 px-2.5 gap-1"
                      >
                        <CheckSquare className="h-3.5 w-3.5" />
                        <span>Ver Processo</span>
                      </button>
                    )}
                    {isNative && (
                      <>
                        <button
                          type="button"
                          onClick={() => openEditModal(ev)}
                          className="btn btn-ghost btn-icon h-8 w-8"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(ev)}
                          className="btn btn-ghost btn-icon h-8 w-8 text-rose-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal Criar / Editar Evento */}
      {modalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] bg-black/25 flex items-center justify-center p-4">
            <div
              className="ds-card w-full max-w-lg border ds-divider shadow-2xl"
              style={{ backgroundColor: 'rgb(var(--surface))' }}
            >
              <div className="px-5 py-3.5 border-b ds-divider flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  {editing ? 'Editar Evento' : 'Novo Evento no Calendário'}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-ghost btn-icon h-7 w-7"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-5 space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider ds-muted mb-1">
                    Título *
                  </label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ex: Reunião de alinhamento com cliente"
                    className="input w-full text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider ds-muted mb-1">
                      Tipo
                    </label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value as CalendarEventItem['type'] })}
                      className="input w-full text-sm"
                    >
                      <option value="reuniao">Reunião</option>
                      <option value="entrega">Entrega / Milestone</option>
                      <option value="tarefa">Tarefa / Processo</option>
                      <option value="followup">Follow-up Comercial</option>
                      <option value="interno">Interno</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider ds-muted mb-1">
                      Prioridade
                    </label>
                    <select
                      value={form.priority}
                      onChange={(e) =>
                        setForm({ ...form, priority: e.target.value as CalendarEventItem['priority'] })
                      }
                      className="input w-full text-sm"
                    >
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider ds-muted mb-1">
                      Início *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={form.startAt}
                      onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                      className="input w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider ds-muted mb-1">
                      Fim
                    </label>
                    <input
                      type="datetime-local"
                      value={form.endAt}
                      onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                      className="input w-full text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider ds-muted mb-1">
                      Cliente / Contacto CRM
                    </label>
                    <select
                      value={form.contactId}
                      onChange={(e) => setForm({ ...form, contactId: e.target.value })}
                      className="input w-full text-sm"
                    >
                      <option value="">Nenhum</option>
                      {contacts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.company ? `(${c.company})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider ds-muted mb-1">
                      Local / Link Reunião
                    </label>
                    <input
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="Escritório Luanda ou Google Meet"
                      className="input w-full text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider ds-muted mb-1">
                    Notas / Pauta
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Detalhes da reunião ou entregável..."
                    className="input w-full text-sm"
                  />
                </div>

                {!editing && (
                  <label className="flex items-center gap-2 text-xs cursor-pointer select-none pt-1">
                    <input
                      type="checkbox"
                      checked={form.createLinkedTask}
                      onChange={(e) => setForm({ ...form, createLinkedTask: e.target.checked })}
                      className="accent-sky-600"
                    />
                    <span>Criar automaticamente uma tarefa vinculada em <strong>Tarefas & Processos</strong></span>
                  </label>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t ds-divider">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="btn btn-secondary text-xs h-9 px-3.5"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary text-xs h-9 px-4"
                  >
                    {saving ? 'A guardar...' : editing ? 'Guardar Alterações' : 'Agendar Evento'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Modal Diagnóstico & Sincronização CalDAV / CardDAV (cPanel Angoweb) */}
      {davModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] bg-black/25 flex items-center justify-center p-4">
            <div
              className="ds-card w-full max-w-xl border ds-divider shadow-2xl"
              style={{ backgroundColor: 'rgb(var(--surface))' }}
            >
              <div className="px-5 py-3.5 border-b ds-divider flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-sky-500" />
                  <h3 className="text-sm font-semibold">Integração cPanel CalDAV & CardDAV</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDavModalOpen(false)}
                  className="btn btn-ghost btn-icon h-7 w-7"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-5 space-y-4 text-xs">
                <div className="p-3 border ds-divider flex items-start gap-2.5">
                  {caldavStatus?.caldavOnline ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-semibold">
                      {caldavStatus?.caldavOnline
                        ? 'Ligado ao servidor cPanel CalDAV'
                        : `cPanel porta 2080 respondeu HTTP ${caldavStatus?.caldavStatus || 'N/A'}`}
                    </p>
                    <p className="ds-muted leading-relaxed">{caldavStatus?.diagnostic}</p>
                  </div>
                </div>

                <div className="space-y-2 font-mono text-[11px]">
                  <div className="p-2.5 border ds-divider">
                    <p className="ds-muted uppercase text-[10px]">Servidor SSL/TLS</p>
                    <p className="mt-0.5">{caldavStatus?.server || 'https://mx109.angoweb.net:2080'}</p>
                  </div>
                  <div className="p-2.5 border ds-divider">
                    <p className="ds-muted uppercase text-[10px]">URL CalDAV (Calendário)</p>
                    <p className="mt-0.5 break-all">{caldavStatus?.caldavUrl}</p>
                  </div>
                  <div className="p-2.5 border ds-divider">
                    <p className="ds-muted uppercase text-[10px]">URL CardDAV (Contactos)</p>
                    <p className="mt-0.5 break-all">{caldavStatus?.carddavUrl}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t ds-divider">
                  <a
                    href={apiUrl('/api/v1/admin/calendar/export.ics')}
                    download="jogimil-calendario.ics"
                    className="btn btn-secondary text-xs h-8 px-3 gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Baixar ficheiro .ICS</span>
                  </a>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={loadAll}
                      className="btn btn-secondary text-xs h-8 px-3"
                    >
                      Reverificar
                    </button>
                    <button
                      type="button"
                      disabled={syncingCaldav}
                      onClick={handleSyncCalDav}
                      className="btn btn-primary text-xs h-8 px-3 gap-1.5"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${syncingCaldav ? 'animate-spin' : ''}`} />
                      <span>{syncingCaldav ? 'A sincronizar...' : 'Sincronizar CalDAV'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Modal Rápido de Agendamento de Publicação Multiplataforma */}
      {postModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
            onClick={() => setPostModalOpen(false)}
          >
            <form
              onSubmit={handleSchedulePostFromCalendar}
              onClick={(e) => e.stopPropagation()}
              className="ds-card w-full max-w-lg max-h-[88vh] flex flex-col border-[rgb(var(--border-strong))] shadow-2xl animate-fadeIn"
            >
              <div className="ds-card-header">
                <div>
                  <h2 className="ds-title">Agendar Publicação no Calendário</h2>
                  <p className="ds-subtitle">Publicação automática no Portal, Facebook, Instagram e Threads</p>
                </div>
                <button type="button" onClick={() => setPostModalOpen(false)} className="btn btn-ghost btn-icon h-8 w-8">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto space-y-4">
                <div>
                  <label className="label">Canais *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'portal', label: 'Portal', icon: '' },
                      { id: 'facebook', label: 'Facebook', icon: '/icons/facebook.svg' },
                      { id: 'instagram', label: 'Instagram', icon: '/icons/instagram.svg' },
                      { id: 'threads', label: 'Threads', icon: '/icons/threads.svg' },
                    ].map((c) => {
                      const active = postPlatforms.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() =>
                            setPostPlatforms((prev) =>
                              prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id]
                            )
                          }
                          className={`px-2.5 py-2 text-xs font-semibold border inline-flex items-center justify-center gap-1.5 ${
                            active ? 'border-brand bg-brand/15 text-brand' : 'ds-divider ds-surface-2 ds-muted'
                          }`}
                        >
                          {c.icon && <img src={c.icon} alt={c.label} className="h-3.5 w-3.5" />}
                          <span>{c.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Data e Hora *</label>
                    <input
                      type="datetime-local"
                      className="input text-xs"
                      value={postScheduledAt}
                      onChange={(e) => setPostScheduledAt(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Formato</label>
                    <select
                      className="input text-xs"
                      value={postType}
                      onChange={(e) => setPostType(e.target.value as typeof postType)}
                    >
                      <option value="post">Publicação Normal</option>
                      <option value="reel">Reels (Vídeo)</option>
                      <option value="story">Story (24h)</option>
                      <option value="carousel">Carrossel</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Título / Chamada *</label>
                  <input className="input" value={postTitle} onChange={(e) => setPostTitle(e.target.value)} required />
                </div>

                <div>
                  <label className="label">URL de Mídia Pública (HTTPS · opcional p/ Portal)</label>
                  <input
                    className="input text-xs font-mono"
                    value={postMediaUrl}
                    onChange={(e) => setPostMediaUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="label">Legenda / Conteúdo</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={postCaption}
                    onChange={(e) => setPostCaption(e.target.value)}
                    placeholder="Texto da publicação..."
                  />
                </div>
              </div>
              <div className="px-5 py-3 border-t ds-divider flex justify-end gap-2">
                <button type="button" onClick={() => setPostModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPost || !postTitle.trim() || postPlatforms.length === 0}
                  className="btn bg-violet-600 hover:bg-violet-500 text-white"
                >
                  {savingPost ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  <span>Agendar no Calendário</span>
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      <ConfirmModal
        isOpen={Boolean(confirmDelete)}
        title="Eliminar evento do calendário?"
        description={`O evento "${confirmDelete?.title || ''}" será removido permanentemente.`}
        confirmLabel="Eliminar Evento"
        loading={deleting}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      <FeedbackPopup
        notice={feedback.open ? { type: feedback.type, title: feedback.title, text: feedback.message } : null}
        onClose={() => setFeedback((f) => ({ ...f, open: false }))}
      />
    </div>
  );
}
