import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FolderOpen,
  Upload,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
  Search,
  Send,
  Download,
  Eye,
  Trash2,
  X,
  Mail,
  MessageCircle,
  LayoutTemplate,
} from 'lucide-react';
import { apiUrl } from '../lib/api';
import { BrandLoader } from './BrandLoader';
import { Pagination } from './Pagination';
import { ConfirmModal, FeedbackPopup } from './ConfirmModal';
import { TemplateStudioModal, type AppliedTemplateMeta } from './TemplateStudioModal';
import { buildBrandedEmailHtml } from '../lib/emailTemplates';

export interface DigitalFileItem {
  id: string;
  name: string;
  fileName: string;
  category: string;
  fileType: 'pdf' | 'excel' | 'image' | 'document';
  mimeType: string;
  size: number;
  description?: string;
  tags?: string[];
  publicUrl?: string;
  dataUrl?: string;
  uploadedBy?: string;
  sendCount: number;
  createdAt: string;
}

interface ContactOpt {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
}

const CATEGORIES = [
  { id: 'propostas', label: 'Propostas Comerciais' },
  { id: 'catalogos', label: 'Catálogos & Portfólio' },
  { id: 'excel', label: 'Folhas Excel & Tabelas' },
  { id: 'contratos', label: 'Contratos & Termos' },
  { id: 'imagens', label: 'Imagens & Marca' },
  { id: 'geral', label: 'Documentos Gerais' },
];

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function FileTypeIcon({ type }: { type: DigitalFileItem['fileType'] }) {
  if (type === 'pdf') return <FileText className="h-4 w-4 text-rose-500 shrink-0" />;
  if (type === 'excel') return <FileSpreadsheet className="h-4 w-4 text-emerald-500 shrink-0" />;
  if (type === 'image') return <ImageIcon className="h-4 w-4 text-sky-500 shrink-0" />;
  return <File className="h-4 w-4 ds-muted shrink-0" />;
}

