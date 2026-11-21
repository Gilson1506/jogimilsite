import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Search,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
  Check,
  FolderOpen,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { apiUrl } from '../lib/api';
import type { DigitalFileItem } from './DigitalFilesManager';

interface DigitalFilePickerModalProps {
  open: boolean;
  alreadyAttachedIds?: string[];
  onClose: () => void;
  onSelect: (files: DigitalFileItem[]) => void;
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function DigitalFilePickerModal({
  open,
  alreadyAttachedIds = [],
  onClose,
  onSelect,
}: DigitalFilePickerModalProps) {
  const [files, setFiles] = useState<DigitalFileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'pdf' | 'excel' | 'image'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const alreadyAttachedSet = useMemo(() => new Set(alreadyAttachedIds), [alreadyAttachedIds]);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const r = await fetch(apiUrl('/api/v1/admin/files'));
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.success) {
        throw new Error(j.message || j.detail || `Erro ao carregar biblioteca (HTTP ${r.status}).`);
      }
      setFiles(Array.isArray(j.files) ? j.files : []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Falha ao carregar arquivos da biblioteca.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setSelectedIds(new Set());
    loadFiles();
  }, [open, loadFiles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return files.filter((f) => {
      if (typeFilter !== 'all' && f.fileType !== typeFilter) return false;
      if (!q) return true;
      return (
        f.name.toLowerCase().includes(q) ||
        f.fileName.toLowerCase().includes(q) ||
        (f.description || '').toLowerCase().includes(q)
      );
    });
  }, [files, search, typeFilter]);

  if (!open) return null;

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    const chosen = files.filter((f) => selectedIds.has(f.id));
    if (chosen.length > 0) onSelect(chosen);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[105] bg-black/25 flex items-center justify-center p-4">
      <div
        className="ds-card w-full max-w-2xl max-h-[82vh] border ds-divider shadow-2xl flex flex-col"
        style={{ backgroundColor: 'rgb(var(--surface))' }}
      >
        <div className="px-5 py-3.5 border-b ds-divider flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-sky-500" />
            <div>
              <h3 className="text-sm font-semibold">Selecionar da Biblioteca de Arquivos Digitais</h3>
              <p className="text-[11px] ds-muted">
                Escolha PDFs, folhas Excel ou imagens prontas sem fazer upload externo.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-icon h-7 w-7">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-3.5 border-b ds-divider flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="h-3.5 w-3.5 ds-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar arquivo..."
              className="input w-full pl-8 text-xs h-8"
            />
          </div>
          <div className="flex border ds-divider">
            {(
              [
                { id: 'all', label: 'Todos' },
                { id: 'pdf', label: 'PDF' },
                { id: 'excel', label: 'Excel' },
                { id: 'image', label: 'Imagens' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTypeFilter(t.id)}
                className={`px-2.5 py-1 text-xs ${
                  typeFilter === t.id ? 'bg-sky-600 text-white' : 'ds-muted'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y ds-divider">
          {loading ? (
            <div className="py-12 text-center text-xs ds-muted">A carregar arquivos...</div>
          ) : loadError ? (
            <div className="py-10 px-6 text-center space-y-3">
              <div className="inline-flex items-center gap-2 text-xs text-rose-500">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{loadError}</span>
              </div>
              <div>
                <button
                  type="button"
                  onClick={loadFiles}
                  className="btn btn-secondary btn-sm gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Tentar novamente
                </button>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-xs ds-muted">
              Nenhum arquivo disponível na biblioteca. Carregue documentos na página <strong>Arquivos Digitais</strong>.
            </div>
          ) : (
            filtered.map((f) => {
              const hasContent = Boolean(f.publicUrl || f.dataUrl);
              const alreadyAttached = alreadyAttachedSet.has(f.id);
              const disabled = !hasContent || alreadyAttached;
              const checked = !disabled && selectedIds.has(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && toggle(f.id)}
                  className={`w-full px-4 py-2.5 text-left flex items-center justify-between gap-3 transition-colors ${
                    disabled
                      ? 'opacity-55 cursor-not-allowed'
                      : checked
                      ? 'bg-sky-500/10'
                      : 'hover:bg-sky-500/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`h-4 w-4 border flex items-center justify-center shrink-0 ${
                        checked ? 'bg-sky-600 border-sky-600 text-white' : 'ds-divider'
                      }`}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    {f.fileType === 'pdf' ? (
                      <FileText className="h-4 w-4 text-rose-500 shrink-0" />
                    ) : f.fileType === 'excel' ? (
                      <FileSpreadsheet className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : f.fileType === 'image' ? (
                      <ImageIcon className="h-4 w-4 text-sky-500 shrink-0" />
                    ) : (
                      <File className="h-4 w-4 ds-muted shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{f.name}</p>
                      <p className="text-[11px] ds-muted truncate">
                        {f.fileName} · {formatBytes(f.size)}
                        {!hasContent && (
                          <span className="text-rose-500 ml-1.5 font-medium">· Sem conteúdo utilizável</span>
                        )}
                        {hasContent && alreadyAttached && (
                          <span className="text-sky-500 ml-1.5 font-medium">· Já anexado</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono uppercase ds-muted shrink-0">{f.fileType}</span>
                </button>
              );
            })
          )}
        </div>

        <div className="px-5 py-3 border-t ds-divider flex items-center justify-between">
          <span className="text-xs ds-muted">
            {selectedIds.size} arquivo(s) selecionado(s)
          </span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="btn btn-secondary text-xs h-8 px-3">
              Cancelar
            </button>
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={handleConfirm}
              className="btn btn-primary text-xs h-8 px-4"
            >
              Anexar Selecionados
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
