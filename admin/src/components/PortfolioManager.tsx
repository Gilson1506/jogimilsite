import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Briefcase, Plus, Trash2, RefreshCw, X, Image as ImageIcon, ExternalLink, Pencil } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { Pagination } from './Pagination';
import { BrandLoader } from './BrandLoader';
import { ConfirmModal, FeedbackPopup } from './ConfirmModal';
import { AdminIcon3D } from './AdminIcon3D';

interface PortfolioItem {
  id?: string;
  slug?: string;
  title: string;
  client?: string;
  category?: string;
  description?: string;
  image?: string;
  metrics?: string;
  tags?: string[];
  link?: string;
}

interface PortfolioManagerProps {
  theme?: 'dark' | 'light';
}

function compressProjectImage(file: File, maxDim = 1280): Promise<string> {
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

export function PortfolioManager(_props: PortfolioManagerProps) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteKey, setDeleteKey] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [title, setTitle] = useState('');
  const [client, setClient] = useState('');
  const [category, setCategory] = useState('Software & ERP');
  const [description, setDescription] = useState('');
  const [metrics, setMetrics] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [link, setLink] = useState('');
  const [image, setImage] = useState('');

  const showNotice = (type: 'success' | 'error', text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 4000);
  };

  const resetForm = () => {
    setEditingSlug(null);
    setTitle('');
    setClient('');
    setCategory('Software & ERP');
    setDescription('');
    setMetrics('');
    setTagsInput('');
    setLink('');
    setImage('');
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (p: PortfolioItem) => {
    setEditingSlug(p.slug || p.id || null);
    setTitle(p.title || '');
    setClient(p.client || '');
    setCategory(p.category || 'Software & ERP');
    setDescription(p.description || '');
    setMetrics(p.metrics || '');
    setTagsInput(Array.isArray(p.tags) ? p.tags.join(', ') : '');
    setLink(p.link || '');
    setImage(p.image || '');
    setModalOpen(true);
  };

  const loadPortfolio = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ portfolio?: PortfolioItem[]; data?: PortfolioItem[] }>('/api/v1/admin/portfolio');
      setItems(res.portfolio || res.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  const handleImageFile = async (file: File) => {
    try {
      const dataUrl = await compressProjectImage(file, 1280);
      setImage(dataUrl);
    } catch {
      showNotice('error', 'Não foi possível processar a imagem.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await apiFetch('/api/v1/admin/portfolio', {
        method: 'POST',
        body: JSON.stringify({
          ...(editingSlug ? { slug: editingSlug } : {}),
          title: title.trim(),
          client: client.trim(),
          category,
          description: description.trim(),
          metrics: metrics.trim(),
          tags,
          link: link.trim(),
          image: image.trim(),
        }),
      });
      resetForm();
      setModalOpen(false);
      showNotice('success', editingSlug ? 'Projeto atualizado no portfólio.' : 'Projeto adicionado ao portfólio.');
      await loadPortfolio();
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Erro ao guardar projeto.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (slugOrId: string) => {
    setDeleteKey(slugOrId);
  };

  const confirmDelete = async () => {
    if (!deleteKey) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/v1/admin/portfolio/${encodeURIComponent(deleteKey)}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((p) => (p.slug || p.id) !== deleteKey));
      showNotice('success', 'Projeto removido com sucesso.');
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Erro ao remover.');
    } finally {
      setDeleting(false);
      setDeleteKey(null);
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2.5">
            <AdminIcon3D name="portfolio" size={26} />
            <span>Portfólio</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={loadPortfolio} disabled={loading} className="btn btn-secondary">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button type="button" onClick={openCreateModal} className="btn btn-primary">
            <Plus className="h-4 w-4" /> Novo Projeto
          </button>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div className="ds-card">
          <BrandLoader size="md" />
        </div>
      ) : items.length === 0 ? (
        <div className="ds-card p-12 text-center space-y-3">
          <p className="text-sm ds-muted">Nenhum projeto registado no portfólio.</p>
          <button type="button" onClick={openCreateModal} className="btn btn-primary">
            <Plus className="h-4 w-4" /> Adicionar primeiro projeto
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.slice((page - 1) * pageSize, page * pageSize).map((p) => {
              const key = p.slug || p.id || p.title;
              return (
                <div key={key} className="ds-card flex flex-col overflow-hidden">
                  {p.image ? (
                    <img src={p.image} alt={p.title} className="h-40 w-full object-cover border-b ds-divider" />
                  ) : (
                    <div className="h-32 w-full ds-surface-2 border-b ds-divider flex items-center justify-center ds-subtle">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                  <div className="p-4 flex-1 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="uppercase text-brand font-semibold">{p.category || 'Projeto'}</span>
                      {p.client && <span className="ds-muted truncate">{p.client}</span>}
                    </div>
                    <h3 className="text-sm font-semibold">{p.title}</h3>
                    {p.description && <p className="text-xs ds-muted line-clamp-3 flex-1">{p.description}</p>}
                    {p.tags && p.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {p.tags.map((t) => (
                          <span key={t} className="badge ds-surface-2 ds-divider text-[10px]">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="pt-3 mt-2 border-t ds-divider flex items-center justify-between gap-2">
                      {p.link ? (
                        <a
                          href={p.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-brand hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" /> Ver link
                        </a>
                      ) : (
                        <span />
                      )}
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => openEditModal(p)} className="btn btn-ghost btn-sm">
                          <Pencil className="h-3.5 w-3.5" /> Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.slug || p.id || '')}
                          className="btn btn-ghost btn-sm text-rose-500 hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="ds-card">
            <Pagination
              page={page}
              pageSize={pageSize}
              totalItems={items.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      )}

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
              className="ds-card w-full max-w-2xl max-h-[88vh] flex flex-col border-[rgb(var(--border-strong))] shadow-2xl animate-fadeIn"
            >
              <div className="ds-card-header">
                <div>
                  <h2 className="ds-title">{editingSlug ? 'Editar Projeto do Portfólio' : 'Adicionar Projeto ao Portfólio'}</h2>
                  <p className="ds-subtitle">Publicado automaticamente na secção de Portfólio do website</p>
                </div>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost btn-icon h-8 w-8">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4">
                {image && (
                  <div className="relative rounded-none overflow-hidden border ds-divider">
                    <img src={image} alt="Capa do projeto" className="h-36 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImage('')}
                      className="absolute top-2 right-2 btn btn-secondary btn-sm"
                    >
                      Remover imagem
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Nome do Projeto *</label>
                    <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
                  </div>
                  <div>
                    <label className="label">Cliente</label>
                    <input className="input" value={client} onChange={(e) => setClient(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Categoria</label>
                    <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                      <option value="Software & ERP">Software &amp; ERP</option>
                      <option value="Web & Mobile">Web &amp; Mobile</option>
                      <option value="Inteligência Artificial">Inteligência Artificial</option>
                      <option value="Infraestrutura & NOC">Infraestrutura &amp; NOC</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Resultado / Destaque</label>
                    <input className="input" value={metrics} onChange={(e) => setMetrics(e.target.value)} placeholder="Ex.: 100% Conformidade AGT" />
                  </div>
                </div>

                <div>
                  <label className="label">Imagem (URL ou ficheiro)</label>
                  <div className="flex gap-2">
                    <input className="input flex-1" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." />
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Tecnologias / Tags (separadas por vírgula)</label>
                    <input className="input" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="React, Node.js, SAF-T" />
                  </div>
                  <div>
                    <label className="label">Link do Projeto (opcional)</label>
                    <input className="input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
                  </div>
                </div>

                <div>
                  <label className="label">Descrição do Projeto</label>
                  <textarea className="input" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva o desafio, solução implementada e impacto..." />
                </div>
              </div>

              <div className="px-5 py-3 border-t ds-divider flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={saving || !title.trim()} className="btn btn-primary">
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  <span>{editingSlug ? 'Atualizar' : 'Guardar'}</span>
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      <ConfirmModal
        isOpen={Boolean(deleteKey)}
        title="Eliminar Projeto"
        description="Tem a certeza que pretende remover este projeto do portfólio do website?"
        loading={deleting}
        onCancel={() => setDeleteKey(null)}
        onConfirm={confirmDelete}
      />
      <FeedbackPopup notice={notice} onClose={() => setNotice(null)} />
    </div>
  );
}
