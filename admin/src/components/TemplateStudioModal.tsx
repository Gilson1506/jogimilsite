import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  LayoutTemplate,
  Code2,
  FileText,
  Monitor,
  Smartphone,
  Link2,
  Plus,
  Check,
  MessageSquare,
  Mail,
} from 'lucide-react';
import {
  EMAIL_TEMPLATES,
  SMS_TEMPLATES,
  EmailTemplatePreset,
  SmsTemplatePreset,
  buildBrandedEmailHtml,
} from '../lib/emailTemplates';

export interface AppliedTemplateMeta {
  mode: 'visual' | 'html';
  templateId?: string;
  category: string;
  headline: string;
  ctaLabel: string;
  ctaUrl: string;
  templateName: string;
}

interface TemplateStudioModalProps {
  isOpen: boolean;
  channel: 'email' | 'whatsapp' | 'sms';
  initialSubject?: string;
  initialBody?: string;
  initialHtml?: string;
  initialMeta?: AppliedTemplateMeta | null;
  recipientName?: string;
  companyName?: string;
  onClose: () => void;
  onApply: (payload: {
    subject?: string;
    body: string;
    html?: string;
    templateName: string;
    mode?: 'visual' | 'html';
    templateId?: string;
    category?: string;
    headline?: string;
    ctaLabel?: string;
    ctaUrl?: string;
  }) => void;
}

