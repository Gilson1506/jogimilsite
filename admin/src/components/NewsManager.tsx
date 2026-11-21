import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Trash2,
  RefreshCw,
  X,
  Image as ImageIcon,
  Calendar,
  CalendarClock,
  Pencil,
  Share2,
  Film,
  Layers,
  Sparkles,
  Globe,
  CheckCircle2,
  AlertCircle,
  Send,
  Clock,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { Pagination } from './Pagination';
import { BrandLoader } from './BrandLoader';
import { ConfirmModal, FeedbackPopup } from './ConfirmModal';
import { AdminIcon3D } from './AdminIcon3D';

interface NewsItem {
  id?: string;
  slug: string;
  title: string;
  category?: string;
  tag?: string;
  date: string;
  excerpt: string;
  content?: string;
  body?: string[];
  image?: string;
  author?: string;
  published?: boolean;
}

interface SocialPostRecord {
  id: string;
  title: string;
  caption: string;
  postType: 'post' | 'reel' | 'story' | 'carousel';
  platforms: string[];
  mediaUrl?: string;
  link?: string;
  scheduledAt?: string | null;
  calendarEventId?: string | null;
  status?: 'scheduled' | 'published' | 'partial' | 'failed';
  results: Record<string, { success: boolean; status: string; remoteId?: string | null; error?: string }>;
  createdAt: string;
}

interface NewsManagerProps {
  theme?: 'dark' | 'light';
}

const POST_TYPE_LABELS: Record<'post' | 'reel' | 'story' | 'carousel', string> = {
  post: 'Publicação Normal',
  reel: 'Reels (Vídeo)',
  story: 'Story (24h)',
  carousel: 'Carrossel',
};

const PLATFORM_ICON_SRC: Record<string, string> = {
  facebook: '/icons/facebook.svg',
  instagram: '/icons/instagram.svg',
  threads: '/icons/threads.svg',
};

function toLocalDateTimeInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function compressCoverImage(file: File, maxDim = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler imagem.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(String(reader.result || ''));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result || ''));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

