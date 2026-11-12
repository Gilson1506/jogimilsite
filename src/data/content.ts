export const COMPANY = {
  name: 'JOGIMIL - Tecnologias, Lda.',
  short: 'JOGIMIL',
  tagline: 'Empresa angolana de tecnologia no modelo AI-First: agentes inteligentes, software à medida, automação e operações de NOC 24/7. Luanda.',
  about:
    'A JOGIMIL - Tecnologias, Lda. é uma empresa angolana de tecnologia pioneira na transição AI-First. Desenvolvemos software onde todas as ferramentas contam com suporte nativo de inteligência artificial, agentes autónomos, implementação de IA empresarial, automação de processos de ponta a ponta e operações de NOC (Network Operations Center) 24/7.',
  phone: '+244 942 775 559',
  phoneRaw: '244942775559',
  email: 'geral@jogimiltecnologias.it.ao',
  address: 'Nova Vida, Kilamba Kiaxi, Luanda, Angola',
  hours: 'Segunda a sexta, 08h00 às 17h00 (CONFIRMAR)',
  maps: 'https://www.google.com/maps/search/?api=1&query=Nova+Vida+Kilamba+Kiaxi+Luanda',
};

export const wa = (msg: string) => `https://wa.me/${COMPANY.phoneRaw}?text=${encodeURIComponent(msg)}`;

export interface Service {
  slug: string;
  title: string;
  short: string;
  icon: string;
  main: boolean; // serviços em destaque na página inicial
  problem: string;
  solution: string;
  process: string[];
  deliverables: string[];
  faq: { q: string; a: string }[];
}

const stdProcess = (a: string) => ['Conversa inicial e levantamento', a, 'Entrega e formação', 'Acompanhamento'];

