import { useEffect, useState } from 'react';
import { Code2, Eye, FileText, Link2, Sparkles, Plus } from 'lucide-react';
import {
  EMAIL_TEMPLATES,
  EmailTemplatePreset,
  buildBrandedEmailHtml,
} from '../lib/emailTemplates';

interface EmailTemplateStudioProps {
  subject: string;
  onSubjectChange: (v: string) => void;
  body: string;
  onBodyChange: (v: string) => void;
  onHtmlChange: (html: string) => void;
  recipientName?: string;
  companyName?: string;
}

export function EmailTemplateStudio({
  subject,
  onSubjectChange,
  body,
  onBodyChange,
  onHtmlChange,
  recipientName,
  companyName,
}: EmailTemplateStudioProps) {
  const [mode, setMode] = useState<'visual' | 'html' | 'preview'>('visual');
  const [activePresetId, setActivePresetId] = useState<string>('custom');
  const [category, setCategory] = useState('JOGIMIL Tecnologias');
  const [headline, setHeadline] = useState('Comunicação Oficial');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [customHtml, setCustomHtml] = useState('');
  const [useCustomHtml, setUseCustomHtml] = useState(false);

  // Barra rápida para inserir link no texto/HTML
  const [showLinkTool, setShowLinkTool] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('https://jogimiltecnologias.it.ao');

  const applyPreset = (preset: EmailTemplatePreset) => {
    const resolvedBody = preset.body
      .replace(/\{nome\}/g, recipientName || '{nome}')
      .replace(/\{empresa\}/g, companyName || '{empresa}');
    setActivePresetId(preset.id);
    setCategory(preset.category);
    setHeadline(preset.headline);
    setCtaLabel(preset.ctaLabel);
    setCtaUrl(preset.ctaUrl);
    setUseCustomHtml(false);
    onSubjectChange(preset.subject);
    onBodyChange(resolvedBody);
  };

  // Mantém o HTML final sincronizado (para envio SMTP real com logo pública)
  useEffect(() => {
    const finalHtml = useCustomHtml
      ? customHtml
      : buildBrandedEmailHtml({
          category,
          headline: headline || subject || 'Comunicação Oficial',
          body,
          ctaLabel,
          ctaUrl,
          previewLocalLogo: false,
        });
    onHtmlChange(finalHtml);
  }, [useCustomHtml, customHtml, category, headline, subject, body, ctaLabel, ctaUrl, onHtmlChange]);

  const previewHtml = useCustomHtml
    ? customHtml
    : buildBrandedEmailHtml({
        category,
        headline: headline || subject || 'Comunicação Oficial',
        body,
        ctaLabel,
        ctaUrl,
        previewLocalLogo: true,
      });

  const handleOpenHtmlEditor = () => {
    if (!useCustomHtml) {
      setCustomHtml(
        buildBrandedEmailHtml({
          category,
          headline: headline || subject || 'Comunicação Oficial',
          body,
          ctaLabel,
          ctaUrl,
          previewLocalLogo: false,
        })
      );
      setUseCustomHtml(true);
    }
    setMode('html');
  };

  const handleInsertLink = () => {
    const cleanUrl = linkUrl.trim();
    const cleanLabel = linkText.trim() || cleanUrl;
    if (!cleanUrl) return;

    if (useCustomHtml || mode === 'html') {
      const anchor = `<a href="${cleanUrl}" target="_blank" style="color:#0066FF;font-weight:600;text-decoration:underline;">${cleanLabel}</a>`;
      setCustomHtml((prev) => `${prev}\n${anchor}`);
    } else {
      onBodyChange(`${body}${body ? '\n' : ''}[${cleanLabel}](${cleanUrl})`);
    }
    setLinkText('');
    setShowLinkTool(false);
  };

  return (
    <div className="border ds-divider space-y-3 p-3" style={{ backgroundColor: 'rgb(var(--surface))' }}>
      {/* Barra de 4 Templates Prontos JOGIMIL */}
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider ds-muted">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            Templates JOGIMIL (com Logo)
          </span>

          {/* Seletor de Modo: Visual / HTML / Preview */}
          <div className="inline-flex border ds-divider">
            <button
              type="button"
              onClick={() => {
                setUseCustomHtml(false);
                setMode('visual');
              }}
              className={`inline-flex items-center gap-1 px-2.5 h-7 text-[11px] font-medium ${
                mode === 'visual' ? 'bg-brand text-white' : 'ds-muted hover:text-[rgb(var(--text))]'
              }`}
            >
              <FileText className="h-3 w-3" /> Editor
            </button>
            <button
              type="button"
              onClick={handleOpenHtmlEditor}
              className={`inline-flex items-center gap-1 px-2.5 h-7 text-[11px] font-medium ${
                mode === 'html' ? 'bg-brand text-white' : 'ds-muted hover:text-[rgb(var(--text))]'
              }`}
            >
              <Code2 className="h-3 w-3" /> HTML
            </button>
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={`inline-flex items-center gap-1 px-2.5 h-7 text-[11px] font-medium ${
                mode === 'preview' ? 'bg-brand text-white' : 'ds-muted hover:text-[rgb(var(--text))]'
              }`}
            >
              <Eye className="h-3 w-3" /> Preview
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {EMAIL_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => applyPreset(tpl)}
              className={`px-2.5 py-1.5 text-left border text-xs transition-colors ${
                activePresetId === tpl.id && !useCustomHtml
                  ? 'border-brand bg-brand/10 text-[rgb(var(--text))] font-semibold'
                  : 'ds-divider ds-surface-2 ds-muted hover:text-[rgb(var(--text))]'
              }`}
            >
              <span className="block truncate">{tpl.label}</span>
              <span className="block text-[10px] ds-subtle">{tpl.category}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Ferramenta rápida de Inserir Link */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t ds-divider">
        <button
          type="button"
          onClick={() => setShowLinkTool(!showLinkTool)}
          className="btn btn-secondary btn-sm h-7 text-[11px]"
        >
          <Link2 className="h-3.5 w-3.5 text-brand" />
          <span>Inserir Link no Corpo</span>
        </button>
        {useCustomHtml && (
          <span className="text-[11px] font-mono text-amber-400">
            Modo HTML Personalizado ativo
          </span>
        )}
      </div>

      {showLinkTool && (
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 border ds-divider ds-surface-2">
          <input
            type="text"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            placeholder="Texto do link (ex.: Ver Proposta)"
            className="input h-8 text-xs sm:col-span-5"
          />
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
            className="input h-8 text-xs sm:col-span-5 font-mono"
          />
          <button
            type="button"
            onClick={handleInsertLink}
            className="btn btn-primary btn-sm h-8 sm:col-span-2"
          >
            <Plus className="h-3.5 w-3.5" /> Inserir
          </button>
        </div>
      )}

      {/* Conteúdo por Modo */}
      {mode === 'visual' && (
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="label mb-1">Título no Cabeçalho do Email</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Ex.: Proposta Comercial JOGIMIL"
                className="input h-8 text-xs"
              />
            </div>
            <div>
              <label className="label mb-1">Etiqueta / Categoria</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex.: Comercial, Suporte, Aviso"
                className="input h-8 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="label mb-1">Mensagem do Email (suporta links `[Texto](https://...)`)</label>
            <textarea
              rows={5}
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              placeholder="Escreva a mensagem do email..."
              className="input text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="label mb-1">Texto do Botão / CTA (Opcional)</label>
              <input
                type="text"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="Ex.: Aceder ao Portal"
                className="input h-8 text-xs"
              />
            </div>
            <div>
              <label className="label mb-1">Link do Botão (URL)</label>
              <input
                type="url"
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                placeholder="https://jogimiltecnologias.it.ao"
                className="input h-8 text-xs font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {mode === 'html' && (
        <div className="space-y-1.5">
          <label className="label mb-1">Código HTML Personalizado do Email</label>
          <textarea
            rows={10}
            value={customHtml}
            onChange={(e) => {
              setUseCustomHtml(true);
              setCustomHtml(e.target.value);
            }}
            placeholder="Cole ou edite aqui o seu HTML completo..."
            className="input font-mono text-[11px] leading-relaxed"
          />
        </div>
      )}

      {mode === 'preview' && (
        <div className="border ds-divider bg-white overflow-hidden">
          <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
            <span className="font-semibold truncate">Assunto: {subject || '(Sem assunto)'}</span>
            <span className="font-mono text-[10px]">Pré-visualização HTML</span>
          </div>
          <iframe
            title="Pré-visualização do Email JOGIMIL"
            srcDoc={previewHtml}
            sandbox="allow-same-origin"
            className="w-full h-[380px] border-0 bg-white"
          />
        </div>
      )}
    </div>
  );
}
