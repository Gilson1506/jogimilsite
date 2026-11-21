import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, RefreshCw, X, Image as ImageIcon, Pencil, FileText, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { Pagination } from './Pagination';
import { BrandLoader } from './BrandLoader';
import { ConfirmModal, FeedbackPopup } from './ConfirmModal';
import { AdminIcon3D } from './AdminIcon3D';

interface ProductItem {
  slug: string;
  name: string;
  category: string;
  tag: string;
  tagline?: string;
  description: string;
  fullDescription?: string[];
  features?: string[];
  image?: string;
  gallery?: string[];
  pdfUrl?: string;
  priceStarting?: string;
  starterPriceValue?: string;
  starterPeriod?: string;
  published?: boolean;
}

interface ProductsManagerProps {
  theme?: 'dark' | 'light';
}

function compressProductImage(file: File, maxDim = 960): Promise<string> {
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
        const isPng = file.type === 'image/png' || file.type === 'image/webp';
        resolve(canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', isPng ? undefined : 0.85));
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

export function ProductsManager(_props: ProductsManagerProps) {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Software & Faturação');
  const [tag, setTag] = useState('Certificado AGT');
  const [tagline, setTagline] = useState('');
  const [starterPriceValue, setStarterPriceValue] = useState('');
  const [starterPeriod, setStarterPeriod] = useState('/mês');
  const [gallery, setGallery] = useState<string[]>([]);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [description, setDescription] = useState('');
  const [fullDescriptionText, setFullDescriptionText] = useState('');
  const [featuresText, setFeaturesText] = useState('');
  const [published, setPublished] = useState(true);

  const showNotice = (type: 'success' | 'error', text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 4500);
  };

  const resetForm = () => {
    setEditingSlug(null);
    setName('');
    setCategory('Software & Faturação');
    setTag('JOGIMIL');
    setTagline('');
    setStarterPriceValue('');
    setStarterPeriod('/mês');
    setGallery([]);
    setPhotoUrlInput('');
    setPdfUrl('');
    setDescription('');
    setFullDescriptionText('');
    setFeaturesText('');
    setPublished(true);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (p: ProductItem) => {
    setEditingSlug(p.slug);
    setName(p.name || '');
    setCategory(p.category || 'Software & Faturação');
    setTag(p.tag || 'JOGIMIL');
    setTagline(p.tagline || '');
    setStarterPriceValue(p.starterPriceValue || p.priceStarting || '');
    setStarterPeriod(p.starterPeriod || '/mês');
    const existingGallery = Array.isArray(p.gallery) && p.gallery.length > 0
      ? p.gallery.slice(0, 5)
      : p.image
      ? [p.image]
      : [];
    setGallery(existingGallery);
    setPhotoUrlInput('');
    setPdfUrl(p.pdfUrl || '');
    setDescription(p.description || '');
    setFullDescriptionText(Array.isArray(p.fullDescription) ? p.fullDescription.join('\n\n') : '');
    setFeaturesText(Array.isArray(p.features) ? p.features.join('\n') : '');
    setPublished(p.published !== false);
    setModalOpen(true);
  };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ products?: ProductItem[]; data?: ProductItem[] }>('/api/v1/admin/products');
      setProducts(res.products || res.data || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = Math.max(0, 5 - gallery.length);
    if (remaining === 0) {
      showNotice('error', 'Máximo de 5 fotos por produto atingido.');
      return;
    }
    const chosen = Array.from(files).slice(0, remaining);
    try {
      const compressed = await Promise.all(chosen.map((f) => compressProductImage(f, 960)));
      setGallery((prev) => [...prev, ...compressed].slice(0, 5));
    } catch {
      showNotice('error', 'Não foi possível processar uma ou mais imagens.');
    }
  };

  const handleAddPhotoUrl = () => {
    const clean = photoUrlInput.trim();
    if (!clean) return;
    if (gallery.length >= 5) {
      showNotice('error', 'Máximo de 5 fotos por produto atingido.');
      return;
    }
    setGallery((prev) => [...prev, clean].slice(0, 5));
    setPhotoUrlInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await apiFetch('/api/v1/admin/products', {
        method: 'POST',
        body: JSON.stringify({
          ...(editingSlug ? { slug: editingSlug } : {}),
          name: name.trim(),
          category: category.trim(),
          tag: tag.trim(),
          tagline: tagline.trim() || description.trim(),
          starterPriceValue: starterPriceValue.trim() || 'Sob consulta',
          priceStarting: starterPriceValue.trim() || 'Sob consulta',
          starterPeriod: starterPeriod.trim(),
          image: gallery[0] || '',
          gallery,
          pdfUrl: pdfUrl.trim(),
          description: description.trim(),
          fullDescription: fullDescriptionText.trim(),
          features: featuresText.trim(),
          published,
        }),
      });
      resetForm();
      setModalOpen(false);
      showNotice('success', editingSlug ? 'Produto atualizado no portal.' : 'Produto cadastrado e publicado no portal!');
      await loadProducts();
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Erro ao guardar produto.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteSlug) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/v1/admin/products/${encodeURIComponent(deleteSlug)}`, { method: 'DELETE' });
      setProducts((prev) => prev.filter((p) => p.slug !== deleteSlug));
      showNotice('success', 'Produto removido com sucesso.');
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Erro ao remover produto.');
    } finally {
      setDeleting(false);
      setDeleteSlug(null);
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2.5">
            <AdminIcon3D name="channels" size={26} />
            <span>Produtos do Portal</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={loadProducts} disabled={loading} className="btn btn-secondary">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button type="button" onClick={openCreateModal} className="btn btn-primary">
            <Plus className="h-4 w-4" /> Novo Produto
          </button>
        </div>
      </div>

      {loading && products.length === 0 ? (
        <div className="ds-card">
          <BrandLoader size="md" />
        </div>
      ) : products.length === 0 ? (
        <div className="ds-card p-12 text-center space-y-3">
          <p className="text-sm ds-muted">
            Ainda não cadastrou produtos personalizados no Admin. Os produtos cadastrados aqui aparecem automaticamente na página <strong>Produtos</strong> do portal público.
          </p>
          <button type="button" onClick={openCreateModal} className="btn btn-primary">
            <Plus className="h-4 w-4" /> Cadastrar primeiro produto
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {products.slice((page - 1) * pageSize, page * pageSize).map((p) => (
              <div key={p.slug} className="ds-card flex flex-col overflow-hidden">
                <div className="h-40 w-full ds-surface-2 border-b ds-divider flex items-center justify-center p-4 relative">
                  {p.image || p.gallery?.[0] ? (
                    <img src={p.image || p.gallery?.[0]} alt={p.name} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <ImageIcon className="h-7 w-7 ds-subtle" />
                  )}
                  {(p.gallery?.length || 0) > 1 && (
                    <span className="absolute bottom-2 left-2.5 badge ds-surface-2 ds-divider text-[10px] font-mono">
                      {p.gallery?.length} fotos
                    </span>
                  )}
                  <span
                    className={`absolute top-2.5 right-2.5 badge text-[10px] ${
                      p.published !== false
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'ds-surface-2 ds-muted ds-divider'
                    }`}
                  >
                    {p.published !== false ? 'Visível no Portal' : 'Rascunho'}
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="uppercase text-brand font-semibold">{p.category}</span>
                    <span className="ds-muted">{p.tag}</span>
                  </div>
                  <h3 className="text-sm font-semibold">{p.name}</h3>
                  {p.description && <p className="text-xs ds-muted line-clamp-3 flex-1">{p.description}</p>}

                  <div className="py-2 border-y ds-divider flex items-baseline justify-between text-xs">
                    <span className="ds-muted">A partir de</span>
                    <span className="font-mono font-bold text-brand">
                      {p.starterPriceValue || p.priceStarting || 'Sob consulta'}{' '}
                      <span className="font-normal ds-subtle">{p.starterPeriod || ''}</span>
                    </span>
                  </div>

                  {p.features && p.features.length > 0 && (
                    <p className="text-[11px] ds-subtle inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" /> {p.features.length} funcionalidade(s)
                    </p>
                  )}

                  <div className="pt-2 mt-auto flex items-center justify-between gap-2">
                    {p.pdfUrl ? (
                      <a
                        href={p.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-brand hover:underline"
                      >
                        <FileText className="h-3 w-3" /> PDF
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
                        onClick={() => setDeleteSlug(p.slug)}
                        className="btn btn-ghost btn-sm text-rose-500 hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="ds-card">
            <Pagination
              page={page}
              pageSize={pageSize}
              totalItems={products.length}
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
              className="ds-card w-full max-w-2xl max-h-[90vh] flex flex-col border-[rgb(var(--border-strong))] shadow-2xl animate-fadeIn"
            >
              <div className="ds-card-header">
                <div>
                  <h2 className="ds-title">{editingSlug ? 'Editar Produto' : 'Cadastrar Novo Produto'}</h2>
                  <p className="ds-subtitle">Fica imediatamente visível na página Produtos do portal público</p>
                </div>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost btn-icon h-8 w-8">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Nome do Produto *</label>
                    <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: SOBA GEST - Faturação & POS" required />
                  </div>
                  <div>
                    <label className="label">Categoria</label>
                    <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Software & Faturação" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="label">Selo / Tag</label>
                    <input className="input" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Certificado AGT" />
                  </div>
                  <div>
                    <label className="label">Preço Inicial</label>
                    <input className="input" value={starterPriceValue} onChange={(e) => setStarterPriceValue(e.target.value)} placeholder="9.999 Kz" />
                  </div>
                  <div>
                    <label className="label">Período</label>
                    <input className="input" value={starterPeriod} onChange={(e) => setStarterPeriod(e.target.value)} placeholder="/mês" />
                  </div>
                </div>

                <div>
                  <label className="label">Subtítulo / Tagline</label>
                  <input className="input" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Resumo de 1 linha exibido na página de detalhes" />
                </div>

                {/* Galeria de Fotos do Produto (até 5 fotos) */}
                <div className="p-3.5 border ds-divider ds-surface-2 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <label className="label mb-0">Fotos do Produto ({gallery.length} / 5)</label>
                    <span className="text-[11px] ds-subtle">A 1.ª foto é a capa principal</span>
                  </div>

                  {gallery.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {gallery.map((src, idx) => (
                        <div key={`${idx}_${src.slice(0, 24)}`} className="relative border ds-divider p-1.5 bg-black/20 flex items-center justify-center h-20">
                          <img src={src} alt={`Foto ${idx + 1}`} className="max-h-full max-w-full object-contain" />
                          {idx === 0 && (
                            <span className="absolute bottom-1 left-1 px-1 py-0.5 text-[9px] font-mono bg-brand text-white">
                              Capa
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setGallery((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 h-5 w-5 bg-black/75 text-rose-400 hover:text-rose-300 inline-flex items-center justify-center"
                            title="Remover foto"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {gallery.length < 5 && (
                    <div className="flex flex-wrap gap-2">
                      <input
                        className="input flex-1 min-w-[180px]"
                        value={photoUrlInput}
                        onChange={(e) => setPhotoUrlInput(e.target.value)}
                        placeholder="Colar URL da imagem (https://...)"
                      />
                      <button type="button" onClick={handleAddPhotoUrl} className="btn btn-secondary btn-sm">
                        Adicionar URL
                      </button>
                      <label className="btn btn-secondary btn-sm cursor-pointer">
                        <ImageIcon className="h-3.5 w-3.5" /> Carregar Fotos
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            handleImageFiles(e.target.files);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>

                <div>
                  <label className="label">URL da Apresentação PDF (opcional)</label>
                  <input className="input" value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} placeholder="/docs/Produto.pdf ou https://..." />
                </div>

                <div>
                  <label className="label">Descrição Curta *</label>
                  <textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} required />
                </div>

                <div>
                  <label className="label">Descrição Completa (parágrafos separados por linha)</label>
                  <textarea className="input" rows={4} value={fullDescriptionText} onChange={(e) => setFullDescriptionText(e.target.value)} />
                </div>

                <div>
                  <label className="label">Funcionalidades Incluídas (uma por linha)</label>
                  <textarea
                    className="input"
                    rows={4}
                    value={featuresText}
                    onChange={(e) => setFeaturesText(e.target.value)}
                    placeholder={'Certificação AGT SAF-T (AO)\nFuncionamento 100% Offline\nSuporte Técnico em Luanda'}
                  />
                </div>

                <label className="inline-flex items-center gap-2 text-xs ds-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="h-4 w-4 accent-[rgb(var(--brand))]"
                  />
                  <span>Visível imediatamente no portal público</span>
                </label>
              </div>

              <div className="px-5 py-3 border-t ds-divider flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={saving || !name.trim()} className="btn btn-primary">
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  <span>{editingSlug ? 'Atualizar Produto' : 'Guardar Produto'}</span>
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      <ConfirmModal
        isOpen={Boolean(deleteSlug)}
        title="Eliminar Produto"
        description="Tem a certeza que pretende remover este produto do website?"
        loading={deleting}
        onCancel={() => setDeleteSlug(null)}
        onConfirm={confirmDelete}
      />
      <FeedbackPopup notice={notice} onClose={() => setNotice(null)} />
    </div>
  );
}