export const SERVICES: Service[] = [
  {
    slug: 'ia',
    title: 'Inteligência Artificial & Agentes (AI-First)',
    icon: 'ia',
    main: true,
    short: 'Modelo AI-First: agentes autónomos, implantação de IA empresarial e suporte nativo de IA em todas as ferramentas.',
    problem: 'Processos manuais lentos, sobrecarga operacional e dificuldade em integrar modelos modernos de Inteligência Artificial com segurança no negócio.',
    solution: 'Operamos sob o paradigma AI-First (inspirado nos mais altos padrões globais como Anthropic / Claude): integramos agentes autónomos, dotamos todas as ferramentas de suporte inteligente e automatizamos fluxos complexos com LLMs.',
    process: ['Diagnóstico de casos de uso e dados', 'Arquitectura de agentes e modelos de IA', 'Integração de APIs e automação segura', 'Homologação, formação e monitorização contínua'],
    deliverables: ['Agentes de IA autónomos configurados', 'Integração de modelos de linguagem (LLMs) em sistemas internos', 'Painel de auditoria e métricas de precisão', 'Formação técnica para a equipa'],
    faq: [
      { q: 'Todas as ferramentas desenvolvidas pela JOGIMIL têm suporte de IA?', a: 'Sim. Todas as nossas soluções e novos produtos seguem a filosofia AI-First, trazendo agentes e inteligência nativa para multiplicar a produtividade.' },
      { q: 'Como ajudam a minha empresa a implantar IA?', a: 'Analisamos os seus fluxos operacionais, selecionamos os modelos adequados, construímos agentes para as tarefas repetitivas e conectamos a IA aos seus bancos de dados e canais (como WhatsApp e ERPs).' },
      { q: 'Os dados da minha empresa ficam seguros e confidenciais?', a: 'Absolutamente. Trabalhamos com ambientes empresariais isolados com chaves privadas, garantindo que os seus dados nunca são expostos nem utilizados para treino público de terceiros.' },
    ],
  },
  {
    slug: 'noc',
    title: 'NOC & Monitorização 24/7',
    icon: 'noc',
    main: true,
    short: 'Centro de Operações de Rede (NOC), vigilância contínua 24/7 de infraestruturas críticas e resposta a incidentes.',
    problem: 'Quebras de rede, indisponibilidade de servidores ou lentidão em sistemas vitais que só são detetados quando o cliente reclama.',
    solution: 'Operamos um NOC 24/7 dedicado que monitoriza ativamente servidores, conectividade, bancos de dados e serviços em nuvem ou locais, antecipando falhas e atuando em tempo real.',
    process: ['Levantamento da topologia e ativos críticos', 'Instalação de sondas de telemetria e limites de alerta', 'Vigilância contínua 24 horas por dia, 7 dias por semana', 'Relatórios periódicos de SLA e capacidade'],
    deliverables: ['Dashboards de telemetria em tempo real', 'Protocolo de escalonamento e equipa de resposta rápida', 'Monitorização proativa de servidores, links e bancos de dados', 'Relatórios de disponibilidade e saúde da infraestrutura'],
    faq: [
      { q: 'O que monitoriza o NOC da JOGIMIL?', a: 'Monitorizamos servidores Linux/Windows, instâncias cloud, links dedicados de internet, bases de dados, certificados SSL, latência e o consumo de recursos.' },
      { q: 'Funciona para servidores locais em Angola e na cloud?', a: 'Sim. Cobrimos infraestruturas híbridas: equipamentos locais (on-premise em Angola) e ambientes internacionais de cloud (AWS, Azure, DigitalOcean).' },
    ],
  },
  {
    slug: 'automacao',
    title: 'Automação inteligente de processos',
    icon: 'bolt',
    main: true,
    short: 'Eliminação de tarefas manuais e repetitivas através de fluxos automatizados com IA e software.',
    problem: 'Colaboradores gastam horas diárias copiando dados, gerando ficheiros manuais ou respondendo a pedidos rotineiros.',
    solution: 'Desenhamos pipelines de automação inteligentes que ligam sistemas e executam fluxos operacionais completos sem intervenção humana.',
    process: stdProcess('Mapeamento e engenharia de fluxos automatizados'),
    deliverables: ['Processos e fluxos automatizados em produção', 'Painel de acompanhamento e logs de execução', 'Formação e manual operacional'],
    faq: [{ q: 'Que tipo de tarefas podem ser automatizadas?', a: 'Emissão de documentos, conferência de extratos, sincronização entre sistemas, notificações multicanal e triagem automatizada com IA.' }],
  },
  {
    slug: 'consultoria', title: 'Consultoria em software e TI', icon: 'compass', main: true,
    short: 'Análise das necessidades do negócio, definição da solução e acompanhamento técnico.',
    problem: 'Muitas empresas compram ou encomendam software sem perceber primeiro o que realmente precisam.',
    solution: 'Analisamos o seu negócio, definimos a solução mais adequada e acompanhamos a execução.',
    process: stdProcess('Análise e definição da solução'),
    deliverables: ['Documento com a análise das necessidades', 'Proposta de solução e prioridades', 'Acompanhamento técnico durante a execução'],
    faq: [{ q: 'A consultoria tem custo?', a: 'Depende do âmbito. Fale connosco para um orçamento.' }],
  },
  {
    slug: 'web', title: 'Desenvolvimento web', icon: 'globe', main: true,
    short: 'Sites, portais, plataformas e sistemas online.',
    problem: 'Precisa de presença ou de um sistema online que funcione bem, mesmo com ligação lenta.',
    solution: 'Desenhamos e desenvolvemos sites, portais e plataformas leves, pensados para a realidade de Angola.',
    process: stdProcess('Desenho e desenvolvimento'),
    deliverables: ['Site ou plataforma publicada', 'Painel para gerir o conteúdo, quando aplicável', 'Formação para a sua equipa'],
    faq: [{ q: 'Fazem sites que carregam depressa em 3G/4G?', a: 'Sim, optimizamos imagens e código para ligações lentas.' }],
  },
  {
    slug: 'mobile', title: 'Desenvolvimento mobile', icon: 'phone', main: true,
    short: 'Aplicações para Android e iOS.',
    problem: 'Os seus clientes ou colaboradores precisam de aceder ao serviço no telemóvel.',
    solution: 'Desenvolvemos aplicações para Android e iOS, com atenção ao consumo de dados.',
    process: stdProcess('Desenho e desenvolvimento'),
    deliverables: ['Aplicação para Android e/ou iOS', 'Apoio na publicação nas lojas', 'Manutenção, se contratada'],
    faq: [{ q: 'Android e iOS ao mesmo tempo?', a: 'Sim, é possível. Definimos na fase de consultoria.' }],
  },
  {
    slug: 'desktop', title: 'Desenvolvimento desktop', icon: 'monitor', main: true,
    short: 'Programas para computador, para uso no escritório ou no ponto de venda.',
    problem: 'Alguns negócios precisam de programas rápidos que não dependam da internet a toda a hora.',
    solution: 'Criamos programas para computador, para o escritório ou ponto de venda.',
    process: stdProcess('Desenho e desenvolvimento'),
    deliverables: ['Programa instalável', 'Instalação e configuração', 'Formação dos utilizadores'],
    faq: [{ q: 'Funciona sem internet?', a: 'Pode funcionar, conforme o desenho acordado.' }],
  },
  {
    slug: 'integracoes', title: 'Integrações e APIs', icon: 'plug', main: true,
    short: 'Ligação entre sistemas, plataformas de pagamento, serviços externos e aplicações já existentes.',
    problem: 'Os seus sistemas não comunicam entre si e a informação é copiada à mão.',
    solution: 'Ligamos sistemas, plataformas de pagamento e serviços externos através de APIs.',
    process: stdProcess('Desenho e implementação da ligação'),
    deliverables: ['Integração funcional e testada', 'Documentação técnica', 'Suporte após a entrega'],
    faq: [{ q: 'Integram com plataformas de pagamento?', a: 'Sim, sujeito à disponibilidade e regras de cada plataforma.' }],
  },
  {
    slug: 'subscricao', title: 'Software por subscrição', icon: 'box', main: true,
    short: 'Soluções próprias da JOGIMIL, disponibilizadas por subscrição, sem investimento inicial elevado.',
    problem: 'Comprar software de uma só vez exige um investimento que nem todas as empresas podem fazer.',
    solution: 'Disponibilizamos soluções próprias por subscrição, com pagamento periódico.',
    process: ['Pedido de demonstração', 'Escolha do plano', 'Activação', 'Suporte contínuo'],
    deliverables: ['Acesso ao software', 'Actualizações', 'Apoio técnico'],
    faq: [{ q: 'Quanto custa?', a: 'Peça uma demonstração e apresentamos os planos.' }],
  },
  {
    slug: 'medida', title: 'Software à medida', icon: 'ruler', main: false,
    short: 'Sistemas desenhados para o processo de cada cliente.',
    problem: 'O software pronto não encaixa na forma como a sua empresa trabalha.',
    solution: 'Desenhamos o sistema à volta do seu processo.',
    process: stdProcess('Desenho e desenvolvimento'),
    deliverables: ['Sistema desenvolvido para o seu processo', 'Documentação', 'Formação'],
    faq: [{ q: 'Quanto tempo demora?', a: 'Depende do âmbito, definido na proposta.' }],
  },
  {
    slug: 'suporte', title: 'Manutenção e suporte técnico', icon: 'lifebuoy', main: false,
    short: 'Correcção de erros, actualizações, melhorias e apoio aos utilizadores.',
    problem: 'Depois de entregue, o sistema precisa de quem o cuide.',
    solution: 'Corrigimos erros, actualizamos e melhoramos o sistema, e apoiamos os utilizadores.',
    process: ['Pedido de suporte', 'Diagnóstico', 'Correcção', 'Confirmação'],
    deliverables: ['Correcção de erros', 'Actualizações e melhorias', 'Apoio aos utilizadores'],
    faq: [{ q: 'Como peço suporte?', a: 'Pelo formulário de suporte técnico ou por WhatsApp.' }],
  },
  {
    slug: 'cloud', title: 'Infraestrutura e cloud', icon: 'cloud', main: false,
    short: 'Alojamento, servidores, cópias de segurança e configuração de ambientes.',
    problem: 'Servidores mal configurados e sem cópias de segurança colocam o negócio em risco.',
    solution: 'Configuramos alojamento, servidores e cópias de segurança.',
    process: stdProcess('Configuração do ambiente'),
    deliverables: ['Ambiente configurado', 'Cópias de segurança', 'Documentação'],
    faq: [{ q: 'Alojam o meu site?', a: 'Sim, fale connosco para os detalhes.' }],
  },
  {
    slug: 'seguranca', title: 'Segurança da informação', icon: 'shield', main: false,
    short: 'Controlo de acessos, protecção de dados e boas práticas de segurança.',
    problem: 'Acessos mal controlados e dados desprotegidos expõem a empresa.',
    solution: 'Definimos controlo de acessos e boas práticas de segurança.',
    process: stdProcess('Revisão e implementação de medidas'),
    deliverables: ['Controlo de acessos', 'Recomendações de protecção de dados', 'Boas práticas para a equipa'],
    faq: [{ q: 'Cumprem a lei de protecção de dados?', a: 'Seguimos boas práticas e a Lei n.º 22/11.' }],
  },
  {
    slug: 'migracao', title: 'Migração e tratamento de dados', icon: 'database', main: false,
    short: 'Transferência de informação de sistemas antigos para novos, com limpeza e organização.',
    problem: 'Mudar de sistema sem perder histórico nem trazer dados desorganizados.',
    solution: 'Transferimos a informação, limpando e organizando os dados.',
    process: ['Levantamento dos dados', 'Limpeza e organização', 'Transferência', 'Verificação'],
    deliverables: ['Dados migrados', 'Relatório de verificação'],
    faq: [{ q: 'Perco o histórico?', a: 'Não, o objectivo é transferir sem perdas.' }],
  },
  {
    slug: 'uiux', title: 'Design de interfaces (UI/UX)', icon: 'layout', main: false,
    short: 'Ecrãs claros e fáceis de usar para os utilizadores.',
    problem: 'Ecrãs confusos fazem os utilizadores errar ou desistir.',
    solution: 'Desenhamos ecrãs claros e fáceis de usar.',
    process: ['Conversa e levantamento', 'Esboços e protótipo', 'Validação', 'Entrega do desenho'],
    deliverables: ['Protótipo dos ecrãs', 'Guia visual'],
    faq: [{ q: 'Desenham antes de programar?', a: 'Sim, validamos o desenho antes do desenvolvimento.' }],
  },
  {
    slug: 'formacao', title: 'Formação de equipas', icon: 'cap', main: false,
    short: 'Preparação dos utilizadores para trabalharem com os sistemas entregues.',
    problem: 'Um sistema só serve se a equipa souber usá-lo.',
    solution: 'Preparamos os utilizadores para trabalharem com os sistemas entregues.',
    process: ['Levantamento das necessidades', 'Preparação', 'Sessões de formação', 'Acompanhamento'],
    deliverables: ['Sessões de formação', 'Material de apoio'],
    faq: [{ q: 'A formação é presencial?', a: 'Pode ser presencial ou remota.' }],
  },
];

