import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, X, Trash2, AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, loading, onCancel]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/25 p-4"
      onClick={() => !loading && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="ds-card w-full max-w-md border-[rgb(var(--border-strong))] shadow-2xl animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ds-card-header">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
            <h3 className="ds-title">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn btn-ghost btn-icon h-8 w-8"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-[13px] ds-muted leading-relaxed">{description}</p>
        </div>

        <div className="px-5 py-3 border-t ds-divider flex items-center justify-end gap-2 ds-surface-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn btn-secondary"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="btn btn-danger"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{loading ? 'A eliminar...' : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

interface FeedbackPopupProps {
  notice: { type: 'success' | 'error'; title?: string; text: string } | null;
  onClose: () => void;
}

export function FeedbackPopup({ notice, onClose }: FeedbackPopupProps) {
  if (!notice || typeof document === 'undefined') return null;
  const isSuccess = notice.type === 'success';

  return createPortal(
    <div className="fixed bottom-5 right-5 z-[120] w-full max-w-sm animate-fadeIn">
      <div
        role="status"
        className={`ds-card p-4 shadow-2xl border-l-4 flex items-start gap-3 ${
          isSuccess ? 'border-l-emerald-500' : 'border-l-rose-500'
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold">
            {notice.title || (isSuccess ? 'Operação concluída' : 'Ocorreu um erro')}
          </p>
          <p className="text-xs ds-muted mt-0.5 leading-snug">{notice.text}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ds-subtle hover:text-[rgb(var(--text))] p-0.5"
          aria-label="Fechar aviso"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>,
    document.body
  );
}