export function TemplateStudioModal({
  isOpen,
  channel,
  initialSubject = '',
  initialBody = '',
  initialHtml = '',
  initialMeta = null,
  recipientName = 'Cliente',
  companyName = 'sua empresa',
  onClose,
  onApply,
}: TemplateStudioModalProps) {
  const isEmail = channel === 'email';

  const [selectedId, setSelectedId] = useState<string>(
    isEmail ? EMAIL_TEMPLATES[0].id : SMS_TEMPLATES[0].id
  );
  const [editorMode, setEditorMode] = useState<'visual' | 'html'>('visual');
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>('desktop');

  const [subject, setSubject] = useState(initialSubject || EMAIL_TEMPLATES[0].subject);
  const [category, setCategory] = useState(EMAIL_TEMPLATES[0].category);
  const [headline, setHeadline] = useState(EMAIL_TEMPLATES[0].headline);
  const [body, setBody] = useState(initialBody || (isEmail ? EMAIL_TEMPLATES[0].body : SMS_TEMPLATES[0].text));
  const [ctaLabel, setCtaLabel] = useState(EMAIL_TEMPLATES[0].ctaLabel);
  const [ctaUrl, setCtaUrl] = useState(EMAIL_TEMPLATES[0].ctaUrl);
  const [customHtml, setCustomHtml] = useState(initialHtml || '');

  // Inserir link
  const [showLinkBar, setShowLinkBar] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('https://jogimiltecnologias.it.ao');

  useEffect(() => {
    if (!isOpen) return;
    if (isEmail) {
      if (initialMeta) {
        if (initialMeta.mode === 'html') {
          setSelectedId('custom_html');
          setEditorMode('html');
          setCustomHtml(initialHtml || '');
          if (initialSubject) setSubject(initialSubject);
          if (initialBody) setBody(initialBody);
        } else {
          setSelectedId(initialMeta.templateId || EMAIL_TEMPLATES[0].id);
          setEditorMode('visual');
          setCategory(initialMeta.category || EMAIL_TEMPLATES[0].category);
          setHeadline(initialMeta.headline || EMAIL_TEMPLATES[0].headline);
          setCtaLabel(initialMeta.ctaLabel ?? '');
          setCtaUrl(initialMeta.ctaUrl ?? '');
          setSubject(initialSubject || EMAIL_TEMPLATES[0].subject);
          setBody(initialBody || '');
        }
      } else if (initialHtml && !initialBody) {
        setSelectedId('custom_html');
        setEditorMode('html');
        setCustomHtml(initialHtml);
      } else if (initialBody) {
        setEditorMode('visual');
        setBody(initialBody);
        if (initialSubject) setSubject(initialSubject);
      } else {
        selectEmailPreset(EMAIL_TEMPLATES[0]);
      }
    } else {
      if (initialMeta?.templateId) {
        setSelectedId(initialMeta.templateId);
      }
      if (initialBody) {
        setBody(initialBody);
      } else {
        selectSmsPreset(SMS_TEMPLATES[0]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, channel]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const selectEmailPreset = (tpl: EmailTemplatePreset) => {
    setSelectedId(tpl.id);
    setEditorMode('visual');
    setSubject(tpl.subject);
    setCategory(tpl.category);
    setHeadline(tpl.headline);
    setBody(
      tpl.body
        .replace(/\{nome\}/g, recipientName)
        .replace(/\{empresa\}/g, companyName)
    );
    setCtaLabel(tpl.ctaLabel);
    setCtaUrl(tpl.ctaUrl);
  };

  const selectSmsPreset = (tpl: SmsTemplatePreset) => {
    setSelectedId(tpl.id);
    setBody(
      tpl.text
        .replace(/\{nome\}/g, recipientName)
        .replace(/\{empresa\}/g, companyName)
    );
  };

  const switchToCustomHtml = () => {
    setSelectedId('custom_html');
    if (!customHtml.trim()) {
      setCustomHtml(
        buildBrandedEmailHtml({
          category,
          headline,
          body,
          ctaLabel,
          ctaUrl,
          previewLocalLogo: false,
        })
      );
    }
    setEditorMode('html');
  };

  const handleInsertLink = () => {
    const url = linkUrl.trim();
    const label = linkText.trim() || url;
    if (!url) return;

    if (isEmail && editorMode === 'html') {
      const a = `<a href="${url}" target="_blank" style="color:#0066FF;font-weight:600;text-decoration:underline;">${label}</a>`;
      setCustomHtml((prev) => `${prev}\n${a}`);
    } else if (isEmail) {
      setBody((prev) => `${prev}${prev ? '\n' : ''}[${label}](${url})`);
    } else {
      setBody((prev) => `${prev}${prev ? ' ' : ''}${label !== url ? `${label}: ` : ''}${url}`);
    }
    setLinkText('');
    setShowLinkBar(false);
  };

  const previewEmailHtml =
    editorMode === 'html'
      ? customHtml
      : buildBrandedEmailHtml({
          category,
          headline: headline || subject || 'Comunicação Oficial',
          body,
          ctaLabel,
          ctaUrl,
          previewLocalLogo: true,
        });

  const finalEmailHtml =
    editorMode === 'html'
      ? customHtml
      : buildBrandedEmailHtml({
          category,
          headline: headline || subject || 'Comunicação Oficial',
          body,
          ctaLabel,
          ctaUrl,
          previewLocalLogo: false,
        });

  const handleApply = () => {
    if (isEmail) {
      const tplLabel =
        editorMode === 'html'
          ? 'HTML Personalizado'
          : EMAIL_TEMPLATES.find((t) => t.id === selectedId)?.label || 'Template JOGIMIL';
      onApply({
        subject,
        body: editorMode === 'html' ? body || subject || 'Email HTML Personalizado' : body,
        html: finalEmailHtml,
        templateName: tplLabel,
        mode: editorMode,
        templateId: selectedId,
        category,
        headline: headline || subject || 'Comunicação Oficial',
        ctaLabel,
        ctaUrl,
      });
    } else {
      const tplLabel = SMS_TEMPLATES.find((t) => t.id === selectedId)?.label || 'Modelo Rápido';
      onApply({
        body,
        templateName: tplLabel,
        mode: 'visual',
        templateId: selectedId,
      });
    }
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/25 p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="ds-card w-full max-w-6xl h-[88vh] flex flex-col border-[rgb(var(--border-strong))] shadow-2xl animate-fadeIn overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do Modal */}
        <div className="ds-card-header shrink-0">
          <div className="flex items-center gap-2.5">
            <LayoutTemplate className="h-4 w-4 text-brand shrink-0" />
            <div>
              <h2 className="ds-title">
                Estúdio de Templates · {isEmail ? 'Email Corporativo (Logo JOGIMIL)' : 'WhatsApp & SMS'}
              </h2>
              <p className="ds-subtitle">
                Selecione um modelo pronto, edite o texto ou cole HTML personalizado com pré-visualização ao vivo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-icon h-8 w-8"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Corpo Split-Screen: 3 Colunas (Modelos | Editor | Live Preview) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
          {/* Coluna 1: Lista de Templates */}
          <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r ds-divider overflow-y-auto p-3 space-y-2 ds-surface-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] ds-subtle px-1">
              {isEmail ? 'Modelos de Email (4)' : 'Modelos de Mensagem (4)'}
            </p>

            {isEmail ? (
              <>
                {EMAIL_TEMPLATES.map((tpl) => {
                  const active = selectedId === tpl.id && editorMode === 'visual';
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => selectEmailPreset(tpl)}
                      className={`w-full text-left p-3 border transition-colors ${
                        active
                          ? 'border-brand bg-brand/10 text-[rgb(var(--text))]'
                          : 'ds-divider hover:bg-[rgb(var(--surface))] ds-muted'
                      }`}
                      style={!active ? { backgroundColor: 'rgb(var(--surface))' } : undefined}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold">{tpl.label}</span>
                        <span className="text-[10px] font-mono ds-subtle">{tpl.category}</span>
                      </div>
                      <p className="text-[11px] ds-muted line-clamp-2 mt-1">{tpl.headline}</p>
                    </button>
                  );
                })}

                <div className="pt-2 border-t ds-divider">
                  <button
                    type="button"
                    onClick={switchToCustomHtml}
                    className={`w-full text-left p-3 border transition-colors ${
                      editorMode === 'html'
                        ? 'border-brand bg-brand/10 text-[rgb(var(--text))]'
                        : 'ds-divider hover:bg-[rgb(var(--surface))] ds-muted'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <Code2 className="h-3.5 w-3.5 text-brand" />
                      <span>HTML Personalizado</span>
                    </div>
                    <p className="text-[11px] ds-muted mt-1">
                      Cole ou edite o seu próprio código HTML com preview em tempo real.
                    </p>
                  </button>
                </div>
              </>
            ) : (
              SMS_TEMPLATES.map((tpl) => {
                const active = selectedId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => selectSmsPreset(tpl)}
                    className={`w-full text-left p-3 border transition-colors ${
                      active
                        ? 'border-brand bg-brand/10 text-[rgb(var(--text))]'
                        : 'ds-divider hover:bg-[rgb(var(--surface))] ds-muted'
                    }`}
                    style={!active ? { backgroundColor: 'rgb(var(--surface))' } : undefined}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold">{tpl.label}</span>
                      <span className="text-[10px] font-mono ds-subtle">{tpl.category}</span>
                    </div>
                    <p className="text-[11px] ds-muted line-clamp-2 mt-1">{tpl.text}</p>
                  </button>
                );
              })
            )}
          </div>

          {/* Coluna 2: Editor */}
          <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r ds-divider overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 pb-2 border-b ds-divider">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                {editorMode === 'html' && isEmail ? (
                  <>
                    <Code2 className="h-3.5 w-3.5 text-brand" /> Editor HTML
                  </>
                ) : (
                  <>
                    <FileText className="h-3.5 w-3.5 text-brand" /> Personalizar Conteúdo
                  </>
                )}
              </span>

              <button
                type="button"
                onClick={() => setShowLinkBar(!showLinkBar)}
                className="btn btn-secondary btn-sm h-7 text-[11px]"
              >
                <Link2 className="h-3.5 w-3.5 text-brand" /> Inserir Link
              </button>
            </div>

            {showLinkBar && (
              <div className="p-2.5 border ds-divider ds-surface-2 space-y-2">
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Texto do link (ex.: Ver Proposta)"
                  className="input h-8 text-xs"
                />
                <div className="flex gap-1.5">
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="input h-8 text-xs font-mono flex-1"
                  />
                  <button type="button" onClick={handleInsertLink} className="btn btn-primary btn-sm h-8">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {isEmail ? (
              editorMode === 'html' ? (
                <div className="space-y-3">
                  <div>
                    <label className="label">Assunto do Email</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="input h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="label">Código HTML Personalizado</label>
                    <textarea
                      rows={16}
                      value={customHtml}
                      onChange={(e) => setCustomHtml(e.target.value)}
                      placeholder="<html>...</html>"
                      className="input font-mono text-[11px] leading-relaxed"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="label">Assunto do Email</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="input h-8 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label">Título do Cabeçalho</label>
                      <input
                        type="text"
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        className="input h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="label">Categoria</label>
                      <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="input h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">Mensagem (aceita `[Texto](https://...)`)</label>
                    <textarea
                      rows={7}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      className="input text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label">Botão CTA (Opcional)</label>
                      <input
                        type="text"
                        value={ctaLabel}
                        onChange={(e) => setCtaLabel(e.target.value)}
                        placeholder="Ex.: Aceder ao Portal"
                        className="input h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="label">URL do Botão</label>
                      <input
                        type="url"
                        value={ctaUrl}
                        onChange={(e) => setCtaUrl(e.target.value)}
                        placeholder="https://..."
                        className="input h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] ds-subtle">Variáveis:</span>
                  {['{nome}', '{empresa}'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setBody((prev) => `${prev}${prev ? ' ' : ''}${v}`)}
                      className="px-2 py-0.5 text-[11px] font-mono border ds-divider ds-surface-2 hover:border-brand"
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="label">Texto da Mensagem</label>
                  <textarea
                    rows={10}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="input text-xs"
                  />
                  <p className="text-[11px] font-mono ds-subtle mt-1 text-right">
                    {body.length} caracteres
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Coluna 3: Live Preview Sempre Visível */}
          <div className="lg:col-span-5 flex flex-col min-h-0 ds-surface-2">
            <div className="px-4 py-2.5 border-b ds-divider flex items-center justify-between gap-2">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                {isEmail ? (
                  <>
                    <Mail className="h-3.5 w-3.5 text-brand" /> Pré-visualização do Email
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-3.5 w-3.5 text-emerald-500" /> Pré-visualização da Mensagem
                  </>
                )}
              </span>

              <div className="inline-flex border ds-divider">
                <button
                  type="button"
                  onClick={() => setPreviewViewport('desktop')}
                  title="Vista Desktop"
                  className={`p-1.5 ${previewViewport === 'desktop' ? 'bg-brand text-white' : 'ds-muted'}`}
                >
                  <Monitor className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport('mobile')}
                  title="Vista Mobile"
                  className={`p-1.5 ${previewViewport === 'mobile' ? 'bg-brand text-white' : 'ds-muted'}`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 flex justify-center items-start">
              {isEmail ? (
                <div
                  className={`bg-white border ds-divider shadow-lg transition-all duration-200 overflow-hidden ${
                    previewViewport === 'mobile' ? 'w-[340px]' : 'w-full'
                  }`}
                >
                  <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 text-[11px] text-slate-700">
                    <span className="font-semibold">Assunto:</span> {subject || '(Sem assunto)'}
                  </div>
                  <iframe
                    title="Live Email Preview"
                    srcDoc={previewEmailHtml}
                    sandbox="allow-same-origin"
                    className="w-full h-[520px] border-0 bg-white"
                  />
                </div>
              ) : (
                <div
                  className={`border ds-divider shadow-lg transition-all duration-200 p-4 space-y-3 ${
                    previewViewport === 'mobile' ? 'w-[320px]' : 'w-full max-w-md'
                  }`}
                  style={{ backgroundColor: 'rgb(var(--surface))' }}
                >
                  <div className="flex items-center gap-2 pb-2 border-b ds-divider">
                    <img src="/logo-mark.png" alt="JOGIMIL" className="h-6 w-6 object-contain" />
                    <div>
                      <p className="text-xs font-semibold">JOGIMIL Tecnologias</p>
                      <p className="text-[10px] text-emerald-500">WhatsApp Business · Oficial</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-[90%] bg-emerald-600 text-white px-3.5 py-2.5 text-xs whitespace-pre-wrap break-words leading-relaxed">
                      {body || 'Escreva a sua mensagem para pré-visualizar...'}
                      <p className="text-[10px] text-white/75 text-right font-mono mt-1.5">
                        {new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })} ✓✓
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="px-5 py-3 border-t ds-divider flex items-center justify-between gap-3 shrink-0" style={{ backgroundColor: 'rgb(var(--surface))' }}>
          <span className="text-[11px] ds-muted">
            O template aplicado pode ainda ser ajustado antes do envio final.
          </span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="button" onClick={handleApply} className="btn btn-primary">
              <Check className="h-4 w-4" /> Aplicar Template
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