export interface Project {
  slug: string;
  title: string;
  category: 'web' | 'mobile' | 'desktop' | 'apis' | 'produtos';
  summary: string;
  problem: string;
  solution: string;
  result: string;
  tech: string[];
  gallery: string[]; // adicionar capturas de ecrã reais em /public/portfolio
  before?: string;
  after?: string;
  testimonial?: { quote: string; author: string };
}

// Enquanto não houver casos de clientes autorizados, mostramos os produtos próprios.
export const PROJECTS: Project[] = [
  {
    slug: 'faturacao', title: 'Software de faturação', category: 'produtos',
    summary: 'Produto próprio da JOGIMIL, por subscrição. (Conteúdo a completar com a equipa.)',
    problem: 'Empresas que precisam de emitir faturas e cumprir as obrigações fiscais.',
    solution: 'Software próprio, disponível por subscrição.',
    result: 'A preencher quando existirem resultados reais verificáveis.',
    tech: ['A confirmar'], gallery: [],
  },
];

export const CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'web', label: 'Web' },
  { id: 'mobile', label: 'Mobile' },
  { id: 'desktop', label: 'Desktop' },
  { id: 'apis', label: 'APIs' },
  { id: 'produtos', label: 'Produtos próprios' },
];

export interface Product {
  slug: string;
  name: string;
  shortName: string;
  category: string;
  tag: string;
  icon: string;
  image: string;
  priceStarting: string;
  tagline: string;
  description: string;
  fullDescription: string[];
  highlight: string;
  features: string[];
  plans: {
    name: string;
    price: string;
    period: string;
    note: string;
    highlighted?: boolean;
    features: string[];
  }[];
}