export function NewsManager(_props: NewsManagerProps) {
  const [activeTab, setActiveTab] = useState<'portal' | 'scheduled' | 'social'>('portal');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialPostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishingNowId, setPublishingNowId] = useState<string | null>(null);
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);
  const [deleteSocialId, setDeleteSocialId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Campos de conteúdo
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Tecnologia');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [author, setAuthor] = useState('Equipa JOGIMIL');

  // Publicação Multiplataforma + Rascunho + Agendamento no Calendário
  const [platforms, setPlatforms] = useState<string[]>(['portal']);
  const [postType, setPostType] = useState<'post' | 'reel' | 'story' | 'carousel'>('post');
  const [publicMediaUrl, setPublicMediaUrl] = useState('');
  const [scheduleMode, setScheduleMode] = useState<'draft' | 'now' | 'schedule'>('draft');
  const [scheduledAt, setScheduledAt] = useState('');
  const [syncCalendar, setSyncCalendar] = useState(true);
  const [publishingDraftSlug, setPublishingDraftSlug] = useState<string | null>(null);

  const showNotice = (type: 'success' | 'error', text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 5000);
  };

  const togglePlatform = (p: string) => {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const applyQuickSchedule = (preset: '1h' | 'tomorrow9' | 'tomorrow18') => {
    const d = new Date();
    if (preset === '1h') {
      d.setHours(d.getHours() + 1, 0, 0, 0);
    } else if (preset === 'tomorrow9') {
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
    } else {
      d.setDate(d.getDate() + 1);
      d.setHours(18, 0, 0, 0);
    }
    setScheduleMode('schedule');
    setScheduledAt(toLocalDateTimeInput(d));
  };

  const resetForm = (startScheduled = false) => {
    setEditingSlug(null);
    setTitle('');
    setCategory('Tecnologia');
    setDate(new Date().toISOString().slice(0, 10));
    setExcerpt('');
    setContent('');
    setImage('');
    setAuthor('Equipa JOGIMIL');
    setPlatforms(startScheduled ? ['portal', 'facebook', 'instagram'] : ['portal']);
    setPostType('post');
    setPublicMediaUrl('');
    setSyncCalendar(true);
    if (startScheduled) {
      const nextHour = new Date(Date.now() + 3600 * 1000);
      nextHour.setMinutes(0, 0, 0);
      setScheduleMode('schedule');
      setScheduledAt(toLocalDateTimeInput(nextHour));
    } else {
      setScheduleMode('draft');
      setScheduledAt('');
    }
  };

  const openCreateModal = (startScheduled = false) => {
    resetForm(startScheduled);
    setModalOpen(true);
  };

  const openEditModal = (item: NewsItem) => {
    setEditingSlug(item.slug);
    setTitle(item.title || '');
    setCategory(item.category || item.tag || 'Tecnologia');
    setDate(item.date || new Date().toISOString().slice(0, 10));
    setExcerpt(item.excerpt || '');
    setContent(item.content || (Array.isArray(item.body) ? item.body.join('\n\n') : ''));
    setImage(item.image || '');
    setAuthor(item.author || 'Equipa JOGIMIL');
    setPlatforms(['portal']);
    setPostType('post');
    setPublicMediaUrl(item.image?.startsWith('http') ? item.image : '');
    setScheduleMode(item.published === false ? 'draft' : 'now');
    setScheduledAt('');
    setSyncCalendar(true);
    setModalOpen(true);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [newsRes, socialRes] = await Promise.all([
        apiFetch<{ news?: NewsItem[]; data?: NewsItem[] }>('/api/v1/admin/news').catch(
          () => ({ news: [] as NewsItem[], data: [] as NewsItem[] })
        ),
        apiFetch<{ posts?: SocialPostRecord[] }>('/api/v1/admin/meta/posts').catch(
          () => ({ posts: [] as SocialPostRecord[] })
        ),
      ]);
      setNews(newsRes.news || newsRes.data || []);
      setSocialPosts(socialRes.posts || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const scheduledPosts = useMemo(
    () => socialPosts.filter((p) => p.status === 'scheduled'),
    [socialPosts]
  );

  const publishedSocialPosts = useMemo(
    () => socialPosts.filter((p) => p.status !== 'scheduled'),
    [socialPosts]
  );

  const handleImageFile = async (file: File) => {
    try {
      const dataUrl = await compressCoverImage(file, 1280);
      setImage(dataUrl);
    } catch {
      showNotice('error', 'Não foi possível processar a imagem.');
    }
  };

  const hasSocialSelected = platforms.some((p) => p === 'facebook' || p === 'instagram' || p === 'threads');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || platforms.length === 0) return;

    if (scheduleMode === 'schedule') {
      if (!scheduledAt || new Date(scheduledAt).getTime() <= Date.now() + 30000) {
        showNotice('error', 'Escolha uma data e hora futura para agendar a publicação.');
        return;
      }
    }

    setSaving(true);
    try {
      // MODO RASCUNHO (guarda sem publicar automaticamente no portal ou redes)
      if (scheduleMode === 'draft') {
        await apiFetch('/api/v1/admin/news', {
          method: 'POST',
          body: JSON.stringify({
            ...(editingSlug ? { slug: editingSlug } : {}),
            title: title.trim(),
            category,
            tag: category,
            excerpt: excerpt.trim(),
            content: content.trim() || excerpt.trim(),
            image: image.trim() || publicMediaUrl.trim(),
            author: author.trim() || 'Equipa JOGIMIL',
            date: date || new Date().toISOString().slice(0, 10),
            published: false,
          }),
        });
        resetForm();
        setModalOpen(false);
        setActiveTab('portal');
        showNotice('success', 'Rascunho guardado! Só ficará visível no portal quando clicar em "Publicar".');
        await loadAll();
        return;
      }

      // MODO AGENDADO (conecta com o Calendário e dispara automaticamente na hora exata)
      if (scheduleMode === 'schedule') {
        const mediaForMeta =
          publicMediaUrl.trim() || (image.trim().startsWith('http') ? image.trim() : '');
        await apiFetch('/api/v1/admin/meta/publish', {
          method: 'POST',
          body: JSON.stringify({
            title: title.trim(),
            category,
            author: author.trim() || 'Equipa JOGIMIL',
            excerpt: excerpt.trim(),
            content: content.trim() || excerpt.trim(),
            caption: [excerpt.trim(), content.trim()].filter(Boolean).join('\n\n'),
            image: image.trim() || mediaForMeta,
            mediaUrl: mediaForMeta,
            postType,
            platforms,
            scheduledAt: new Date(scheduledAt).toISOString(),
            syncCalendar,
          }),
        });
        resetForm();
        setModalOpen(false);
        setActiveTab('scheduled');
        showNotice(
          'success',
          syncCalendar
            ? 'Publicação agendada e sincronizada automaticamente no Calendário!'
            : 'Publicação agendada com sucesso.'
        );
        await loadAll();
        return;
      }

      // MODO IMEDIATO
      const messages: string[] = [];

      if (platforms.includes('portal')) {
        await apiFetch('/api/v1/admin/news', {
          method: 'POST',
          body: JSON.stringify({
            ...(editingSlug ? { slug: editingSlug } : {}),
            title: title.trim(),
            category,
            tag: category,
            excerpt: excerpt.trim(),
            content: content.trim() || excerpt.trim(),
            image: image.trim() || publicMediaUrl.trim(),
            author: author.trim() || 'Equipa JOGIMIL',
            date: date || new Date().toISOString().slice(0, 10),
            published: true,
          }),
        });
        messages.push('Portal/Blog');
      }

      const socialTargets = platforms.filter((p) => p !== 'portal');
      if (socialTargets.length > 0) {
        const mediaForMeta =
          publicMediaUrl.trim() || (image.trim().startsWith('http') ? image.trim() : '');
        const metaRes = await apiFetch<{ post?: SocialPostRecord }>('/api/v1/admin/meta/publish', {
          method: 'POST',
          body: JSON.stringify({
            title: title.trim(),
            caption: [excerpt.trim(), content.trim()].filter(Boolean).join('\n\n'),
            postType,
            platforms: socialTargets,
            mediaUrl: mediaForMeta,
          }),
        });

        const resMap = metaRes.post?.results || {};
        const okList = Object.entries(resMap)
          .filter(([, r]) => r.success)
          .map(([k]) => k.toUpperCase());
        const failList = Object.entries(resMap)
          .filter(([, r]) => !r.success)
          .map(([k, r]) => `${k.toUpperCase()}: ${r.error || 'erro'}`);

        if (okList.length > 0) messages.push(`Redes (${okList.join(', ')})`);
        if (failList.length > 0 && okList.length === 0 && !platforms.includes('portal')) {
          showNotice('error', failList.join(' | '));
          await loadAll();
          setModalOpen(false);
          resetForm();
          return;
        }
      }

      resetForm();
      setModalOpen(false);
      showNotice(
        'success',
        editingSlug
          ? 'Publicação atualizada com sucesso.'
          : `Publicado em: ${messages.join(' + ') || 'Registo guardado'}.`
      );
      await loadAll();
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Erro ao publicar conteúdo.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishDraft = async (item: NewsItem) => {
    setPublishingDraftSlug(item.slug);
    try {
      await apiFetch('/api/v1/admin/news', {
        method: 'POST',
        body: JSON.stringify({
          slug: item.slug,
          title: item.title,
          category: item.category || item.tag || 'Tecnologia',
          tag: item.category || item.tag || 'Tecnologia',
          excerpt: item.excerpt || '',
          content: item.content || (Array.isArray(item.body) ? item.body.join('\n\n') : item.excerpt || ''),
          image: item.image || '',
          author: item.author || 'Equipa JOGIMIL',
          date: item.date || new Date().toISOString().slice(0, 10),
          published: true,
        }),
      });
      showNotice('success', `"${item.title}" publicado agora no Portal & Blog!`);
      await loadAll();
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Falha ao publicar rascunho.');
    } finally {
      setPublishingDraftSlug(null);
    }
  };

  const handlePublishNow = async (id: string) => {
    setPublishingNowId(id);
    try {
      await apiFetch(`/api/v1/admin/meta/posts/${encodeURIComponent(id)}/publish-now`, {
        method: 'POST',
      });
      showNotice('success', 'Publicação agendada disparada imediatamente!');
      await loadAll();
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Falha ao publicar agora.');
    } finally {
      setPublishingNowId(null);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      if (deleteSlug) {
        await apiFetch(`/api/v1/admin/news/${encodeURIComponent(deleteSlug)}`, { method: 'DELETE' });
        setNews((prev) => prev.filter((n) => (n.slug || n.id) !== deleteSlug));
        showNotice('success', 'Notícia removida com sucesso.');
      } else if (deleteSocialId) {
        await apiFetch(`/api/v1/admin/meta/posts/${encodeURIComponent(deleteSocialId)}`, { method: 'DELETE' });
        setSocialPosts((prev) => prev.filter((p) => p.id !== deleteSocialId));
        showNotice('success', 'Publicação removida (e evento do Calendário cancelado).');
      }
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Erro ao remover.');
    } finally {
      setDeleting(false);
      setDeleteSlug(null);
      setDeleteSocialId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-fadeIn">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2.5">
            <AdminIcon3D name="news" size={26} />
            <span>Notícias &amp; Publicações Multiplataforma</span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex border ds-divider">
            <button
              type="button"
              onClick={() => setActiveTab('portal')}
              className={`px-3 h-9 text-xs font-semibold inline-flex items-center gap-1.5 ${
                activeTab === 'portal' ? 'bg-brand text-white' : 'ds-muted hover:text-[rgb(var(--text))]'
              }`}
            >
              <Globe className="h-3.5 w-3.5" /> Portal ({news.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('scheduled')}
              className={`px-3 h-9 text-xs font-semibold inline-flex items-center gap-1.5 ${
                activeTab === 'scheduled' ? 'bg-violet-600 text-white' : 'ds-muted hover:text-[rgb(var(--text))]'
              }`}
            >
              <CalendarClock className="h-3.5 w-3.5" /> Agendados ({scheduledPosts.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('social')}
              className={`px-3 h-9 text-xs font-semibold inline-flex items-center gap-1.5 ${
                activeTab === 'social' ? 'bg-brand text-white' : 'ds-muted hover:text-[rgb(var(--text))]'
              }`}
            >
              <Share2 className="h-3.5 w-3.5" /> Histórico Social ({publishedSocialPosts.length})
            </button>
          </div>
          <button type="button" onClick={loadAll} disabled={loading} className="btn btn-secondary">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => openCreateModal(true)}
            className="btn btn-secondary"
            title="Agendar publicação diretamente no Calendário"
          >
            <CalendarClock className="h-4 w-4 text-violet-400" /> Agendar Post
          </button>
          <button type="button" onClick={() => openCreateModal(false)} className="btn btn-primary">
            <Plus className="h-4 w-4" /> Nova Publicação
          </button>
        </div>
      </div>

      {loading && news.length === 0 && socialPosts.length === 0 ? (
        <div className="ds-card">
          <BrandLoader size="md" />
        </div>
      ) : activeTab === 'portal' ? (
        news.length === 0 ? (
          <div className="ds-card p-12 text-center space-y-3">
            <p className="text-sm ds-muted">Ainda não existem notícias publicadas no Portal.</p>
            <button type="button" onClick={() => openCreateModal(false)} className="btn btn-primary">
              <Plus className="h-4 w-4" /> Publicar primeira notícia
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {news.slice((page - 1) * pageSize, page * pageSize).map((item) => {
                const key = item.slug || item.id || item.title;
                return (
                  <article key={key} className="ds-card flex flex-col overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="h-40 w-full object-cover border-b ds-divider" />
                    ) : (
                      <div className="h-32 w-full ds-surface-2 border-b ds-divider flex items-center justify-center ds-subtle">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}
                    <div className="p-4 flex-1 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono ds-muted">
                        <span className="uppercase text-brand font-semibold truncate">{item.category || item.tag || 'Blog'}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`badge text-[10px] ${
                              item.published === false
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {item.published === false ? 'Rascunho' : 'Publicado'}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {item.date || '—'}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-sm font-semibold leading-snug">{item.title}</h3>
                      <p className="text-xs ds-muted line-clamp-3 flex-1">{item.excerpt || item.content}</p>
                      <div className="pt-3 mt-2 border-t ds-divider flex items-center justify-between gap-2">
                        <span className="text-[11px] ds-subtle truncate">{item.author || 'Equipa JOGIMIL'}</span>
                        <div className="flex items-center gap-1">
                          {item.published === false && (
                            <button
                              type="button"
                              disabled={publishingDraftSlug === item.slug}
                              onClick={() => handlePublishDraft(item)}
                              className="btn btn-primary btn-sm"
                              title="Publicar este rascunho agora no Portal"
                            >
                              {publishingDraftSlug === item.slug ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Send className="h-3.5 w-3.5" />
                              )}
                              <span>Publicar</span>
                            </button>
                          )}
                          <button type="button" onClick={() => openEditModal(item)} className="btn btn-ghost btn-sm">
                            <Pencil className="h-3.5 w-3.5" /> Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteSlug(item.slug || item.id || '')}
                            className="btn btn-ghost btn-sm text-rose-500 hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="ds-card">
              <Pagination
                page={page}
                pageSize={pageSize}
                totalItems={news.length}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          </div>
        )
      ) : activeTab === 'scheduled' ? (
        scheduledPosts.length === 0 ? (
          <div className="ds-card p-12 text-center space-y-3">
            <CalendarClock className="h-8 w-8 text-violet-400 mx-auto" />
            <p className="text-sm ds-muted">Nenhuma publicação agendada no Calendário de momento.</p>
            <button type="button" onClick={() => openCreateModal(true)} className="btn btn-primary">
              <CalendarClock className="h-4 w-4" /> Agendar Primeira Publicação
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {scheduledPosts.map((sp) => (
              <div key={sp.id} className="ds-card p-4 flex flex-col gap-3 border-l-2 border-l-violet-500">
                <div className="flex items-center justify-between gap-2">
                  <span className="badge bg-violet-500/15 text-violet-300 border-violet-500/35 text-[10px]">
                    <Clock className="h-3 w-3" />
                    {sp.scheduledAt
                      ? new Date(sp.scheduledAt).toLocaleString('pt-PT', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Agendado'}
                  </span>
                  <span className="badge ds-surface-2 ds-divider text-[10px]">
                    {POST_TYPE_LABELS[sp.postType] || sp.postType}
                  </span>
                </div>

                <h3 className="text-sm font-semibold">{sp.title || 'Publicação Agendada'}</h3>
                {sp.caption && <p className="text-xs ds-muted line-clamp-3 flex-1">{sp.caption}</p>}

                {/* Canais de destino com ícones oficiais */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t ds-divider">
                  {(sp.platforms || []).map((pl) => (
                    <span
                      key={pl}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] ds-surface-2 border ds-divider"
                    >
                      {PLATFORM_ICON_SRC[pl] ? (
                        <img src={PLATFORM_ICON_SRC[pl]} alt={pl} className="h-3 w-3" />
                      ) : (
                        <Globe className="h-3 w-3 text-brand" />
                      )}
                      <span className="capitalize">{pl}</span>
                    </span>
                  ))}
                  {sp.calendarEventId && (
                    <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-emerald-400">
                      <Calendar className="h-3 w-3" /> No Calendário
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t ds-divider flex items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={publishingNowId === sp.id}
                    onClick={() => handlePublishNow(sp.id)}
                    className="btn btn-secondary btn-sm"
                  >
                    {publishingNowId === sp.id ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5 text-brand" />
                    )}
                    <span>Publicar Agora</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteSocialId(sp.id)}
                    className="btn btn-ghost btn-sm text-rose-500 hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Cancelar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : publishedSocialPosts.length === 0 ? (
        <div className="ds-card p-12 text-center space-y-3">
          <p className="text-sm ds-muted">Nenhuma publicação enviada para Facebook, Instagram ou Threads ainda.</p>
          <button type="button" onClick={() => openCreateModal(false)} className="btn btn-primary">
            <Plus className="h-4 w-4" /> Criar Publicação Multiplataforma
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {publishedSocialPosts.map((sp) => (
            <div key={sp.id} className="ds-card p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="badge bg-brand/10 text-brand border-brand/30 text-[10px] uppercase">
                  {POST_TYPE_LABELS[sp.postType] || sp.postType}
                </span>
                <span className="font-mono text-[10px] ds-subtle">
                  {new Date(sp.createdAt).toLocaleString('pt-PT', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <h3 className="text-sm font-semibold">{sp.title || 'Publicação Social'}</h3>
              {sp.caption && <p className="text-xs ds-muted line-clamp-3">{sp.caption}</p>}

              <div className="space-y-1.5 pt-2 border-t ds-divider">
                {Object.entries(sp.results || {}).map(([net, r]) => (
                  <div key={net} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="inline-flex items-center gap-1.5 uppercase font-mono font-semibold">
                      {PLATFORM_ICON_SRC[net] && <img src={PLATFORM_ICON_SRC[net]} alt={net} className="h-3.5 w-3.5" />}
                      {net}
                    </span>
                    {r.success ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> {r.status === 'scheduled' ? 'Agendado' : 'Publicado'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-400 truncate max-w-[200px]" title={r.error}>
                        <AlertCircle className="h-3 w-3 shrink-0" /> {r.error || r.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2 mt-auto border-t ds-divider flex justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteSocialId(sp.id)}
                  className="btn btn-ghost btn-sm text-rose-500 hover:text-rose-400"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Multiplataforma & Agendamento Conectado ao Calendário */}
      {modalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 backdrop-blur-xs p-4"
            onClick={() => setModalOpen(false)}
          >
            <form
              onSubmit={handleSubmit}
              onClick={(e) => e.stopPropagation()}
              className="ds-card w-full max-w-2xl max-h-[90vh] flex flex-col border-[rgb(var(--border-strong))] shadow-2xl animate-fadeIn"
            >
              <div className="ds-card-header">
                <div>
                  <h2 className="ds-title">
                    {editingSlug ? 'Editar Publicação' : 'Publicar ou Agendar no Calendário'}
                  </h2>
                  <p className="ds-subtitle">
                    Multiplataforma (Portal, Facebook, Instagram e Threads) com disparo automático sincronizado no Calendário
                  </p>
                </div>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost btn-icon h-8 w-8">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4">
                {/* 1. Canais de Publicação */}
                <div>
                  <label className="label">Canais de Publicação *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'portal', label: 'Portal / Blog', iconSrc: '', activeCls: 'border-brand bg-brand/15 text-brand' },
                      { id: 'facebook', label: 'Facebook', iconSrc: '/icons/facebook.svg', activeCls: 'border-blue-500 bg-blue-500/15 text-blue-400' },
                      { id: 'instagram', label: 'Instagram', iconSrc: '/icons/instagram.svg', activeCls: 'border-pink-500 bg-pink-500/15 text-pink-400' },
                      { id: 'threads', label: 'Threads', iconSrc: '/icons/threads.svg', activeCls: 'border-sky-400 bg-sky-500/15 text-sky-400' },
                    ].map((pl) => {
                      const active = platforms.includes(pl.id);
                      return (
                        <button
                          key={pl.id}
                          type="button"
                          onClick={() => togglePlatform(pl.id)}
                          className={`px-3 py-2 text-xs font-semibold border inline-flex items-center justify-center gap-1.5 transition-colors ${
                            active ? pl.activeCls : 'ds-divider ds-surface-2 ds-muted hover:text-[rgb(var(--text))]'
                          }`}
                        >
                          {pl.iconSrc ? (
                            <img src={pl.iconSrc} alt={pl.label} className="h-3.5 w-3.5 shrink-0" />
                          ) : (
                            <Globe className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <span>{pl.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Modo de Envio: Rascunho (Padrão) vs Publicar Agora vs Agendar */}
                <div className="p-3.5 border ds-divider ds-surface-2 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="label mb-0">Estado da Publicação</label>
                    <div className="inline-flex border ds-divider">
                      <button
                        type="button"
                        onClick={() => setScheduleMode('draft')}
                        className={`px-3 h-8 text-xs font-semibold inline-flex items-center gap-1.5 ${
                          scheduleMode === 'draft' ? 'bg-amber-600 text-white' : 'ds-muted hover:text-[rgb(var(--text))]'
                        }`}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Rascunho
                      </button>
                      <button
                        type="button"
                        onClick={() => setScheduleMode('now')}
                        className={`px-3 h-8 text-xs font-semibold inline-flex items-center gap-1.5 ${
                          scheduleMode === 'now' ? 'bg-brand text-white' : 'ds-muted hover:text-[rgb(var(--text))]'
                        }`}
                      >
                        <Send className="h-3.5 w-3.5" /> Publicar Já
                      </button>
                      {!editingSlug && (
                        <button
                          type="button"
                          onClick={() => {
                            setScheduleMode('schedule');
                            if (!scheduledAt) applyQuickSchedule('1h');
                          }}
                          className={`px-3 h-8 text-xs font-semibold inline-flex items-center gap-1.5 ${
                            scheduleMode === 'schedule' ? 'bg-violet-600 text-white' : 'ds-muted hover:text-[rgb(var(--text))]'
                          }`}
                        >
                          <CalendarClock className="h-3.5 w-3.5" /> Agendar
                        </button>
                      )}
                    </div>
                  </div>
                  {scheduleMode === 'draft' && (
                    <p className="text-[11px] ds-muted">
                      O artigo será guardado como <strong>Rascunho</strong> privado no Admin e não aparecerá no portal até clicar em <strong>Publicar</strong>.
                    </p>
                  )}

                  {scheduleMode === 'schedule' && (
                      <div className="space-y-2.5 pt-2 border-t ds-divider">
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="datetime-local"
                            className="input h-9 text-xs flex-1 min-w-[200px]"
                            value={scheduledAt}
                            onChange={(e) => setScheduledAt(e.target.value)}
                            required
                          />
                          <button type="button" onClick={() => applyQuickSchedule('1h')} className="btn btn-secondary btn-sm">
                            +1 hora
                          </button>
                          <button type="button" onClick={() => applyQuickSchedule('tomorrow9')} className="btn btn-secondary btn-sm">
                            Amanhã 09h
                          </button>
                          <button type="button" onClick={() => applyQuickSchedule('tomorrow18')} className="btn btn-secondary btn-sm">
                            Amanhã 18h
                          </button>
                        </div>
                        <label className="inline-flex items-center gap-2 text-xs ds-muted cursor-pointer">
                          <input
                            type="checkbox"
                            checked={syncCalendar}
                            onChange={(e) => setSyncCalendar(e.target.checked)}
                            className="h-4 w-4 accent-[rgb(var(--brand))]"
                          />
                          <span>Criar automaticamente evento no Calendário Corporativo</span>
                        </label>
                      </div>
                    )}
                  </div>

                {/* 3. Formato da Publicação Social */}
                {hasSocialSelected && (
                  <div className="p-3.5 border ds-divider ds-surface-2 space-y-3">
                    <div>
                      <label className="label">Formato Social (Facebook / Instagram / Threads) *</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'post' as const, label: 'Normal', icon: Sparkles },
                          { id: 'reel' as const, label: 'Reels', icon: Film },
                          { id: 'story' as const, label: 'Story', icon: ImageIcon },
                          { id: 'carousel' as const, label: 'Carrossel', icon: Layers },
                        ].map((t) => {
                          const Icon = t.icon;
                          const isAct = postType === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setPostType(t.id)}
                              className={`px-2.5 py-2 text-xs font-semibold border inline-flex items-center justify-center gap-1.5 transition-colors ${
                                isAct ? 'border-brand bg-brand text-white' : 'ds-divider ds-muted hover:text-[rgb(var(--text))]'
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              <span>{t.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="label">URL Pública de Mídia (HTTPS · Obrigatório p/ Instagram / Reels / Story)</label>
                      <input
                        className="input text-xs font-mono"
                        value={publicMediaUrl}
                        onChange={(e) => setPublicMediaUrl(e.target.value)}
                        placeholder={postType === 'reel' ? 'https://.../video.mp4' : 'https://.../imagem.jpg'}
                      />
                    </div>
                  </div>
                )}

                {image && (
                  <div className="relative rounded-none overflow-hidden border ds-divider">
                    <img src={image} alt="Capa" className="h-36 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImage('')}
                      className="absolute top-2 right-2 btn btn-secondary btn-sm"
                    >
                      Remover capa
                    </button>
                  </div>
                )}

                <div>
                  <label className="label">Título / Chamada Principal *</label>
                  <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>

                {platforms.includes('portal') && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="label">Categoria</label>
                      <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option value="Tecnologia">Tecnologia</option>
                        <option value="Fiscalidade AGT">Fiscalidade AGT</option>
                        <option value="Inteligência Artificial">Inteligência Artificial</option>
                        <option value="Produtos">Produtos</option>
                        <option value="Institucional">Institucional</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Autor</label>
                      <input className="input" value={author} onChange={(e) => setAuthor(e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Data</label>
                      <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                  </div>
                )}

                <div>
                  <label className="label">Imagem de Capa (URL ou carregar ficheiro)</label>
                  <div className="flex gap-2">
                    <input
                      className="input flex-1"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="https://..."
                    />
                    <label className="btn btn-secondary cursor-pointer">
                      <ImageIcon className="h-4 w-4" /> Ficheiro
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleImageFile(f);
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="label">Resumo / Legenda Curta</label>
                  <textarea className="input" rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
                </div>

                <div>
                  <label className="label">Conteúdo Completo / Legenda</label>
                  <textarea
                    className="input"
                    rows={5}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Escreva o artigo ou legenda para as redes..."
                  />
                </div>
              </div>

              <div className="px-5 py-3 border-t ds-divider flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !title.trim() || platforms.length === 0}
                  className={`btn ${
                    scheduleMode === 'schedule'
                      ? 'bg-violet-600 hover:bg-violet-500 text-white'
                      : scheduleMode === 'draft'
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'btn-primary'
                  }`}
                >
                  {saving ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : scheduleMode === 'schedule' ? (
                    <CalendarClock className="h-4 w-4" />
                  ) : scheduleMode === 'draft' ? (
                    <Pencil className="h-4 w-4" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span>
                    {scheduleMode === 'draft'
                      ? editingSlug
                        ? 'Guardar Rascunho'
                        : 'Criar Rascunho'
                      : scheduleMode === 'schedule'
                      ? `Agendar (${platforms.length})`
                      : editingSlug
                      ? 'Atualizar & Publicar'
                      : `Publicar Já (${platforms.length})`}
                  </span>
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      <ConfirmModal
        isOpen={Boolean(deleteSlug || deleteSocialId)}
        title={deleteSocialId ? 'Cancelar / Remover Publicação' : 'Eliminar Notícia'}
        description={
          deleteSocialId
            ? 'Pretende remover esta publicação? Se estiver agendada, o evento correspondente também será removido do Calendário.'
            : 'Tem a certeza que pretende eliminar esta notícia do website?'
        }
        loading={deleting}
        onCancel={() => {
          setDeleteSlug(null);
          setDeleteSocialId(null);
        }}
        onConfirm={confirmDelete}
      />
      <FeedbackPopup notice={notice} onClose={() => setNotice(null)} />
    </div>
  );
}
