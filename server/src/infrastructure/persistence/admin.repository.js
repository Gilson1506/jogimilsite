import fs from 'node:fs';
import path from 'node:path';
import { ENV } from '../config/env.config.js';

export class AdminRepository {
  constructor() {
    this.dataDir = ENV.DATA_DIR;
    this.contactsFile = path.join(this.dataDir, 'contacts.json');
    this.remindersFile = path.join(this.dataDir, 'reminders.json');
    this.newsFile = path.join(this.dataDir, 'news.json');
    this.teamFile = path.join(this.dataDir, 'team.json');
    this.portfolioFile = path.join(this.dataDir, 'portfolio.json');
    this.settingsFile = path.join(this.dataDir, 'settings.json');
    this.supportFile = path.join(this.dataDir, 'support.json');
    this.broadcastsFile = path.join(this.dataDir, 'broadcasts.json');
    this.crmDealsFile = path.join(this.dataDir, 'crm-deals.json');
    this.submissionsFile = ENV.SUBMISSIONS_FILE;

    this._init();
  }

  _init() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    // Inicializar campanhas de disparo em massa
    if (!fs.existsSync(this.broadcastsFile)) {
      const initialBroadcasts = [
        {
          id: 'bc_1',
          title: 'Comunicado SAF-T (AO) Norma AGT 2026',
          channels: ['whatsapp', 'email'],
          audience: 'Clientes Ativos POS',
          totalRecipients: 480,
          sentCount: 480,
          deliveredCount: 468,
          failedCount: 12,
          message: 'Prezado cliente, informamos que o patch fiscal de 2026 já está disponível para atualização imediata.',
          subject: 'Atualização Mandatória AGT 2026 - JOGIMIL POS',
          status: 'completed',
          createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        },
        {
          id: 'bc_2',
          title: 'Oferta Especial de Lançamento IA Omnicanal',
          channels: ['whatsapp', 'sms'],
          audience: 'Leads e Diretores Comerciais',
          totalRecipients: 250,
          sentCount: 250,
          deliveredCount: 242,
          failedCount: 8,
          message: 'Descubra a nova automação WhatsApp com Inteligência Artificial da JOGIMIL. Agende demonstração gratuita.',
          subject: '',
          status: 'completed',
          createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        },
      ];
      fs.writeFileSync(this.broadcastsFile, JSON.stringify(initialBroadcasts, null, 2), 'utf-8');
    }

