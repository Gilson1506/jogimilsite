import { useState, useEffect } from 'react';
import { COMPANY, POSTS, PRODUCTS, TEAM_MEMBERS, TeamMember } from '../data/content';
import { href } from '../lib/hooks';
import { Form, FORMS } from '../components/Forms';
import { Icon, Reveal } from '../components/ui';
import { Body, PageHead } from './shared';
import { NotFound } from './Services';

export function Products() {
  return (<>
    <PageHead
      eyebrow="Produtos Próprios"
      title="Software pronto por subscrição"
      lead="Soluções desenvolvidas e homologadas pela JOGIMIL para empresas angolanas, com suporte técnico contínuo em Luanda e funcionamento offline."
      crumbs={[['Produtos']]}
    />
    <Body>
      {/* Grade de Produtos: Cards Retangulares Horizontais com Imagens */}
      <div className="grid gap-8 lg:grid-cols-2 max-w-5xl mx-auto">
        {PRODUCTS.map((p, i) => (
          <Reveal key={p.slug} delay={i * 80}>
            <div className="group flex flex-col justify-between rounded-2xl bg-card/60 hover:bg-card border border-line/40 hover:border-blue/50 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl shadow-sm p-6">
              <div>
                {/* Logotipo Oficial do Produto: sem fundo escuro de caixa, sem bordas, tamanho responsivo */}
                <div className="w-full flex flex-col items-center justify-center py-6">
                  <div className="relative flex items-center justify-center h-36 sm:h-44 md:h-48 w-full">
                    <div className="absolute h-28 w-28 rounded-full bg-blue/10 blur-2xl pointer-events-none" />
                    <img
                      src={p.image}
                      alt={p.name}
                      loading="lazy"
                      className="max-h-full max-w-[260px] sm:max-w-[320px] w-auto object-contain drop-shadow-lg transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <span className="mt-3 inline-block rounded-md bg-accent/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-accent border border-accent/20">
                    {p.tag}
                  </span>
                </div>

                <span className="mt-5 block font-mono text-xs uppercase tracking-wider text-muted">
                  {p.category}
                </span>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-fg group-hover:text-blue transition-colors">
                  {p.name}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {p.description}
                </p>

                {/* Preço Inicial Simplificado - sem bordas excessivas */}
                <div className="mt-6 py-3 border-y border-line/40 flex items-baseline justify-between">
                  <span className="text-xs text-muted font-medium">A partir de</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-mono font-bold text-accent">
                      {p.starterPriceValue || p.priceStarting}
                    </span>
                    <span className="text-xs text-muted">{p.starterPeriod || '/mês'}</span>
                  </div>
                </div>
              </div>

              {/* Botões de Ação Direta: Solicitar Info e Download PDF */}
              <div className="mt-6 pt-2 flex flex-wrap gap-2.5 items-center">
                <a
                  href={`https://wa.me/${COMPANY.phoneRaw}?text=${encodeURIComponent(`Olá JOGIMIL! Gostaria de solicitar informações sobre o ${p.name}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary text-xs py-2.5 px-4 flex-1 justify-center inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Icon n="wa" className="h-4 w-4" /> Solicitar Info
                </a>

                {p.pdfUrl && (
                  <a
                    href={p.pdfUrl}
                    download
                    className="btn btn-ghost text-xs py-2.5 px-3 border border-line hover:border-accent inline-flex items-center gap-1.5 text-muted hover:text-fg"
                    title="Download da Apresentação em PDF"
                  >
                    <Icon n="download" className="h-4 w-4 text-accent" /> PDF
                  </a>
                )}

                <a
                  href={href('produtos', p.slug)}
                  className="btn btn-ghost text-xs py-2.5 px-3 border border-line hover:border-blue inline-flex items-center gap-1 text-blue"
                >
                  Detalhes <Icon n="arrow" className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Body>
  </>);
}

export function ProductDetail({ id }: { id: string }) {
  const p = PRODUCTS.find((x) => x.slug === id || (id === 'faturacao' && x.slug === 'soba-gest') || (id === 'gestao-escolar' && x.slug === 'soba-school'));
  if (!p) return <NotFound />;

  const scrollToDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('pedir-demonstracao');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (<>
    <PageHead
      eyebrow={p.category}
      title={p.name}
      lead={p.tagline}
      crumbs={[['Produtos', href('produtos')], [p.name]]}
    />
    <Body>
      {/* Banner Principal com Imagem e Ações Imediatas */}
      <div className="mb-14 grid gap-8 lg:grid-cols-12 items-center">
        <div className="lg:col-span-6 flex flex-col items-center justify-center py-6">
          <div className="relative flex items-center justify-center h-52 sm:h-64 md:h-72 w-full">
            <div className="absolute h-44 w-44 rounded-full bg-blue/15 blur-3xl pointer-events-none" />
            <img
              src={p.image}
              alt={p.name}
              className="max-h-full max-w-[300px] sm:max-w-[420px] w-auto object-contain drop-shadow-xl"
            />
          </div>
          <span className="mt-4 rounded-lg bg-accent/10 px-3 py-1.5 font-mono text-xs font-semibold text-accent border border-accent/20">
            {p.tag}
          </span>
        </div>

        <div className="lg:col-span-6 flex flex-col justify-center space-y-4">
          <span className="font-mono text-xs uppercase tracking-widest text-muted">{p.category}</span>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-fg">{p.name}</h1>
          <p className="text-muted leading-relaxed text-sm sm:text-base">{p.description}</p>
          
          {/* Preço Inicial Simplificado - sem bordas excessivas */}
          <div className="py-4 my-2 border-y border-line/40">
            <span className="text-xs uppercase tracking-wider text-muted font-mono">Investimento:</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-sm text-muted">A partir de</span>
              <span className="text-3xl sm:text-4xl font-mono font-bold text-accent">
                {p.starterPriceValue || p.priceStarting}
              </span>
              <span className="text-xs text-muted">{p.starterPeriod || '/mês (Plano Starter)'}</span>
            </div>
            <p className="mt-1.5 text-xs text-muted">
              Sem custos de instalação em Luanda · Suporte técnico contínuo e atualizações incluídos.
            </p>
          </div>

          {/* Botões: Solicitar Info e Download PDF */}
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href={`https://wa.me/${COMPANY.phoneRaw}?text=${encodeURIComponent(`Olá JOGIMIL! Gostaria de solicitar informações sobre o ${p.name}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <Icon n="wa" className="h-4 w-4" /> Solicitar Informações
            </a>

            {p.pdfUrl && (
              <a
                href={p.pdfUrl}
                download
                className="btn btn-ghost inline-flex items-center gap-2 border border-line hover:border-accent"
              >
                <Icon n="download" className="h-4 w-4 text-accent" /> Download da Apresentação (PDF)
              </a>
            )}

            <a href="#pedir-demonstracao" onClick={scrollToDemo} className="btn btn-ghost text-xs text-muted hover:text-fg">
              Pedir Demonstração Online ↓
            </a>
          </div>
        </div>
      </div>

      {/* Descrição Completa e O Que Inclui */}
      <div className="grid gap-12 lg:grid-cols-12 mb-16">
        <div className="lg:col-span-7 space-y-6">
          <h2 className="text-2xl font-bold font-display text-fg">Descrição Completa da Solução</h2>
          <div className="space-y-4 text-muted leading-relaxed text-base">
            {p.fullDescription.map((par, i) => (
              <p key={i}>{par}</p>
            ))}
          </div>

          <h3 className="text-xl font-bold font-display text-fg pt-4">O que inclui em todas as licenças</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {p.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 p-3 rounded-xl bg-card/40 text-sm">
                <Icon n="check" className="mt-0.5 h-4 w-4 shrink-0 text-blue font-bold" />
                <span className="text-fg">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bloco de Aquisição Simplificado e Limpo */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-5 rounded-2xl bg-card/40 p-6 sm:p-8 border border-line/40">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-accent">Plano Inicial</span>
            <h3 className="text-xl font-display font-bold text-fg mt-1">Ativação Imediata & Suporte Local</h3>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-xs text-muted">A partir de</span>
              <span className="text-3xl font-mono font-extrabold text-accent">
                {p.starterPriceValue || p.priceStarting}
              </span>
              <span className="text-xs text-muted">{p.starterPeriod || '/mês'}</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Conformidade garantida com a legislação angolana, emissão ágil e apoio presencial ou remoto da equipa técnica em Luanda.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <a
              href={`https://wa.me/${COMPANY.phoneRaw}?text=${encodeURIComponent(`Olá JOGIMIL! Gostaria de solicitar informações sobre o ${p.name}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary w-full justify-center inline-flex items-center gap-2 py-3"
            >
              <Icon n="wa" className="h-4 w-4" /> Solicitar Info no WhatsApp
            </a>

            {p.pdfUrl && (
              <a
                href={p.pdfUrl}
                download
                className="btn btn-ghost w-full justify-center inline-flex items-center gap-2 border border-line hover:border-accent py-3 text-sm font-semibold"
              >
                <Icon n="download" className="h-4 w-4 text-accent" /> Download do PDF de Apresentação
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Seção do Formulário de Demonstração (Envia por Email para o Microserviço) */}
      <div id="pedir-demonstracao" className="mt-16 pt-12 border-t border-line/40">
        <div className="mx-auto max-w-3xl text-center mb-8">
          <span className="eyebrow text-accent">Demonstração sem Compromisso</span>
          <h2 className="text-3xl font-display font-bold text-fg mt-2">
            Agende uma Demonstração do {p.name}
          </h2>
          <p className="lead mt-3 text-base">
            Preencha os seus dados. A equipa comercial da JOGIMIL entrará em contacto por email e telefone para agendar a apresentação online ou nas suas instalações em Luanda.
          </p>
        </div>

        <div className="mx-auto max-w-2xl bg-card/60 p-6 sm:p-8 rounded-3xl shadow-xl border border-line/40">
          <Form def={FORMS.demonstracao} />
        </div>
      </div>
    </Body>
  </>);
}

function TeamCard({ member }: { member: TeamMember }) {
  const [imgErr, setImgErr] = useState(false);
  const showImg = member.photo && !imgErr;

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-card/70 border border-line/40 hover:border-blue/50 transition-all duration-300 hover:shadow-2xl flex flex-col justify-between">
      {/* Container de imagem simplificado sem borda dura, adaptado para PNG com fundo transparente */}
      <div className="relative w-full pt-8 px-6 flex items-end justify-center bg-gradient-to-t from-blue/10 via-transparent to-transparent min-h-[320px]">
        {showImg ? (
          <img
            src={member.photo}
            alt={`Fotografia de ${member.name}`}
            loading="lazy"
            onError={() => setImgErr(true)}
            className="max-h-[300px] w-auto object-contain object-bottom transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-44 w-44 items-center justify-center rounded-2xl bg-black/60 border border-line shadow-lg">
            <span className="font-display text-3xl font-bold tracking-wider text-white">
              {member.initials}
            </span>
          </div>
        )}
        <span className="absolute top-4 left-4 rounded-md bg-black/80 backdrop-blur-sm px-2.5 py-1 text-[11px] font-semibold text-accent border border-white/10">
          {member.department}
        </span>
      </div>

      <div className="p-6">
        <h3 className="font-display text-xl font-bold text-fg group-hover:text-blue transition-colors">
          {member.name}
        </h3>
        <p className="mt-1 text-sm font-semibold text-accent">{member.role}</p>
        <p className="mt-3 text-xs leading-relaxed text-muted">{member.bio}</p>
      </div>

      <div className="border-t border-line/40 bg-bg/40 p-4 flex flex-wrap items-center justify-between gap-2 text-xs">
        {member.email && (
          <a
            href={`mailto:${member.email}`}
            className="inline-flex items-center gap-1.5 text-muted hover:text-accent transition-colors truncate max-w-[220px]"
            title={member.email}
          >
            <span>✉</span> {member.email}
          </a>
        )}
        <a
          href={`https://wa.me/${COMPANY.phoneRaw}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-accent font-semibold hover:underline ml-auto"
        >
          WhatsApp ↗
        </a>
      </div>
    </div>
  );
}

export function About() {
  const vals = [
    ['Clareza', 'Dizemos o que vamos fazer, quando e porquê. Sem custos ocultos nem termos dúbios.'],
    ['Utilidade', 'Software e arquiteturas concebidos para resolver problemas de negócio reais.'],
    ['Proximidade', 'Estamos em Luanda e respondemos prontamente em qualquer situação operacional.']
  ];

  return (
    <>
      <PageHead
        eyebrow="Sobre nós"
        title="Uma empresa angolana de tecnologia"
        lead={COMPANY.about}
        crumbs={[['Sobre nós']]}
      />
      <Body>
        {/* História e Valores */}
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="h2">A nossa história</h2>
            <p className="mt-4 leading-relaxed text-muted">
              Fundada em Luanda, a <strong className="text-fg">JOGIMIL - Tecnologias, Lda.</strong> nasceu com a missão de elevar a maturidade digital em Angola através de software fiável, moderno e integralmente alinhado à regulamentação tributária da AGT.
            </p>
            <p className="mt-3 leading-relaxed text-muted">
              Desenvolvemos produtos próprios (como o JOGIMIL Faturação &amp; POS, o EduGest Académico e o StockERP Armazéns) e criamos soluções corporativas por medida. A nossa actuação alia engenharia de software de ponta a uma assistência presencial constante aos operadores, retalhistas e instituições de ensino em todo o país.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="card rounded-none border border-line p-5">
                <p className="font-display text-2xl font-bold text-accent">100%</p>
                <p className="mt-1 text-xs text-muted">Engenharia Angolana</p>
              </div>
              <div className="card rounded-none border border-line p-5">
                <p className="font-display text-2xl font-bold text-accent">Luanda</p>
                <p className="mt-1 text-xs text-muted">Sede na Nova Vida, Kilamba Kiaxi</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="h2">Os nossos valores</h2>
            <ul className="mt-4 space-y-3">
              {vals.map(([t, d]) => (
                <li key={t} className="card rounded-none border border-line p-5 transition hover:border-blue">
                  <p className="font-display font-semibold text-fg">{t}</p>
                  <p className="mt-1 text-sm text-muted">{d}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Secção da Equipa - Apresentação Limpa e Focada */}
        <div className="mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="eyebrow text-accent">Liderança &amp; Gestão</p>
              <h2 className="h2 mt-1">A nossa equipa</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted">
                Gestão estratégica de projectos de tecnologia, implementação de software empresarial e acompanhamento de excelência em Angola.
              </p>
            </div>
          </div>

          <div className="max-w-md mx-auto">
            {TEAM_MEMBERS.map((member) => (
              <TeamCard key={member.id} member={member} />
            ))}
          </div>
        </div>

        {/* Localização com Mapa do Google Interativo */}
        <div className="mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="eyebrow text-accent">Presença Física em Luanda</p>
              <h2 className="h2 mt-1">Localização da sede</h2>
              <p className="mt-2 text-sm text-muted">
                Visite as nossas instalações ou agende uma reunião técnica com a nossa equipa.
              </p>
            </div>
            <a
              href={COMPANY.maps}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary rounded-none shadow-md inline-flex items-center gap-2 text-sm"
            >
              <Icon n="map" className="h-4 w-4" /> Traçar rota no Google Maps ↗
            </a>
          </div>

          <div className="card rounded-none border border-line bg-card overflow-hidden shadow-sm">
            {/* Barra de Informações da Morada */}
            <div className="grid gap-5 border-b border-line bg-card p-6 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase font-semibold text-muted">Morada Oficial</p>
                <p className="mt-1 font-semibold text-fg flex items-start gap-2">
                  <Icon n="map" className="mt-0.5 h-4 w-4 shrink-0 text-blue" />
                  {COMPANY.address}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase font-semibold text-muted">Horário de Atendimento</p>
                <p className="mt-1 font-semibold text-fg flex items-center gap-2">
                  <span>⏱</span> {COMPANY.hours}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase font-semibold text-muted">Contacto Telefónico</p>
                <p className="mt-1 font-semibold text-fg flex items-center gap-2">
                  <span>📞</span> <a href={`tel:+${COMPANY.phoneRaw}`} className="hover:text-blue">{COMPANY.phone}</a>
                </p>
              </div>
            </div>

            {/* Iframe Interativo do Google Maps */}
            <div className="relative w-full overflow-hidden bg-slate-900 h-80 sm:h-[420px]">
              <iframe
                title="Mapa de Localização da JOGIMIL - Tecnologias, Lda. em Luanda"
                src="https://maps.google.com/maps?q=Nova+Vida,+Kilamba+Kiaxi,+Luanda+(JOGIMIL+Tecnologias)&t=&z=15&ie=UTF8&iwloc=B&output=embed"
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>

            {/* Rodapé informativo do mapa */}
            <div className="border-t border-line bg-bg/60 p-4 text-xs text-muted flex flex-wrap items-center justify-between gap-3">
              <p>
                Urbanização Nova Vida, Município do Kilamba Kiaxi, Província de Luanda. Estacionamento para clientes disponível.
              </p>
              <a
                href={COMPANY.maps}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue underline underline-offset-2"
              >
                Abrir aplicação externa do Google Maps ↗
              </a>
            </div>
          </div>
        </div>
      </Body>
    </>
  );
}

export function Partners() {
  return (<>
    <PageHead eyebrow="Parceiros" title="Programa de agentes autorizados" lead="Para quem quer apresentar as soluções da JOGIMIL na sua zona. Condições a combinar após a candidatura." crumbs={[['Parceiros']]} />
    <Body><div className="mx-auto max-w-2xl"><Form def={FORMS.parceiro} /></div></Body>
  </>);
}

const fmt = (d: string) => new Date(d).toLocaleDateString('pt-AO', { day: 'numeric', month: 'long', year: 'numeric' });

export function Posts() {
  const [allPosts, setAllPosts] = useState(POSTS);

  useEffect(() => {
    fetch('/api/v1/news')
      .then((r) => r.json())
      .then((data) => {
        if (data.news && Array.isArray(data.news)) {
          // Mesclar notícias estáticas com as dinâmicas criadas no painel admin
          const dynamicSlugs = new Set(data.news.map((n: any) => n.slug));
          const uniqueStatic = POSTS.filter((p) => !dynamicSlugs.has(p.slug));
          setAllPosts([...data.news, ...uniqueStatic]);
        }
      })
      .catch(() => {
        /* fallback para POSTS */
      });
  }, []);

  return (<>
    <PageHead eyebrow="Notícias" title="Faturação, SAF-T (AO) e tecnologia" lead="Artigos curtos e práticos sobre software e fiscalidade." crumbs={[['Notícias']]} />
    <Body>
      <div className="grid gap-5 md:grid-cols-2">
        {allPosts.map((p) => (
          <a key={p.slug} href={href('noticias', p.slug)} className="card card-hover block p-7">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">{p.tag} · <time dateTime={p.date}>{fmt(p.date)}</time></p>
            <h2 className="mt-3 text-xl font-semibold">{p.title}</h2>
            <p className="mt-2 text-muted">{p.excerpt}</p>
          </a>
        ))}
      </div>
    </Body>
  </>);
}

export function PostDetail({ id }: { id: string }) {
  const [post, setPost] = useState(() => POSTS.find((x) => x.slug === id));

  useEffect(() => {
    if (!post) {
      fetch('/api/v1/news')
        .then((r) => r.json())
        .then((data) => {
          if (data.news) {
            const found = data.news.find((n: any) => n.slug === id);
            if (found) setPost(found);
          }
        })
        .catch(() => {});
    }
  }, [id, post]);

  if (!post) return <NotFound />;
  return (<>
    <PageHead eyebrow={post.tag} title={post.title} lead={<time dateTime={post.date}>{fmt(post.date)}</time>} crumbs={[['Notícias', href('noticias')], [post.title]]} />
    <Body><article className="mx-auto max-w-2xl space-y-5 text-lg leading-relaxed">{post.body.map((t, i) => <p key={i}>{t}</p>)}</article></Body>
  </>);
}

const TABS: [keyof typeof FORMS, string][] = [['orcamento', 'Orçamento'], ['geral', 'Contacto geral'], ['demonstracao', 'Demonstração'], ['suporte', 'Suporte']];

export function Contact({ id }: { id?: string }) {
  const cur = (id && id in FORMS ? id : 'orcamento') as keyof typeof FORMS;
  const copy = () => navigator.clipboard?.writeText(COMPANY.phone);
  return (<>
    <PageHead eyebrow="Contacto" title="Fale connosco" lead="Escolha como prefere: telefone, WhatsApp ou formulário." crumbs={[['Contacto']]} />
    <Body>
      <div className="grid gap-10 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <div className="card rounded-none border border-line p-6">
            <p className="text-sm text-muted">Telefone</p>
            <div className="mt-1 flex items-center gap-3">
              <a href={`tel:+${COMPANY.phoneRaw}`} className="font-display text-2xl font-semibold">{COMPANY.phone}</a>
              <button onClick={copy} className="inline-flex h-11 w-11 items-center justify-center rounded-none border border-line hover:border-blue" aria-label="Copiar telefone"><Icon n="copy" className="h-4 w-4" /></button>
            </div>
          </div>
          <a href={`https://wa.me/${COMPANY.phoneRaw}`} target="_blank" rel="noopener noreferrer" className="card rounded-none card-hover flex items-center gap-3 p-6 font-semibold"><Icon n="wa" className="text-blue" /> WhatsApp <Icon n="arrow" className="ml-auto h-4 w-4" /></a>
          <a href={`mailto:${COMPANY.email}`} className="card rounded-none card-hover block p-6"><p className="text-sm text-muted">Email</p><p className="font-semibold">{COMPANY.email}</p></a>
          <div className="card rounded-none border border-line p-6">
            <p className="text-sm text-muted">Morada</p><p className="font-semibold">{COMPANY.address}</p>
            <a href={COMPANY.maps} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-[44px] items-center text-blue underline">Abrir no Google Maps ↗</a>
          </div>
          <div className="card rounded-none border border-line p-6"><p className="text-sm text-muted">Horário</p><p className="font-semibold">{COMPANY.hours}</p></div>
        </div>
        <div className="lg:col-span-3">
          <div role="tablist" aria-label="Tipo de pedido" className="mb-5 flex flex-wrap gap-2">
            {TABS.map(([k, l]) => (
              <a key={k} role="tab" aria-selected={cur === k} href={href('contacto', k)} className={`inline-flex min-h-[44px] items-center rounded-none border px-5 text-sm font-semibold transition ${cur === k ? 'border-blue bg-blue text-white shadow-md' : 'border-line hover:border-blue'}`}>{l}</a>
            ))}
          </div>
          <div role="tabpanel"><Form key={cur} def={FORMS[cur]} /></div>
        </div>
      </div>
    </Body>
  </>);
}

export function Privacy() {
  const S = ({ t, num, children }: { t: string; num: string; children: React.ReactNode }) => (
    <section className="mt-12 scroll-mt-24 border-t border-line/60 pt-8 first:border-0 first:pt-0">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue/10 font-mono text-xs font-bold text-blue">
          {num}
        </span>
        <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">{t}</h2>
      </div>
      <div className="mt-4 space-y-4 text-[0.95rem] leading-relaxed text-muted">{children}</div>
    </section>
  );

  return (
    <>
      <PageHead
        eyebrow="Conformidade & Segurança"
        title="Política de Privacidade e Protecção de Dados"
        lead="Compromisso rigoroso com a segurança da informação, privacidade em Inteligência Artificial, acordos prévios de confidencialidade (NDA) e cumprimento integral da Lei n.º 22/11 de Angola."
        crumbs={[['Política de Privacidade']]}
      />
      <Body>
        <div className="mx-auto max-w-4xl">
          {/* DESTAQUE INSTITUCIONAL: ACORDO DE CONFIDENCIALIDADE (NDA) PRÉVIO OBRIGATÓRIO */}
          <div className="relative overflow-hidden rounded-none border-2 border-blue-600 bg-gradient-to-br from-blue/10 via-card to-card p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line/60 pb-5">
              <div className="flex items-center gap-3.5">
                {/* Ícone livre, sem caixa ou borda fechada */}
                <Icon n="shield" className="h-9 w-9 text-blue shrink-0" />
                <div>
                  <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-blue">
                    Compromisso Corporativo Obrigatório
                  </span>
                  <h3 className="font-display text-xl font-bold text-fg sm:text-2xl">
                    Acordo de Confidencialidade (NDA) Pré-Negócio
                  </h3>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-none bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <span className="h-2 w-2 rounded-none bg-emerald-500" />
                Política Inegociável
              </span>
            </div>

            <div className="mt-5 space-y-3.5 text-sm sm:text-base leading-relaxed text-fg">
              <p>
                <strong>A JOGIMIL - Tecnologias, Lda. estabelece como protocolo obrigatório</strong> a assinatura formal e prévia de um <strong>Acordo de Confidencialidade e Não Divulgação (Non-Disclosure Agreement — NDA)</strong> juridicamente vinculativo com todos os clientes, empresas parceiras e prestadores de serviços, <strong>antes de qualquer receção, acesso, troca ou análise de dados sensíveis, processos operacionais internos, segredos comerciais, bases de dados ou código-fonte</strong>.
              </p>
              <div className="grid gap-3 pt-2 sm:grid-cols-3 text-xs sm:text-sm">
                <div className="rounded-none bg-bg p-3.5 border border-line/70 border-l-2 border-l-blue-600">
                  <p className="font-bold text-blue">1. Assinatura Prévia</p>
                  <p className="mt-1 text-muted">Nenhum dado é trocado sem o instrumento contratual assinado por ambas as partes.</p>
                </div>
                <div className="rounded-none bg-bg p-3.5 border border-line/70 border-l-2 border-l-blue-600">
                  <p className="font-bold text-blue">2. Segredo Comercial Total</p>
                  <p className="mt-1 text-muted">Protecção irrestrita de estratégias de mercado, finanças, dados fiscais e clientes.</p>
                </div>
                <div className="rounded-none bg-bg p-3.5 border border-line/70 border-l-2 border-l-blue-600">
                  <p className="font-bold text-blue">3. Validade Pós-Contrato</p>
                  <p className="mt-1 text-muted">A obrigação de sigilo mantém-se ativa mesmo após a conclusão ou entrega do projecto.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Secção 1: Enquadramento Legal e Responsável pelo Tratamento */}
          <S num="01" t="Responsável pelo Tratamento e Enquadramento Legal">
            <p>
              O responsável pelo tratamento dos dados recolhidos através deste portal é a <strong>{COMPANY.name}</strong>, sociedade comercial com sede em {COMPANY.address}, Luanda, República de Angola.
            </p>
            <p>
              A nossa atuação rege-se integralmente pela <strong>Lei n.º 22/11, de 17 de Junho (Lei da Protecção de Dados Pessoais da República de Angola)</strong>, bem como pelos mais rigorosos referenciais internacionais de cibersegurança e governança de dados (ISO/IEC 27001, NIST e RGPD da União Europeia para interações com sistemas internacionais).
            </p>
            <p>
              Canal oficial de privacidade e proteção de dados: <a href={`mailto:${COMPANY.email}`} className="text-blue font-semibold hover:underline">{COMPANY.email}</a>.
            </p>
          </S>

          {/* Secção 2: Privacidade em Inteligência Artificial & Modelo AI-First */}
          <S num="02" t="Privacidade em Soluções de Inteligência Artificial & Agentes (AI-First)">
            <p>
              No âmbito do nosso modelo tecnológico <strong>AI-First</strong> (desenvolvimento de soluções e ferramentas com suporte nativo a inteligência artificial e agentes autónomos), a JOGIMIL adota uma <strong>Política Estrita de Treino Zero (Zero-Training Policy)</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Nenhum Dado de Cliente é Usado para Treino:</strong> Os dados corporativos, documentos, consultas, bases de dados ou prompts processados pelos nossos agentes de IA <strong>nunca</strong> são armazenados para reaproveitamento público ou utilizados para treinar modelos fundacionais de terceiros (Anthropic, OpenAI, Google ou outros).
              </li>
              <li>
                <strong>Isolamento Lógico em Ambientes Fechados:</strong> As instâncias de inferência de IA operam através de canais criptografados com chaves privadas empresariais dedicadas exclusivamente à sua organização.
              </li>
              <li>
                <strong>Anonimização e Higienização de Dados:</strong> Sempre que os fluxos de trabalho envolvam triagem com agentes inteligentes, dados de identificação pessoal são filtrados e anonimizados antes do envio a motores de processamento de linguagem.
              </li>
            </ul>
          </S>

          {/* Secção 3: Operações de NOC & Monitorização de Infraestruturas 24/7 */}
          <S num="03" t="Segurança e Dados em Operações de NOC 24/7">
            <p>
              Nas operações do nosso <strong>Centro de Operações de Rede (NOC 24/7)</strong>, a monitorização incide exclusivamente sobre <strong>telemetria operacional</strong> (consumo de CPU, memória RAM, latência de rede, disponibilidade de portas e integridade de conexões de telecomunicações).
            </p>
            <p>
              A equipa técnica do NOC <strong>não inspeciona, não armazena e não tem acesso ao conteúdo dos ficheiros, bancos de dados ou comunicações internas</strong> das empresas monitorizadas. Quaisquer alertas e intervenções são auditados com registo inalterável de logs de acesso (*audit trails*).
            </p>
          </S>

          {/* Secção 4: Dados que Recolhemos e Finalidades */}
          <S num="04" t="Categorias de Dados Recolhidos e Finalidades">
            <p>Recolhemos apenas as informações estritamente necessárias e proporcionais para cada finalidade técnica ou comercial:</p>
            <div className="grid gap-3 sm:grid-cols-2 pt-2">
              <div className="rounded-none border border-line/70 bg-card p-4">
                <p className="font-semibold text-fg">Dados de Contacto e Identificação</p>
                <p className="mt-1 text-xs text-muted">Nome, endereço de correio eletrónico, número de telefone e empresa indicada nos formulários de contacto, pedidos de orçamento ou Live Chat.</p>
              </div>
              <div className="rounded-none border border-line/70 bg-card p-4">
                <p className="font-semibold text-fg">Dados de Diagnóstico Técnico</p>
                <p className="mt-1 text-xs text-muted">Descrição dos requisitos de software, especificações de arquitetura e documentos de escopo voluntariamente submetidos para orçamentação.</p>
              </div>
              <div className="rounded-none border border-line/70 bg-card p-4">
                <p className="font-semibold text-fg">Dados de Navegação e Telemetria</p>
                <p className="mt-1 text-xs text-muted">Endereço IP pseudonimizado, tipo de navegador, páginas visualizadas e duração da sessão para auditoria de segurança e prevenção de ataques DDoS.</p>
              </div>
              <div className="rounded-none border border-line/70 bg-card p-4">
                <p className="font-semibold text-fg">Preferências de Interface</p>
                <p className="mt-1 text-xs text-muted">Preferência de tema visual (modo claro ou modo escuro) e preferências de navegação armazenadas localmente no seu dispositivo.</p>
              </div>
            </div>
          </S>

          {/* Secção 5: Medidas de Segurança da Informação */}
          <S num="05" t="Medidas Técnicas e Organizativas de Segurança">
            <p>
              A JOGIMIL implementa salvaguardas tecnológicas avançadas para prevenir o acesso não autorizado, a destruição, a perda ou a alteração de dados:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Criptografia de dados em trânsito com protocolos modernos <strong>TLS 1.3</strong> e em repouso com algoritmo <strong>AES de 256 bits</strong>;</li>
              <li>Acesso restrito baseado no princípio do menor privilégio (*Role-Based Access Control — RBAC*) e autenticação multifatorial (MFA);</li>
              <li>Cópias de segurança (*backups*) automáticas com réplicas geograficamente distribuídas e testes periódicos de restauração;</li>
              <li>Monitorização contínua de vulnerabilidades e testes de intrusão em todas as aplicações antes da entrada em produção.</li>
            </ul>
          </S>

          {/* Secção 6: Conservação e Partilha com Terceiros */}
          <S num="06" t="Conservação de Dados e Partilha Responsável">
            <p>
              <strong>A JOGIMIL nunca vende, aluga ou cede dados pessoais ou empresariais a terceiros para fins de marketing ou publicidade.</strong>
            </p>
            <p>
              Os dados são conservados exclusivamente durante o período necessário para cumprir as finalidades para as quais foram recolhidos (por exemplo, vigência de contrato de prestação de serviços ou cumprimento de obrigações fiscais junto da AGT) ou até que o titular solicite a sua eliminação, observados os prazos legais de prescrição.
            </p>
          </S>

          {/* Secção 7: Direitos do Titular dos Dados */}
          <S num="07" t="Os Seus Direitos (Lei n.º 22/11 de Angola)">
            <p>
              Em conformidade com a legislação angolana de proteção de dados, tem o direito pleno e irrevogável de exercer, a qualquer momento:
            </p>
            <div className="grid gap-2 sm:grid-cols-2 pt-1 text-sm">
              <div className="flex items-start gap-2 rounded-none bg-bg p-3 border border-line/70">
                <span className="text-blue font-bold">✓</span>
                <div>
                  <strong className="text-fg">Direito de Acesso:</strong> Confirmar se tratamos os seus dados e obter cópia dos mesmos.
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-none bg-bg p-3 border border-line/70">
                <span className="text-blue font-bold">✓</span>
                <div>
                  <strong className="text-fg">Direito de Rectificação:</strong> Corrigir dados inexatos, incompletos ou desatualizados.
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-none bg-bg p-3 border border-line/70">
                <span className="text-blue font-bold">✓</span>
                <div>
                  <strong className="text-fg">Direito de Eliminação:</strong> Exigir a eliminação permanente dos seus dados (salvo obrigações legais).
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-none bg-bg p-3 border border-line/70">
                <span className="text-blue font-bold">✓</span>
                <div>
                  <strong className="text-fg">Direito de Oposição:</strong> Opor-se ao tratamento de dados para finalidades não essenciais.
                </div>
              </div>
            </div>
            <p className="pt-2">
              Para exercer qualquer um destes direitos, basta enviar uma comunicação escrita identificando-se para o correio eletrónico <a href={`mailto:${COMPANY.email}`} className="text-blue font-semibold hover:underline">{COMPANY.email}</a> ou contactar-nos por correio postal para {COMPANY.address}, Luanda.
            </p>
          </S>

          {/* Secção 8: Política de Cookies */}
          <S num="08" t="Gestão de Cookies e Armazenamento Local">
            <p>
              O nosso portal utiliza cookies e armazenamento local (*localStorage*) exclusivamente para:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Cookies Estritamente Necessários:</strong> Manter a integridade da sessão, segurança contra requisições fraudulentas (CSRF) e prevenção de ataques;</li>
              <li><strong>Cookies de Preferências:</strong> Recordar a sua escolha entre tema Claro ou Escuro e a confirmação do banner de cookies;</li>
              <li><strong>Cookies Analíticos:</strong> Quando aceites, recolhem dados estatísticos agregados e anónimos sobre o desempenho e velocidade do site.</li>
            </ul>
            <p className="pt-1">
              Pode a qualquer momento gerir ou revogar as suas preferências de cookies através das configurações do seu navegador ou limpando os dados de navegação deste website.
            </p>
          </S>
        </div>
      </Body>
    </>
  );
}