export const PRODUCTS: Product[] = [
  {
    slug: 'faturacao',
    name: 'JOGIMIL Faturação & POS',
    shortName: 'Faturação & POS',
    category: 'Comércio & Retalho',
    tag: 'Certificado AGT · SAF-T (AO)',
    icon: 'pos',
    image: '/products/faturacao.svg',
    priceStarting: '25.000 Kz / mês',
    tagline: 'Emissão rápida de faturas, recibos e guias em menos de 2 segundos com selo oficial da AGT.',
    description: 'Software de faturação certificado pela AGT em Angola. Ponto de venda (POS), controlo de stocks em tempo real, extracção oficial do ficheiro SAF-T (AO) e fecho de caixa com relatórios diários.',
    fullDescription: [
      'O JOGIMIL Faturação & POS é a solução ideal para empresas, lojas de retalho, restaurantes, clínicas e prestadores de serviços em Angola que exigem cumprimento rigoroso das regras fiscais da Administração Geral Tributária (AGT).',
      'Com interface táctil ultra rápida concebida para caixas de alto fluxo, o sistema emite facturas com código de barras, gera recibos e guias de transporte em menos de 2 segundos. O ficheiro SAF-T (AO) é gerado de forma totalmente automática e validado em tempo real, eliminando qualquer risco de divergência ou coima fiscal.',
      'Funciona com suporte completo a modo offline: caso a ligação de internet caia, o caixa continua a facturar normalmente e os dados são sincronizados de imediato quando a rede é restabelecida.',
    ],
    highlight: 'Emissão < 2s · 100% Homologado AGT',
    features: [
      'Certificação Oficial AGT Angola (Validação SAF-T AO)',
      'Ponto de Venda (POS) Rápido com Atalhos de Caixa',
      'Gestão Completa de Stocks, Lotes e Inventário',
      'Emissão de Facturas, Recibos, Notas de Crédito e Guias',
      'Fecho de Caixa Diário (X e Z) e Relatórios de Vendas',
      'Funcionamento Offline com Sincronização Automática',
    ],
    plans: [
      {
        name: 'Plano Essencial POS',
        price: '25.000 Kz',
        period: '/mês',
        note: 'Ideal para lojas individuais, boutiques e pequenos negócios em Luanda.',
        features: ['1 Ponto de Caixa (POS)', 'Facturação Ilimitada', 'Exportação SAF-T (AO)', 'Suporte Técnico Local'],
      },
      {
        name: 'Plano Empresarial Pro',
        price: '45.000 Kz',
        period: '/mês',
        highlighted: true,
        note: 'Para supermercados, restaurantes e empresas com múltiplos caixas e stocks avançados.',
        features: ['Até 4 Caixas Simultâneos', 'Gestão Multi-Stock', 'Backups Automáticos na Cloud', 'Suporte Prioritário 24/7'],
      },
      {
        name: 'Plano Corporativo / Rede',
        price: '85.000 Kz',
        period: '/mês',
        note: 'Para redes com múltiplas filiais e integração com sistemas centrais.',
        features: ['Caixas Ilimitados', 'Sincronização entre Lojas', 'API de Integração', 'Gestor de Conta Dedicado'],
      },
    ],
  },
  {
    slug: 'gestao-escolar',
    name: 'JOGIMIL EduGest Académico',
    shortName: 'EduGest Escolar',
    category: 'Educação & Ensino',
    tag: 'Colégios & Universidades',
    icon: 'school',
    image: '/products/gestao-escolar.svg',
    priceStarting: '40.000 Kz / mês',
    tagline: 'Gestão integrada de propinas, pautas oficiais do MED, mini-pautas e portal de encarregados.',
    description: 'Plataforma para instituições de ensino em Angola. Controlo rigoroso de propinas com alertas por SMS aos encarregados, gestão de turmas, lançamento de notas e pautas automáticas.',
    fullDescription: [
      'O JOGIMIL EduGest Académico foi desenhado especificamente para o calendário e modelo pedagógico angolano, atendendo colégios do ensino primário, I e II ciclos do ensino secundário, institutos politécnicos e universidades.',
      'Elimine a inadimplência com o módulo financeiro automatizado: envio de alertas por SMS e WhatsApp para encarregados de educação antes e depois do vencimento da propina, emissão de extractos de conta e aplicação automática de multas regulamentares.',
      'Professores lançam notas através de mini-pautas digitais protegidas e o sistema compila automaticamente as pautas trimestrais e finais conforme os formulários oficiais do Ministério da Educação (MED).',
    ],
    highlight: 'Portal Pais · Propinas · Pautas MED',
    features: [
      'Controlo de Propinas, Multas e Tesouraria Escolar',
      'Notificações Automáticas por SMS e WhatsApp aos Pais',
      'Pautas Trimestrais e Finais Normatizadas pelo MED',
      'Emissão Automática de Boletins de Notas e Certificados',
      'Portal Online para Encarregados de Educação',
      'Gestão de Matrículas, Turmas e Frequência de Alunos',
    ],
    plans: [
      {
        name: 'Plano Colégios Médios',
        price: '40.000 Kz',
        period: '/mês',
        note: 'Para colégios e escolas com até 600 alunos matriculados.',
        features: ['Gestão de até 600 Alunos', 'Emissão de Boletins e Pautas', 'Controlo de Propinas', 'Formação Inicial da Secretaria'],
      },
      {
        name: 'Plano Institutos & Complexos',
        price: '75.000 Kz',
        period: '/mês',
        highlighted: true,
        note: 'Para complexos escolares e institutos técnicos com até 2.000 alunos.',
        features: ['Até 2.000 Alunos', 'Portal de Encarregados Online', 'Disparos de SMS & WhatsApp', 'Suporte Técnico Presencial em Luanda'],
      },
      {
        name: 'Plano Universitário',
        price: 'Sob Consulta',
        period: '',
        note: 'Para universidades, institutos superiores e redes de múltiplos polos.',
        features: ['Alunos Ilimitados', 'Multi-Campus / Polos', 'Módulo de Bolsas e Tesouraria', 'SLA de Atendimento Dedicado'],
      },
    ],
  },
  {
    slug: 'erp-armazem',
    name: 'JOGIMIL StockERP Armazéns',
    shortName: 'StockERP Armazém',
    category: 'Logística & Distribuição',
    tag: 'Operação Offline & Multi-loja',
    icon: 'database',
    image: '/products/erp-armazem.svg',
    priceStarting: '50.000 Kz / mês',
    tagline: 'Controlo total de armazéns, leitores de código de barras, transferências de carga e tesouraria multi-caixa.',
    description: 'Sistema empresarial para armazéns, grossistas e importadores em Angola. Leitura de códigos de barras, transferências entre filiais, fornecedores e relatórios financeiros.',
    fullDescription: [
      'O JOGIMIL StockERP Armazéns é o coração operacional para empresas de importação, distribuidores atacadistas, armazenistas e cadeias de lojas em Angola que necessitam de rastreabilidade absoluta de cada palete e caixa.',
      'Suporta leitura ágil por códigos de barras (EAN-13, QR Code), controlo rigoroso de lotes e datas de validade (essencial para alimentos e medicamentos), além da emissão homologada de guias de transporte da AGT com rastreio de motorista e viatura.',
      'Possibilita a gestão centralizada de múltiplos armazéns espalhados por diferentes províncias de Angola com reconciliação automática de inventário físico vs. inventário de sistema.',
    ],
    highlight: 'Multi-armazém · Leitor Barras · Modo Offline',
    features: [
      'Gestão Centralizada de Múltiplos Armazéns e Filiais',
      'Leitura Rápida por Código de Barras e Coletores de Dados',
      'Controlo Rigoroso de Lotes, Séries e Validades',
      'Emissão Oficial de Guias de Transporte da AGT',
      'Gestão de Compras, Fornecedores e Custos de Importação',
      'Inventário Rotativo sem Interrupção das Vendas',
    ],
    plans: [
      {
        name: 'Plano Distribuição Padrão',
        price: '50.000 Kz',
        period: '/mês',
        note: 'Para operadores com até 2 armazéns ou entrepostos.',
        features: ['Até 2 Armazéns', 'Leitor de Código de Barras', 'Emissão de Guias de Transporte', 'Relatórios Diários de Stock'],
      },
      {
        name: 'Plano Logística Avançada',
        price: '90.000 Kz',
        period: '/mês',
        highlighted: true,
        note: 'Para grandes grossistas com frota própria e múltiplos armazéns.',
        features: ['Até 6 Armazéns', 'Gestão de Frotas e Cargas', 'Controlo de Lotes & Validades', 'Acompanhamento Técnico em Luanda'],
      },
      {
        name: 'Plano Corporativo Enterprise',
        price: 'Sob Consulta',
        period: '',
        note: 'Para grupos industriais, importadores de grande escala e cadeias nacionais.',
        features: ['Armazéns Ilimitados', 'Conexão com ERP SAP / Primavera', 'Auditoria e Logs de Segurança', 'Servidor Local ou Dedicado'],
      },
    ],
  },
];