    // Inicializar negócios do CRM & Funil de Vendas
    if (!fs.existsSync(this.crmDealsFile)) {
      const initialDeals = [
        {
          id: 'deal_101',
          clientName: 'Manuel Quaresma',
          company: 'Supermercado Alvalade, Lda',
          value: 3850000,
          stage: 'negociacao',
          probability: 80,
          primaryChannel: 'whatsapp',
          contactPhone: '+244 923 881 229',
          contactEmail: 'm.quaresma@alvalade.co.ao',
          expectedCloseDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
          assignedAgent: 'Joel Gaspar',
          productInterest: 'POS SAF-T Angola (3 Caixas)',
          interactions: [
            {
              id: 'int_1',
              channel: 'whatsapp',
              type: 'Reunião de Alinhamento',
              note: 'Cliente confirmou orçamento de 3.850.000 Kz. Aguarda minuta final de contrato.',
              timestamp: new Date(Date.now() - 86400000).toISOString(),
              agent: 'Joel Gaspar',
            },
            {
              id: 'int_2',
              channel: 'email',
              type: 'Envio de Proposta',
              note: 'Enviada minuta técnica com arquitetura de backup offline para Luanda.',
              timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
              agent: 'Joel Gaspar',
            },
          ],
          createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'deal_102',
          clientName: 'Dra. Luísa Furtado',
          company: 'Complexo Escolar Milénio',
          value: 5200000,
          stage: 'proposta',
          probability: 60,
          primaryChannel: 'email',
          contactPhone: '+244 912 340 991',
          contactEmail: 'luisa.furtado@colegiomilenio.ao',
          expectedCloseDate: new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0],
          assignedAgent: 'Helena Kiala',
          productInterest: 'Portal Acadêmico Cloud + Propinas GPO',
          interactions: [
            {
              id: 'int_3',
              channel: 'email',
              type: 'Apresentação Comercial',
              note: 'Diretoria analisou o plano de 5.200.000 Kz para 2.400 alunos matriculados.',
              timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
              agent: 'Helena Kiala',
            },
          ],
          createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'deal_103',
          clientName: 'Eng. António Silva',
          company: 'Logística & Navegação Luanda',
          value: 7800000,
          stage: 'ganho',
          probability: 100,
          primaryChannel: 'whatsapp',
          contactPhone: '+244 942 775 559',
          contactEmail: 'antonio.silva@logluanda.ao',
          expectedCloseDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          assignedAgent: 'Joel Gaspar',
          productInterest: 'Assistente IA Omnicanal + GPS Mobile',
          interactions: [
            {
              id: 'int_4',
              channel: 'whatsapp',
              type: 'Contrato Assinado',
              note: 'Primeira tranche de pagamento liquidada via transferência bancária BFA.',
              timestamp: new Date(Date.now() - 86400000).toISOString(),
              agent: 'Joel Gaspar',
            },
          ],
          createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'deal_104',
          clientName: 'Dr. Paulo Kassoma',
          company: 'Clínica Sagrada Esperança Parceiros',
          value: 4100000,
          stage: 'demonstracao',
          probability: 40,
          primaryChannel: 'whatsapp',
          contactPhone: '+244 931 100 240',
          contactEmail: 'paulo.k@clinicasagrada.co.ao',
          expectedCloseDate: new Date(Date.now() + 18 * 86400000).toISOString().split('T')[0],
          assignedAgent: 'Mauro dos Santos',
          productInterest: 'Agendamento Clínico com Bot WhatsApp',
          interactions: [
            {
              id: 'int_5',
              channel: 'whatsapp',
              type: 'Demonstração Agendada',
              note: 'Demonstração ao vivo agendada para sexta-feira às 14h30.',
              timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
              agent: 'Mauro dos Santos',
            },
          ],
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'deal_105',
          clientName: 'Kátia dos Remédios',
          company: 'Grupo Hoteleiro Baía de Luanda',
          value: 6400000,
          stage: 'novo_lead',
          probability: 20,
          primaryChannel: 'sms',
          contactPhone: '+244 928 554 112',
          contactEmail: 'remedios@hotelbaia.ao',
          expectedCloseDate: new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0],
          assignedAgent: 'Joel Gaspar',
          productInterest: 'Suite Completa Hotelaria & POS Restaurante',
          interactions: [
            {
              id: 'int_6',
              channel: 'sms',
              type: 'Lead Recebido',
              note: 'Contacto recebido através de campanha SMS em massa.',
              timestamp: new Date(Date.now() - 86400000).toISOString(),
              agent: 'Joel Gaspar',
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      fs.writeFileSync(this.crmDealsFile, JSON.stringify(initialDeals, null, 2), 'utf-8');
    }

    // Inicializar ficheiro de contactos
    if (!fs.existsSync(this.contactsFile)) {
      const initialContacts = this._seedContactsFromSubmissions();
      fs.writeFileSync(this.contactsFile, JSON.stringify(initialContacts, null, 2), 'utf-8');
    }

    // Inicializar ficheiro de lembretes
    if (!fs.existsSync(this.remindersFile)) {
      const initialReminders = [
        {
          id: 'rem_1',
          title: 'Follow-up de proposta comercial',
          contactName: 'Eng. Manuel Bento',
          phone: '+244942775559',
          email: 'manuel.bento@jogimil.ao',
          datetime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          notes: 'Confirmar aceitação da proposta de desenvolvimento AI-First.',
          status: 'pending',
          notifyWhatsApp: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'rem_2',
          title: 'Demonstração do JOGIMIL Faturação & POS',
          contactName: 'Mateus Silva',
          phone: '+244923112233',
          email: 'mateus@parceiro.ao',
          datetime: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
          notes: 'Apresentar emissão SAF-T (AO) e funcionamento offline.',
          status: 'pending',
          notifyWhatsApp: true,
          createdAt: new Date().toISOString(),
        },
      ];
      fs.writeFileSync(this.remindersFile, JSON.stringify(initialReminders, null, 2), 'utf-8');
    }

    // Inicializar ficheiro de notícias com fotos
    if (!fs.existsSync(this.newsFile)) {
      const initialNews = [
        {
          slug: 'jogimil-suite-ia-angola',
          title: 'JOGIMIL lança nova suite de IA em Luanda',
          date: new Date().toISOString().split('T')[0],
          tag: 'Tecnologia',
          excerpt: 'Automação avançada com agentes autónomos e dados protegidos para o mercado angolano.',
          body: [
            'A JOGIMIL Tecnologias anunciou hoje o lançamento da sua nova suite de agentes inteligentes de IA concebida para modernizar os processos corporativos em Angola.',
            'A solução integra modelos de linguagem modernos aos canais locais como WhatsApp e software de faturação, garantindo total conformidade e soberania dos dados.',
          ],
          image: '/products/faturacao.svg',
          author: 'Engenharia JOGIMIL',
          createdAt: new Date().toISOString(),
        },
        {
          slug: 'atualizacao-normas-saft-agt',
          title: 'Atualização das Normas de Validação AGT 2026',
          date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
          tag: 'Faturação',
          excerpt: 'Exportação e validação de SAF-T (AO) sem erros para o comércio e serviços.',
          body: [
            'O software JOGIMIL Faturação & POS foi atualizado para assegurar cumprimento integral das recentes diretrizes da Administração Geral Tributária (AGT).',
          ],
          image: '/products/gestao-escolar.svg',
          author: 'Equipa Fiscal JOGIMIL',
          createdAt: new Date().toISOString(),
        },
      ];
      fs.writeFileSync(this.newsFile, JSON.stringify(initialNews, null, 2), 'utf-8');
    }

    // Inicializar ficheiro da equipa
    if (!fs.existsSync(this.teamFile)) {
      const initialTeam = [
        {
          id: 'manuel-bento',
          name: 'Eng. Manuel Bento',
          role: 'Director Geral & Arquitecto de Software',
          department: 'Direcção Executiva',
          bio: 'Mais de 12 anos em engenharia de sistemas e liderança técnica em Luanda. Especialista em infraestruturas resilientes.',
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
          bio: 'Responsável técnica pelo motor de validação fiscal, módulos de faturação certificados pela AGT e Multicaixa Express.',
          photo: '/team/esperanca-domingos.svg',
          email: 'esperanca.domingos@jogimil.ao',
          initials: 'ED',
        },
        {
          id: 'kelson-afonso',
          name: 'Kelson Afonso',
          role: 'Engenheiro de Redes & Cloud / POS',
          department: 'Infraestrutura & Suporte',
          bio: 'Especialista em servidores locais para armazéns, replicação offline-first, redes de dados estruturadas.',
          photo: '/team/kelson-afonso.svg',
          email: 'kelson.afonso@jogimil.ao',
          initials: 'KA',
        },
        {
          id: 'ana-costa',
          name: 'Ana Paula Costa',
          role: 'Gestora de Clientes & Formação',
          department: 'Operações & Atendimento',
          bio: 'Gestão da relação direta com parceiros e clientes em Luanda. Coordena a formação presencial de utilizadores.',
          photo: '/team/ana-costa.svg',
          email: 'ana.costa@jogimil.ao',
          initials: 'AC',
        },
      ];
      fs.writeFileSync(this.teamFile, JSON.stringify(initialTeam, null, 2), 'utf-8');
    }

    // Inicializar ficheiro de portfólio
    if (!fs.existsSync(this.portfolioFile)) {
      const initialPortfolio = [
        {
          slug: 'sistema-pos-retalho-luanda',
          title: 'Rede POS Offline-First & SAF-T (AO)',
          category: 'Sistemas & ERP',
          client: 'Cadeia de Retalho Alimentar',
          year: '2026',
          description: 'Implantação de postos de venda de alta velocidade com emissão certificada pela AGT e funcionamento 100% autônomo sem internet.',
          image: '/products/faturacao.svg',
          metricValue: '100%',
          metricLabel: 'Validação SAF-T AGT',
          tags: ['SAF-T', 'POS', 'Offline-First'],
        },
        {
          slug: 'agentes-ia-atendimento-whatsapp',
          title: 'Agentes de Atendimento Inteligente no WhatsApp',
          category: 'Inteligência Artificial',
          client: 'Grupo de Serviços Financeiros',
          year: '2026',
          description: 'Desenvolvimento de agentes autónomos com IA para qualificação de propostas e atendimento 24/7 integrado aos sistemas internos.',
          image: '/products/gestao-escolar.svg',
          metricValue: '< 4 seg',
          metricLabel: 'Tempo Médio de Resposta',
          tags: ['AI-First', 'Evolution API', 'LLM'],
        },
        {
          slug: 'gestao-logistica-armazens',
          title: 'JOGIMIL StockERP para Entrepostos e Carga',
          category: 'Logística & Distribuição',
          client: 'Distribuidora Grossista Nacional',
          year: '2025',
          description: 'Rastreamento por código de barras, conferência de carga, emissão de guias de transporte e controlo de lotes para importadores.',
          image: '/products/erp-armazem.svg',
          metricValue: '99.8%',
          metricLabel: 'Acurácia de Stock',
          tags: ['ERP', 'Logística', 'Guias AGT'],
        },
      ];
      fs.writeFileSync(this.portfolioFile, JSON.stringify(initialPortfolio, null, 2), 'utf-8');
    }

    // Inicializar configurações do sistema
    if (!fs.existsSync(this.settingsFile)) {
      const initialSettings = {
        evolutionApi: {
          serverUrl: 'https://evolution.jogimiltecnologias.it.ao',
          instanceName: 'jogimil-main',
          apiKey: 'jg_evolution_live_secret_key_2026',
          webhookUrl: 'http://localhost:3001/api/v1/admin/whatsapp/webhook',
          autoReply: true,
          syncIntervalMinutes: 5,
        },
        emailServer: {
          smtpHost: 'mail.jogimiltecnologias.it.ao',
          smtpPort: 587,
          smtpUser: 'geral@jogimiltecnologias.it.ao',
          smtpSecure: false,
          imapHost: 'mail.jogimiltecnologias.it.ao',
          imapPort: 993,
          imapUser: 'geral@jogimiltecnologias.it.ao',
          imapSecure: true,
          spfDkimVerified: true,
        },
        systemPreferences: {
          theme: 'dark',
          primaryColor: '#0066FF',
          companyName: 'JOGIMIL - Tecnologias, Lda.',
          supportPhone: '+244 942 775 559',
          timezone: 'Africa/Luanda',
        },
      };
      fs.writeFileSync(this.settingsFile, JSON.stringify(initialSettings, null, 2), 'utf-8');
    }

    // Inicializar atendimento multicanal (Support tickets & chats)
    if (!fs.existsSync(this.supportFile)) {
      const initialTickets = [
        {
          id: 'tick_101',
          contactName: 'Carlos Mendonça',
          company: 'Supermercados Luanda Sul',
          phone: '+244 923 445 566',
          email: 'carlos.mendonca@sul.ao',
          channel: 'whatsapp', // 'whatsapp' | 'email'
          subject: 'Dúvida sobre parametrização da taxa IVA no POS',
          status: 'open', // 'open' | 'pending' | 'resolved'
          assignedAgent: 'Esperança Domingos',
          updatedAt: new Date().toISOString(),
          messages: [
            {
              id: 'msg_1',
              sender: 'client',
              content: 'Boa tarde, equipa JOGIMIL. Gostaria de saber como atualizar a taxa de IVA nos novos artigos que inserimos hoje no POS.',
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              channel: 'whatsapp',
            },
            {
              id: 'msg_2',
              sender: 'agent',
              content: 'Boa tarde, Sr. Carlos! No menu Definições > Artigos do POS, pode alterar a taxa diretamente e gravar. O sistema valida automaticamente o SAF-T.',
              timestamp: new Date(Date.now() - 1800000).toISOString(),
              channel: 'whatsapp',
            },
          ],
        },
        {
          id: 'tick_102',
          contactName: 'Dra. Luísa Fernandes',
          company: 'Colégio Nova Esperança',
          phone: '+244 931 778 899',
          email: 'secretaria@novaesperanca.edu.ao',
          channel: 'email',
          subject: 'Pedido de demonstração do módulo de Propinas Online',
          status: 'open',
          assignedAgent: 'Ana Costa',
          updatedAt: new Date(Date.now() - 7200000).toISOString(),
          messages: [
            {
              id: 'msg_3',
              sender: 'client',
              content: 'Prezados, gostaríamos de agendar uma demonstração online do módulo de cobrança automática de propinas com Multicaixa Express.',
              timestamp: new Date(Date.now() - 7200000).toISOString(),
              channel: 'email',
            },
          ],
        },
      ];
      fs.writeFileSync(this.supportFile, JSON.stringify(initialTickets, null, 2), 'utf-8');
    }
  }

  _seedContactsFromSubmissions() {
    const contactsMap = new Map();

    if (fs.existsSync(this.submissionsFile)) {
      try {
        const content = fs.readFileSync(this.submissionsFile, 'utf-8');
        const lines = content.trim().split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const sub = JSON.parse(line);
            const email = sub.clientEmail || sub.data?.email || `contacto-${sub.id}@jogimil.ao`;
            const name = sub.clientName || sub.data?.nome || sub.data?.empresa || 'Contacto Website';
            const phone = sub.data?.telefone || sub.data?.whatsapp || sub.data?.telemovel || '+244 942 775 559';

            if (!contactsMap.has(email)) {
              contactsMap.set(email, {
                id: `cont_${sub.id.replace('sub_', '')}`,
                name,
                email,
                phone,
                company: sub.data?.empresa || 'Empresa em Angola',
                status: 'novo',
                source: sub.formTitle || sub.formType || 'Website JOGIMIL',
                createdAt: sub.receivedAt || new Date().toISOString(),
                history: [
                  {
                    id: `msg_${Date.now()}_init`,
                    channel: 'form',
                    direction: 'inbound',
                    content: sub.data?.mensagem || `Submissão inicial do formulário: ${sub.formTitle || sub.formType}`,
                    timestamp: sub.receivedAt || new Date().toISOString(),
                  },
                ],
              });
            }
          } catch {
            // Continua
          }
        }
      } catch {
        // Continua
      }
    }