export function DigitalFilesManager() {
  const [files, setFiles] = useState<DigitalFileItem[]>([]);
  const [contacts, setContacts] = useState<ContactOpt[]>([]);
  const [loading, setLoading] = useState(true);

  const [typeFilter, setTypeFilter] = useState<'all' | 'pdf' | 'excel' | 'image'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    category: 'propostas',
    description: '',
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [previewItem, setPreviewItem] = useState<DigitalFileItem | null>(null);

  const [sendItem, setSendItem] = useState<DigitalFileItem | null>(null);
  const [sending, setSending] = useState(false);
  const [sendForm, setSendForm] = useState({
    channel: 'email' as 'email' | 'whatsapp',
    contactId: '',
    to: '',
    subject: '',
    message: '',
  });
  const [sendEmailHtml, setSendEmailHtml] = useState('');
  const [sendTemplateName, setSendTemplateName] = useState<string | null>(null);
  const [sendTemplateMeta, setSendTemplateMeta] = useState<AppliedTemplateMeta | null>(null);
  const [sendTemplateModalOpen, setSendTemplateModalOpen] = useState(false);

  const effectiveSendHtml = useMemo(() => {
    if (sendForm.channel !== 'email') return '';
    if (sendTemplateMeta?.mode === 'visual') {
      return buildBrandedEmailHtml({
        category: sendTemplateMeta.category,
        headline: sendTemplateMeta.headline || sendForm.subject || 'Comunicação Oficial',
        body: sendForm.message,
        ctaLabel: sendTemplateMeta.ctaLabel,
        ctaUrl: sendTemplateMeta.ctaUrl,
        previewLocalLogo: false,
      });
    }
    return sendEmailHtml;
  }, [sendForm.channel, sendForm.subject, sendForm.message, sendTemplateMeta, sendEmailHtml]);

  const clearSendTemplate = () => {
    setSendEmailHtml('');
    setSendTemplateName(null);
    setSendTemplateMeta(null);
  };

  const [confirmDelete, setConfirmDelete] = useState<DigitalFileItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ open: boolean; type: 'success' | 'error'; title: string; message: string }>({
    open: false,
    type: 'success',
    title: '',
    message: '',
  });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [fRes, cRes] = await Promise.all([
        fetch(apiUrl('/api/v1/admin/files')),
        fetch(apiUrl('/api/v1/admin/contacts')),
      ]);
      const fJson = await fRes.json().catch(() => ({}));
      const cJson = await cRes.json().catch(() => ({}));
      if (fJson.success && Array.isArray(fJson.files)) setFiles(fJson.files);
      if (cJson.success && Array.isArray(cJson.contacts)) setContacts(cJson.contacts);
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
    return files.filter((f) => {
      if (typeFilter !== 'all' && f.fileType !== typeFilter) return false;
      if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        f.name.toLowerCase().includes(q) ||
        f.fileName.toLowerCase().includes(q) ||
        (f.description || '').toLowerCase().includes(q)
      );
    });
  }, [files, typeFilter, categoryFilter, search]);

  const pageSize = 10;
  const paginated = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page]
  );

  useEffect(() => {
    setPage(1);
  }, [typeFilter, categoryFilter, search]);

  const counts = useMemo(
    () => ({
      all: files.length,
      pdf: files.filter((f) => f.fileType === 'pdf').length,
      excel: files.filter((f) => f.fileType === 'excel').length,
      image: files.filter((f) => f.fileType === 'image').length,
    }),
    [files]
  );

  const handleFilePick = (file: File | null) => {
    if (!file) return;
    if (file.size > 18 * 1024 * 1024) {
      setFeedback({
        open: true,
        type: 'error',
        title: 'Arquivo muito grande',
        message: 'O tamanho máximo permitido por arquivo é 18 MB.',
      });
      return;
    }
    setSelectedFile(file);
    setUploadForm((prev) => ({
      ...prev,
      name: prev.name || file.name.replace(/\.[^.]+$/, ''),
    }));
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    try {
      const dataBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
        reader.readAsDataURL(selectedFile);
      });

      const res = await fetch(apiUrl('/api/v1/admin/files'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: uploadForm.name.trim() || selectedFile.name,
          fileName: selectedFile.name,
          category: uploadForm.category,
          description: uploadForm.description.trim(),
          mimeType: selectedFile.type || 'application/octet-stream',
          size: selectedFile.size,
          dataBase64,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.message || json.detail || json.error || 'Erro ao guardar arquivo');
      }

      setUploadOpen(false);
      setSelectedFile(null);
      setUploadForm({ name: '', category: 'propostas', description: '' });
      await loadAll();
      setFeedback({
        open: true,
        type: 'success',
        title: 'Arquivo digital guardado',
        message: 'O arquivo já está disponível na biblioteca para envio imediato por Email e WhatsApp.',
      });
    } catch (err) {
      setFeedback({
        open: true,
        type: 'error',
        title: 'Erro no upload',
        message: err instanceof Error ? err.message : 'Falha ao enviar arquivo.',
      });
    } finally {
      setUploading(false);
    }
  };

  const openSendModal = (file: DigitalFileItem) => {
    clearSendTemplate();
    setSendItem(file);
    setSendForm({
      channel: 'email',
      contactId: '',
      to: '',
      subject: `JOGIMIL Tecnologias · ${file.name}`,
      message: `Olá,\n\nSegue em anexo o documento "${file.name}".\n\nCom os melhores cumprimentos,\nEquipa JOGIMIL Tecnologias`,
    });
  };

  const closeSendModal = () => {
    setSendItem(null);
    clearSendTemplate();
  };

  const handleSelectContactForSend = (contactId: string, channel = sendForm.channel) => {
    const c = contacts.find((item) => item.id === contactId);
    setSendForm((prev) => ({
      ...prev,
      contactId,
      to: c ? (channel === 'whatsapp' ? c.phone || '' : c.email || '') : prev.to,
    }));
  };

  const handleSendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendItem || !sendForm.to.trim()) return;
    setSending(true);
    try {
      const contact = contacts.find((c) => c.id === sendForm.contactId);
      const res = await fetch(apiUrl(`/api/v1/admin/files/${sendItem.id}/send`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: sendForm.channel,
          to: sendForm.to.trim(),
          subject: sendForm.subject.trim(),
          message: sendForm.message.trim(),
          html: sendForm.channel === 'email' && effectiveSendHtml.trim() ? effectiveSendHtml : undefined,
          contactId: sendForm.contactId || undefined,
          contactName: contact?.name || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.message || json.detail || json.error || 'Falha ao enviar arquivo');
      }

      closeSendModal();
      await loadAll();
      setFeedback({
        open: true,
        type: 'success',
        title: 'Arquivo enviado',
        message: json.message || 'Enviado com sucesso.',
      });
    } catch (err) {
      setFeedback({
        open: true,
        type: 'error',
        title: 'Erro no envio',
        message: err instanceof Error ? err.message : 'Falha ao enviar arquivo.',
      });
    } finally {
      setSending(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(apiUrl(`/api/v1/admin/files/${confirmDelete.id}`), {
        method: 'DELETE',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) {
        throw new Error(json.message || json.detail || json.error || 'Falha ao eliminar arquivo');
      }
      setConfirmDelete(null);
      await loadAll();
      setFeedback({
        open: true,
        type: 'success',
        title: 'Arquivo eliminado',
        message: 'O documento foi removido da biblioteca digital.',
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

  if (loading && files.length === 0) {
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
            Arquivos Digitais
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="btn btn-primary text-xs h-9 px-3.5 gap-1.5"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>Carregar Arquivo</span>
        </button>
      </div>

      {/* Filtros por Tipo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(
          [
            { id: 'all', label: 'Todos os Arquivos', count: counts.all, icon: FolderOpen },
            { id: 'pdf', label: 'Documentos PDF', count: counts.pdf, icon: FileText },
            { id: 'excel', label: 'Folhas Excel / CSV', count: counts.excel, icon: FileSpreadsheet },
            { id: 'image', label: 'Imagens & Media', count: counts.image, icon: ImageIcon },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = typeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTypeFilter(tab.id)}
              className={`ds-card p-3.5 text-left transition-colors ${
                active ? 'border-sky-500 ring-1 ring-inset ring-sky-500/40' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider ds-muted font-semibold">
                  {tab.label}
                </span>
                <Icon className={`h-4 w-4 ${active ? 'text-sky-500' : 'ds-muted'}`} />
              </div>
              <p className="text-2xl font-display font-bold mt-1">{tab.count}</p>
            </button>
          );
        })}
      </div>

      {/* Pesquisa e Categoria */}
      <div className="ds-card p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-3.5 w-3.5 ds-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome, ficheiro ou descrição..."
            className="input w-full pl-8 text-xs h-8"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input text-xs h-8"
        >
          <option value="all">Todas Categorias</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tabela de Arquivos */}
      <div className="ds-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b ds-divider text-[11px] uppercase tracking-wider ds-muted">
              <tr>
                <th className="py-2.5 px-3.5">Arquivo</th>
                <th className="py-2.5 px-3">Categoria</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Tamanho</th>
                <th className="py-2.5 px-3">Envios</th>
                <th className="py-2.5 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y ds-divider">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center ds-muted">
                    Nenhum arquivo digital na biblioteca. Clique em &ldquo;Carregar Arquivo&rdquo; para adicionar PDFs, Excel ou imagens.
                  </td>
                </tr>
              ) : (
                paginated.map((file) => {
                  const href = file.publicUrl || file.dataUrl || '';
                  return (
                    <tr key={file.id} className="hover:bg-sky-500/[0.03]">
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileTypeIcon type={file.fileType} />
                          <div className="min-w-0">
                            <p className="font-medium truncate max-w-[260px]">{file.name}</p>
                            <p className="text-[11px] ds-muted truncate max-w-[260px]">
                              {file.fileName}
                              {file.description ? ` · ${file.description}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {CATEGORIES.find((c) => c.id === file.category)?.label || file.category}
                      </td>
                      <td className="py-3 px-3 uppercase font-mono text-[11px] ds-muted">
                        {file.fileType}
                      </td>
                      <td className="py-3 px-3 font-mono">{formatBytes(file.size)}</td>
                      <td className="py-3 px-3 font-mono">{file.sendCount || 0}</td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openSendModal(file)}
                            title="Enviar por Email ou WhatsApp"
                            className="btn btn-primary text-[11px] h-7 px-2.5 gap-1"
                          >
                            <Send className="h-3 w-3" />
                            <span>Enviar</span>
                          </button>
                          {(file.fileType === 'image' || file.fileType === 'pdf') && href && (
                            <button
                              type="button"
                              onClick={() => setPreviewItem(file)}
                              title="Pré-visualizar"
                              className="btn btn-ghost btn-icon h-7 w-7"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {href && (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={file.fileName}
                              title="Transferir"
                              className="btn btn-ghost btn-icon h-7 w-7"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(file)}
                            title="Eliminar"
                            className="btn btn-ghost btn-icon h-7 w-7 text-rose-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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

      {/* Modal Upload de Arquivo */}
      {uploadOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] bg-black/25 flex items-center justify-center p-4">
            <div
              className="ds-card w-full max-w-lg border ds-divider shadow-2xl"
              style={{ backgroundColor: 'rgb(var(--surface))' }}
            >
              <div className="px-5 py-3.5 border-b ds-divider flex items-center justify-between">
                <h3 className="text-sm font-semibold">Carregar Arquivo Digital</h3>
                <button
                  type="button"
                  onClick={() => setUploadOpen(false)}
                  className="btn btn-ghost btn-icon h-7 w-7"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleUploadSubmit} className="p-5 space-y-3.5">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFilePick(e.dataTransfer.files?.[0] || null);
                  }}
                  className="border border-dashed ds-divider p-6 text-center cursor-pointer hover:border-sky-500 transition-colors"
                >
                  <Upload className="h-6 w-6 mx-auto ds-muted mb-2" />
                  {selectedFile ? (
                    <div>
                      <p className="text-xs font-semibold">{selectedFile.name}</p>
                      <p className="text-[11px] ds-muted mt-0.5">{formatBytes(selectedFile.size)}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-medium">Clique ou arraste um arquivo aqui</p>
                      <p className="text-[11px] ds-muted mt-1">
                        PDF, Excel (.xlsx, .xls, .csv) e Imagens (.png, .jpg, .webp) · Máx. 18 MB
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx"
                    className="hidden"
                    onChange={(e) => handleFilePick(e.target.files?.[0] || null)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider ds-muted mb-1">
                    Nome de Apresentação *
                  </label>
                  <input
                    required
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                    placeholder="Ex: Portfólio Corporativo JOGIMIL 2026"
                    className="input w-full text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider ds-muted mb-1">
                    Categoria
                  </label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                    className="input w-full text-sm"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider ds-muted mb-1">
                    Descrição / Notas
                  </label>
                  <input
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    placeholder="Breve descrição para a equipa identificar rapidamente..."
                    className="input w-full text-sm"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t ds-divider">
                  <button
                    type="button"
                    onClick={() => setUploadOpen(false)}
                    className="btn btn-secondary text-xs h-9 px-3.5"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedFile || uploading}
                    className="btn btn-primary text-xs h-9 px-4"
                  >
                    {uploading ? 'A carregar...' : 'Guardar na Biblioteca'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Modal Envio Direto por Email ou WhatsApp */}
      {sendItem &&
        createPortal(
          <div className="fixed inset-0 z-[100] bg-black/25 flex items-center justify-center p-4">
            <div
              className="ds-card w-full max-w-lg border ds-divider shadow-2xl"
              style={{ backgroundColor: 'rgb(var(--surface))' }}
            >
              <div className="px-5 py-3.5 border-b ds-divider flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <FileTypeIcon type={sendItem.fileType} />
                  <h3 className="text-sm font-semibold truncate">Enviar: {sendItem.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={closeSendModal}
                  className="btn btn-ghost btn-icon h-7 w-7"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleSendSubmit} className="p-5 space-y-3.5">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSendForm((p) => ({ ...p, channel: 'email' }));
                      if (sendForm.contactId) handleSelectContactForSend(sendForm.contactId, 'email');
                    }}
                    className={`h-9 text-xs font-medium border ds-divider flex items-center justify-center gap-1.5 ${
                      sendForm.channel === 'email' ? 'bg-sky-600 text-white border-sky-600' : 'ds-muted'
                    }`}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>Enviar por Email</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearSendTemplate();
                      setSendForm((p) => ({ ...p, channel: 'whatsapp' }));
                      if (sendForm.contactId) handleSelectContactForSend(sendForm.contactId, 'whatsapp');
                    }}
                    className={`h-9 text-xs font-medium border ds-divider flex items-center justify-center gap-1.5 ${
                      sendForm.channel === 'whatsapp'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'ds-muted'
                    }`}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>Enviar por WhatsApp</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider ds-muted mb-1">
                    Selecionar Contacto do CRM (Opcional)
                  </label>
                  <select
                    value={sendForm.contactId}
                    onChange={(e) => handleSelectContactForSend(e.target.value)}
                    className="input w-full text-sm"
                  >
                    <option value="">Escolher contacto ou digitar abaixo...</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.company ? `(${c.company})` : ''} —{' '}
                        {sendForm.channel === 'whatsapp' ? c.phone || 'sem tel.' : c.email || 'sem email'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider ds-muted mb-1">
                    {sendForm.channel === 'whatsapp' ? 'Número WhatsApp *' : 'Endereço de Email *'}
                  </label>
                  <input
                    required
                    type={sendForm.channel === 'email' ? 'email' : 'text'}
                    value={sendForm.to}
                    onChange={(e) => setSendForm({ ...sendForm, to: e.target.value })}
                    placeholder={
                      sendForm.channel === 'whatsapp' ? '+244 9XX XXX XXX' : 'cliente@empresa.co.ao'
                    }
                    className="input w-full text-sm"
                  />
                </div>

                {sendForm.channel === 'email' && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider ds-muted mb-1">
                      Assunto
                    </label>
                    <input
                      value={sendForm.subject}
                      onChange={(e) => setSendForm({ ...sendForm, subject: e.target.value })}
                      className="input w-full text-sm"
                    />
                  </div>
                )}

                {sendForm.channel === 'email' && sendTemplateName && (
                  <div className="flex items-center justify-between gap-2 px-3 py-1.5 border border-brand/40 bg-brand/10 text-xs">
                    <span className="inline-flex items-center gap-1.5 truncate">
                      <LayoutTemplate className="h-3.5 w-3.5 text-brand shrink-0" />
                      <span>
                        Template ativo: <strong>{sendTemplateName}</strong>
                        {effectiveSendHtml ? ' (HTML com Logo JOGIMIL)' : ''}
                      </span>
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSendTemplateModalOpen(true)}
                        className="text-brand font-semibold hover:underline"
                      >
                        Editar / Preview
                      </button>
                      <button
                        type="button"
                        onClick={clearSendTemplate}
                        className="text-rose-400 hover:underline"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider ds-muted">
                      {sendForm.channel === 'whatsapp' ? 'Legenda / Mensagem' : 'Corpo do Email'}
                    </label>
                    {sendForm.channel === 'email' && (
                      <button
                        type="button"
                        onClick={() => setSendTemplateModalOpen(true)}
                        className="btn btn-secondary btn-sm h-7 text-[11px] gap-1"
                        title="Aplicar template HTML com Logo JOGIMIL"
                      >
                        <LayoutTemplate className="h-3.5 w-3.5 text-brand" /> Templates
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={sendForm.message}
                    onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })}
                    className="input w-full text-sm"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t ds-divider">
                  <button
                    type="button"
                    onClick={closeSendModal}
                    className="btn btn-secondary text-xs h-9 px-3.5"
                  >
                    Cancelar
                  </button>
                  <button type="submit" disabled={sending} className="btn btn-primary text-xs h-9 px-4 gap-1.5">
                    <Send className="h-3.5 w-3.5" />
                    <span>{sending ? 'A enviar...' : 'Enviar Agora'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      <TemplateStudioModal
        isOpen={sendTemplateModalOpen && Boolean(sendItem)}
        channel="email"
        initialSubject={sendForm.subject}
        initialBody={sendForm.message}
        initialHtml={effectiveSendHtml}
        initialMeta={sendTemplateMeta}
        recipientName={contacts.find((c) => c.id === sendForm.contactId)?.name || 'Cliente'}
        companyName={contacts.find((c) => c.id === sendForm.contactId)?.company || 'sua empresa'}
        onClose={() => setSendTemplateModalOpen(false)}
        onApply={({ subject, body, html, templateName, mode, templateId, category, headline, ctaLabel, ctaUrl }) => {
          setSendForm((prev) => ({
            ...prev,
            subject: subject || prev.subject,
            message: body,
          }));
          if (html !== undefined) setSendEmailHtml(html);
          setSendTemplateName(templateName);
          setSendTemplateMeta({
            mode: mode || 'visual',
            templateId,
            category: category || 'JOGIMIL Tecnologias',
            headline: headline || subject || 'Comunicação Oficial',
            ctaLabel: ctaLabel || '',
            ctaUrl: ctaUrl || '',
            templateName,
          });
        }}
      />

      {/* Modal Preview de Imagem / PDF */}
      {previewItem &&
        createPortal(
          <div className="fixed inset-0 z-[100] bg-black/25 flex items-center justify-center p-4">
            <div
              className="ds-card w-full max-w-4xl h-[82vh] border ds-divider shadow-2xl flex flex-col"
              style={{ backgroundColor: 'rgb(var(--surface))' }}
            >
              <div className="px-4 py-3 border-b ds-divider flex items-center justify-between">
                <span className="text-sm font-semibold truncate">{previewItem.name}</span>
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="btn btn-ghost btn-icon h-7 w-7"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
                {previewItem.fileType === 'image' ? (
                  <img
                    src={previewItem.publicUrl || previewItem.dataUrl}
                    alt={previewItem.name}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <iframe
                    src={previewItem.publicUrl || previewItem.dataUrl}
                    title={previewItem.name}
                    className="w-full h-full border ds-divider bg-white"
                  />
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      <ConfirmModal
        isOpen={Boolean(confirmDelete)}
        title="Eliminar arquivo digital?"
        description={`O arquivo "${confirmDelete?.name || ''}" será removido permanentemente da biblioteca.`}
        confirmLabel="Eliminar Arquivo"
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