export interface Post { slug: string; title: string; date: string; tag: string; excerpt: string; body: string[] }
export const POSTS: Post[] = [
  {
    slug: 'o-que-e-o-saft-ao', title: 'O que é o SAF-T (AO) e porque importa à sua empresa', date: '2026-11-01', tag: 'Faturação',
    excerpt: 'Uma explicação simples do ficheiro SAF-T (AO) e do que deve verificar no seu software.',
    body: [
      'O SAF-T (AO) é um ficheiro normalizado com dados contabilísticos e de faturação, usado em Angola para comunicação com a administração tributária.',
      'Texto de rascunho: rever com a equipa e confirmar com a legislação em vigor antes de publicar.',
    ],
  },
  {
    slug: 'cloud-ou-servidor-local', title: 'Cloud ou servidor local? Como decidir', date: '2026-10-20', tag: 'Tecnologia',
    excerpt: 'Pontos práticos para escolher onde correr o seu sistema.',
    body: ['Texto de rascunho: rever com a equipa antes de publicar.'],
  },
];

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  bio: string;
  photo?: string;
  email?: string;
  phone?: string;
  initials: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'manuel-bento',
    name: 'Eng. Manuel Bento',
    role: 'Director Geral & Arquitecto de Software',
    department: 'Direcção Executiva',
    bio: 'Mais de 12 anos em engenharia de sistemas e liderança técnica em Luanda. Especialista em infraestruturas resilientes e soluções sob medida para o mercado angolano.',
    photo: '/team/manuel-bento.svg',
    email: 'manuel.bento@jogimil.ao',
    phone: '+244 942 775 559',
    initials: 'MB',
  },
  {
    id: 'esperanca-domingos',
    name: 'Esperança Domingos',
    role: 'Lead Developer & Especialista AGT / SAF-T',
    department: 'Engenharia de Software',
    bio: 'Responsável técnica pelo motor de validação fiscal, módulos de faturação certificados pela AGT e integração de APIs de pagamentos multi-canal (Multicaixa Express).',
    photo: '/team/esperanca-domingos.svg',
    email: 'esperanca.domingos@jogimil.ao',
    initials: 'ED',
  },
  {
    id: 'kelson-afonso',
    name: 'Kelson Afonso',
    role: 'Engenheiro de Redes & Cloud / POS',
    department: 'Infraestrutura & Suporte',
    bio: 'Especialista em servidores locais para armazéns, replicação offline-first, redes de dados estruturadas e assistência operacional no terreno.',
    photo: '/team/kelson-afonso.svg',
    email: 'kelson.afonso@jogimil.ao',
    initials: 'KA',
  },
  {
    id: 'ana-costa',
    name: 'Ana Paula Costa',
    role: 'Gestora de Clientes & Formação',
    department: 'Operações & Atendimento',
    bio: 'Gestão da relação direta com parceiros e clientes em Luanda. Coordena a formação presencial de utilizadores e garantia de assistência técnica rápida.',
    photo: '/team/ana-costa.svg',
    email: 'ana.costa@jogimil.ao',
    initials: 'AC',
  },
];