    if (contactsMap.size === 0) {
      return [
        {
          id: 'cont_seed_1',
          name: 'António Kiala',
          email: 'antonio.kiala@angolapositiva.ao',
          phone: '+244 923 881 234',
          company: 'Kiala Distribuidora, Lda.',
          status: 'novo',
          source: 'Pedido de Orçamento Web',
          createdAt: new Date().toISOString(),
          history: [
            {
              id: 'msg_seed_1',
              channel: 'whatsapp',
              direction: 'inbound',
              content: 'Boa tarde, necessitamos de um software de faturação certificado pela AGT para 3 lojas em Luanda.',
              timestamp: new Date().toISOString(),
            },
          ],
        },
      ];
    }

    return Array.from(contactsMap.values());
  }

  // --- CONTACTOS & CRM ---
  async getContacts() {
    this._init();
    try {
      const data = await fs.promises.readFile(this.contactsFile, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async saveContact(contact) {
    const contacts = await this.getContacts();
    const existingIndex = contacts.findIndex((c) => c.id === contact.id);

    const contactEntity = {
      id: contact.id || `cont_${Date.now()}`,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company || '',
      status: contact.status || 'novo',
      source: contact.source || 'Painel Admin',
      createdAt: contact.createdAt || new Date().toISOString(),
      history: contact.history || [],
    };

    if (existingIndex >= 0) {
      contacts[existingIndex] = contactEntity;
    } else {
      contacts.unshift(contactEntity);
    }

    await fs.promises.writeFile(this.contactsFile, JSON.stringify(contacts, null, 2), 'utf-8');
    return contactEntity;
  }

  async updateContactStatus(contactId, status) {
    const contacts = await this.getContacts();
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) throw new Error('Contacto não encontrado');
    contact.status = status;
    await fs.promises.writeFile(this.contactsFile, JSON.stringify(contacts, null, 2), 'utf-8');
    return contact;
  }

  async addContactMessage(contactId, message) {
    const contacts = await this.getContacts();
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) throw new Error('Contacto não encontrado');

    if (!contact.history) contact.history = [];
    const msgEntity = {
      id: `msg_${Date.now()}`,
      channel: message.channel || 'whatsapp',
      direction: message.direction || 'outbound',
      content: message.content,
      author: message.author || 'Equipa JOGIMIL',
      timestamp: new Date().toISOString(),
    };
    contact.history.push(msgEntity);

    await fs.promises.writeFile(this.contactsFile, JSON.stringify(contacts, null, 2), 'utf-8');
    return msgEntity;
  }

  // --- LEMBRETES ---
  async getReminders() {
    this._init();
    try {
      const data = await fs.promises.readFile(this.remindersFile, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async saveReminder(reminder) {
    const reminders = await this.getReminders();
    const newReminder = {
      id: reminder.id || `rem_${Date.now()}`,
      title: reminder.title,
      contactName: reminder.contactName || '',
      phone: reminder.phone || '',
      email: reminder.email || '',
      datetime: reminder.datetime,
      notes: reminder.notes || '',
      status: reminder.status || 'pending',
      notifyWhatsApp: Boolean(reminder.notifyWhatsApp),
      createdAt: new Date().toISOString(),
    };
    reminders.unshift(newReminder);
    await fs.promises.writeFile(this.remindersFile, JSON.stringify(reminders, null, 2), 'utf-8');
    return newReminder;
  }

  async updateReminderStatus(reminderId, status) {
    const reminders = await this.getReminders();
    const rem = reminders.find((r) => r.id === reminderId);
    if (!rem) throw new Error('Lembrete não encontrado');
    rem.status = status;
    await fs.promises.writeFile(this.remindersFile, JSON.stringify(reminders, null, 2), 'utf-8');
    return rem;
  }

  async deleteReminder(reminderId) {
    const reminders = await this.getReminders();
    const filtered = reminders.filter((r) => r.id !== reminderId);
    await fs.promises.writeFile(this.remindersFile, JSON.stringify(filtered, null, 2), 'utf-8');
    return { success: true };
  }

  // --- NOTÍCIAS DINÂMICAS COM FOTO ---
  async getNews() {
    this._init();
    try {
      const data = await fs.promises.readFile(this.newsFile, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async saveNews(post) {
    const news = await this.getNews();
    const slug = post.slug || post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existingIndex = news.findIndex((n) => n.slug === slug);

    const postEntity = {
      slug,
      title: post.title,
      date: post.date || new Date().toISOString().split('T')[0],
      tag: post.tag || 'Tecnologia',
      excerpt: post.excerpt || '',
      body: Array.isArray(post.body) ? post.body : [post.body],
      image: post.image || '/products/faturacao.svg',
      author: post.author || 'Equipa JOGIMIL',
      createdAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      news[existingIndex] = { ...news[existingIndex], ...postEntity };
    } else {
      news.unshift(postEntity);
    }

    await fs.promises.writeFile(this.newsFile, JSON.stringify(news, null, 2), 'utf-8');
    return postEntity;
  }

  async deleteNews(slug) {
    const news = await this.getNews();
    const filtered = news.filter((n) => n.slug !== slug);
    await fs.promises.writeFile(this.newsFile, JSON.stringify(filtered, null, 2), 'utf-8');
    return { success: true };
  }

  // --- MEMBROS DA EQUIPA COM FOTO ---
  async getTeam() {
    this._init();
    try {
      const data = await fs.promises.readFile(this.teamFile, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async saveTeamMember(member) {
    const team = await this.getTeam();
    const id = member.id || member.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existingIndex = team.findIndex((m) => m.id === id);

    const initials = member.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');

    const memberEntity = {
      id,
      name: member.name,
      role: member.role,
      department: member.department || 'Engenharia',
      bio: member.bio || '',
      photo: member.photo || `/team/${id}.svg`,
      email: member.email || `${id}@jogimil.ao`,
      phone: member.phone || '+244 942 775 559',
      initials: member.initials || initials || 'JG',
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      team[existingIndex] = memberEntity;
    } else {
      team.push(memberEntity);
    }

    await fs.promises.writeFile(this.teamFile, JSON.stringify(team, null, 2), 'utf-8');
    return memberEntity;
  }

  async deleteTeamMember(id) {
    const team = await this.getTeam();
    const filtered = team.filter((m) => m.id !== id);
    await fs.promises.writeFile(this.teamFile, JSON.stringify(filtered, null, 2), 'utf-8');
    return { success: true };
  }

  // --- ITENS DE PORTFÓLIO COM FOTO/MOCKUP ---
  async getPortfolio() {
    this._init();
    try {
      const data = await fs.promises.readFile(this.portfolioFile, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async savePortfolioItem(item) {
    const portfolio = await this.getPortfolio();
    const slug = item.slug || item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existingIndex = portfolio.findIndex((p) => p.slug === slug);

    const itemEntity = {
      slug,
      title: item.title,
      category: item.category || 'Sistemas & IA',
      client: item.client || 'Cliente Corporativo',
      year: item.year || new Date().getFullYear().toString(),
      description: item.description || '',
      image: item.image || '/products/faturacao.svg',
      metricValue: item.metricValue || '100%',
      metricLabel: item.metricLabel || 'Satisfação e Conformidade',
      tags: Array.isArray(item.tags) ? item.tags : (item.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      portfolio[existingIndex] = itemEntity;
    } else {
      portfolio.unshift(itemEntity);
    }

    await fs.promises.writeFile(this.portfolioFile, JSON.stringify(portfolio, null, 2), 'utf-8');
    return itemEntity;
  }

  async deletePortfolioItem(slug) {
    const portfolio = await this.getPortfolio();
    const filtered = portfolio.filter((p) => p.slug !== slug);
    await fs.promises.writeFile(this.portfolioFile, JSON.stringify(filtered, null, 2), 'utf-8');
    return { success: true };
  }

  // --- DEFINIÇÕES DO SISTEMA (EVOLUTION API & EMAIL IMAP/SMTP) ---
  async getSettings() {
    this._init();
    try {
      const data = await fs.promises.readFile(this.settingsFile, 'utf-8');
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  async saveSettings(settings) {
    const current = await this.getSettings();
    const updated = {
      ...current,
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    await fs.promises.writeFile(this.settingsFile, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
  }

  // --- ATENDIMENTO MULTICANAL (WHATSAPP & EMAIL CHAT) ---
  async getSupportTickets() {
    this._init();
    try {
      const data = await fs.promises.readFile(this.supportFile, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async saveSupportMessage(ticketId, message) {
    const tickets = await this.getSupportTickets();
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) throw new Error('Ticket de suporte não encontrado');

    const msgEntity = {
      id: `msg_${Date.now()}`,
      sender: message.sender || 'agent',
      content: message.content,
      channel: message.channel || ticket.channel,
      timestamp: new Date().toISOString(),
    };

    ticket.messages.push(msgEntity);
    ticket.updatedAt = new Date().toISOString();

    await fs.promises.writeFile(this.supportFile, JSON.stringify(tickets, null, 2), 'utf-8');
    return msgEntity;
  }

  async updateTicketStatus(ticketId, status) {
    const tickets = await this.getSupportTickets();
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) throw new Error('Ticket de suporte não encontrado');

    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();

    await fs.promises.writeFile(this.supportFile, JSON.stringify(tickets, null, 2), 'utf-8');
    return ticket;
  }

  // --- DISPARO EM MASSA (WHATSAPP, EMAIL, SMS) ---
  async getBroadcasts() {
    this._init();
    try {
      const data = await fs.promises.readFile(this.broadcastsFile, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async createBroadcastCampaign(campaign) {
    const broadcasts = await this.getBroadcasts();
    const newBroadcast = {
      id: campaign.id || `bc_${Date.now()}`,
      title: campaign.title || 'Campanha Omnicanal',
      channels: campaign.channels || ['whatsapp'],
      audience: campaign.audience || 'Todos os Clientes',
      totalRecipients: Number(campaign.totalRecipients || 0),
      sentCount: Number(campaign.sentCount || campaign.totalRecipients || 0),
      deliveredCount: Number(campaign.deliveredCount || Math.floor((campaign.totalRecipients || 10) * 0.95)),
      failedCount: Number(campaign.failedCount || 0),
      message: campaign.message || '',
      subject: campaign.subject || '',
      status: campaign.status || 'completed',
      scheduledAt: campaign.scheduledAt || null,
      createdAt: new Date().toISOString(),
    };
    broadcasts.unshift(newBroadcast);
    await fs.promises.writeFile(this.broadcastsFile, JSON.stringify(broadcasts, null, 2), 'utf-8');
    return newBroadcast;
  }

  // --- CRM & GESTÃO AVANÇADA DE VENDAS / FUNIL ---
  async getCrmDeals() {
    this._init();
    try {
      const data = await fs.promises.readFile(this.crmDealsFile, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async saveCrmDeal(deal) {
    const deals = await this.getCrmDeals();
    const existingIndex = deals.findIndex((d) => d.id === deal.id);
    const dealEntity = {
      id: deal.id || `deal_${Date.now()}`,
      clientName: deal.clientName,
      company: deal.company,
      value: Number(deal.value || 0),
      stage: deal.stage || 'novo_lead',
      probability: Number(deal.probability || 20),
      primaryChannel: deal.primaryChannel || 'whatsapp',
      contactPhone: deal.contactPhone || '',
      contactEmail: deal.contactEmail || '',
      expectedCloseDate:
        deal.expectedCloseDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      assignedAgent: deal.assignedAgent || 'Joel Gaspar',
      productInterest: deal.productInterest || 'POS SAF-T Angola',
      interactions: deal.interactions || [
        {
          id: `int_${Date.now()}`,
          channel: deal.primaryChannel || 'whatsapp',
          type: 'Contacto Inicial',
          note: 'Lead captado e adicionado ao CRM com interesse em automação.',
          timestamp: new Date().toISOString(),
          agent: deal.assignedAgent || 'Joel Gaspar',
        },
      ],
      createdAt: deal.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      deals[existingIndex] = { ...deals[existingIndex], ...dealEntity, updatedAt: new Date().toISOString() };
    } else {
      deals.unshift(dealEntity);
    }

    await fs.promises.writeFile(this.crmDealsFile, JSON.stringify(deals, null, 2), 'utf-8');
    return dealEntity;
  }

  async updateDealStage(dealId, stage) {
    const deals = await this.getCrmDeals();
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) throw new Error('Negócio não encontrado');

    deal.stage = stage;
    deal.updatedAt = new Date().toISOString();
    deal.interactions.unshift({
      id: `int_${Date.now()}`,
      channel: 'system',
      type: 'Mudança de Estágio',
      note: `Fase do funil de vendas atualizada para: ${stage.toUpperCase()}`,
      timestamp: new Date().toISOString(),
      agent: 'Sistema JOGIMIL',
    });

    await fs.promises.writeFile(this.crmDealsFile, JSON.stringify(deals, null, 2), 'utf-8');
    return deal;
  }

  async addDealInteraction(dealId, interaction) {
    const deals = await this.getCrmDeals();
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) throw new Error('Negócio não encontrado');

    const newInteraction = {
      id: `int_${Date.now()}`,
      channel: interaction.channel || 'whatsapp',
      type: interaction.type || 'Interação',
      note: interaction.note || '',
      timestamp: new Date().toISOString(),
      agent: interaction.agent || 'Consultor JOGIMIL',
    };

    deal.interactions.unshift(newInteraction);
    deal.updatedAt = new Date().toISOString();

    await fs.promises.writeFile(this.crmDealsFile, JSON.stringify(deals, null, 2), 'utf-8');
    return newInteraction;
  }

  async deleteCrmDeal(dealId) {
    let deals = await this.getCrmDeals();
    deals = deals.filter((d) => d.id !== dealId);
    await fs.promises.writeFile(this.crmDealsFile, JSON.stringify(deals, null, 2), 'utf-8');
    return true;
  }
}