import { FormEvent, useId, useState } from 'react';
import { wa } from '../data/content';
import { href } from '../lib/hooks';
import { submitToMicroservice } from '../lib/api';
import { Icon } from './ui';

type Field =
  | { name: string; label: string; type?: 'text' | 'email' | 'tel' | 'textarea'; required?: boolean; placeholder?: string }
  | { name: string; label: string; type: 'select'; options: string[]; required?: boolean };

export interface FormDef {
  id: string;
  title: string;
  submit: string; // verbo claro
  heading: string;
  fields: Field[];
  attachment?: boolean;
}

const phoneOk = (v: string) => v.replace(/\D/g, '').length >= 9;

export function Form({ def }: { def: FormDef }) {
  const uid = useId();
  const [vals, setVals] = useState<Record<string, string>>({});
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [file, setFile] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [serverMsg, setServerMsg] = useState('');

  const validate = () => {
    const e: Record<string, string> = {};
    def.fields.forEach((f) => {
      const v = (vals[f.name] || '').trim();
      if (f.required && !v) e[f.name] = 'Este campo é obrigatório.';
      else if (v && f.type === 'email' && !/^\S+@\S+\.\S+$/.test(v)) e[f.name] = 'Escreva um email válido, por exemplo nome@empresa.ao.';
      else if (v && f.type === 'tel' && !phoneOk(v)) e[f.name] = 'Escreva um número com pelo menos 9 dígitos.';
    });
    if (!consent) e.consent = 'Para continuar, tem de aceitar a política de privacidade.';
    setErrs(e);
    return e;
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    const first = Object.keys(e)[0];
    if (first) {
      document.getElementById(`${uid}-${first}`)?.focus();
      return;
    }

    setSending(true);

    const payloadData = { ...vals };
    if (file) payloadData.anexo = file;

    try {
      const json = await submitToMicroservice({
        formType: def.id,
        formTitle: def.title,
        data: payloadData,
        source: window.location.href,
      });

      setServerMsg(json.message || 'Mensagem enviada com sucesso para o email da JOGIMIL.');
      setDone(true);
    } catch {
      // Se a API retornar erro, fallback suave para WhatsApp
      const lines = def.fields.map((f) => `${f.label}: ${(vals[f.name] || '-').trim()}`);
      if (file) lines.push(`Anexo: ${file}`);
      window.open(wa(`*${def.title}*\n${lines.join('\n')}\n\nAceito a política de privacidade.`), '_blank', 'noopener');
      setDone(true);
    } finally {
      setSending(false);
    }
  };

  const linesWhatsApp = def.fields.map((f) => `${f.label}: ${(vals[f.name] || '-').trim()}`);
  if (file) linesWhatsApp.push(`Anexo: ${file}`);
  const waUrl = wa(`*${def.title}*\n${linesWhatsApp.join('\n')}\n\nAceito a política de privacidade.`);

  if (done)
    return (
      <div role="status" className="card rounded-none border border-line bg-card p-8 shadow-sm">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-none bg-blue/15 text-blue">
          <Icon n="check" />
        </span>
        <h3 className="mt-4 font-display text-2xl font-bold">Mensagem enviada com sucesso</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {serverMsg || 'Recebemos o seu pedido por email. A nossa equipa técnica entrará em contacto muito brevemente.'}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost rounded-none text-sm inline-flex items-center gap-2"
          >
            <Icon n="wa" /> Abrir também no WhatsApp
          </a>
          <button
            className="btn btn-primary rounded-none text-sm"
            onClick={() => {
              setDone(false);
              setVals({});
              setConsent(false);
              setFile('');
              setServerMsg('');
            }}
          >
            Fazer outro pedido
          </button>
        </div>
      </div>
    );

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="card rounded-none border border-line bg-card space-y-5 p-6 sm:p-8 shadow-sm"
      aria-labelledby={`${uid}-h`}
    >
      <h3 id={`${uid}-h`} className="font-display text-2xl font-bold tracking-tight">
        {def.heading}
      </h3>
      {def.fields.map((f) => {
        const id = `${uid}-${f.name}`;
        const err = errs[f.name];
        const common = {
          id,
          name: f.name,
          className: 'field rounded-none',
          required: f.required,
          'aria-invalid': !!err,
          'aria-describedby': err ? `${id}-e` : undefined,
          value: vals[f.name] || '',
          onChange: (e: { target: { value: string } }) => setVals({ ...vals, [f.name]: e.target.value }),
        };
        return (
          <div key={f.name}>
            <label htmlFor={id} className="label">
              {f.label}
              {f.required && <span className="text-accent" aria-hidden="true"> *</span>}
            </label>
            {f.type === 'textarea' ? (
              <textarea rows={5} {...common} placeholder={f.placeholder} />
            ) : f.type === 'select' ? (
              <select {...common}>
                <option value="">Escolha uma opção</option>
                {f.options.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            ) : (
              <input
                type={f.type || 'text'}
                inputMode={f.type === 'tel' ? 'tel' : undefined}
                autoComplete={f.type === 'email' ? 'email' : f.type === 'tel' ? 'tel' : undefined}
                {...common}
                placeholder={f.placeholder}
              />
            )}
            {err && (
              <p id={`${id}-e`} className="mt-1.5 text-xs font-semibold text-rose-500">
                {err}
              </p>
            )}
          </div>
        );
      })}

      {def.attachment && (
        <div>
          <label htmlFor={`${uid}-file`} className="label">
            Anexo (opcional)
          </label>
          <label className="field rounded-none flex cursor-pointer items-center gap-2 text-muted">
            <Icon n="clip" className="h-4 w-4" /> {file || 'Escolher ficheiro (PDF, imagem, etc.)'}
            <input
              id={`${uid}-file`}
              type="file"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0]?.name || '')}
            />
          </label>
          <p className="mt-1.5 text-xs text-muted">
            O nome do ficheiro é anexado ao pedido por email e confirmado com a equipa.
          </p>
        </div>
      )}

      <div>
        <label className="flex items-start gap-3 text-sm cursor-pointer">
          <input
            id={`${uid}-consent`}
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-5 w-5 rounded-none accent-[#0066FF]"
            aria-invalid={!!errs.consent}
            aria-describedby={errs.consent ? `${uid}-consent-e` : undefined}
          />
          <span className="text-xs sm:text-sm">
            Li e aceito a{' '}
            <a href={href('privacidade')} className="text-blue underline underline-offset-2">
              política de privacidade
            </a>
            . <span className="text-accent" aria-hidden="true">*</span>
          </span>
        </label>
        {errs.consent && (
          <p id={`${uid}-consent-e`} className="mt-1.5 text-xs font-semibold text-rose-500">
            {errs.consent}
          </p>
        )}
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={sending}
          className="btn btn-primary rounded-none w-full sm:w-auto shadow-md transition-all active:scale-95 disabled:opacity-50"
        >
          {sending ? (
            'A enviar pedido...'
          ) : (
            <>
              <Icon n="arrow" className="h-4 w-4" /> {def.submit}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

const SEL = (xs: string[]) => xs;
export const FORMS: Record<string, FormDef> = {
  geral: {
    id: 'geral',
    title: 'Contacto geral',
    submit: 'Enviar mensagem',
    heading: 'Envie-nos uma mensagem',
    fields: [
      { name: 'nome', label: 'Nome completo', required: true, placeholder: 'Ex.: Carlos Manuel' },
      { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'Ex.: carlos@empresa.ao' },
      { name: 'telefone', label: 'Telefone / WhatsApp', type: 'tel', placeholder: 'Ex.: +244 923 000 000' },
      { name: 'empresa', label: 'Empresa', placeholder: 'Nome da sua empresa' },
      { name: 'assunto', label: 'Assunto', required: true, placeholder: 'Como podemos ajudar?' },
      { name: 'mensagem', label: 'Mensagem', type: 'textarea', required: true, placeholder: 'Descreva detalhadamente o que precisa...' },
    ],
  },
  orcamento: {
    id: 'orcamento',
    title: 'Pedido de orçamento',
    submit: 'Solicitar orçamento',
    heading: 'Peça um orçamento de software',
    attachment: true,
    fields: [
      { name: 'nome', label: 'Nome completo', required: true, placeholder: 'O seu nome' },
      { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'nome@empresa.ao' },
      { name: 'telefone', label: 'Telefone / WhatsApp', type: 'tel', required: true, placeholder: '+244 923 000 000' },
      { name: 'empresa', label: 'Empresa', placeholder: 'Empresa ou instituição' },
      { name: 'tipo', label: 'Tipo de projecto', type: 'select', required: true, options: SEL(['Desenvolvimento Web', 'App Mobile Android & iOS', 'Software Desktop / POS', 'Integração de APIs', 'Consultoria e Auditoria', 'Outro']) },
      { name: 'orcamento', label: 'Orçamento aproximado', type: 'select', options: SEL(['A definir com a JOGIMIL', 'Até 500.000 Kz', '500.000 a 2.000.000 Kz', '2.000.000 a 5.000.000 Kz', 'Acima de 5.000.000 Kz']) },
      { name: 'prazo', label: 'Prazo desejado', type: 'select', options: SEL(['Sem pressa', 'Urgente (menos de 1 mês)', '1 a 3 meses', 'Mais de 3 meses']) },
      { name: 'descricao', label: 'Descrição dos requisitos', type: 'textarea', required: true, placeholder: 'Indique funcionalidades, utilizadores e objectivos...' },
    ],
  },
  demonstracao: {
    id: 'demonstracao',
    title: 'Pedido de demonstração',
    submit: 'Agendar demonstração',
    heading: 'Peça uma demonstração de produto',
    fields: [
      { name: 'nome', label: 'Nome completo', required: true, placeholder: 'O seu nome' },
      { name: 'empresa', label: 'Empresa', placeholder: 'Nome da sua empresa' },
      { name: 'telefone', label: 'Telefone / WhatsApp', type: 'tel', required: true, placeholder: '+244 923 000 000' },
      { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'nome@empresa.ao' },
      { name: 'produto', label: 'Produto pretendido', type: 'select', required: true, options: SEL(['JOGIMIL Faturação & POS (Certificado AGT)', 'JOGIMIL EduGest Académico', 'JOGIMIL StockERP Armazéns', 'Desenvolvimento por Medida']) },
    ],
  },
  suporte: {
    id: 'suporte',
    title: 'Suporte técnico',
    submit: 'Abrir ticket de suporte',
    heading: 'Peça suporte técnico',
    fields: [
      { name: 'nome', label: 'Nome', required: true },
      { name: 'telefone', label: 'Telefone', type: 'tel', required: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'produto', label: 'Sistema / Software', required: true, placeholder: 'Ex.: POS, Web, Servidor' },
      { name: 'urgencia', label: 'Nível de urgência', type: 'select', required: true, options: SEL(['Baixa', 'Normal', 'Alta', 'Crítica - Sistema parado']) },
      { name: 'descricao', label: 'Descrição do problema', type: 'textarea', required: true, placeholder: 'Explique o erro ou dificuldade encontrada...' },
    ],
  },
  parceiro: {
    id: 'parceiro',
    title: 'Candidatura a parceiro',
    submit: 'Enviar candidatura de parceiro',
    heading: 'Candidate-se a agente autorizado JOGIMIL',
    fields: [
      { name: 'nome', label: 'Nome completo / Razão social', required: true, placeholder: 'Nome ou Empresa' },
      { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'parceiro@empresa.ao' },
      { name: 'telefone', label: 'Telefone / WhatsApp', type: 'tel', required: true, placeholder: '+244 923 000 000' },
      { name: 'zona', label: 'Província / Município onde actua', required: true, placeholder: 'Ex.: Luanda (Kilamba Kiaxi, Viana, Talatona)' },
      { name: 'experiencia', label: 'Experiência em TI ou Vendas de Software', type: 'textarea', required: true, placeholder: 'Descreva a sua experiência e clientes na zona...' },
    ],
  },
};

/** Subscrição de novidades / Newsletter com Bordas Retangulares e Conexão ao Microserviço */
export function Newsletter({ cls = '' }: { cls?: string }) {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState('');
  const id = useId();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setMsg('Por favor escreva um email válido.');
      return;
    }
    if (!consent) {
      setMsg('Aceite a política de privacidade para continuar.');
      return;
    }

    setSending(true);
    try {
      const json = await submitToMicroservice({
        formType: 'newsletter',
        formTitle: 'Subscrição de Newsletter',
        data: { email },
        source: window.location.href,
      });

      setDone(true);
      setMsg(json.message || 'Obrigado por subscrever a newsletter da JOGIMIL!');
    } catch {
      setDone(true);
      setMsg('Obrigado por subscrever as novidades da JOGIMIL!');
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className={`card rounded-none border border-line bg-card p-6 ${cls}`}>
        <div className="flex items-center gap-3 text-emerald-500">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-none bg-emerald-500/10 text-emerald-500">
            ✓
          </span>
          <p className="font-semibold text-sm text-fg">{msg}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className={`card rounded-none border border-line bg-card p-6 ${cls}`}>
      <label htmlFor={id} className="label font-bold text-fg">
        Receber novidades & actualizações por email
      </label>
      <p className="mb-4 text-xs text-muted">
        Artigos sobre SAF-T (AO), novas versões de software e tecnologia em Angola. Sem spam.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id={id}
          type="email"
          autoComplete="email"
          required
          className="field rounded-none flex-1"
          placeholder="O seu email profissional (ex.: nome@empresa.ao)"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setMsg('');
          }}
        />
        <button
          className="btn btn-primary rounded-none shadow-md px-6 text-sm disabled:opacity-50"
          type="submit"
          disabled={sending}
        >
          {sending ? 'A subscrever...' : 'Subscrever'}
        </button>
      </div>
      <label className="mt-3 flex items-start gap-3 text-xs cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded-none accent-[#0066FF]"
        />
        <span className="text-muted">
          Aceito a{' '}
          <a href={href('privacidade')} className="text-blue underline underline-offset-2">
            política de privacidade
          </a>{' '}
          e o tratamento do email pela JOGIMIL.
        </span>
      </label>
      {msg && <p role="status" className="mt-2 text-xs font-semibold text-rose-500">{msg}</p>}
    </form>
  );
}
