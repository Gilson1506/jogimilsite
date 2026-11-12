export class AdminController {
  constructor({ adminRepository, evolutionService, emailCenterService, listSubmissionsUseCase, logger }) {
    this.repo = adminRepository;
    this.evolution = evolutionService;
    this.emailCenter = emailCenterService;
    this.listSubmissions = listSubmissionsUseCase;
    this.logger = logger || console;

    // Fazer bind de todos os métodos para segurança no roteamento Express
    this.getDashboard = this.getDashboard.bind(this);
    this.listContacts = this.listContacts.bind(this);
    this.createContact = this.createContact.bind(this);
    this.updateContactStatus = this.updateContactStatus.bind(this);
    this.addMessage = this.addMessage.bind(this);
    this.listReminders = this.listReminders.bind(this);
    this.createReminder = this.createReminder.bind(this);
    this.updateReminderStatus = this.updateReminderStatus.bind(this);
    this.deleteReminder = this.deleteReminder.bind(this);
    this.notifyReminderWhatsApp = this.notifyReminderWhatsApp.bind(this);
    this.getWhatsappStatus = this.getWhatsappStatus.bind(this);
    this.createWhatsappInstance = this.createWhatsappInstance.bind(this);
    this.getWhatsappQrCode = this.getWhatsappQrCode.bind(this);
    this.sendWhatsappMessage = this.sendWhatsappMessage.bind(this);
    this.getEmailStatus = this.getEmailStatus.bind(this);
    this.sendTestEmail = this.sendTestEmail.bind(this);
    this.listNews = this.listNews.bind(this);
    this.createNews = this.createNews.bind(this);
    this.deleteNews = this.deleteNews.bind(this);

    // Gestão de Equipa
    this.listTeam = this.listTeam.bind(this);
    this.createTeamMember = this.createTeamMember.bind(this);
    this.deleteTeamMember = this.deleteTeamMember.bind(this);

    // Gestão de Portfólio
    this.listPortfolio = this.listPortfolio.bind(this);
    this.createPortfolioItem = this.createPortfolioItem.bind(this);
    this.deletePortfolioItem = this.deletePortfolioItem.bind(this);

    // Definições do Sistema (Evolution & Email)
    this.getSettings = this.getSettings.bind(this);
    this.updateSettings = this.updateSettings.bind(this);

    // Atendimento Multicanal / Suporte
    this.listSupportTickets = this.listSupportTickets.bind(this);
    this.addSupportMessage = this.addSupportMessage.bind(this);
    this.updateSupportStatus = this.updateSupportStatus.bind(this);

    // Disparo em Massa (WhatsApp, Email, SMS)
    this.listBroadcasts = this.listBroadcasts.bind(this);
    this.sendBroadcast = this.sendBroadcast.bind(this);

    // CRM & Gestão Avançada de Vendas / Funil
    this.listCrmDeals = this.listCrmDeals.bind(this);
    this.createCrmDeal = this.createCrmDeal.bind(this);
    this.updateDealStage = this.updateDealStage.bind(this);
    this.addDealInteraction = this.addDealInteraction.bind(this);
    this.deleteCrmDeal = this.deleteCrmDeal.bind(this);
  }

  // --- DASHBOARD OMNICANAL ---
  async getDashboard(req, res, next) {
    try {
      const [contacts, reminders, news, waStatus, emailStatus] = await Promise.all([
        this.repo.getContacts(),
        this.repo.getReminders(),
        this.repo.getNews(),
        this.evolution.getConnectionStatus(),
        this.emailCenter.getStatus(),
      ]);

      const pendingReminders = reminders.filter((r) => r.status === 'pending');
      const totalMessages = contacts.reduce((acc, c) => acc + (c.history?.length || 0), 0);

      res.json({
        success: true,
        summary: {
          totalContacts: contacts.length,
          newContacts: contacts.filter((c) => c.status === 'novo').length,
          pendingReminders: pendingReminders.length,
          totalNews: news.length,
          totalMessages,
          whatsappConnected: Boolean(waStatus.connected),
          whatsappState: waStatus.state,
          emailOperational: Boolean(emailStatus.smtp.configured),
        },
        whatsapp: waStatus,
        email: emailStatus,
        recentContacts: contacts.slice(0, 5),
        upcomingReminders: pendingReminders.slice(0, 5),
      });
    } catch (err) {
      next(err);
    }
  }

  // --- CONTACTOS & HISTÓRICO ---
  async listContacts(req, res, next) {
    try {
      const contacts = await this.repo.getContacts();
      res.json({ success: true, contacts });
    } catch (err) {
      next(err);
    }
  }

  async createContact(req, res, next) {
    try {
      const contact = await this.repo.saveContact(req.body);
      res.status(201).json({ success: true, contact });
    } catch (err) {
      next(err);
    }
  }

  async updateContactStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const contact = await this.repo.updateContactStatus(id, status);
      res.json({ success: true, contact });
    } catch (err) {
      next(err);
    }
  }

  async addMessage(req, res, next) {
    try {
      const { id } = req.params;
      const { channel, content, sendLive } = req.body;

      if (!content) {
        return res.status(400).json({ success: false, message: 'Conteúdo da mensagem é obrigatório.' });
      }

      const msg = await this.repo.addContactMessage(id, req.body);

      // Se for canal WhatsApp e solicitado envio ao vivo, disparar via Evolution API
      let waResult = null;
      if (channel === 'whatsapp' && sendLive) {
        const contacts = await this.repo.getContacts();
        const contact = contacts.find((c) => c.id === id);
        if (contact?.phone) {
          waResult = await this.evolution.sendText(contact.phone, content);
        }
      }

      res.status(201).json({ success: true, message: msg, whatsappResult: waResult });
    } catch (err) {
      next(err);
    }
  }

  // --- LEMBRETES & NOTIFICAÇÕES WHATSAPP ---
  async listReminders(req, res, next) {
    try {
      const reminders = await this.repo.getReminders();
      res.json({ success: true, reminders });
    } catch (err) {
      next(err);
    }
  }

  async createReminder(req, res, next) {
    try {
      const reminder = await this.repo.saveReminder(req.body);

      // Se marcado para notificar imediatamente via WhatsApp
      let notifyResult = null;
      if (req.body.notifyNow && reminder.phone) {
        const text = `🔔 *LEMBRETE JOGIMIL*\n\n*Assunto:* ${reminder.title}\n*Data/Hora:* ${new Date(reminder.datetime).toLocaleString('pt-AO')}\n*Cliente:* ${reminder.contactName || 'N/A'}\n*Detalhes:* ${reminder.notes || 'Sem observações.'}`;
        notifyResult = await this.evolution.sendText(reminder.phone, text);
      }

      res.status(201).json({ success: true, reminder, notifyResult });
    } catch (err) {
      next(err);
    }
  }

  async updateReminderStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const rem = await this.repo.updateReminderStatus(id, status);
      res.json({ success: true, reminder: rem });
    } catch (err) {
      next(err);
    }
  }

  async deleteReminder(req, res, next) {
    try {
      const { id } = req.params;
      await this.repo.deleteReminder(id);
      res.json({ success: true, message: 'Lembrete removido com sucesso.' });
    } catch (err) {
      next(err);
    }
  }

  async notifyReminderWhatsApp(req, res, next) {
    try {
      const { id } = req.params;
      const reminders = await this.repo.getReminders();
      const rem = reminders.find((r) => r.id === id);

      if (!rem) {
        return res.status(404).json({ success: false, message: 'Lembrete não encontrado.' });
      }

      const phone = req.body.phone || rem.phone;
      if (!phone) {
        return res.status(400).json({ success: false, message: 'Nenhum número de WhatsApp associado.' });
      }

      const text = req.body.customText || `🔔 *NOTIFICAÇÃO JOGIMIL*\n\n📌 *Lembrete:* ${rem.title}\n📅 *Data:* ${new Date(rem.datetime).toLocaleString('pt-AO')}\n👤 *Cliente:* ${rem.contactName || 'N/A'}\n📝 *Notas:* ${rem.notes || 'Sem detalhes'}\n\n_Mensagem automática do Centro Omnicanal JOGIMIL_`;

      const result = await this.evolution.sendText(phone, text);
      res.json({ success: true, result, destination: phone });
    } catch (err) {
      next(err);
    }
  }

  // --- WHATSAPP / EVOLUTION API ---
  async getWhatsappStatus(req, res, next) {
    try {
      const status = await this.evolution.getConnectionStatus();
      res.json({ success: true, status });
    } catch (err) {
      next(err);
    }
  }

  async createWhatsappInstance(req, res, next) {
    try {
      const result = await this.evolution.createInstance();
      res.json({ success: true, result });
    } catch (err) {
      next(err);
    }
  }

  async getWhatsappQrCode(req, res, next) {
    try {
      const result = await this.evolution.getQrCode();
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async sendWhatsappMessage(req, res, next) {
    try {
      const { phone, message } = req.body;
      if (!phone || !message) {
        return res.status(400).json({ success: false, message: 'Telefone e mensagem são obrigatórios.' });
      }

      const result = await this.evolution.sendText(phone, message);
      res.json({ success: true, result });
    } catch (err) {
      next(err);
    }
  }

  // --- EMAIL (SMTP & IMAP) ---
  async getEmailStatus(req, res, next) {
    try {
      const status = await this.emailCenter.getStatus();
      res.json({ success: true, status });
    } catch (err) {
      next(err);
    }
  }

  async sendTestEmail(req, res, next) {
    try {
      const { email } = req.body;
      const result = await this.emailCenter.sendTestEmail(email);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  // --- NOTÍCIAS DINÂMICAS ---
  async listNews(req, res, next) {
    try {
      const news = await this.repo.getNews();
      res.json({ success: true, news, data: news });
    } catch (err) {
      next(err);
    }
  }

  async createNews(req, res, next) {
    try {
      const { title, tag, excerpt, body } = req.body;
      if (!title || (!body && !req.body.summary)) {
        return res.status(400).json({ success: false, message: 'Título e conteúdo da notícia são obrigatórios.' });
      }

      const post = await this.repo.saveNews(req.body);
      res.status(201).json({ success: true, post, data: post });
    } catch (err) {
      next(err);
    }
  }

  async deleteNews(req, res, next) {
    try {
      const { slug } = req.params;
      await this.repo.deleteNews(slug);
      res.json({ success: true, message: 'Notícia eliminada com sucesso.' });
    } catch (err) {
      next(err);
    }
  }

  // --- GESTÃO DE EQUIPA ---
  async listTeam(req, res, next) {
    try {
      const team = await this.repo.getTeam();
      res.json({ success: true, team, data: team });
    } catch (err) {
      next(err);
    }
  }

  async createTeamMember(req, res, next) {
    try {
      const { name, role } = req.body;
      if (!name || !role) {
        return res.status(400).json({ success: false, message: 'Nome e cargo são obrigatórios.' });
      }
      const member = await this.repo.saveTeamMember(req.body);
      res.status(201).json({ success: true, member, data: member });
    } catch (err) {
      next(err);
    }
  }

  async deleteTeamMember(req, res, next) {
    try {
      const { id } = req.params;
      await this.repo.deleteTeamMember(id);
      res.json({ success: true, message: 'Membro da equipa removido com sucesso.' });
    } catch (err) {
      next(err);
    }
  }

  // --- GESTÃO DE PORTFÓLIO ---
  async listPortfolio(req, res, next) {
    try {
      const portfolio = await this.repo.getPortfolio();
      res.json({ success: true, portfolio, data: portfolio });
    } catch (err) {
      next(err);
    }
  }

  async createPortfolioItem(req, res, next) {
    try {
      const { title } = req.body;
      if (!title) {
        return res.status(400).json({ success: false, message: 'Título do projeto é obrigatório.' });
      }
      const item = await this.repo.savePortfolioItem(req.body);
      res.status(201).json({ success: true, item, data: item });
    } catch (err) {
      next(err);
    }
  }

  async deletePortfolioItem(req, res, next) {
    try {
      const { slug } = req.params;
      await this.repo.deletePortfolioItem(slug);
      res.json({ success: true, message: 'Projeto de portfólio removido com sucesso.' });
    } catch (err) {
      next(err);
    }
  }

  // --- DEFINIÇÕES DE EVOLUTION & EMAIL ---
  async getSettings(req, res, next) {
    try {
      const settings = await this.repo.getSettings();
      res.json({ success: true, settings, data: settings });
    } catch (err) {
      next(err);
    }
  }

  async updateSettings(req, res, next) {
    try {
      const updated = await this.repo.saveSettings(req.body);
      res.json({ success: true, settings: updated, data: updated });
    } catch (err) {
      next(err);
    }
  }

  // --- ATENDIMENTO MULTICANAL / SUPORTE ---
  async listSupportTickets(req, res, next) {
    try {
      const tickets = await this.repo.getSupportTickets();
      res.json({ success: true, tickets, data: tickets });
    } catch (err) {
      next(err);
    }
  }

  async addSupportMessage(req, res, next) {
    try {
      const { id } = req.params;
      const { content, channel, sender } = req.body;
      if (!content) {
        return res.status(400).json({ success: false, message: 'Conteúdo da mensagem é obrigatório.' });
      }
      const message = await this.repo.saveSupportMessage(id, { content, channel, sender });
      res.status(201).json({ success: true, message });
    } catch (err) {
      next(err);
    }
  }

  async updateSupportStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const ticket = await this.repo.updateTicketStatus(id, status);
      res.json({ success: true, ticket });
    } catch (err) {
      next(err);
    }
  }

  // --- DISPARO EM MASSA (WHATSAPP, EMAIL, SMS) ---
  async listBroadcasts(req, res, next) {
    try {
      const broadcasts = await this.repo.getBroadcasts();
      res.json({ success: true, broadcasts, data: broadcasts });
    } catch (err) {
      next(err);
    }
  }

  async sendBroadcast(req, res, next) {
    try {
      const { title, channels, audience, message, subject } = req.body;
      if (!message) {
        return res.status(400).json({ success: false, message: 'Conteúdo da mensagem de disparo é obrigatório.' });
      }

      const campaign = await this.repo.createBroadcastCampaign(req.body);
      res.status(201).json({ success: true, campaign, data: campaign });
    } catch (err) {
      next(err);
    }
  }

  // --- CRM & FUNIL DE VENDAS ---
  async listCrmDeals(req, res, next) {
    try {
      const deals = await this.repo.getCrmDeals();
      res.json({ success: true, deals, data: deals });
    } catch (err) {
      next(err);
    }
  }

  async createCrmDeal(req, res, next) {
    try {
      const { clientName, company, value } = req.body;
      if (!clientName || !company) {
        return res.status(400).json({ success: false, message: 'Nome do cliente e empresa são obrigatórios.' });
      }
      const deal = await this.repo.saveCrmDeal(req.body);
      res.status(201).json({ success: true, deal, data: deal });
    } catch (err) {
      next(err);
    }
  }

  async updateDealStage(req, res, next) {
    try {
      const { id } = req.params;
      const { stage } = req.body;
      const deal = await this.repo.updateDealStage(id, stage);
      res.json({ success: true, deal, data: deal });
    } catch (err) {
      next(err);
    }
  }

  async addDealInteraction(req, res, next) {
    try {
      const { id } = req.params;
      const interaction = await this.repo.addDealInteraction(id, req.body);
      res.status(201).json({ success: true, interaction, data: interaction });
    } catch (err) {
      next(err);
    }
  }

  async deleteCrmDeal(req, res, next) {
    try {
      const { id } = req.params;
      await this.repo.deleteCrmDeal(id);
      res.json({ success: true, message: 'Negócio removido do CRM com sucesso.' });
    } catch (err) {
      next(err);
    }
  }
}
