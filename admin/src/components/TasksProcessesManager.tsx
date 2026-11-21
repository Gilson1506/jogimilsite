import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Search,
  CalendarDays,
  CheckSquare,
  Square,
  Trash2,
  Edit3,
  X,
  User,
  Building2,
  LayoutGrid,
  List,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { apiUrl } from '../lib/api';
import { BrandLoader } from './BrandLoader';
import { Pagination } from './Pagination';
import { ConfirmModal, FeedbackPopup } from './ConfirmModal';

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface TaskProcess {
  id: string;
  code: string;
  title: string;
  description: string;
  category: 'operacao' | 'comercial' | 'suporte' | 'entrega' | 'interno';
  stage: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  assignee: string;
  contactId?: string | null;
  contactName?: string;
  dueDate?: string | null;
  calendarEventId?: string | null;
  syncToCalendar: boolean;
  checklist: ChecklistItem[];
  tags: string[];
  progress: number;
  createdAt: string;
  updatedAt: string;
}

interface ContactOpt {
  id: string;
  name: string;
  company?: string;
}

interface TeamMemberOpt {
  id: string;
  name: string;
  role?: string;
}

interface TasksProcessesManagerProps {
  onNavigate?: (tab: string) => void;
}

const STAGES: { id: TaskProcess['stage']; label: string; accent: string }[] = [
  { id: 'todo', label: 'Por Iniciar', accent: 'border-t-slate-400' },
  { id: 'in_progress', label: 'Em Curso', accent: 'border-t-sky-500' },
  { id: 'review', label: 'Em Revisão', accent: 'border-t-amber-500' },
  { id: 'done', label: 'Concluído', accent: 'border-t-emerald-500' },
];

const CATEGORIES: Record<TaskProcess['category'], string> = {
  operacao: 'Operação',
  comercial: 'Comercial',
  suporte: 'Suporte Técnico',
  entrega: 'Entrega Projeto',
  interno: 'Processo Interno',
};

const PRIORITY_STYLE: Record<TaskProcess['priority'], string> = {
  baixa: 'text-slate-400 border-slate-500/30',
  media: 'text-sky-500 border-sky-500/30',
  alta: 'text-amber-500 border-amber-500/30',
  urgente: 'text-rose-500 border-rose-500/40',
};

