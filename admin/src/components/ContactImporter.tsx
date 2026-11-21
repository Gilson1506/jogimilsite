import { useRef, useState } from 'react';
import { FileSpreadsheet, Upload, Download, CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { STAGES } from '../lib/crm';

type FieldKey = 'name' | 'email' | 'phone' | 'company' | 'role' | 'stage' | 'priority' | 'tags' | 'notes' | 'source';

const FIELDS: { key: FieldKey; label: string; required?: boolean; aliases: string[] }[] = [
  { key: 'name', label: 'Nome', required: true, aliases: ['nome', 'name', 'nome completo', 'cliente', 'contacto', 'contato', 'full name'] },
  { key: 'email', label: 'Email', aliases: ['email', 'e-mail', 'correio', 'mail'] },
  { key: 'phone', label: 'Telefone', aliases: ['telefone', 'telemovel', 'telemóvel', 'phone', 'celular', 'whatsapp', 'numero', 'número', 'tel', 'mobile'] },
  { key: 'company', label: 'Empresa', aliases: ['empresa', 'company', 'organizacao', 'organização', 'entidade'] },
  { key: 'role', label: 'Cargo', aliases: ['cargo', 'funcao', 'função', 'role', 'title', 'posição'] },
  { key: 'stage', label: 'Etapa', aliases: ['etapa', 'fase', 'stage', 'estado', 'status'] },
  { key: 'priority', label: 'Prioridade', aliases: ['prioridade', 'priority'] },
  { key: 'tags', label: 'Etiquetas', aliases: ['etiquetas', 'tags', 'segmento', 'categoria'] },
  { key: 'notes', label: 'Notas', aliases: ['notas', 'notes', 'observacoes', 'observações', 'obs', 'comentarios'] },
  { key: 'source', label: 'Origem', aliases: ['origem', 'source', 'fonte', 'canal'] },
];

const norm = (s: string) =>
  s
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

function autoMap(headers: string[]): Record<FieldKey, string> {
  const map = {} as Record<FieldKey, string>;
  for (const f of FIELDS) {
    const hit = headers.find((h) => f.aliases.map(norm).includes(norm(h)));
    map[f.key] = hit || '';
  }
  return map;
}

function toStage(v: string) {
  const n = norm(v);
  if (!n) return undefined;
  const found = STAGES.find((s) => norm(s.label) === n || s.id === n);
  if (found) return found.id;
  if (n.includes('ganh') || n.includes('cliente')) return 'ganho';
  if (n.includes('perd')) return 'perdido';
  if (n.includes('negoc')) return 'negociacao';
  if (n.includes('propost')) return 'proposta';
  if (n.includes('qualif')) return 'qualificado';
  if (n.includes('contact')) return 'contactado';
  return 'novo';
}

function toPriority(v: string) {
  const n = norm(v);
  if (n.startsWith('alt') || n === 'high') return 'alta';
  if (n.startsWith('baix') || n === 'low') return 'baixa';
  if (n) return 'media';
  return undefined;
}

export function ContactImporter() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Record<FieldKey, string>>({} as Record<FieldKey, string>);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const reset = () => {
    setFileName('');
    setHeaders([]);
    setRows([]);
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFile = async (file: File) => {
    setParsing(true);
    setResult(null);
    try {
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array', cellDates: true });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false });
      if (!json.length) throw new Error('A folha está vazia.');
      const hdrs = Object.keys(json[0]);
      setFileName(file.name);
      setHeaders(hdrs);
      setRows(json);
      setMapping(autoMap(hdrs));
    } catch (e) {
      setResult({ type: 'error', text: `Não foi possível ler o ficheiro: ${e instanceof Error ? e.message : 'formato inválido'}` });
    } finally {
      setParsing(false);
    }
  };

  const buildPayload = () =>
    rows.map((r) => {
      const get = (k: FieldKey) => (mapping[k] ? String(r[mapping[k]] ?? '').trim() : '');
      return {
        name: get('name'),
        email: get('email'),
        phone: get('phone'),
        company: get('company'),
        role: get('role'),
        stage: toStage(get('stage')),
        priority: toPriority(get('priority')),
        tags: get('tags'),
        notes: get('notes'),
        source: get('source') || undefined,
      };
    });

  const validRows = rows.length ? buildPayload().filter((r) => r.name || r.email || r.phone).length : 0;

  const doImport = async () => {
    if (!mapping.name && !mapping.email && !mapping.phone) {
      setResult({ type: 'error', text: 'Associe pelo menos a coluna Nome, Email ou Telefone.' });
      return;
    }
    setImporting(true);
    try {
      const res = await apiFetch<{ created: number; updated: number; skipped: number; errors: { row: number; message: string }[]; total: number }>(
        '/api/v1/admin/contacts/import',
        {
          method: 'POST',
          body: JSON.stringify({ contacts: buildPayload(), updateExisting, source: `Importação · ${fileName}` }),
        }
      );
      setResult({
        type: 'success',
        text: `Importação concluída: ${res.created} criados, ${res.updated} atualizados, ${res.skipped} ignorados${
          res.errors?.length ? `, ${res.errors.length} avisos` : ''
        }. Total no CRM: ${res.total}.`,
      });
      setRows([]);
      setHeaders([]);
      if (fileRef.current) fileRef.current.value = '';
    } catch (e) {
      setResult({ type: 'error', text: e instanceof Error ? e.message : 'Falha na importação.' });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = async () => {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.aoa_to_sheet([
      ['Nome', 'Email', 'Telefone', 'Empresa', 'Cargo', 'Etapa', 'Prioridade', 'Etiquetas', 'Notas'],
      ['Manuel Quaresma', 'manuel@empresa.ao', '+244 923 000 000', 'Supermercado Alvalade', 'Diretor', 'Novo lead', 'Alta', 'POS, Retalho', 'Interessado em demonstração'],
    ]);
    ws['!cols'] = [20, 26, 18, 24, 14, 14, 12, 18, 30].map((w) => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contactos');
    XLSX.writeFile(wb, 'modelo-importacao-contactos-jogimil.xlsx');
  };

  return (
    <div className="ds-card">
      <div className="ds-card-header">
        <div className="flex items-center gap-2.5">
          <FileSpreadsheet className="h-4 w-4 text-emerald-500 shrink-0" />
          <div>
            <p className="ds-title">Importar contactos (Excel / CSV)</p>
            <p className="ds-subtitle">Carregue .xlsx, .xls ou .csv — duplicados são detetados por email ou telefone</p>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={downloadTemplate}>
          <Download className="h-3.5 w-3.5" /> Modelo Excel
        </button>
      </div>

      <div className="p-5 space-y-4">
        {result && (
          <div
            className={`flex items-start gap-2 border px-3 py-2.5 text-[13px] ${
              result.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500' : 'border-rose-500/30 bg-rose-500/10 text-rose-500'
            }`}
          >
            {result.type === 'success' ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />}
            <span>{result.text}</span>
          </div>
        )}

        {!rows.length ? (
          <label
            className="flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed ds-divider px-6 py-10 text-center transition-colors hover:border-brand hover:bg-brand/5"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
          >
            {parsing ? <RefreshCw className="h-6 w-6 animate-spin ds-muted" /> : <Upload className="h-6 w-6 ds-muted" />}
            <p className="text-[13px] font-medium">Arraste o ficheiro para aqui ou clique para selecionar</p>
            <p className="text-xs ds-muted">Primeira linha com cabeçalhos (Nome, Email, Telefone, Empresa…)</p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </label>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-[13px]">
                <span className="font-medium">{fileName}</span>{' '}
                <span className="ds-muted">
                  · {rows.length} linhas · {validRows} válidas
                </span>
              </p>
              <button className="btn btn-ghost btn-sm" onClick={reset}>
                <X className="h-3.5 w-3.5" /> Cancelar
              </button>
            </div>

            {/* Mapeamento de colunas */}
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider ds-subtle">Correspondência de colunas</p>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
                {FIELDS.map((f) => (
                  <div key={f.key}>
                    <label className="label">
                      {f.label}
                      {f.required && ' *'}
                    </label>
                    <select className="input" value={mapping[f.key] || ''} onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value })}>
                      <option value="">— Não importar —</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Pré-visualização */}
            <div className="overflow-hidden rounded-lg border ds-divider">
              <div className="overflow-x-auto max-h-64">
                <table className="ds-table">
                  <thead>
                    <tr>
                      {FIELDS.filter((f) => mapping[f.key]).map((f) => (
                        <th key={f.key}>{f.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {buildPayload()
                      .slice(0, 8)
                      .map((r, i) => (
                        <tr key={i}>
                          {FIELDS.filter((f) => mapping[f.key]).map((f) => (
                            <td key={f.key} className="whitespace-nowrap">
                              {String((r as Record<string, unknown>)[f.key] ?? '') || <span className="ds-subtle">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 8 && <p className="px-4 py-2 text-xs ds-muted">+ {rows.length - 8} linhas adicionais</p>}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 text-[13px]">
                <input type="checkbox" checked={updateExisting} onChange={(e) => setUpdateExisting(e.target.checked)} className="h-4 w-4 accent-[#0066FF]" />
                Atualizar contactos existentes (mesmo email/telefone)
              </label>
              <button className="btn btn-primary" onClick={doImport} disabled={importing || !validRows}>
                {importing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Importar {validRows} contactos
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