export function TasksProcessesManager({ onNavigate }: TasksProcessesManagerProps) {
  const [tasks, setTasks] = useState<TaskProcess[]>([]);
  const [contacts, setContacts] = useState<ContactOpt[]>([]);
  const [team, setTeam] = useState<TeamMemberOpt[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TaskProcess | null>(null);
  const [saving, setSaving] = useState(false);
  const [newCheckItem, setNewCheckItem] = useState('');

  const [confirmDelete, setConfirmDelete] = useState<TaskProcess | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ open: boolean; type: 'success' | 'error'; title: string; message: string }>({
    open: false,
    type: 'success',
    title: '',
    message: '',
  });

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'operacao' as TaskProcess['category'],
    stage: 'todo' as TaskProcess['stage'],
    priority: 'media' as TaskProcess['priority'],
    assignee: '',
    contactId: '',
    dueDate: '',
    syncToCalendar: true,
    checklist: [] as ChecklistItem[],
  });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [tRes, cRes, teamRes] = await Promise.all([
        fetch(apiUrl('/api/v1/admin/tasks')),
        fetch(apiUrl('/api/v1/admin/contacts')),
        fetch(apiUrl('/api/v1/admin/team')),
      ]);
      const tJson = await tRes.json().catch(() => ({}));
      const cJson = await cRes.json().catch(() => ({}));
      const teamJson = await teamRes.json().catch(() => ({}));

      if (tJson.success && Array.isArray(tJson.tasks)) setTasks(tJson.tasks);
      if (cJson.success && Array.isArray(cJson.contacts)) setContacts(cJson.contacts);
      if (teamJson.success && Array.isArray(teamJson.team || teamJson.members || teamJson.data)) {
        setTeam(teamJson.team || teamJson.members || teamJson.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        (t.assignee || '').toLowerCase().includes(q) ||
        (t.contactName || '').toLowerCase().includes(q)
      );
    });
  }, [tasks, search, filterCategory, filterPriority]);

  const pageSize = 10;
  const paginatedList = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page]
  );

  useEffect(() => {
    setPage(1);
  }, [search, filterCategory, filterPriority]);

  const metrics = useMemo(() => {
    const total = tasks.length;
    const inProgress = tasks.filter((t) => t.stage === 'in_progress' || t.stage === 'review').length;
    const done = tasks.filter((t) => t.stage === 'done').length;
    const overdue = tasks.filter(
      (t) => t.stage !== 'done' && t.dueDate && new Date(t.dueDate).getTime() < Date.now()
    ).length;
    return { total, inProgress, done, overdue };
  }, [tasks]);

  const openCreateModal = (initialStage: TaskProcess['stage'] = 'todo') => {
    setEditing(null);
    setNewCheckItem('');
    setForm({
      title: '',
      description: '',
      category: 'operacao',
      stage: initialStage,
      priority: 'media',
      assignee: team[0]?.name || 'Equipa JOGIMIL',
      contactId: '',
      dueDate: '',
      syncToCalendar: true,
      checklist: [],
    });
    setModalOpen(true);
  };

  const openEditModal = (t: TaskProcess) => {
    setEditing(t);
    setNewCheckItem('');
    setForm({
      title: t.title,
      description: t.description || '',
      category: t.category || 'operacao',
      stage: t.stage || 'todo',
      priority: t.priority || 'media',
      assignee: t.assignee || '',
      contactId: t.contactId || '',
      dueDate: t.dueDate ? String(t.dueDate).slice(0, 10) : '',
      syncToCalendar: t.syncToCalendar !== false,
      checklist: Array.isArray(t.checklist) ? t.checklist : [],
    });
    setModalOpen(true);
  };

  const handleAddCheckItem = () => {
    const text = newCheckItem.trim();
    if (!text) return;
    setForm((prev) => ({
      ...prev,
      checklist: [...prev.checklist, { id: `chk_${Date.now()}`, text, done: false }],
    }));
    setNewCheckItem('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const contact = contacts.find((c) => c.id === form.contactId);
      const body = {
        ...form,
        dueDate: form.dueDate ? `${form.dueDate}T09:00:00.000Z` : null,
        contactId: form.contactId || null,
        contactName: contact?.name || '',
      };

      const url = editing ? apiUrl(`/api/v1/admin/tasks/${editing.id}`) : apiUrl('/api/v1/admin/tasks');
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Erro ao guardar tarefa/processo');

      setModalOpen(false);
      await loadAll();
      setFeedback({
        open: true,
        type: 'success',
        title: editing ? 'Processo atualizado' : 'Processo criado',
        message:
          form.dueDate && form.syncToCalendar
            ? 'Guardado e sincronizado automaticamente no Calendário Corporativo.'
            : 'Tarefa/processo guardado com sucesso.',
      });
    } catch (err) {
      setFeedback({
        open: true,
        type: 'error',
        title: 'Erro ao guardar',
        message: err instanceof Error ? err.message : 'Não foi possível guardar.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMoveStage = async (task: TaskProcess, nextStage: TaskProcess['stage']) => {
    try {
      const res = await fetch(apiUrl(`/api/v1/admin/tasks/${task.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: nextStage }),
      });
      if (res.ok) await loadAll();
    } catch {
      // ignore
    }
  };

  const handleToggleInlineCheck = async (task: TaskProcess, itemId: string) => {
    const nextChecklist = task.checklist.map((c) =>
      c.id === itemId ? { ...c, done: !c.done } : c
    );
    try {
      const res = await fetch(apiUrl(`/api/v1/admin/tasks/${task.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklist: nextChecklist }),
      });
      if (res.ok) await loadAll();
    } catch {
      // ignore
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(apiUrl(`/api/v1/admin/tasks/${confirmDelete.id}`), {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Falha ao eliminar processo');
      setConfirmDelete(null);
      await loadAll();
      setFeedback({
        open: true,
        type: 'success',
        title: 'Processo eliminado',
        message: 'A tarefa/processo e o seu evento vinculado foram removidos.',
      });
    } catch (err) {
      setFeedback({
        open: true,
        type: 'error',
        title: 'Erro ao eliminar',
        message: err instanceof Error ? err.message : 'Falha ao eliminar.',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="py-20 flex items-center justify-center">
        <BrandLoader />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-display font-semibold tracking-tight">
            Gestão de Tarefas & Processos
          </h2>
          <p className="text-xs ds-muted mt-0.5">
            Fluxo operacional com etapas, checklists, responsáveis e sincronização bidirecional com o Calendário.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('calendar')}
              className="btn btn-secondary text-xs h-9 px-3 gap-1.5"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Ver no Calendário</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => openCreateModal('todo')}
            className="btn btn-primary text-xs h-9 px-3.5 gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Novo Processo / Tarefa</span>
          </button>
        </div>
      </div>

      {/* KPIs Operacionais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="ds-card p-3.5">
          <p className="text-[11px] uppercase tracking-wider ds-muted font-semibold">Total de Processos</p>
          <p className="text-2xl font-display font-bold mt-1">{metrics.total}</p>
        </div>
        <div className="ds-card p-3.5">
          <p className="text-[11px] uppercase tracking-wider ds-muted font-semibold">Em Execução / Revisão</p>
          <p className="text-2xl font-display font-bold mt-1 text-sky-500">{metrics.inProgress}</p>
        </div>
        <div className="ds-card p-3.5">
          <p className="text-[11px] uppercase tracking-wider ds-muted font-semibold">Concluídos</p>
          <p className="text-2xl font-display font-bold mt-1 text-emerald-500">{metrics.done}</p>
        </div>
        <div className="ds-card p-3.5">
          <p className="text-[11px] uppercase tracking-wider ds-muted font-semibold">Com Prazo Vencido</p>
          <p className="text-2xl font-display font-bold mt-1 text-rose-500">{metrics.overdue}</p>
        </div>
      </div>

      {/* Filtros & Vista */}
      <div className="ds-card p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="h-3.5 w-3.5 ds-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar código, título, cliente..."
              className="input w-full pl-8 text-xs h-8"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input text-xs h-8"
          >
            <option value="all">Todas Categorias</option>
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="input text-xs h-8"
          >
            <option value="all">Todas Prioridades</option>
            <option value="urgente">Urgente</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>

        <div className="flex border ds-divider">
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={`px-2.5 py-1 text-xs inline-flex items-center gap-1 ${
              viewMode === 'kanban' ? 'bg-sky-600 text-white' : 'ds-muted'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Kanban</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-2.5 py-1 text-xs inline-flex items-center gap-1 ${
              viewMode === 'list' ? 'bg-sky-600 text-white' : 'ds-muted'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>Lista</span>
          </button>
        </div>
      </div>

      {/* Vista Kanban */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {STAGES.map((stage) => {
            const colTasks = filtered.filter((t) => t.stage === stage.id);
            return (
              <div key={stage.id} className={`ds-card border-t-2 ${stage.accent} flex flex-col`}>
                <div className="px-3.5 py-2.5 border-b ds-divider flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">{stage.label}</span>
                    <span className="text-[11px] font-mono ds-muted">({colTasks.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openCreateModal(stage.id)}
                    className="btn btn-ghost btn-icon h-6 w-6"
                    title={`Nova tarefa em ${stage.label}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="p-2.5 space-y-2.5 flex-1 min-h-[280px]">
                  {colTasks.length === 0 ? (
                    <p className="text-[11px] ds-muted text-center py-8">Sem itens nesta etapa.</p>
                  ) : (
                    colTasks.map((task) => {
                      const nextStageIdx = STAGES.findIndex((s) => s.id === task.stage) + 1;
                      const nextStage = STAGES[nextStageIdx];
                      const isOverdue =
                        task.stage !== 'done' &&
                        task.dueDate &&
                        new Date(task.dueDate).getTime() < Date.now();

                      return (
                        <div key={task.id} className="p-3 border ds-divider space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono ds-muted">{task.code}</span>
                            <span
                              className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 border ${
                                PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.media
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>

                          <div>
                            <p className="text-sm font-medium leading-snug">{task.title}</p>
                            <p className="text-[11px] ds-muted mt-0.5">
                              {CATEGORIES[task.category] || task.category}
                            </p>
                          </div>

                          {/* Progresso */}
                          <div>
                            <div className="flex justify-between text-[10px] ds-muted mb-1">
                              <span>Progresso</span>
                              <span className="font-mono">{task.progress}%</span>
                            </div>
                            <div className="h-1 w-full bg-slate-500/20 overflow-hidden">
                              <div
                                className="h-full bg-sky-500 transition-all"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          </div>

                          {/* Checklist rápida (primeiros 3 itens) */}
                          {task.checklist.length > 0 && (
                            <div className="space-y-1 pt-1">
                              {task.checklist.slice(0, 3).map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => handleToggleInlineCheck(task, item.id)}
                                  className="flex items-center gap-1.5 text-[11px] text-left w-full hover:opacity-80"
                                >
                                  {item.done ? (
                                    <CheckSquare className="h-3 w-3 text-emerald-500 shrink-0" />
                                  ) : (
                                    <Square className="h-3 w-3 ds-muted shrink-0" />
                                  )}
                                  <span className={item.done ? 'line-through ds-muted truncate' : 'truncate'}>
                                    {item.text}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Metadados + Ações */}
                          <div className="pt-2 border-t ds-divider flex flex-wrap items-center justify-between gap-2 text-[11px] ds-muted">
                            <div className="space-y-0.5 min-w-0">
                              {task.assignee && (
                                <div className="flex items-center gap-1 truncate">
                                  <User className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{task.assignee}</span>
                                </div>
                              )}
                              {task.dueDate && (
                                <div
                                  className={`flex items-center gap-1 ${
                                    isOverdue ? 'text-rose-500 font-semibold' : ''
                                  }`}
                                >
                                  <Clock className="h-3 w-3 shrink-0" />
                                  <span>{String(task.dueDate).slice(0, 10)}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              {nextStage && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveStage(task, nextStage.id)}
                                  title={`Avançar para ${nextStage.label}`}
                                  className="btn btn-ghost btn-icon h-7 w-7 text-sky-500"
                                >
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => openEditModal(task)}
                                title="Editar"
                                className="btn btn-ghost btn-icon h-7 w-7"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDelete(task)}
                                title="Eliminar"
                                className="btn btn-ghost btn-icon h-7 w-7 text-rose-500"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Vista Tabela Paginada */
        <div className="ds-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b ds-divider text-[11px] uppercase tracking-wider ds-muted">
                <tr>
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3">Processo / Tarefa</th>
                  <th className="py-2.5 px-3">Etapa</th>
                  <th className="py-2.5 px-3">Responsável</th>
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3">Prazo</th>
                  <th className="py-2.5 px-3">Progresso</th>
                  <th className="py-2.5 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y ds-divider">
                {paginatedList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center ds-muted">
                      Nenhuma tarefa ou processo encontrado.
                    </td>
                  </tr>
                ) : (
                  paginatedList.map((t) => (
                    <tr key={t.id} className="hover:bg-sky-500/[0.03]">
                      <td className="py-2.5 px-3 font-mono ds-muted">{t.code}</td>
                      <td className="py-2.5 px-3">
                        <p className="font-medium">{t.title}</p>
                        <p className="text-[11px] ds-muted">{CATEGORIES[t.category] || t.category}</p>
                      </td>
                      <td className="py-2.5 px-3">
                        <select
                          value={t.stage}
                          onChange={(e) => handleMoveStage(t, e.target.value as TaskProcess['stage'])}
                          className="input text-xs py-1 h-7"
                        >
                          {STAGES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-3">{t.assignee || '—'}</td>
                      <td className="py-2.5 px-3">
                        {t.contactName ? (
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="h-3 w-3 ds-muted" />
                            {t.contactName}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {t.dueDate ? String(t.dueDate).slice(0, 10) : '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono">{t.progress}%</td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(t)}
                            className="btn btn-ghost btn-icon h-7 w-7"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(t)}
                            className="btn btn-ghost btn-icon h-7 w-7 text-rose-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={filtered.length}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Modal Criar / Editar Tarefa / Processo */}
      {modalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] bg-black/25 flex items-center justify-center p-4">
            <div
              className="ds-card w-full max-w-xl border ds-divider shadow-2xl max-h-[90vh] flex flex-col"
              style={{ backgroundColor: 'rgb(var(--surface))' }}
            >
              <div className="px-5 py-3.5 border-b ds-divider flex items-center justify-between shrink-0">
                <h3 className="text-sm font-semibold">
                  {editing ? `Editar ${editing.code}` : 'Novo Processo / Tarefa'}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-ghost btn-icon h-7 w-7"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-5 space-y-3.5 overflow-y-auto flex-1">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider ds-muted mb-1">
                    Título do Processo / Tarefa *
                  </label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ex: Implantação ERP Cliente Luanda Sul"
                    className="input w-full text-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider ds-muted mb-1">
                      Categoria
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value as TaskProcess['category'] })}
                      className="input w-full text-xs"
                    >
                      {Object.entries(CATEGORIES).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider ds-muted mb-1">
                      Etapa
                    </label>
                    <select
                      value={form.stage}
                      onChange={(e) => setForm({ ...form, stage: e.target.value as TaskProcess['stage'] })}
                      className="input w-full text-xs"
                    >
                      {STAGES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider ds-muted mb-1">
                      Prioridade
                    </label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value as TaskProcess['priority'] })}
                      className="input w-full text-xs"
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
                      Responsável
                    </label>
                    <input
                      list="team-assignee-list"
                      value={form.assignee}
                      onChange={(e) => setForm({ ...form, assignee: e.target.value })}
                      placeholder="Nome do responsável"
                      className="input w-full text-sm"
                    />
                    <datalist id="team-assignee-list">
                      {team.map((m) => (
                        <option key={m.id} value={m.name} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider ds-muted mb-1">
                      Cliente CRM Vinculado
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
                </div>

                <div className="grid grid-cols-2 gap-3 items-end">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider ds-muted mb-1">
                      Prazo de Conclusão
                    </label>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                      className="input w-full text-xs"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs pb-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.syncToCalendar}
                      onChange={(e) => setForm({ ...form, syncToCalendar: e.target.checked })}
                      className="accent-sky-600"
                    />
                    <span>Sincronizar prazo no Calendário</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider ds-muted mb-1">
                    Descrição / Escopo
                  </label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Detalhes do processo, critérios de entrega..."
                    className="input w-full text-sm"
                  />
                </div>

                {/* Checklist do Processo */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider ds-muted">
                    Checklist de Etapas ({form.checklist.filter((c) => c.done).length}/{form.checklist.length})
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={newCheckItem}
                      onChange={(e) => setNewCheckItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCheckItem();
                        }
                      }}
                      placeholder="Adicionar passo do processo..."
                      className="input flex-1 text-xs h-8"
                    />
                    <button
                      type="button"
                      onClick={handleAddCheckItem}
                      className="btn btn-secondary text-xs h-8 px-3"
                    >
                      Adicionar
                    </button>
                  </div>
                  {form.checklist.length > 0 && (
                    <div className="border ds-divider divide-y ds-divider max-h-36 overflow-y-auto">
                      {form.checklist.map((item) => (
                        <div key={item.id} className="px-2.5 py-1.5 flex items-center justify-between gap-2 text-xs">
                          <label className="flex items-center gap-2 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={item.done}
                              onChange={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  checklist: prev.checklist.map((c) =>
                                    c.id === item.id ? { ...c, done: !c.done } : c
                                  ),
                                }))
                              }
                              className="accent-emerald-500"
                            />
                            <span className={item.done ? 'line-through ds-muted' : ''}>{item.text}</span>
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                checklist: prev.checklist.filter((c) => c.id !== item.id),
                              }))
                            }
                            className="text-rose-500 hover:opacity-75"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t ds-divider">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="btn btn-secondary text-xs h-9 px-3.5"
                  >
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving} className="btn btn-primary text-xs h-9 px-4">
                    {saving ? 'A guardar...' : editing ? 'Guardar Alterações' : 'Criar Processo'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      <ConfirmModal
        isOpen={Boolean(confirmDelete)}
        title="Eliminar tarefa/processo?"
        description={`O processo "${confirmDelete?.code} — ${confirmDelete?.title || ''}" será eliminado permanentemente.`}
        confirmLabel="Eliminar Processo"
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
