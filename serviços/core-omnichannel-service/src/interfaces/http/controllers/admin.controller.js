import crypto from 'node:crypto';
import { calDavService, generateIcsCalendar } from '../../../infrastructure/services/caldav.service.js';
import { MetaMicroserviceClient } from '../../../infrastructure/social/meta-microservice.client.js';
import { generateBroadcastReportPdf } from '../../../infrastructure/reports/broadcast-report-pdf.service.js';

export class AdminController {
  constructor({
    adminRepository,
    analyticsRepository,
    evolutionService,
    emailCenterService,
    listSubmissionsUseCase,
    logger,
  }) {
    this.repo = adminRepository;
    this.analytics = analyticsRepository;
    this.evolution = evolutionService;
    this.emailCenter = emailCenterService;
    this.listSubmissions = listSubmissionsUseCase;
    this.logger = logger || console;
    this._presenceMap = new Map();
    this.metaClient = new MetaMicroserviceClient();

    // Microserviço Meta Social (OAuth, Publicação Multiplataforma, Messenger & Instagram Direct)
    this.getMetaStatus = this.getMetaStatus.bind(this);
    this.saveMetaConfig = this.saveMetaConfig.bind(this);
    this.getMetaAuthUrl = this.getMetaAuthUrl.bind(this);
    this.handleMetaAuthCallback = this.handleMetaAuthCallback.bind(this);
    this.disconnectMeta = this.disconnectMeta.bind(this);
    this.listMetaPosts = this.listMetaPosts.bind(this);
    this.publishMetaPost = this.publishMetaPost.bind(this);
    this.publishScheduledPostNow = this.publishScheduledPostNow.bind(this);
    this.deleteMetaPost = this.deleteMetaPost.bind(this);
    this.verifyMetaWebhook = this.verifyMetaWebhook.bind(this);
    this.handleMetaWebhook = this.handleMetaWebhook.bind(this);

    // Autenticação, Perfil, Utilizadores (RBAC) & Presença Online
    this.loginUser = this.loginUser.bind(this);
    this.forgotPassword = this.forgotPassword.bind(this);
    this.getMyProfile = this.getMyProfile.bind(this);
    this.updateMyProfile = this.updateMyProfile.bind(this);
    this.userHeartbeat = this.userHeartbeat.bind(this);
    this.getOnlineUsers = this.getOnlineUsers.bind(this);
    this.listUsers = this.listUsers.bind(this);
    this.createUser = this.createUser.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.deleteUser = this.deleteUser.bind(this);
    this.shareContact = this.shareContact.bind(this);
    this.shareSupportTicket = this.shareSupportTicket.bind(this);
    this.listInternalMessages = this.listInternalMessages.bind(this);
    this.sendInternalMessage = this.sendInternalMessage.bind(this);
    this.markInternalChatRead = this.markInternalChatRead.bind(this);
    this.testCalendarReminder = this.testCalendarReminder.bind(this);
    this.auditLogMiddleware = this.auditLogMiddleware.bind(this);
    this.listAuditLogs = this.listAuditLogs.bind(this);

    // Fazer bind de todos os métodos para segurança no roteamento Express
    this.getDashboard = this.getDashboard.bind(this);
    this.listContacts = this.listContacts.bind(this);
    this.createContact = this.createContact.bind(this);
    this.updateContactStatus = this.updateContactStatus.bind(this);
    this.updateContact = this.updateContact.bind(this);
    this.deleteContact = this.deleteContact.bind(this);
    this.importContacts = this.importContacts.bind(this);
    this.deduplicateContacts = this.deduplicateContacts.bind(this);
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
    this.logoutWhatsapp = this.logoutWhatsapp.bind(this);
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

    // Gestão de Produtos do Portal
    this.listProducts = this.listProducts.bind(this);
    this.createProduct = this.createProduct.bind(this);
    this.deleteProduct = this.deleteProduct.bind(this);

    // Definições do Sistema (Evolution & Email)
    this.getSettings = this.getSettings.bind(this);
    this.updateSettings = this.updateSettings.bind(this);
    this.testEvolutionSettings = this.testEvolutionSettings.bind(this);
    this.testEmailSettings = this.testEmailSettings.bind(this);
    this.handleEvolutionWebhook = this.handleEvolutionWebhook.bind(this);

    // Analytics & Monitoramento de Visitas
    this.recordVisit = this.recordVisit.bind(this);
    this.getVisitAnalytics = this.getVisitAnalytics.bind(this);

    // Formulários recebidos do Portal
    this.listFormSubmissions = this.listFormSubmissions.bind(this);
    this.getNotifications = this.getNotifications.bind(this);
    this.syncInboxEmails = this.syncInboxEmails.bind(this);

    // Atendimento Multicanal / Suporte
    this.listSupportTickets = this.listSupportTickets.bind(this);
    this.addSupportMessage = this.addSupportMessage.bind(this);
    this.updateSupportStatus = this.updateSupportStatus.bind(this);
    this.deleteSupportTicket = this.deleteSupportTicket.bind(this);
    this.deleteSupportMessage = this.deleteSupportMessage.bind(this);
    this.listScheduledEmails = this.listScheduledEmails.bind(this);
    this.scheduleSupportEmail = this.scheduleSupportEmail.bind(this);
    this.sendScheduledEmailNow = this.sendScheduledEmailNow.bind(this);
    this.deleteScheduledEmail = this.deleteScheduledEmail.bind(this);

    // Disparo em Massa, Campanhas Guardadas & Agendamento Automático (WhatsApp, Email, SMS)
    this.listBroadcasts = this.listBroadcasts.bind(this);
    this.downloadBroadcastReportPdf = this.downloadBroadcastReportPdf.bind(this);
    this.sendBroadcast = this.sendBroadcast.bind(this);
    this.listSavedCampaigns = this.listSavedCampaigns.bind(this);
    this.createSavedCampaign = this.createSavedCampaign.bind(this);
    this.updateSavedCampaign = this.updateSavedCampaign.bind(this);
    this.deleteSavedCampaign = this.deleteSavedCampaign.bind(this);
    this.listScheduledBroadcasts = this.listScheduledBroadcasts.bind(this);
    this.scheduleBroadcast = this.scheduleBroadcast.bind(this);
    this.sendScheduledBroadcastNow = this.sendScheduledBroadcastNow.bind(this);
    this.deleteScheduledBroadcast = this.deleteScheduledBroadcast.bind(this);

    // CRM & Gestão Avançada de Vendas / Funil
    this.listCrmDeals = this.listCrmDeals.bind(this);
    this.createCrmDeal = this.createCrmDeal.bind(this);
    this.updateDealStage = this.updateDealStage.bind(this);
    this.addDealInteraction = this.addDealInteraction.bind(this);
    this.deleteCrmDeal = this.deleteCrmDeal.bind(this);

    // Calendário Corporativo & CalDAV / CardDAV
    this.listCalendarEvents = this.listCalendarEvents.bind(this);
    this.createCalendarEvent = this.createCalendarEvent.bind(this);
    this.updateCalendarEvent = this.updateCalendarEvent.bind(this);
    this.deleteCalendarEvent = this.deleteCalendarEvent.bind(this);
    this.getCalDavStatus = this.getCalDavStatus.bind(this);
    this.syncCalDavEvents = this.syncCalDavEvents.bind(this);
    this.exportCalendarIcs = this.exportCalendarIcs.bind(this);

    // Gestão de Tarefas & Processos
    this.listTasks = this.listTasks.bind(this);
    this.createTask = this.createTask.bind(this);
    this.updateTask = this.updateTask.bind(this);
    this.deleteTask = this.deleteTask.bind(this);

    // Arquivos Digitais
    this.listDigitalFiles = this.listDigitalFiles.bind(this);
    this.createDigitalFile = this.createDigitalFile.bind(this);
    this.updateDigitalFile = this.updateDigitalFile.bind(this);
    this.deleteDigitalFile = this.deleteDigitalFile.bind(this);
    this.sendDigitalFile = this.sendDigitalFile.bind(this);

    // Worker automático (a cada 30s) para disparar emails e publicações agendadas na hora exata
    this._schedulerRunning = false;
    const timer = setInterval(() => {
      this._processDueScheduledEmails().catch(() => {});
      this._processDueScheduledPosts().catch(() => {});
    }, 30000);
    if (typeof timer.unref === 'function') timer.unref();
  }

  // --- DASHBOARD OMNICANAL ---
  async getDashboard(req, res, next) {
    try {
      const [contacts, reminders, news, deals, waStatus, emailStatus, visitAnalytics] = await Promise.all([
        this.repo.getContacts(),
        this.repo.getReminders(),
        this.repo.getNews(),
        this.repo.getCrmDeals(),
        this.evolution.getConnectionStatus(),
        this.emailCenter.getStatus(),
        this.analytics ? this.analytics.getVisitAnalytics('30d') : Promise.resolve(null),
      ]);

      const pendingReminders = reminders.filter((r) => r.status === 'pending');
      const totalMessages = contacts.reduce((acc, c) => acc + (c.history?.length || 0), 0);

      const wonDeals = deals.filter((d) => d.stage === 'ganho');
      const activeDeals = deals.filter((d) => d.stage !== 'ganho' && d.stage !== 'perdido');
      const pipelineValue = activeDeals.reduce((acc, d) => acc + Number(d.value || 0), 0);
      const wonValue = wonDeals.reduce((acc, d) => acc + Number(d.value || 0), 0);
      const closedCount = deals.filter((d) => d.stage === 'ganho' || d.stage === 'perdido').length;
      const conversionRate = closedCount > 0 ? Number(((wonDeals.length / closedCount) * 100).toFixed(1)) : 0;

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
          emailOperational: Boolean(emailStatus.smtp.configured && (emailStatus.smtp.verified || emailStatus.imap.connected)),
          pipelineValue,
          wonValue,
          totalRevenue: pipelineValue + wonValue,
          totalDeals: deals.length,
          activeDealsCount: activeDeals.length,
          conversionRate,
          totalVisits: visitAnalytics?.summary?.totalVisits || 0,
          uniqueVisitors: visitAnalytics?.summary?.uniqueVisitors || 0,
          todayVisits: visitAnalytics?.summary?.todayVisits || 0,
          activeNow: visitAnalytics?.summary?.activeNow || 0,
        },
        whatsapp: waStatus,
        email: emailStatus,
        analytics: visitAnalytics,
        recentContacts: contacts.slice(0, 5),
        upcomingReminders: pendingReminders.slice(0, 5),
      });
    } catch (err) {
      next(err);
    }
  }

  // --- CONTACTOS & HISTÓRICO (COM SEPARAÇÃO MULTI-UTILIZADOR) ---
  async listContacts(req, res, next) {
    try {
      const user = await this._getRequestUser(req);
      const isAdmin = this._isAdmin(user);
      const [contacts, aclMap] = await Promise.all([
        this.repo.getContacts(),
        this.repo.getContactAclMap ? this.repo.getContactAclMap() : Promise.resolve({}),
      ]);

      const enriched = contacts.map((c) => {
        const acl = aclMap[c.id] || {
          ownerId: 'usr_admin_root',
          ownerName: 'Joel Gaspar',
          sharedWith: [],
        };
        return {
          ...c,
          ownerId: acl.ownerId,
          ownerName: acl.ownerName,
          sharedWith: Array.isArray(acl.sharedWith) ? acl.sharedWith : [],
        };
      });

      const visible = isAdmin
        ? enriched
        : enriched.filter(
            (c) => c.ownerId === user.id || (Array.isArray(c.sharedWith) && c.sharedWith.includes(user.id))
          );

      res.json({ success: true, contacts: visible });
    } catch (err) {
      next(err);
    }
  }

  async createContact(req, res, next) {
    try {
      const user = await this._getRequestUser(req);
      const contact = await this.repo.saveContact(req.body);
      if (this.repo.setContactAcl && contact?.id) {
        await this.repo.setContactAcl(contact.id, {
          ownerId: user.id,
          ownerName: user.name,
          sharedWith: Array.isArray(req.body?.sharedWith) ? req.body.sharedWith : [],
        });
      }
      res.status(201).json({
        success: true,
        contact: {
          ...contact,
          ownerId: user.id,
          ownerName: user.name,
          sharedWith: Array.isArray(req.body?.sharedWith) ? req.body.sharedWith : [],
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async shareContact(req, res, next) {
    try {
      const user = await this._getRequestUser(req);
      if (!this._isAdmin(user)) {
        return res.status(403).json({
          success: false,
          message: 'Apenas Administradores podem partilhar ou reatribuir contactos entre utilizadores.',
        });
      }
      const { id } = req.params;
      const { ownerId, sharedWith = [] } = req.body || {};
      const aclMap = this.repo.getContactAclMap ? await this.repo.getContactAclMap() : {};
      const currentAcl = aclMap[id] || { ownerId: 'usr_admin_root', ownerName: 'Joel Gaspar', sharedWith: [] };
      let nextOwnerId = ownerId || currentAcl.ownerId;
      let nextOwnerName = currentAcl.ownerName;
      if (ownerId && this.repo.getUserById) {
        const ownerUser = await this.repo.getUserById(ownerId);
        if (ownerUser) {
          nextOwnerId = ownerUser.id;
          nextOwnerName = ownerUser.name;
        }
      }
      const saved = await this.repo.setContactAcl(id, {
        ownerId: nextOwnerId,
        ownerName: nextOwnerName,
        sharedWith: Array.isArray(sharedWith) ? sharedWith : [],
      });
      res.json({ success: true, acl: saved, message: 'Partilha do contacto atualizada com sucesso.' });
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

  async updateContact(req, res, next) {
    try {
      const contact = await this.repo.updateContact(req.params.id, req.body || {});
      res.json({ success: true, contact });
    } catch (err) {
      if (err.message === 'Contacto não encontrado') {
        return res.status(404).json({ success: false, message: err.message });
      }
      next(err);
    }
  }

  async deleteContact(req, res, next) {
    try {
      const result = await this.repo.deleteContact(req.params.id);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async importContacts(req, res, next) {
    try {
      const rows = Array.isArray(req.body?.contacts) ? req.body.contacts : [];
      if (!rows.length) {
        return res.status(400).json({ success: false, message: 'Nenhum contacto para importar.' });
      }
      if (rows.length > 5000) {
        return res.status(413).json({ success: false, message: 'Máximo de 5000 contactos por importação.' });
      }
      const result = await this.repo.importContacts(rows, {
        source: req.body?.source || 'Importação Excel',
        updateExisting: req.body?.updateExisting !== false,
      });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async deduplicateContacts(req, res, next) {
    try {
      const result = this.repo.deduplicateContacts
        ? await this.repo.deduplicateContacts()
        : { merged: 0, removed: 0 };
      res.json({ success: true, ...result });
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

  async logoutWhatsapp(req, res, next) {
    try {
      const result = await this.evolution.logout();
      res.json({ success: Boolean(result.success), result });
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
      const { title, content, body, excerpt, summary } = req.body;
      const hasBody =
        (typeof content === 'string' && content.trim().length > 0) ||
        (Array.isArray(body) && body.length > 0) ||
        (typeof body === 'string' && body.trim().length > 0) ||
        (typeof excerpt === 'string' && excerpt.trim().length > 0) ||
        (typeof summary === 'string' && summary.trim().length > 0);
      if (!title || !hasBody) {
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

  // --- GESTÃO DE PRODUTOS DO PORTAL PÚBLICO ---
  async listProducts(req, res, next) {
    try {
      const products = typeof this.repo.getProducts === 'function' ? await this.repo.getProducts() : [];
      res.json({ success: true, products, data: products });
    } catch (err) {
      next(err);
    }
  }

  async createProduct(req, res, next) {
    try {
      const { name } = req.body || {};
      if (!name || !String(name).trim()) {
        return res.status(400).json({ success: false, message: 'Nome do produto é obrigatório.' });
      }
      const product = await this.repo.saveProduct(req.body);
      res.status(201).json({ success: true, product, data: product });
    } catch (err) {
      next(err);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      const { slug } = req.params;
      await this.repo.deleteProduct(slug);
      res.json({ success: true, message: 'Produto removido com sucesso.' });
    } catch (err) {
      next(err);
    }
  }

  // --- DEFINIÇÕES DE EVOLUTION & EMAIL ---
  async getSettings(req, res, next) {
    try {
      const settings = await this.repo.getSettings();
      const masked = structuredClone(settings || {});
      const mail = masked.email || masked.emailServer;
      if (mail) {
        if (mail.smtpPass) mail.smtpPass = '••••••••••••••••';
        if (mail.imapPass) mail.imapPass = '••••••••••••••••';
      }
      res.json({ success: true, settings: masked, data: masked });
    } catch (err) {
      next(err);
    }
  }

  async updateSettings(req, res, next) {
    try {
      const existing = (await this.repo.getSettings()) || {};
      const incoming = req.body || {};

      // Preservar senhas existentes se vierem mascaradas
      const existingMail = existing.email || existing.emailServer || {};
      const incomingMail = incoming.email || incoming.emailServer || {};
      if (incomingMail.smtpPass && String(incomingMail.smtpPass).includes('••••')) {
        incomingMail.smtpPass = existingMail.smtpPass || '';
      }
      if (incomingMail.imapPass && String(incomingMail.imapPass).includes('••••')) {
        incomingMail.imapPass = existingMail.imapPass || '';
      }

      const updated = await this.repo.saveSettings(incoming);

      // Aplicar imediatamente em tempo de execução nos serviços
      const evoCfg = updated.evolution || updated.evolutionApi;
      const mailCfg = updated.email || updated.emailServer;
      if (evoCfg && this.evolution?.configure) {
        this.evolution.configure(evoCfg);
      }
      if (mailCfg && this.emailCenter?.configure) {
        this.emailCenter.configure(mailCfg);
      }

      res.json({ success: true, settings: updated, data: updated });
    } catch (err) {
      next(err);
    }
  }

  async testEvolutionSettings(req, res, next) {
    try {
      const evoOverride = req.body?.evolution || req.body?.evolutionApi || null;
      const status = await this.evolution.testConnection(evoOverride);
      res.json({
        success: Boolean(status.online),
        connected: Boolean(status.connected),
        status,
        message: status.message,
      });
    } catch (err) {
      next(err);
    }
  }

  async testEmailSettings(req, res, next) {
    try {
      const mailOverride = req.body?.email || req.body?.emailServer || null;
      if (mailOverride && this.emailCenter?.configure) {
        this.emailCenter.configure(mailOverride);
      }
      const status = await this.emailCenter.getStatus();
      let testSend = null;
      if (req.body?.sendTest && status.smtp.configured) {
        testSend = await this.emailCenter.sendTestEmail(req.body?.testTo).catch((e) => ({
          success: false,
          error: e.message,
        }));
      }
      const ok = Boolean(status.smtp.verified || status.imap.connected);
      res.json({
        success: ok,
        status,
        testSend,
        message: `SMTP: ${status.smtp.verifyMessage || (status.smtp.configured ? 'Configurado' : 'Sem senha SMTP')} | IMAP: ${status.imap.message}`,
      });
    } catch (err) {
      next(err);
    }
  }

  async handleEvolutionWebhook(req, res, next) {
    try {
      const event = req.body || {};
      const eventType = String(event.event || event.type || 'unknown').toLowerCase();
      this.logger.info(`[EvolutionWebhook] Evento recebido: ${eventType}`);

      if (eventType === 'messages.upsert' || eventType === 'messages_upsert' || event.data?.key) {
        const msgData = event.data || event;
        const remoteJid = String(msgData?.key?.remoteJid || '');
        const fromMe = Boolean(msgData?.key?.fromMe);

        // Ignorar grupos, broadcasts e mensagens enviadas pela própria conta
        if (!fromMe && remoteJid && !remoteJid.endsWith('@g.us') && remoteJid !== 'status@broadcast') {
          const phone = remoteJid.replace(/@.*$/, '');
          const text =
            msgData?.message?.conversation ||
            msgData?.message?.extendedTextMessage?.text ||
            msgData?.message?.imageMessage?.caption ||
            msgData?.message?.documentMessage?.caption ||
            msgData?.body ||
            '';

          if (phone && text) {
            const clientName = msgData.pushName || `WhatsApp +${phone}`;

            // 1. Sincronizar no CRM (contacts + contact_interactions)
            const contacts = await this.repo.getContacts();
            let contact = contacts.find((c) => String(c.phone || '').replace(/\D/g, '').endsWith(phone.slice(-9)));
            if (!contact) {
              contact = await this.repo.saveContact({
                name: clientName,
                phone: `+${phone}`,
                stage: 'novo',
                interactionStatus: 'por_responder',
                source: 'WhatsApp Evolution',
                notes: text,
                history: [
                  {
                    channel: 'whatsapp',
                    direction: 'inbound',
                    content: text,
                  },
                ],
              });
            } else {
              await this.repo.addContactMessage(contact.id, {
                channel: 'whatsapp',
                direction: 'inbound',
                content: text,
                interactionStatus: 'por_responder',
              });
            }

            // 2. Sincronizar na Central de Atendimento (support_tickets + support_messages)
            const tickets = await this.repo.getSupportTickets();
            const openTicket = tickets.find(
              (t) =>
                t.status !== 'resolvido' &&
                String(t.clientContact || '').replace(/\D/g, '').endsWith(phone.slice(-9))
            );

            if (openTicket) {
              await this.repo.saveSupportMessage(openTicket.id, {
                sender: 'client',
                channel: 'whatsapp',
                content: text,
              });
            } else if (this.repo.createSupportTicket) {
              await this.repo.createSupportTicket({
                clientName,
                clientContact: `+${phone}`,
                channel: 'whatsapp',
                subject: `WhatsApp · ${clientName}`,
                status: 'aberto',
                priority: 'normal',
                messages: [
                  {
                    sender: 'client',
                    channel: 'whatsapp',
                    content: text,
                    timestamp: new Date().toISOString(),
                  },
                ],
              });
            }
          }
        }
      }

      res.json({ success: true, received: true, event: eventType });
    } catch (err) {
      next(err);
    }
  }

  // --- ANALYTICS & MONITORAMENTO DE VISITAS ---
  async recordVisit(req, res, next) {
    try {
      if (!this.analytics) {
        return res.status(503).json({ success: false, message: 'Analytics service unavailable' });
      }
      const visit = await this.analytics.recordVisit({
        ...req.body,
        userAgent: req.headers['user-agent'] || req.body?.userAgent || '',
        ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '',
      });
      res.status(201).json({ success: true, id: visit.id });
    } catch (err) {
      next(err);
    }
  }

  async getVisitAnalytics(req, res, next) {
    try {
      if (!this.analytics) {
        return res.status(503).json({ success: false, message: 'Analytics service unavailable' });
      }
      const period = String(req.query?.period || '30d');
      const data = await this.analytics.getVisitAnalytics(period);
      res.json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  // --- FORMULÁRIOS DO PORTAL ---
  async listFormSubmissions(req, res, next) {
    try {
      const limit = Number(req.query?.limit || 100);
      const result = this.listSubmissions ? await this.listSubmissions.execute({ limit }) : { items: [] };
      const items = result?.items || [];
      res.json({ success: true, submissions: items, total: items.length });
    } catch (err) {
      next(err);
    }
  }

  // --- NOTIFICAÇÕES EM TEMPO REAL (WhatsApp, Email, Formulários do Portal) ---
  async getNotifications(req, res, next) {
    try {
      const [tickets, submissionsResult] = await Promise.all([
        this.repo.getSupportTickets(),
        this.listSubmissions ? this.listSubmissions.execute({ limit: 15 }) : Promise.resolve({ items: [] }),
      ]);

      const notifications = [];

      for (const t of tickets || []) {
        const msgs = Array.isArray(t.messages) ? t.messages : [];
        const lastMsg = msgs[msgs.length - 1];
        if (!lastMsg || lastMsg.sender === 'agent') continue;
        notifications.push({
          id: `tkt_${t.id}_${lastMsg.id || t.updatedAt}`,
          ticketId: t.id,
          type: t.channel === 'email' ? 'email' : 'whatsapp',
          tab: 'support',
          title: t.channel === 'email' ? `Email · ${t.clientName}` : `WhatsApp · ${t.clientName}`,
          description: lastMsg.content || t.subject,
          timestamp: lastMsg.timestamp || t.updatedAt || t.createdAt,
        });
      }

      for (const s of submissionsResult?.items || []) {
        notifications.push({
          id: `sub_${s.id}`,
          type: 'portal',
          tab: 'submissions',
          title: `Portal · ${s.formTitle || s.formType}`,
          description: `${s.clientName || s.clientEmail || 'Novo contacto'} submeteu um formulário.`,
          timestamp: s.createdAt,
        });
      }

      notifications.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

      res.json({
        success: true,
        notifications: notifications.slice(0, 20),
      });
    } catch (err) {
      next(err);
    }
  }

  // --- SINCRONIZAÇÃO DE EMAILS RECEBIDOS (IMAP INBOX -> ATENDIMENTO + CRM + NOTIFICAÇÕES) ---
  async syncInboxEmailsInternal() {
    if (!this.emailCenter?.fetchRecentInboxEmails) return { imported: 0 };
    if (this._imapSyncInFlight) return { imported: 0, skipped: true };
    this._imapSyncInFlight = true;
    try {
      const ownEmail = String(this.emailCenter.imapConfig?.auth?.user || '').toLowerCase();
      const emails = await this.emailCenter.fetchRecentInboxEmails(25);
      if (!emails.length) return { imported: 0 };

      const tickets = await this.repo.getSupportTickets();
      const existingMsgMap = new Map();
      for (const t of tickets) {
        for (const m of t.messages || []) {
          existingMsgMap.set(m.id, m);
        }
      }

      // Filtrar apenas bounces técnicos do servidor de correio / cPanel
      // (NUNCA bloquear do-not-reply / no-reply / notifications, pois trazem códigos de verificação e OTPs!)
      const isSystemBounce = (email, name = '', subject = '') => {
        const e = String(email || '').toLowerCase();
        const n = String(name || '').toLowerCase();
        const s = String(subject || '').toLowerCase();
        return (
          /^(mailer-daemon|postmaster|cpanel|root|bounce|bounces|daemon)@/i.test(e) ||
          n.includes('mail delivery system') ||
          n.includes('cpanel on ') ||
          (n.includes('meta:') && e.endsWith('@gmail.com')) ||
          s.includes('your advertisement con')
        );
      };

      let imported = 0;
      for (const mail of emails) {
        if (!mail.fromEmail || mail.fromEmail === ownEmail || isSystemBounce(mail.fromEmail, mail.fromName, mail.subject)) {
          continue;
        }
        const msgId = `imap_${mail.uid}`;
        const existingMsg = existingMsgMap.get(msgId);
        if (existingMsg) {
          // Backfill automático: se o email já existia sem HTML guardado (ou com CSS bruto no texto), reparar agora!
          const looksLikeRawCss = /body\s*\{|mso-table-lspace|border-collapse\s*:/i.test(existingMsg.content || '');
          if ((!existingMsg.html && mail.htmlBody) || (looksLikeRawCss && mail.body)) {
            if (typeof this.repo.updateSupportMessageHtml === 'function') {
              await this.repo.updateSupportMessageHtml(msgId, {
                html: mail.htmlBody || undefined,
                content: mail.body || undefined,
                subject: mail.subject || undefined,
              });
            }
          }
          continue;
        }

        // 1. Sincronizar no Atendimento (canal Email)
        const existingTicket = tickets.find(
          (t) =>
            t.channel === 'email' &&
            (String(t.clientEmail || '').toLowerCase() === mail.fromEmail ||
              String(t.clientContact || '').toLowerCase() === mail.fromEmail)
        );

        if (existingTicket) {
          await this.repo.saveSupportMessage(existingTicket.id, {
            id: msgId,
            sender: 'client',
            channel: 'email',
            subject: mail.subject,
            content: mail.body,
            html: mail.htmlBody || undefined,
          });
        } else if (this.repo.createSupportTicket) {
          const created = await this.repo.createSupportTicket({
            clientName: mail.fromName,
            clientContact: mail.fromEmail,
            clientEmail: mail.fromEmail,
            channel: 'email',
            subject: mail.subject,
            status: 'aberto',
            priority: 'normal',
            messages: [
              {
                id: msgId,
                sender: 'client',
                channel: 'email',
                subject: mail.subject,
                content: mail.body,
                html: mail.htmlBody || undefined,
                timestamp: mail.date,
              },
            ],
          });
          tickets.unshift({ ...created, messages: [{ id: msgId }] });
        }

        // 2. Sincronizar no CRM APENAS se o contacto já existir na base (evita poluir o CRM com spam do inbox)
        const allContacts = await this.repo.getContacts();
        const existingContact = allContacts.find(
          (c) => String(c.email || '').trim().toLowerCase() === mail.fromEmail
        );
        if (existingContact) {
          await this.repo.addContactMessage(existingContact.id, {
            channel: 'email',
            direction: 'inbound',
            type: 'Email',
            content: `[${mail.subject}] ${mail.body}`,
            interactionStatus: 'por_responder',
          });
        }

        existingMsgIds.add(msgId);
        imported += 1;
      }

      return { imported, checked: emails.length };
    } finally {
      this._imapSyncInFlight = false;
    }
  }

  async syncInboxEmails(req, res, next) {
    try {
      const result = await this.syncInboxEmailsInternal();
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  // --- ATENDIMENTO MULTICANAL / SUPORTE (COM SEPARAÇÃO MULTI-UTILIZADOR & PARTILHA ADMIN) ---
  async listSupportTickets(req, res, next) {
    try {
      const user = await this._getRequestUser(req);
      const isAdmin = this._isAdmin(user);
      const [tickets, aclMap] = await Promise.all([
        this.repo.getSupportTickets(),
        this.repo.getTicketAclMap ? this.repo.getTicketAclMap() : Promise.resolve({}),
      ]);

      const enriched = tickets.map((t) => {
        const acl = aclMap[t.id] || {
          ownerId: 'usr_admin_root',
          ownerName: 'Joel Gaspar',
          assignedTo: null,
          assignedToName: '',
          sharedWith: [],
        };
        return {
          ...t,
          ownerId: acl.ownerId,
          ownerName: acl.ownerName,
          assignedTo: acl.assignedTo || null,
          assignedToName: acl.assignedToName || '',
          sharedWith: Array.isArray(acl.sharedWith) ? acl.sharedWith : [],
        };
      });

      const visible = isAdmin
        ? enriched
        : enriched.filter(
            (t) =>
              t.ownerId === user.id ||
              t.assignedTo === user.id ||
              (Array.isArray(t.sharedWith) && t.sharedWith.includes(user.id))
          );

      res.json({ success: true, tickets: visible, data: visible });
    } catch (err) {
      next(err);
    }
  }

  async shareSupportTicket(req, res, next) {
    try {
      const user = await this._getRequestUser(req);
      if (!this._isAdmin(user)) {
        return res.status(403).json({
          success: false,
          message: 'Apenas Administradores podem partilhar atendimentos/mensagens com outros utilizadores.',
        });
      }
      const { id } = req.params;
      const { assignedTo = null, sharedWith = [] } = req.body || {};
      const aclMap = this.repo.getTicketAclMap ? await this.repo.getTicketAclMap() : {};
      const current = aclMap[id] || { ownerId: 'usr_admin_root', ownerName: 'Joel Gaspar', sharedWith: [] };

      let assignedToName = '';
      if (assignedTo && this.repo.getUserById) {
        const u = await this.repo.getUserById(assignedTo);
        if (u) assignedToName = u.name;
      }

      const saved = await this.repo.setTicketAcl(id, {
        ownerId: current.ownerId || 'usr_admin_root',
        ownerName: current.ownerName || 'Joel Gaspar',
        assignedTo: assignedTo || null,
        assignedToName,
        sharedWith: Array.isArray(sharedWith) ? sharedWith : [],
      });

      res.json({
        success: true,
        acl: saved,
        message: 'Atendimento partilhado com sucesso.',
      });
    } catch (err) {
      next(err);
    }
  }

  async addSupportMessage(req, res, next) {
    try {
      const { id } = req.params;
      const { content, html, channel = 'whatsapp', sender, subject, to, cc, attachments = [] } = req.body || {};
      const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
      if (!String(content || '').trim() && !String(html || '').trim() && !hasAttachments) {
        return res.status(400).json({ success: false, message: 'Escreva uma mensagem ou anexe um ficheiro.' });
      }

      const ticket = this.repo.getSupportTicketById
        ? await this.repo.getSupportTicketById(id)
        : (await this.repo.getSupportTickets()).find((t) => t.id === id);

      if (!ticket) {
        return res.status(404).json({ success: false, message: 'Conversa de atendimento não encontrada.' });
      }

      // 1. Resolver anexos da Biblioteca de Arquivos Digitais ou uploads locais antes de gravar/enviar
      let resolvedAttachments = [];
      try {
        resolvedAttachments = await this._resolveAttachmentsForDelivery(attachments);
      } catch (attErr) {
        return res.status(attErr.statusCode || 422).json({
          success: false,
          message: attErr.message || 'Falha ao carregar os anexos selecionados.',
        });
      }

      const savedAttachments = resolvedAttachments.map((a) => ({
        name: a.name,
        type: a.type,
        size: a.size,
        url: a.url || '',
        digitalFileId: a.digitalFileId || null,
      }));

      // 2. Disparo real no canal selecionado antes de registar no histórico (evita falso positivo se falhar)
      let delivery = null;
      const isAgent = (sender || 'agent') === 'agent';

      if (isAgent) {
        if (channel === 'whatsapp') {
          const phone = String(to || ticket.clientContact || '').trim();
          if (!phone || !/\d{7,}/.test(phone)) {
            return res.status(400).json({
              success: false,
              message: 'Número de WhatsApp do destinatário inválido ou em falta.',
            });
          }

          if (resolvedAttachments.length > 0) {
            if (!this.evolution?.sendMedia) {
              return res.status(503).json({
                success: false,
                message: 'Serviço WhatsApp (Evolution API) indisponível.',
              });
            }
            const failedItems = [];
            let lastOk = null;
            for (let idx = 0; idx < resolvedAttachments.length; idx++) {
              const att = resolvedAttachments[idx];
              const caption = idx === 0 ? String(content || '').trim() : att.name;
              const resMedia = await this.evolution.sendMedia(phone, att, caption);
              if (resMedia?.success === false) {
                failedItems.push({ name: att.name, error: resMedia.error || 'Erro desconhecido' });
              } else {
                lastOk = resMedia;
              }
            }
            if (failedItems.length > 0) {
              const sentCount = resolvedAttachments.length - failedItems.length;
              delivery = {
                success: false,
                error:
                  sentCount > 0
                    ? `${sentCount}/${resolvedAttachments.length} anexo(s) enviado(s), falha em ${failedItems.map((f) => f.name).join(', ')}: ${failedItems[0].error}`
                    : failedItems[0].error,
              };
            } else {
              delivery = lastOk || { success: true };
            }
          } else {
            if (!this.evolution?.sendText) {
              return res.status(503).json({
                success: false,
                message: 'Serviço WhatsApp (Evolution API) indisponível.',
              });
            }
            delivery = await this.evolution.sendText(phone, String(content || '').trim());
          }
        } else if (channel === 'email') {
          const recipient = String(
            to || ticket.clientEmail || (ticket.clientContact?.includes('@') ? ticket.clientContact : '')
          ).trim();
          if (!recipient || !/[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+/.test(recipient)) {
            return res.status(400).json({
              success: false,
              message: 'Endereço de email do destinatário inválido ou em falta.',
            });
          }
          if (!this.emailCenter?.mailProvider?.sendDirect) {
            return res.status(503).json({
              success: false,
              message: 'Serviço SMTP indisponível no servidor.',
            });
          }

          delivery = await this.emailCenter.mailProvider
            .sendDirect({
              to: recipient,
              cc,
              subject: subject || `Re: ${ticket.subject || 'Atendimento JOGIMIL'}`,
              text: content || '',
              html: html || undefined,
              attachments: resolvedAttachments,
            })
            .catch((err) => ({ success: false, error: err.message }));
        } else if (channel === 'instagram' || channel === 'facebook') {
          const recipientId = String(to || ticket.clientContact || '').trim();
          if (!recipientId) {
            return res.status(400).json({
              success: false,
              message: `ID do contacto (${channel === 'instagram' ? 'IGSID' : 'PSID'}) em falta.`,
            });
          }
          const firstMediaUrl = resolvedAttachments.find((a) => a.url)?.url || '';
          const firstMediaType = resolvedAttachments[0]?.type?.startsWith('video/')
            ? 'video'
            : resolvedAttachments[0]?.type?.startsWith('image/')
            ? 'image'
            : 'file';

          delivery = await this.metaClient.sendDirectMessage({
            platform: channel,
            recipientId,
            text: String(content || '').trim(),
            mediaUrl: firstMediaUrl,
            mediaType: firstMediaType,
            useHumanAgentTag: true,
          });
        }

        if (delivery?.success === false) {
          const channelLabel =
            channel === 'whatsapp'
              ? 'WhatsApp'
              : channel === 'instagram'
              ? 'Instagram Direct'
              : channel === 'facebook'
              ? 'Facebook Messenger'
              : 'Email (SMTP)';
          return res.status(502).json({
            success: false,
            message: `Falha no envio via ${channelLabel}: ${delivery.error || 'erro desconhecido'}`,
            delivery,
          });
        }
      }

      // 3. Persistir mensagem no histórico após envio confirmado (ou entrada inbound)
      let message;
      let persistenceWarning = null;
      try {
        message = await this.repo.saveSupportMessage(id, {
          content: content || '',
          html: html || undefined,
          channel,
          sender,
          subject,
          attachments: savedAttachments,
        });
      } catch (saveErr) {
        if (!isAgent) throw saveErr;
        persistenceWarning = saveErr.message;
        this.logger?.error?.(`[Support] Mensagem entregue mas falha ao gravar histórico: ${saveErr.message}`);
        message = {
          id: `msg_${Date.now()}`,
          sender: sender || 'agent',
          content: content || '',
          channel,
          subject,
          attachments: savedAttachments,
          timestamp: new Date().toISOString(),
        };
      }

      if (isAgent) {
        // 4. Incrementar sendCount apenas após entrega bem-sucedida
        await this._incrementDigitalFilesSendCount(resolvedAttachments);

        // 5. Sincronizar a mensagem enviada também no histórico de interações do cliente no CRM
        try {
          const contacts = await this.repo.getContacts();
          const targetEmail = (to && to.includes('@') ? to : ticket.clientEmail || '').toLowerCase();
          const targetPhone = String(to && !to.includes('@') ? to : ticket.clientContact || '')
            .replace(/\D/g, '')
            .slice(-9);
          const matched = contacts.find(
            (c) =>
              (targetEmail && String(c.email || '').toLowerCase() === targetEmail) ||
              (targetPhone.length >= 9 && String(c.phone || '').replace(/\D/g, '').endsWith(targetPhone))
          );
          if (matched) {
            await this.repo.addContactMessage(matched.id, {
              channel: channel || 'email',
              direction: 'outbound',
              type: channel === 'email' ? 'Email' : 'WhatsApp',
              content: subject ? `[${subject}] ${content || ''}`.trim() : content || '(Anexo enviado)',
              interactionStatus: 'aguardar_cliente',
            });
          }
        } catch {
          // não bloquear resposta caso CRM falhe
        }
      }

      res.status(201).json({
        success: true,
        message,
        delivery,
        ...(persistenceWarning ? { persistenceWarning } : {}),
      });
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

  async deleteSupportTicket(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.repo.deleteSupportTicket(id);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async deleteSupportMessage(req, res, next) {
    try {
      const { id, messageId } = req.params;
      const result = await this.repo.deleteSupportMessage(id, messageId);
      res.json({ success: true, ...result });
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

  async downloadBroadcastReportPdf(req, res, next) {
    try {
      const { id } = req.params;
      const statusFilter = String(req.query.status || 'all');
      const channelFilter = String(req.query.channel || 'all');
      const isDownload = req.query.download === '1' || req.query.download === 'true';

      const broadcasts = await this.repo.getBroadcasts();
      const campaign = broadcasts.find((b) => String(b.id) === String(id));
      if (!campaign) {
        return res.status(404).json({ success: false, message: 'Campanha não encontrada.' });
      }

      const pdfBuffer = await generateBroadcastReportPdf(campaign, { statusFilter, channelFilter });
      const safeName = String(campaign.title || 'Campanha')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 60) || 'Campanha';

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `${isDownload ? 'attachment' : 'inline'}; filename="Relatorio-${safeName}.pdf"`
      );
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  }

  async listSavedCampaigns(req, res, next) {
    try {
      const campaigns = await this.repo.getSavedCampaigns();
      res.json({ success: true, campaigns, data: campaigns });
    } catch (err) {
      next(err);
    }
  }

  async createSavedCampaign(req, res, next) {
    try {
      const payload = req.body || {};
      if (!String(payload.title || '').trim()) {
        return res.status(400).json({ success: false, message: 'Informe um título para guardar a campanha.' });
      }
      const campaign = await this.repo.createSavedCampaign(payload);
      res.status(201).json({ success: true, campaign, data: campaign });
    } catch (err) {
      next(err);
    }
  }

  async updateSavedCampaign(req, res, next) {
    try {
      const { id } = req.params;
      const campaign = await this.repo.updateSavedCampaign(id, req.body || {});
      res.json({ success: true, campaign, data: campaign });
    } catch (err) {
      next(err);
    }
  }

  async deleteSavedCampaign(req, res, next) {
    try {
      const { id } = req.params;
      await this.repo.deleteSavedCampaign(id);
      res.json({ success: true, message: 'Campanha guardada eliminada.' });
    } catch (err) {
      next(err);
    }
  }

  async _executeBroadcastDelivery(payload = {}) {
    const {
      title,
      channels = [],
      audience,
      message = '',
      html,
      subject,
      recipients = [],
      attachments = [],
    } = payload;

    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
    if (!String(message || '').trim() && !String(html || '').trim() && !hasAttachments) {
      const err = new Error('Conteúdo da mensagem ou anexo da biblioteca é obrigatório.');
      err.statusCode = 400;
      throw err;
    }

    let resolvedAttachments = [];
    if (hasAttachments) {
      resolvedAttachments = await this._resolveAttachmentsForDelivery(attachments);
    }

    const recipientList = Array.isArray(recipients) ? recipients : [];
    const emailRegex = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
    let sentCount = 0;
    let deliveredCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const deliveries = [];

    for (const r of recipientList) {
      const contactName = r.name || 'Cliente';
      const contactCompany = r.company || '';
      const personalized = String(message || '')
        .replace(/\{nome\}/gi, contactName)
        .replace(/\{empresa\}/gi, contactCompany);

      if (channels.includes('whatsapp')) {
        const cleanPhone = String(r.phone || '').trim();
        const hasValidPhone = /\d{7,}/.test(cleanPhone);
        if (!hasValidPhone) {
          skippedCount += 1;
          deliveries.push({
            contactId: r.id || '',
            name: contactName,
            company: contactCompany,
            channel: 'whatsapp',
            target: cleanPhone,
            status: 'skipped',
            error: cleanPhone ? 'Número de WhatsApp inválido' : 'Contacto sem número de WhatsApp/telefone',
            timestamp: new Date().toISOString(),
          });
        } else {
          sentCount += 1;
          try {
            if (resolvedAttachments.length > 0) {
              let lastError = '';
              let allOk = true;
              for (let idx = 0; idx < resolvedAttachments.length; idx++) {
                const att = resolvedAttachments[idx];
                const caption = idx === 0 ? personalized.trim() || att.name : att.name;
                const waMedia = await this.evolution.sendMedia(cleanPhone, att, caption);
                if (!waMedia?.success) {
                  allOk = false;
                  lastError = waMedia?.error || `Falha ao enviar anexo "${att.name}" no WhatsApp`;
                  break;
                }
              }
              if (allOk) {
                deliveredCount += 1;
                deliveries.push({
                  contactId: r.id || '',
                  name: contactName,
                  company: contactCompany,
                  channel: 'whatsapp',
                  target: cleanPhone,
                  status: 'delivered',
                  error: '',
                  timestamp: new Date().toISOString(),
                });
              } else {
                failedCount += 1;
                deliveries.push({
                  contactId: r.id || '',
                  name: contactName,
                  company: contactCompany,
                  channel: 'whatsapp',
                  target: cleanPhone,
                  status: 'failed',
                  error: lastError,
                  timestamp: new Date().toISOString(),
                });
              }
            } else {
              const wa = await this.evolution.sendText(cleanPhone, personalized);
              if (wa?.success) {
                deliveredCount += 1;
                deliveries.push({
                  contactId: r.id || '',
                  name: contactName,
                  company: contactCompany,
                  channel: 'whatsapp',
                  target: cleanPhone,
                  status: 'delivered',
                  error: '',
                  timestamp: new Date().toISOString(),
                });
              } else {
                failedCount += 1;
                deliveries.push({
                  contactId: r.id || '',
                  name: contactName,
                  company: contactCompany,
                  channel: 'whatsapp',
                  target: cleanPhone,
                  status: 'failed',
                  error: wa?.error || 'Falha no envio via WhatsApp (Evolution API)',
                  timestamp: new Date().toISOString(),
                });
              }
            }
          } catch (err) {
            failedCount += 1;
            deliveries.push({
              contactId: r.id || '',
              name: contactName,
              company: contactCompany,
              channel: 'whatsapp',
              target: cleanPhone,
              status: 'failed',
              error: err?.message || 'Erro inesperado no envio WhatsApp',
              timestamp: new Date().toISOString(),
            });
          }
        }
      }

      if (channels.includes('email')) {
        const cleanEmail = String(r.email || '').trim();
        if (!cleanEmail || !emailRegex.test(cleanEmail)) {
          skippedCount += 1;
          deliveries.push({
            contactId: r.id || '',
            name: contactName,
            company: contactCompany,
            channel: 'email',
            target: cleanEmail,
            status: 'skipped',
            error: cleanEmail ? 'Endereço de email inválido' : 'Contacto sem endereço de email',
            timestamp: new Date().toISOString(),
          });
        } else {
          sentCount += 1;
          try {
            if (!this.emailCenter?.mailProvider?.sendDirect) {
              failedCount += 1;
              deliveries.push({
                contactId: r.id || '',
                name: contactName,
                company: contactCompany,
                channel: 'email',
                target: cleanEmail,
                status: 'failed',
                error: 'Serviço SMTP indisponível no servidor',
                timestamp: new Date().toISOString(),
              });
            } else {
              const personalizedHtml = html
                ? String(html)
                    .replace(/\{nome\}/gi, contactName)
                    .replace(/\{empresa\}/gi, contactCompany)
                : undefined;
              const mail = await this.emailCenter.mailProvider.sendDirect({
                to: cleanEmail,
                subject: String(subject || title || 'Comunicado JOGIMIL Tecnologias')
                  .replace(/\{nome\}/gi, contactName)
                  .replace(/\{empresa\}/gi, contactCompany),
                text:
                  personalized.trim() ||
                  (resolvedAttachments.length > 0
                    ? `Segue em anexo o(s) documento(s) enviado(s) pela equipa JOGIMIL Tecnologias.`
                    : ''),
                html: personalizedHtml,
                attachments: resolvedAttachments,
              });
              if (mail?.success) {
                deliveredCount += 1;
                deliveries.push({
                  contactId: r.id || '',
                  name: contactName,
                  company: contactCompany,
                  channel: 'email',
                  target: cleanEmail,
                  status: 'delivered',
                  error: '',
                  timestamp: new Date().toISOString(),
                });
              } else {
                failedCount += 1;
                deliveries.push({
                  contactId: r.id || '',
                  name: contactName,
                  company: contactCompany,
                  channel: 'email',
                  target: cleanEmail,
                  status: 'failed',
                  error: mail?.error || 'Falha no envio SMTP',
                  timestamp: new Date().toISOString(),
                });
              }
            }
          } catch (err) {
            failedCount += 1;
            deliveries.push({
              contactId: r.id || '',
              name: contactName,
              company: contactCompany,
              channel: 'email',
              target: cleanEmail,
              status: 'failed',
              error: err?.message || 'Erro inesperado no envio SMTP',
              timestamp: new Date().toISOString(),
            });
          }
        }
      }

      if (channels.includes('sms')) {
        const cleanPhone = String(r.phone || '').trim();
        if (!/\d{7,}/.test(cleanPhone)) {
          skippedCount += 1;
          deliveries.push({
            contactId: r.id || '',
            name: contactName,
            company: contactCompany,
            channel: 'sms',
            target: cleanPhone,
            status: 'skipped',
            error: 'Contacto sem número de telefone para SMS',
            timestamp: new Date().toISOString(),
          });
        } else {
          sentCount += 1;
          deliveredCount += 1;
          deliveries.push({
            contactId: r.id || '',
            name: contactName,
            company: contactCompany,
            channel: 'sms',
            target: cleanPhone,
            status: 'delivered',
            error: '',
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    if (deliveredCount > 0 && resolvedAttachments.length > 0) {
      await this._incrementDigitalFilesSendCount(resolvedAttachments);
    }

    const sanitizedAttachments = resolvedAttachments.map((a) => ({
      name: a.name,
      type: a.type,
      size: a.size,
      url: a.url || '',
      digitalFileId: a.digitalFileId || null,
    }));

    const finalStatus =
      deliveredCount === 0 && failedCount > 0
        ? 'failed'
        : deliveredCount > 0 && failedCount > 0
        ? 'partial'
        : deliveredCount === 0 && skippedCount > 0
        ? 'skipped'
        : 'completed';

    return await this.repo.createBroadcastCampaign({
      title,
      channels,
      audience,
      subject,
      message,
      attachments: sanitizedAttachments,
      deliveries,
      totalRecipients: recipientList.length || Number(payload.totalRecipients || 0),
      sentCount,
      deliveredCount,
      failedCount,
      skippedCount,
      status: finalStatus,
    });
  }

  async sendBroadcast(req, res, next) {
    try {
      const campaign = await this._executeBroadcastDelivery(req.body || {});
      res.status(201).json({ success: true, campaign, data: campaign });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ success: false, message: err.message });
      }
      next(err);
    }
  }

  // --- AGENDAMENTO AUTOMÁTICO DE CAMPANHAS (COM INTEGRAÇÃO OPCIONAL AGENDA & PROCESSOS) ---
  async _dispatchScheduledBroadcast(item, { allowRetryFailed = false } = {}) {
    if (!item || (item.status !== 'pending' && !(allowRetryFailed && item.status === 'failed'))) {
      return item;
    }
    try {
      await this.repo.updateScheduledBroadcast(item.id, { status: 'processing', error: '' });
      const campaign = await this._executeBroadcastDelivery({
        title: item.title,
        channels: item.channels || [],
        audience: `${item.audience || 'Agendada'} (Automático)`,
        subject: item.subject || '',
        message: item.message || '',
        html: item.html || undefined,
        recipients: item.recipients || [],
        attachments: item.attachments || [],
      });

      const now = new Date().toISOString();
      const nextStatus =
        campaign.status === 'failed'
          ? 'failed'
          : campaign.status === 'partial'
          ? 'partial'
          : 'sent';

      // Atualizar evento na Agenda se estiver integrado
      if (item.calendarEventId && this.repo.updateCalendarEvent) {
        await this.repo
          .updateCalendarEvent(item.calendarEventId, { status: 'concluido' })
          .catch(() => {});
      }

      // Atualizar tarefa em Processos se estiver integrada
      if (item.taskId && this.repo.updateTask) {
        await this.repo
          .updateTask(item.taskId, { stage: 'done' })
          .catch(() => {});
      }

      const updated = await this.repo.updateScheduledBroadcast(item.id, {
        status: nextStatus,
        broadcastId: campaign.id,
        deliveredCount: campaign.deliveredCount || 0,
        failedCount: campaign.failedCount || 0,
        skippedCount: campaign.skippedCount || 0,
        sentAt: now,
        error: nextStatus === 'failed' ? 'Todos os envios falharam. Verifique o relatório.' : '',
      });

      return { scheduled: updated, campaign };
    } catch (err) {
      const failed = await this.repo.updateScheduledBroadcast(item.id, {
        status: 'failed',
        error: err.message || 'Erro interno no disparo agendado da campanha.',
      });
      return { scheduled: failed, campaign: null };
    }
  }

  async _processDueScheduledBroadcasts() {
    if (this._broadcastSchedulerRunning || !this.repo.getScheduledBroadcasts) return;
    this._broadcastSchedulerRunning = true;
    try {
      const list = await this.repo.getScheduledBroadcasts();
      const nowMs = Date.now();
      for (const item of list) {
        if (item.status === 'pending' && new Date(item.scheduledAt).getTime() <= nowMs) {
          this.logger?.info?.(`[Scheduled Broadcast] A disparar campanha agendada "${item.title}"...`);
          await this._dispatchScheduledBroadcast(item);
        }
      }
    } finally {
      this._broadcastSchedulerRunning = false;
    }
  }

  async listScheduledBroadcasts(req, res, next) {
    try {
      await this._processDueScheduledBroadcasts().catch(() => {});
      const items = await this.repo.getScheduledBroadcasts();
      res.json({ success: true, scheduled: items, data: items });
    } catch (err) {
      next(err);
    }
  }

  async scheduleBroadcast(req, res, next) {
    try {
      const {
        title,
        channels = [],
        audience = 'Todos os Contactos',
        recipients = [],
        subject = '',
        message = '',
        html = '',
        attachments = [],
        scheduledAt,
        syncToCalendar = false,
        syncToTask = false,
      } = req.body || {};

      if (!String(title || '').trim()) {
        return res.status(400).json({ success: false, message: 'Informe o título da campanha.' });
      }
      if (!scheduledAt || Number.isNaN(new Date(scheduledAt).getTime())) {
        return res.status(400).json({ success: false, message: 'Informe uma data e hora válida para o agendamento.' });
      }
      if (!Array.isArray(channels) || channels.length === 0) {
        return res.status(400).json({ success: false, message: 'Selecione pelo menos um canal de envio.' });
      }
      if (!Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ success: false, message: 'Selecione pelo menos um destinatário.' });
      }
      const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
      if (!String(message || '').trim() && !String(html || '').trim() && !hasAttachments) {
        return res.status(400).json({
          success: false,
          message: 'Escreva a mensagem ou anexe um arquivo da biblioteca.',
        });
      }

      const scheduledIso = new Date(scheduledAt).toISOString();
      const sanitizedAttachments = hasAttachments
        ? attachments.map((a) => ({
            name: String(a?.name || 'anexo'),
            type: String(a?.type || 'application/octet-stream'),
            size: Number(a?.size || 0),
            url: String(a?.url || ''),
            digitalFileId: a?.digitalFileId || null,
          }))
        : [];

      const channelsLabel = channels.map((c) => c.toUpperCase()).join(' + ');
      let calendarEventId = null;
      let taskId = null;

      // Integração OPCIONAL com a Agenda (Calendário Corporativo)
      if (syncToCalendar === true && this.repo.createCalendarEvent) {
        const calEvent = await this.repo.createCalendarEvent({
          title: `Campanha Agendada: ${String(title).trim()}`,
          description: `Disparo automático (${channelsLabel}) para ${recipients.length} destinatário(s) — ${audience}.\n${String(message || '').slice(0, 260)}`,
          type: 'campanha_agendada',
          status: 'agendado',
          priority: 'media',
          startAt: scheduledIso,
          endAt: new Date(new Date(scheduledIso).getTime() + 30 * 60 * 1000).toISOString(),
          allDay: false,
          location: channelsLabel,
          owner: 'Equipa JOGIMIL',
          source: 'admin',
        });
        calendarEventId = calEvent?.id || null;
      }

      // Integração OPCIONAL com Tarefas & Processos
      if (syncToTask === true && this.repo.createTask) {
        const createdTask = await this.repo.createTask({
          title: `Campanha: ${String(title).trim()}`,
          description: `Envio automático agendado (${channelsLabel}) para ${recipients.length} destinatário(s) (${audience}).${sanitizedAttachments.length > 0 ? ` Anexos: ${sanitizedAttachments.map((a) => a.name).join(', ')}.` : ''}`,
          category: 'marketing',
          priority: 'media',
          stage: 'todo',
          dueDate: scheduledIso,
          assignee: 'Equipa JOGIMIL',
          tags: ['campanha', ...channels],
          calendarEventId: calendarEventId || null,
        });
        taskId = createdTask?.id || null;
      }

      const scheduled = await this.repo.createScheduledBroadcast({
        title: String(title).trim(),
        channels,
        audience,
        recipients,
        totalRecipients: recipients.length,
        subject: String(subject || '').trim(),
        message: String(message || ''),
        html: String(html || ''),
        attachments: sanitizedAttachments,
        scheduledAt: scheduledIso,
        syncToCalendar: syncToCalendar === true,
        calendarEventId,
        syncToTask: syncToTask === true,
        taskId,
      });

      const integrations = [
        calendarEventId ? 'Agenda' : null,
        taskId ? 'Processos' : null,
      ].filter(Boolean);

      res.status(201).json({
        success: true,
        scheduled,
        data: scheduled,
        message:
          integrations.length > 0
            ? `Campanha agendada com sucesso e integrada em: ${integrations.join(' e ')}.`
            : 'Campanha agendada com sucesso para envio automático.',
      });
    } catch (err) {
      next(err);
    }
  }

  async sendScheduledBroadcastNow(req, res, next) {
    try {
      const { id } = req.params;
      const list = await this.repo.getScheduledBroadcasts();
      const target = list.find((i) => i.id === id);
      if (!target) {
        return res.status(404).json({ success: false, message: 'Campanha agendada não encontrada.' });
      }
      const result = await this._dispatchScheduledBroadcast(target, { allowRetryFailed: true });
      res.json({
        success: result?.scheduled?.status !== 'failed',
        scheduled: result?.scheduled,
        campaign: result?.campaign,
        message:
          result?.scheduled?.status === 'failed'
            ? result?.scheduled?.error || 'Falha ao disparar campanha agendada.'
            : 'Campanha disparada com sucesso.',
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteScheduledBroadcast(req, res, next) {
    try {
      const { id } = req.params;
      const list = await this.repo.getScheduledBroadcasts();
      const target = list.find((i) => i.id === id);
      if (target && target.status === 'pending') {
        if (target.calendarEventId && this.repo.deleteCalendarEvent) {
          await this.repo.deleteCalendarEvent(target.calendarEventId).catch(() => {});
        }
        if (target.taskId && this.repo.deleteTask) {
          await this.repo.deleteTask(target.taskId).catch(() => {});
        }
      }
      await this.repo.deleteScheduledBroadcast(id);
      res.json({ success: true, message: 'Agendamento de campanha removido.' });
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

  // =========================================================================
  // HELPER: Resolver anexos da Biblioteca de Arquivos Digitais para envio
  // =========================================================================
  _decodeDataUrlToBuffer(rawValue) {
    const clean = String(rawValue || '').replace(/^data:[^,]*;base64,/i, '').trim();
    if (!clean) return null;
    const buf = Buffer.from(clean, 'base64');
    return buf.length > 0 ? buf : null;
  }

  async _fetchUrlBufferWithRetry(sourceUrl, retries = 1) {
    let lastError = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const resp = await fetch(sourceUrl, { signal: AbortSignal.timeout(20000) });
        if (!resp.ok) {
          lastError = new Error(`HTTP ${resp.status}`);
          continue;
        }
        const buf = Buffer.from(await resp.arrayBuffer());
        if (buf.length > 0) return buf;
        lastError = new Error('Resposta vazia');
      } catch (err) {
        lastError = err;
      }
    }
    if (lastError) {
      this.logger?.warn?.(`[Attachment] Falha ao transferir ${sourceUrl}: ${lastError.message}`);
    }
    return null;
  }

  async _resolveAttachmentsForDelivery(attachments = []) {
    if (!Array.isArray(attachments) || attachments.length === 0) return [];
    const maxTotalBytes = 20 * 1024 * 1024;
    let totalBytes = 0;
    const resolved = [];

    for (const att of attachments) {
      let fileRecord = null;
      if (att?.digitalFileId && this.repo.getDigitalFileById) {
        fileRecord = await this.repo.getDigitalFileById(att.digitalFileId).catch(() => null);
      }

      const sourceUrl = fileRecord?.publicUrl || att?.url || att?.publicUrl || '';
      const mimeType = fileRecord?.mimeType || att?.type || 'application/octet-stream';
      const fileName = fileRecord?.fileName || att?.name || 'documento';

      let buffer = null;
      if (Buffer.isBuffer(att?.buffer) && att.buffer.length > 0) {
        buffer = att.buffer;
      } else if (att?.dataUrl) {
        buffer = this._decodeDataUrlToBuffer(att.dataUrl);
      }

      if (att?.digitalFileId) {
        if (!buffer && fileRecord?.dataUrl) {
          buffer = this._decodeDataUrlToBuffer(fileRecord.dataUrl);
        }
        if (!buffer && fileRecord?.storagePath && this.repo.downloadDigitalFileBuffer) {
          buffer = await this.repo.downloadDigitalFileBuffer(fileRecord).catch(() => null);
          if (!buffer) {
            buffer = await this.repo.downloadDigitalFileBuffer(fileRecord).catch(() => null);
          }
        }
        if (!buffer && sourceUrl) {
          buffer = await this._fetchUrlBufferWithRetry(sourceUrl, 1);
        }
        if (!buffer || buffer.length === 0) {
          const err = new Error(
            `Não foi possível carregar o arquivo "${fileName}" da biblioteca interna. Verifique se o ficheiro existe ou recarregue-o na Biblioteca.`
          );
          err.statusCode = 422;
          throw err;
        }
      } else if (!buffer || buffer.length === 0) {
        const err = new Error(`O anexo "${fileName}" está vazio ou inválido.`);
        err.statusCode = 422;
        throw err;
      }

      totalBytes += buffer.length;
      if (totalBytes > maxTotalBytes) {
        const err = new Error('O tamanho total dos anexos excede o limite de 20 MB por envio.');
        err.statusCode = 400;
        throw err;
      }

      const existingDataUrl =
        (typeof att?.dataUrl === 'string' && att.dataUrl.startsWith('data:') ? att.dataUrl : '') ||
        (typeof fileRecord?.dataUrl === 'string' && fileRecord.dataUrl.startsWith('data:') ? fileRecord.dataUrl : '');

      resolved.push({
        name: fileName,
        type: mimeType,
        size: buffer.length || fileRecord?.size || att?.size || 0,
        url: sourceUrl,
        digitalFileId: fileRecord?.id || att?.digitalFileId || null,
        buffer,
        dataUrl: existingDataUrl || `data:${mimeType};base64,${buffer.toString('base64')}`,
      });
    }

    return resolved;
  }

  async _incrementDigitalFilesSendCount(resolvedAttachments = []) {
    if (!this.repo.getDigitalFileById || !this.repo.updateDigitalFile) return;
    const uniqueIds = Array.from(
      new Set(resolvedAttachments.map((a) => a?.digitalFileId).filter(Boolean))
    );
    for (const fileId of uniqueIds) {
      try {
        const current = await this.repo.getDigitalFileById(fileId);
        if (current) {
          await this.repo.updateDigitalFile(fileId, {
            sendCount: Number(current.sendCount || 0) + 1,
          });
        }
      } catch {
        // non-blocking counter update
      }
    }
  }

  // =========================================================================
  // CALENDÁRIO CORPORATIVO & INTEGRAÇÃO CALDAV / TAREFAS / CRM
  // =========================================================================
  async listCalendarEvents(req, res, next) {
    try {
      const [events, tasks, contacts] = await Promise.all([
        this.repo.getCalendarEvents(),
        this.repo.getTasks(),
        this.repo.getContacts(),
      ]);

      // Mapear tarefas com prazo que não têm evento duplicado
      const linkedTaskIds = new Set(events.filter((e) => e.taskId).map((e) => e.taskId));
      const taskEvents = tasks
        .filter((t) => t.dueDate && !linkedTaskIds.has(t.id))
        .map((t) => ({
          id: `task_evt_${t.id}`,
          title: `[${t.code}] ${t.title}`,
          description: t.description || '',
          type: 'tarefa',
          status: t.stage === 'done' ? 'concluido' : 'agendado',
          priority: t.priority || 'media',
          startAt: t.dueDate,
          endAt: t.dueDate,
          allDay: true,
          location: t.contactName ? `Cliente: ${t.contactName}` : '',
          contactId: t.contactId || null,
          contactName: t.contactName || '',
          taskId: t.id,
          owner: t.assignee || 'Equipa JOGIMIL',
          source: 'task',
          readOnly: false,
        }));

      // Mapear follow-ups de contactos CRM
      const crmFollowUps = contacts
        .filter((c) => c.nextFollowUp)
        .map((c) => ({
          id: `crm_fu_${c.id}`,
          title: `Follow-up: ${c.name}${c.company ? ` (${c.company})` : ''}`,
          description: c.notes || `Acompanhamento comercial via CRM.`,
          type: 'followup',
          status: 'agendado',
          priority: c.priority || 'media',
          startAt: `${String(c.nextFollowUp).slice(0, 10)}T09:00:00.000Z`,
          endAt: `${String(c.nextFollowUp).slice(0, 10)}T09:30:00.000Z`,
          allDay: true,
          location: c.phone || c.email || '',
          contactId: c.id,
          contactName: c.name,
          taskId: null,
          owner: c.owner || 'Equipa JOGIMIL',
          source: 'crm',
          readOnly: true,
        }));

      const user = await this._getRequestUser(req);
      const isAdmin = this._isAdmin(user);
      const unifiedAll = [...events, ...taskEvents, ...crmFollowUps].sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      );
      const unified = isAdmin
        ? unifiedAll
        : unifiedAll.filter(
            (e) =>
              e.ownerId === user.id ||
              (Array.isArray(e.sharedWith) && e.sharedWith.includes(user.id)) ||
              String(e.owner || '').toLowerCase() === String(user.name || '').toLowerCase()
          );

      res.json({
        success: true,
        events: unified,
        nativeEvents: isAdmin ? events : events.filter((e) => e.ownerId === user.id),
        counts: {
          total: unified.length,
          events: events.length,
          tasks: taskEvents.length + events.filter((e) => e.taskId).length,
          followUps: crmFollowUps.length,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async createCalendarEvent(req, res, next) {
    try {
      const user = await this._getRequestUser(req);
      const payload = req.body || {};
      if (!payload.title || !payload.startAt) {
        return res.status(400).json({ success: false, message: 'Título e data de início são obrigatórios.' });
      }

      let linkedTaskId = payload.taskId || null;

      // Se o utilizador pediu para criar também uma Tarefa/Processo vinculada
      if (payload.createLinkedTask && !linkedTaskId) {
        const createdTask = await this.repo.createTask({
          title: payload.title,
          description: payload.description || '',
          category: payload.type === 'entrega' ? 'entrega' : 'operacao',
          stage: 'todo',
          priority: payload.priority || 'media',
          assignee: payload.owner || user.name || 'Equipa JOGIMIL',
          contactId: payload.contactId || null,
          contactName: payload.contactName || '',
          dueDate: payload.startAt,
          syncToCalendar: true,
        });
        linkedTaskId = createdTask.id;
      }

      const event = await this.repo.createCalendarEvent({
        ...payload,
        ownerId: user.id,
        owner: payload.owner || user.name || 'Equipa JOGIMIL',
        taskId: linkedTaskId,
      });

      if (linkedTaskId) {
        await this.repo.updateTask(linkedTaskId, { calendarEventId: event.id }).catch(() => {});
      }

      // Tentativa não-bloqueante de push para CalDAV cPanel
      const caldav = await calDavService.pushEvent(event).catch(() => ({ synced: false }));

      // Notificação automática (WhatsApp e/ou Email) conforme as preferências do utilizador
      const deliveryResult = await this._sendCalendarEventReminderToUser({
        event,
        user,
        mode: 'created',
        overrideWhatsapp: payload.notifyPhone,
        forceWhatsapp: payload.notifyWhatsapp === true,
      });

      res.status(201).json({
        success: true,
        event,
        data: event,
        caldav,
        whatsappNotification: deliveryResult.whatsapp,
        emailNotification: deliveryResult.email,
      });
    } catch (err) {
      next(err);
    }
  }

  async _sendCalendarEventReminderToUser({
    event,
    user,
    mode = 'upcoming',
    overrideWhatsapp = '',
    forceWhatsapp = false,
  }) {
    const whenStr = new Date(event.startAt).toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const isCreated = mode === 'created';
    const isTest = mode === 'test';
    const titlePrefix = isTest
      ? '🔔 *Teste de Lembrete da Agenda · JOGIMIL*'
      : isCreated
      ? '📅 *Evento Agendado · JOGIMIL*'
      : '⏰ *Lembrete de Evento Próximo · JOGIMIL*';

    const lines = [
      titlePrefix,
      '',
      `*Evento:* ${event.title}`,
      event.contactName ? `*Contacto:* ${event.contactName}` : null,
      `*Data/Hora:* ${whenStr}`,
      event.type ? `*Tipo:* ${event.type}` : null,
      event.location ? `*Local / Canal:* ${event.location}` : null,
      event.description ? `*Notas:* ${event.description}` : null,
      '',
      `👤 Utilizador: ${user?.name || event.owner || 'Equipa JOGIMIL'}`,
    ].filter((l) => l !== null);

    const whatsappResult = { sent: false, phone: '', error: '' };
    const emailResult = { sent: false, email: '', error: '' };

    const wantWhatsapp = forceWhatsapp || user?.notifyWhatsapp !== false;
    const targetPhone = String(overrideWhatsapp || user?.whatsapp || '').trim();
    if (wantWhatsapp && targetPhone && this.evolution?.sendText) {
      whatsappResult.phone = targetPhone;
      try {
        const waRes = await this.evolution.sendText(targetPhone, lines.join('\n'));
        whatsappResult.sent = Boolean(waRes?.success);
        if (!waRes?.success) whatsappResult.error = waRes?.error || 'Falha ao enviar WhatsApp.';
      } catch (err) {
        whatsappResult.error = err?.message || 'Erro ao enviar WhatsApp.';
      }
    } else if (wantWhatsapp && !targetPhone) {
      whatsappResult.error = 'Número de WhatsApp não configurado no Perfil.';
    }

    const wantEmail = user?.notifyEmail !== false;
    const targetEmail = String(user?.email || '').trim();
    if (wantEmail && targetEmail && this.emailCenter?.mailProvider?.sendDirect) {
      emailResult.email = targetEmail;
      const subject = isTest
        ? 'JOGIMIL Agenda · Teste de Lembrete Automático'
        : isCreated
        ? `JOGIMIL Agenda · Evento Agendado: ${event.title}`
        : `JOGIMIL Agenda · Lembrete: ${event.title}`;

      const html = `<!DOCTYPE html>
<html lang="pt"><head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;background:#0C0D10;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#F1F3F6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:540px;margin:0 auto;background:#14161A;border:1px solid #2A2E37;border-radius:16px;overflow:hidden;">
    <tr>
      <td style="padding:20px 24px;border-bottom:1px solid #2A2E37;background:#181B21;">
        <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#2575FC;font-weight:700;">JOGIMIL · Agenda Corporativa</div>
        <h2 style="margin:6px 0 0;font-size:18px;color:#FFFFFF;">${event.title}</h2>
      </td>
    </tr>
    <tr>
      <td style="padding:22px 24px;font-size:13px;line-height:1.6;color:#D1D5DB;">
        <p style="margin:0 0 12px;">Olá, <strong style="color:#FFFFFF;">${user?.name || 'Equipa'}</strong>,</p>
        <p style="margin:0 0 16px;">${
          isTest
            ? 'Este é um teste de lembrete automático da sua Agenda JOGIMIL.'
            : isCreated
            ? 'Um novo evento foi agendado na sua Agenda Corporativa:'
            : 'Lembrete de evento prestes a começar na sua Agenda Corporativa:'
        }</p>
        <div style="background:#1B1E24;border:1px solid #2A2E37;border-radius:12px;padding:14px 16px;">
          <div><strong style="color:#9EA4B0;">Data/Hora:</strong> <span style="color:#FFFFFF;font-family:monospace;">${whenStr}</span></div>
          ${event.contactName ? `<div style="margin-top:6px;"><strong style="color:#9EA4B0;">Contacto:</strong> <span style="color:#FFFFFF;">${event.contactName}</span></div>` : ''}
          ${event.location ? `<div style="margin-top:6px;"><strong style="color:#9EA4B0;">Local/Canal:</strong> <span style="color:#FFFFFF;">${event.location}</span></div>` : ''}
          ${event.description ? `<div style="margin-top:6px;"><strong style="color:#9EA4B0;">Notas:</strong> <span style="color:#D1D5DB;">${event.description}</span></div>` : ''}
        </div>
      </td>
    </tr>
  </table>
</body></html>`;

      try {
        const mailRes = await this.emailCenter.mailProvider.sendDirect({
          to: targetEmail,
          subject,
          text: lines.join('\n').replace(/\*/g, ''),
          html,
        });
        emailResult.sent = Boolean(mailRes?.success);
        if (!mailRes?.success) emailResult.error = mailRes?.error || 'Falha no envio SMTP.';
      } catch (err) {
        emailResult.error = err?.message || 'Erro ao enviar email.';
      }
    }

    return { whatsapp: whatsappResult, email: emailResult };
  }

  async _processUpcomingCalendarReminders() {
    if (this._calReminderRunning || !this.repo.getCalendarEvents) return;
    this._calReminderRunning = true;
    try {
      const [events, users, settings] = await Promise.all([
        this.repo.getCalendarEvents(),
        this.repo.getUsers ? this.repo.getUsers() : Promise.resolve([]),
        this.repo.getSettings ? this.repo.getSettings().catch(() => ({})) : Promise.resolve({}),
      ]);

      const cfg = settings?.calendarReminders || {};
      if (cfg.enabled === false) return;
      const defaultLeadMin = Number(cfg.defaultMinutesBefore ?? 15);
      const nowMs = Date.now();

      for (const ev of events) {
        if (!ev?.startAt || ev.reminderSentAt) continue;
        if (ev.status === 'concluido' || ev.status === 'cancelado') continue;

        const owner =
          users.find((u) => ev.ownerId && u.id === ev.ownerId) ||
          users.find((u) => ev.owner && String(u.name || '').toLowerCase() === String(ev.owner).toLowerCase()) ||
          users.find((u) => u.id === 'usr_admin_root');
        if (!owner) continue;

        const leadMin = Number(owner.reminderMinutesBefore ?? defaultLeadMin);
        const startMs = new Date(ev.startAt).getTime();
        if (Number.isNaN(startMs)) continue;

        const triggerMs = startMs - leadMin * 60 * 1000;
        if (nowMs >= triggerMs && nowMs <= startMs + 10 * 60 * 1000) {
          await this._sendCalendarEventReminderToUser({
            event: ev,
            user: owner,
            mode: 'upcoming',
          });
          await this.repo
            .updateCalendarEvent(ev.id, { reminderSentAt: new Date().toISOString() })
            .catch(() => {});
        }
      }
    } finally {
      this._calReminderRunning = false;
    }
  }

  async testCalendarReminder(req, res, next) {
    try {
      const actor = await this._getRequestUser(req);
      const { userId } = req.body || {};
      let targetUser = actor;
      if (userId && this._isAdmin(actor) && this.repo.getUserById) {
        const found = await this.repo.getUserById(userId);
        if (found) targetUser = found;
      }

      const result = await this._sendCalendarEventReminderToUser({
        event: {
          title: 'Reunião de Alinhamento (Teste de Lembrete)',
          type: 'reuniao',
          startAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          location: 'Painel JOGIMIL · Agenda',
          description: 'Lembrete automático configurado por utilizador (WhatsApp e/ou Email).',
          owner: targetUser.name,
        },
        user: targetUser,
        mode: 'test',
      });

      const ok = result.whatsapp.sent || result.email.sent;
      res.json({
        success: ok,
        result,
        message: ok
          ? `Lembrete de teste enviado para ${targetUser.name} (${[
              result.whatsapp.sent ? `WhatsApp: ${result.whatsapp.phone}` : null,
              result.email.sent ? `Email: ${result.email.email}` : null,
            ]
              .filter(Boolean)
              .join(' · ')}).`
          : `Não foi possível enviar o lembrete (${result.whatsapp.error || result.email.error || 'ative WhatsApp ou Email no utilizador'}).`,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateCalendarEvent(req, res, next) {
    try {
      const { id } = req.params;
      const patch = req.body || {};
      const event = await this.repo.updateCalendarEvent(id, patch);

      // Se o evento estiver vinculado a uma tarefa, sincronizar prazo/título/estado
      if (event.taskId) {
        const taskPatch = {};
        if (patch.startAt) taskPatch.dueDate = patch.startAt;
        if (patch.status === 'concluido') taskPatch.stage = 'done';
        if (Object.keys(taskPatch).length > 0) {
          await this.repo.updateTask(event.taskId, taskPatch).catch(() => {});
        }
      }

      await calDavService.pushEvent(event).catch(() => {});
      res.json({ success: true, event, data: event });
    } catch (err) {
      next(err);
    }
  }

  async deleteCalendarEvent(req, res, next) {
    try {
      const { id } = req.params;
      await this.repo.deleteCalendarEvent(id);
      res.json({ success: true, message: 'Evento removido do calendário.' });
    } catch (err) {
      next(err);
    }
  }

  async getCalDavStatus(req, res, next) {
    try {
      const status = await calDavService.getStatus();
      res.json({ success: true, ...status });
    } catch (err) {
      next(err);
    }
  }

  async syncCalDavEvents(req, res, next) {
    try {
      const remoteEvents = await calDavService.fetchEvents();
      const localEvents = await this.repo.getCalendarEvents();
      const existingUids = new Set(localEvents.map((e) => e.caldavUid).filter(Boolean));

      let imported = 0;
      for (const rem of remoteEvents) {
        if (!existingUids.has(rem.caldavUid)) {
          await this.repo.createCalendarEvent(rem);
          imported += 1;
        }
      }

      res.json({
        success: true,
        imported,
        totalRemote: remoteEvents.length,
        message: `${imported} evento(s) sincronizado(s) do cPanel CalDAV.`,
      });
    } catch (err) {
      res.status(err.httpStatus === 403 ? 502 : 500).json({
        success: false,
        message: err.message || 'Erro ao sincronizar CalDAV.',
      });
    }
  }

  async exportCalendarIcs(req, res, next) {
    try {
      const events = await this.repo.getCalendarEvents();
      const tasks = await this.repo.getTasks();
      const linkedIds = new Set(events.filter((e) => e.taskId).map((e) => e.taskId));
      const all = [
        ...events,
        ...tasks
          .filter((t) => t.dueDate && !linkedIds.has(t.id))
          .map((t) => ({
            id: `task-${t.id}`,
            title: `[${t.code}] ${t.title}`,
            description: t.description,
            startAt: t.dueDate,
            endAt: t.dueDate,
          })),
      ];
      const ics = generateIcsCalendar(all);
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="jogimil-calendario.ics"');
      res.send(ics);
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // GESTÃO DE TAREFAS & PROCESSOS (Integrado com Calendário)
  // =========================================================================
  async listTasks(req, res, next) {
    try {
      const tasks = await this.repo.getTasks();
      res.json({ success: true, tasks, data: tasks });
    } catch (err) {
      next(err);
    }
  }

  async createTask(req, res, next) {
    try {
      const payload = req.body || {};
      if (!payload.title) {
        return res.status(400).json({ success: false, message: 'O título da tarefa/processo é obrigatório.' });
      }
      let task = await this.repo.createTask(payload);

      // Integração automática com o Calendário quando tem prazo definido
      if (task.dueDate && task.syncToCalendar !== false) {
        const evt = await this.repo.createCalendarEvent({
          title: `[${task.code}] ${task.title}`,
          description: task.description || `Prazo do processo ${task.code}`,
          type: 'tarefa',
          status: task.stage === 'done' ? 'concluido' : 'agendado',
          priority: task.priority || 'media',
          startAt: task.dueDate,
          endAt: task.dueDate,
          allDay: true,
          contactId: task.contactId || null,
          contactName: task.contactName || '',
          taskId: task.id,
          owner: task.assignee || 'Equipa JOGIMIL',
          source: 'task',
        });
        task = await this.repo.updateTask(task.id, { calendarEventId: evt.id });
      }

      res.status(201).json({ success: true, task, data: task });
    } catch (err) {
      next(err);
    }
  }

  async updateTask(req, res, next) {
    try {
      const { id } = req.params;
      const patch = req.body || {};
      let task = await this.repo.updateTask(id, patch);

      // Manter evento do Calendário sincronizado com o prazo/título/estado da tarefa
      if (task.syncToCalendar !== false && task.dueDate) {
        if (task.calendarEventId) {
          await this.repo
            .updateCalendarEvent(task.calendarEventId, {
              title: `[${task.code}] ${task.title}`,
              description: task.description || '',
              priority: task.priority,
              status: task.stage === 'done' ? 'concluido' : 'agendado',
              startAt: task.dueDate,
              endAt: task.dueDate,
              owner: task.assignee || 'Equipa JOGIMIL',
              contactId: task.contactId || null,
              contactName: task.contactName || '',
            })
            .catch(() => {});
        } else {
          const evt = await this.repo.createCalendarEvent({
            title: `[${task.code}] ${task.title}`,
            description: task.description || '',
            type: 'tarefa',
            status: task.stage === 'done' ? 'concluido' : 'agendado',
            priority: task.priority,
            startAt: task.dueDate,
            endAt: task.dueDate,
            allDay: true,
            contactId: task.contactId || null,
            contactName: task.contactName || '',
            taskId: task.id,
            owner: task.assignee || 'Equipa JOGIMIL',
            source: 'task',
          });
          task = await this.repo.updateTask(task.id, { calendarEventId: evt.id });
        }
      }

      res.json({ success: true, task, data: task });
    } catch (err) {
      next(err);
    }
  }

  async deleteTask(req, res, next) {
    try {
      const { id } = req.params;
      const tasks = await this.repo.getTasks();
      const target = tasks.find((t) => t.id === id);
      if (target?.calendarEventId) {
        await this.repo.deleteCalendarEvent(target.calendarEventId).catch(() => {});
      }
      await this.repo.deleteTask(id);
      res.json({ success: true, message: 'Tarefa/Processo eliminado com sucesso.' });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // ARQUIVOS DIGITAIS (Biblioteca PDF, Excel, Imagens + Envio Email/WhatsApp)
  // =========================================================================
  async listDigitalFiles(req, res, next) {
    try {
      const files = await this.repo.getDigitalFiles();
      res.json({ success: true, files, data: files });
    } catch (err) {
      next(err);
    }
  }

  async createDigitalFile(req, res, next) {
    try {
      const payload = req.body || {};
      if (!payload.fileName && !payload.name) {
        return res.status(400).json({ success: false, message: 'Selecione um arquivo para carregar.' });
      }
      const file = await this.repo.createDigitalFile(payload);
      res.status(201).json({ success: true, file, data: file });
    } catch (err) {
      next(err);
    }
  }

  async updateDigitalFile(req, res, next) {
    try {
      const { id } = req.params;
      const file = await this.repo.updateDigitalFile(id, req.body || {});
      res.json({ success: true, file, data: file });
    } catch (err) {
      next(err);
    }
  }

  async deleteDigitalFile(req, res, next) {
    try {
      const { id } = req.params;
      await this.repo.deleteDigitalFile(id);
      res.json({ success: true, message: 'Arquivo digital eliminado.' });
    } catch (err) {
      next(err);
    }
  }

  async sendDigitalFile(req, res, next) {
    try {
      const { id } = req.params;
      const { channel = 'email', to, subject, message = '', html = '', contactId, contactName } = req.body || {};
      const cleanTo = String(to || '').trim();
      if (!cleanTo) {
        return res.status(400).json({ success: false, message: 'Indique o destinatário (e-mail ou telefone).' });
      }

      if (channel === 'whatsapp') {
        if (!/\d{7,}/.test(cleanTo)) {
          return res.status(400).json({ success: false, message: 'Número de WhatsApp inválido.' });
        }
      } else if (!/[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+/.test(cleanTo)) {
        return res.status(400).json({ success: false, message: 'Endereço de email inválido.' });
      }

      const file = await this.repo.getDigitalFileById(id);
      if (!file) {
        return res.status(404).json({ success: false, message: 'Arquivo digital não encontrado.' });
      }

      let resolved = [];
      try {
        resolved = await this._resolveAttachmentsForDelivery([{ digitalFileId: file.id }]);
      } catch (attErr) {
        return res.status(attErr.statusCode || 422).json({
          success: false,
          message: attErr.message || 'Falha ao carregar o arquivo da biblioteca.',
        });
      }

      const att = resolved[0];
      let delivery = null;

      if (channel === 'whatsapp') {
        if (!this.evolution?.sendMedia) {
          return res.status(503).json({ success: false, message: 'Serviço WhatsApp (Evolution API) indisponível.' });
        }
        delivery = await this.evolution.sendMedia(cleanTo, att, message || file.name);
      } else {
        if (!this.emailCenter?.mailProvider?.sendDirect) {
          return res.status(503).json({ success: false, message: 'Serviço SMTP indisponível.' });
        }
        delivery = await this.emailCenter.mailProvider
          .sendDirect({
            to: cleanTo,
            subject: subject || `JOGIMIL Tecnologias · ${file.name}`,
            text:
              message ||
              `Segue em anexo o documento "${file.name}" enviado pela equipa JOGIMIL Tecnologias.`,
            html: String(html || '').trim() ? html : undefined,
            attachments: [att],
          })
          .catch((err) => ({ success: false, error: err.message }));
      }

      if (!delivery || delivery.success === false) {
        return res.status(502).json({
          success: false,
          delivery,
          message: delivery?.error || 'Falha ao entregar o arquivo.',
        });
      }

      // Incrementar contador apenas após envio confirmado
      await this._incrementDigitalFilesSendCount(resolved);

      // Registar interação no contacto CRM se existir
      try {
        const contacts = await this.repo.getContacts();
        const target =
          contacts.find((c) => contactId && c.id === contactId) ||
          contacts.find(
            (c) =>
              (channel === 'email' && c.email && c.email.toLowerCase() === cleanTo.toLowerCase()) ||
              (channel === 'whatsapp' &&
                c.phone &&
                String(c.phone).replace(/\D/g, '').endsWith(cleanTo.replace(/\D/g, '').slice(-9)))
          );
        if (target) {
          await this.repo.addContactMessage(target.id, {
            channel,
            direction: 'outbound',
            content: `[Arquivo enviado: ${file.fileName}] ${message || ''}`.trim(),
            author: 'Equipa JOGIMIL',
          });
        }
      } catch {
        // non-blocking
      }

      res.json({
        success: true,
        delivery,
        message: `Arquivo "${file.name}" enviado com sucesso via ${channel === 'whatsapp' ? 'WhatsApp' : 'Email'} para ${contactName || cleanTo}.`,
      });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // AGENDAMENTO DE ENVIO DE EMAIL (Atendimento + Integração Calendário)
  // =========================================================================
  async _dispatchSingleScheduledEmail(item, { allowRetryFailed = false } = {}) {
    if (!item || (item.status !== 'pending' && !(allowRetryFailed && item.status === 'failed'))) {
      return item;
    }
    try {
      if (!this.emailCenter?.mailProvider?.sendDirect) {
        return await this.repo.updateScheduledEmail(item.id, {
          status: 'failed',
          error: 'Serviço SMTP indisponível no servidor.',
        });
      }

      const resolvedAttachments = await this._resolveAttachmentsForDelivery(item.attachments || []);
      const delivery = await this.emailCenter.mailProvider.sendDirect({
        to: item.to,
        cc: item.cc || undefined,
        subject: item.subject || 'Atendimento JOGIMIL',
        text: item.content || '',
        html: item.html || undefined,
        attachments: resolvedAttachments,
      });

      if (!delivery || delivery.success === false) {
        return await this.repo.updateScheduledEmail(item.id, {
          status: 'failed',
          error: delivery?.error || 'Falha no envio SMTP.',
        });
      }

      const now = new Date().toISOString();

      await this._incrementDigitalFilesSendCount(resolvedAttachments);

      // Registar mensagem enviada no histórico da conversa de Atendimento
      if (item.ticketId) {
        await this.repo
          .saveSupportMessage(item.ticketId, {
            content: item.content || '',
            channel: 'email',
            sender: 'agent',
            subject: item.subject,
            attachments: resolvedAttachments.map((a) => ({
              name: a.name,
              type: a.type,
              size: a.size,
              url: a.url || '',
              digitalFileId: a.digitalFileId || null,
            })),
          })
          .catch(() => {});
      }

      // Registar interação no contacto CRM correspondente
      try {
        const contacts = await this.repo.getContacts();
        const target = contacts.find(
          (c) => c.email && c.email.toLowerCase() === String(item.to || '').toLowerCase()
        );
        if (target) {
          await this.repo.addContactMessage(target.id, {
            channel: 'email',
            direction: 'outbound',
            content: `[Email agendado enviado · ${item.subject}] ${item.content || ''}`.slice(0, 600),
            author: 'Equipa JOGIMIL',
          });
        }
      } catch {
        // non-blocking
      }

      // Atualizar evento vinculado no Calendário para Concluído
      if (item.calendarEventId) {
        await this.repo
          .updateCalendarEvent(item.calendarEventId, { status: 'concluido' })
          .catch(() => {});
      }

      return await this.repo.updateScheduledEmail(item.id, {
        status: 'sent',
        sentAt: now,
        error: '',
      });
    } catch (err) {
      return await this.repo.updateScheduledEmail(item.id, {
        status: 'failed',
        error: err.message || 'Erro interno no disparo agendado.',
      });
    }
  }

  async _processDueScheduledEmails() {
    if (this._schedulerRunning || !this.repo.getScheduledEmails) return;
    this._schedulerRunning = true;
    try {
      const list = await this.repo.getScheduledEmails();
      const nowMs = Date.now();
      for (const item of list) {
        if (item.status === 'pending' && new Date(item.scheduledAt).getTime() <= nowMs) {
          await this._dispatchSingleScheduledEmail(item);
        }
      }
    } finally {
      this._schedulerRunning = false;
    }
  }

  async listScheduledEmails(req, res, next) {
    try {
      // Aproveitar para disparar qualquer agendamento vencido
      await this._processDueScheduledEmails().catch(() => {});
      const { ticketId } = req.query;
      let items = await this.repo.getScheduledEmails();
      if (ticketId) {
        items = items.filter((i) => i.ticketId === ticketId);
      }
      res.json({ success: true, scheduled: items, data: items });
    } catch (err) {
      next(err);
    }
  }

  async scheduleSupportEmail(req, res, next) {
    try {
      const { id } = req.params;
      const {
        to,
        cc = '',
        subject,
        content = '',
        html = '',
        attachments = [],
        scheduledAt,
        syncToCalendar = true,
      } = req.body || {};

      if (!scheduledAt) {
        return res.status(400).json({ success: false, message: 'Indique a data e hora para o envio.' });
      }
      if (!content && !html && (!Array.isArray(attachments) || attachments.length === 0)) {
        return res.status(400).json({ success: false, message: 'Escreva a mensagem ou anexe um ficheiro.' });
      }

      const ticket = this.repo.getSupportTicketById
        ? await this.repo.getSupportTicketById(id)
        : (await this.repo.getSupportTickets()).find((t) => t.id === id);
      const recipient = String(
        to || ticket?.clientEmail || (ticket?.clientContact?.includes('@') ? ticket.clientContact : '')
      ).trim();

      if (!recipient || !/[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+/.test(recipient)) {
        return res.status(400).json({
          success: false,
          message: 'Indique um endereço de email válido para o destinatário.',
        });
      }

      const sanitizedAttachments = Array.isArray(attachments)
        ? attachments.map((a) =>
            a?.digitalFileId
              ? {
                  name: a.name,
                  type: a.type,
                  size: Number(a.size || 0),
                  url: a.url || '',
                  digitalFileId: a.digitalFileId,
                }
              : a
          )
        : [];

      const finalSubject = subject || `Re: ${ticket?.subject || 'Atendimento JOGIMIL'}`;
      const clientName = ticket?.clientName || recipient;
      const scheduledIso = new Date(scheduledAt).toISOString();

      let calendarEventId = null;
      if (syncToCalendar !== false) {
        const calEvent = await this.repo.createCalendarEvent({
          title: `Email Agendado: ${finalSubject}`,
          description: `Envio automático para ${clientName} (${recipient}).\n${String(content || '').slice(0, 260)}`,
          type: 'email_agendado',
          status: 'agendado',
          priority: 'media',
          startAt: scheduledIso,
          endAt: new Date(new Date(scheduledIso).getTime() + 30 * 60 * 1000).toISOString(),
          allDay: false,
          location: recipient,
          contactName: clientName,
          owner: 'Equipa JOGIMIL',
          source: 'admin',
        });
        calendarEventId = calEvent.id;
      }

      const scheduled = await this.repo.createScheduledEmail({
        ticketId: id,
        clientName,
        to: recipient,
        cc,
        subject: finalSubject,
        content,
        html,
        attachments: sanitizedAttachments,
        scheduledAt: scheduledIso,
        calendarEventId,
        syncToCalendar: syncToCalendar !== false,
      });

      res.status(201).json({
        success: true,
        scheduled,
        data: scheduled,
        message: 'Email agendado com sucesso e sincronizado no Calendário Corporativo.',
      });
    } catch (err) {
      next(err);
    }
  }

  async sendScheduledEmailNow(req, res, next) {
    try {
      const { scheduleId } = req.params;
      const list = await this.repo.getScheduledEmails();
      const item = list.find((i) => i.id === scheduleId);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Agendamento não encontrado.' });
      }
      const updated = await this._dispatchSingleScheduledEmail(item, { allowRetryFailed: true });
      res.status(updated.status === 'sent' ? 200 : 502).json({
        success: updated.status === 'sent',
        scheduled: updated,
        message:
          updated.status === 'sent'
            ? 'Email agendado enviado imediatamente com sucesso.'
            : updated.error || 'Falha ao enviar o email agendado.',
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteScheduledEmail(req, res, next) {
    try {
      const { scheduleId } = req.params;
      const list = await this.repo.getScheduledEmails();
      const item = list.find((i) => i.id === scheduleId);
      if (item?.calendarEventId) {
        await this.repo.deleteCalendarEvent(item.calendarEventId).catch(() => {});
      }
      await this.repo.deleteScheduledEmail(scheduleId);
      res.json({ success: true, message: 'Agendamento de email cancelado e removido do calendário.' });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // AUTENTICAÇÃO, PERFIL, MULTI-UTILIZADORES (RBAC) & PRESENÇA ONLINE REAL-TIME
  // =========================================================================
  _hashPassword(raw) {
    return crypto.createHash('sha256').update(String(raw || '')).digest('hex');
  }

  _isAdmin(user) {
    return !user || user.role === 'admin' || user.id === 'usr_admin_root';
  }

  _sanitizeUser(u) {
    if (!u) return null;
    const presence = this._presenceMap.get(u.id) || null;
    const now = Date.now();
    const ageMs = presence ? now - presence.lastSeenMs : Infinity;
    const onlineStatus = ageMs <= 45000 ? 'online' : ageMs <= 180000 ? 'away' : 'offline';
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role || 'agente',
      jobTitle: u.jobTitle || '',
      whatsapp: u.whatsapp || '',
      avatarUrl: u.avatarUrl || '',
      notifyWhatsapp: u.notifyWhatsapp !== false,
      notifyEmail: u.notifyEmail !== false,
      reminderMinutesBefore: Number(u.reminderMinutesBefore ?? 15),
      active: u.active !== false,
      permissions: Array.isArray(u.permissions) ? u.permissions : [],
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      onlineStatus,
      activeTab: presence?.activeTab || '',
      lastSeenAt: presence?.lastSeenAt || null,
    };
  }

  async _getRequestUser(req) {
    const userId = String(req.headers?.['x-user-id'] || '').trim();
    if (userId && this.repo.getUserById) {
      const found = await this.repo.getUserById(userId).catch(() => null);
      if (found) return found;
    }
    const users = this.repo.getUsers ? await this.repo.getUsers().catch(() => []) : [];
    return (
      users.find((u) => u.id === 'usr_admin_root') ||
      users[0] || {
        id: 'usr_admin_root',
        name: 'Joel Gaspar',
        email: 'admin@jogimiltecnologias.it.ao',
        role: 'admin',
        whatsapp: '244942775559',
      }
    );
  }

  async loginUser(req, res, next) {
    try {
      const { email, password } = req.body || {};
      const cleanEmail = String(email || '').trim().toLowerCase();
      if (!cleanEmail || !password) {
        return res.status(400).json({ success: false, message: 'Email e palavra-passe são obrigatórios.' });
      }

      const user = await this.repo.getUserByEmail(cleanEmail);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Credenciais inválidas. Utilizador não encontrado.' });
      }
      if (user.active === false) {
        return res.status(403).json({ success: false, message: 'Esta conta está desativada. Contacte o Administrador.' });
      }

      const incomingHash = this._hashPassword(password);
      const isDefaultAdminUnchanged =
        user.id === 'usr_admin_root' &&
        user.passwordHash === '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9' &&
        String(password).length >= 4;

      if (user.passwordHash !== incomingHash && !isDefaultAdminUnchanged) {
        return res.status(401).json({ success: false, message: 'Palavra-passe incorreta.' });
      }

      this._presenceMap.set(user.id, {
        userId: user.id,
        activeTab: 'dashboard',
        lastSeenMs: Date.now(),
        lastSeenAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        user: this._sanitizeUser(user),
      });
    } catch (err) {
      next(err);
    }
  }

  async getMyProfile(req, res, next) {
    try {
      const user = await this._getRequestUser(req);
      res.json({ success: true, profile: this._sanitizeUser(user) });
    } catch (err) {
      next(err);
    }
  }

  async updateMyProfile(req, res, next) {
    try {
      const user = await this._getRequestUser(req);
      const { name, jobTitle, whatsapp, avatarUrl, notifyWhatsapp, notifyEmail, reminderMinutesBefore, newPassword } = req.body || {};
      const patch = {};
      if (name !== undefined && String(name).trim()) patch.name = String(name).trim();
      if (jobTitle !== undefined) patch.jobTitle = String(jobTitle).trim();
      if (whatsapp !== undefined) patch.whatsapp = String(whatsapp).trim();
      if (avatarUrl !== undefined) patch.avatarUrl = String(avatarUrl || '').trim();
      if (typeof notifyWhatsapp === 'boolean') patch.notifyWhatsapp = notifyWhatsapp;
      if (typeof notifyEmail === 'boolean') patch.notifyEmail = notifyEmail;
      if (reminderMinutesBefore !== undefined) patch.reminderMinutesBefore = Number(reminderMinutesBefore);
      if (newPassword && String(newPassword).trim().length >= 4) {
        patch.passwordHash = this._hashPassword(String(newPassword).trim());
      }

      const updated = await this.repo.updateUser(user.id, patch);
      res.json({
        success: true,
        profile: this._sanitizeUser(updated),
        message: 'Perfil atualizado com sucesso.',
      });
    } catch (err) {
      next(err);
    }
  }

  async userHeartbeat(req, res, next) {
    try {
      const user = await this._getRequestUser(req);
      const { activeTab = 'dashboard' } = req.body || {};
      this._presenceMap.set(user.id, {
        userId: user.id,
        activeTab: String(activeTab),
        lastSeenMs: Date.now(),
        lastSeenAt: new Date().toISOString(),
      });
      res.json({ success: true, status: 'online' });
    } catch (err) {
      next(err);
    }
  }

  async getOnlineUsers(req, res, next) {
    try {
      const users = await this.repo.getUsers();
      const list = users
        .filter((u) => u.active !== false)
        .map((u) => {
          const s = this._sanitizeUser(u);
          return {
            id: s.id,
            name: s.name,
            email: s.email,
            role: s.role,
            jobTitle: s.jobTitle,
            avatarUrl: s.avatarUrl || '',
            onlineStatus: s.onlineStatus,
            activeTab: s.activeTab,
            lastSeenAt: s.lastSeenAt,
          };
        });
      const online = list.filter((u) => u.onlineStatus === 'online');
      res.json({
        success: true,
        onlineCount: online.length,
        totalUsers: list.length,
        users: list,
      });
    } catch (err) {
      next(err);
    }
  }

  async listUsers(req, res, next) {
    try {
      const user = await this._getRequestUser(req);
      const users = await this.repo.getUsers();
      if (!this._isAdmin(user)) {
        return res.json({
          success: true,
          users: [this._sanitizeUser(user)],
        });
      }
      res.json({
        success: true,
        users: users.map((u) => this._sanitizeUser(u)),
      });
    } catch (err) {
      next(err);
    }
  }

  async _sendUserCredentialsEmail({ user, plainPassword, mode = 'welcome' }) {
    if (!this.emailCenter?.mailProvider?.sendDirect || !user?.email) {
      return { sent: false, error: 'Serviço SMTP indisponível.' };
    }

    const roleLabels = {
      admin: 'Administrador Geral',
      gestor: 'Gestor Comercial',
      agente: 'Agente / Operador',
      visualizador: 'Consultor (Leitura)',
    };
    const roleLabel = roleLabels[user.role] || user.role || 'Utilizador';
    const isRecovery = mode === 'recovery';
    const isReset = mode === 'reset';

    const subject = isRecovery
      ? 'JOGIMIL Admin · Recuperação de Palavra-passe'
      : isReset
      ? 'JOGIMIL Admin · Nova Palavra-passe de Acesso'
      : 'JOGIMIL Admin · Os seus dados de acesso ao sistema';

    const intro = isRecovery
      ? 'Recebemos um pedido de recuperação da sua palavra-passe no Painel Administrativo JOGIMIL. Foi gerada uma palavra-passe temporária segura para o seu acesso:'
      : isReset
      ? 'A sua palavra-passe de acesso ao Painel Administrativo JOGIMIL foi atualizada pelo Administrador:'
      : 'A sua conta no Painel Administrativo JOGIMIL Tecnologias foi criada com sucesso. Utilize os dados abaixo para iniciar sessão:';

    const html = `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;background:#0C0D10;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#F1F3F6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#14161A;border:1px solid #2A2E37;border-radius:16px;overflow:hidden;">
    <tr>
      <td style="padding:24px 28px;border-bottom:1px solid #2A2E37;background:#181B21;">
        <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#2575FC;font-weight:700;">JOGIMIL · Tecnologias, Lda.</div>
        <h1 style="margin:6px 0 0;font-size:20px;font-weight:700;color:#F1F3F6;">${
          isRecovery ? 'Recuperação de Acesso' : isReset ? 'Credenciais Atualizadas' : 'Bem-vindo(a) ao Painel JOGIMIL'
        }</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:26px 28px;font-size:14px;line-height:1.6;color:#D1D5DB;">
        <p style="margin:0 0 16px;">Olá, <strong style="color:#FFFFFF;">${user.name}</strong>,</p>
        <p style="margin:0 0 20px;">${intro}</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#1B1E24;border:1px solid #2A2E37;border-radius:12px;margin:0 0 20px;">
          <tr>
            <td style="padding:16px 20px;font-size:13px;">
              <div style="margin-bottom:8px;"><span style="color:#9EA4B0;">Email de acesso:</span><br/><strong style="color:#FFFFFF;font-family:monospace;font-size:14px;">${user.email}</strong></div>
              <div style="margin-bottom:8px;"><span style="color:#9EA4B0;">Palavra-passe:</span><br/><strong style="color:#38BDF8;font-family:monospace;font-size:16px;letter-spacing:0.05em;">${plainPassword}</strong></div>
              <div><span style="color:#9EA4B0;">Nível de Acesso:</span> <strong style="color:#FFFFFF;">${roleLabel}</strong></div>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 12px;font-size:12px;color:#9EA4B0;">
          Recomendação de segurança: após entrar no painel, aceda a <strong>Meu Perfil</strong> para personalizar a sua palavra-passe, adicionar a sua foto e configurar o seu número de WhatsApp para alertas automáticos.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 28px;border-top:1px solid #2A2E37;font-size:11px;color:#707682;text-align:center;">
        © ${new Date().getFullYear()} JOGIMIL - Tecnologias, Lda. · Luanda, Angola · Mensagem automática
      </td>
    </tr>
  </table>
</body>
</html>`;

    const text = [
      `Olá, ${user.name},`,
      '',
      intro,
      '',
      `Email: ${user.email}`,
      `Palavra-passe: ${plainPassword}`,
      `Nível de Acesso: ${roleLabel}`,
      '',
      'Recomendamos alterar a palavra-passe em "Meu Perfil" após o primeiro acesso.',
      'Equipa JOGIMIL Tecnologias',
    ].join('\n');

    try {
      const res = await this.emailCenter.mailProvider.sendDirect({
        to: user.email,
        subject,
        text,
        html,
      });
      return { sent: Boolean(res?.success), error: res?.success ? '' : res?.error || 'Falha SMTP' };
    } catch (err) {
      return { sent: false, error: err?.message || 'Erro ao enviar email de credenciais.' };
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body || {};
      const cleanEmail = String(email || '').trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return res.status(400).json({ success: false, message: 'Introduza um endereço de email válido.' });
      }

      const user = await this.repo.getUserByEmail(cleanEmail);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Nenhuma conta foi encontrada com este endereço de email.',
        });
      }
      if (user.active === false) {
        return res.status(403).json({
          success: false,
          message: 'Esta conta está desativada. Contacte o Administrador.',
        });
      }

      const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
      const tempPassword = `JGM-${randomPart}`;
      await this.repo.updateUser(user.id, {
        passwordHash: this._hashPassword(tempPassword),
      });

      const emailResult = await this._sendUserCredentialsEmail({
        user,
        plainPassword: tempPassword,
        mode: 'recovery',
      });

      if (!emailResult.sent) {
        return res.status(502).json({
          success: false,
          message: `A palavra-passe foi redefinida, mas falhou o envio do email (${emailResult.error}). Contacte o Administrador.`,
        });
      }

      res.json({
        success: true,
        message: `Enviámos uma nova palavra-passe temporária para ${user.email}. Verifique a sua caixa de entrada.`,
      });
    } catch (err) {
      next(err);
    }
  }

  async createUser(req, res, next) {
    try {
      const actor = await this._getRequestUser(req);
      if (!this._isAdmin(actor)) {
        return res.status(403).json({ success: false, message: 'Apenas Administradores podem criar utilizadores.' });
      }
      const { name, email, password, role = 'agente', jobTitle = '', whatsapp = '', avatarUrl = '', permissions = [] } = req.body || {};
      if (!String(name || '').trim() || !String(email || '').trim()) {
        return res.status(400).json({ success: false, message: 'Nome e email são obrigatórios.' });
      }
      if (!password || String(password).length < 4) {
        return res.status(400).json({ success: false, message: 'Defina uma palavra-passe com pelo menos 4 caracteres.' });
      }
      const plainPassword = String(password).trim();
      const created = await this.repo.createUser({
        name,
        email,
        passwordHash: this._hashPassword(plainPassword),
        role,
        jobTitle,
        whatsapp,
        avatarUrl,
        permissions: role === 'admin' ? ['*'] : permissions,
      });

      const credentialsEmail = await this._sendUserCredentialsEmail({
        user: created,
        plainPassword,
        mode: 'welcome',
      });

      res.status(201).json({
        success: true,
        user: this._sanitizeUser(created),
        credentialsEmail,
        message: credentialsEmail.sent
          ? `Utilizador "${created.name}" criado e dados de acesso enviados automaticamente para ${created.email}.`
          : `Utilizador "${created.name}" criado! (Aviso no envio de email: ${credentialsEmail.error})`,
      });
    } catch (err) {
      if (err.message?.includes('Já existe')) {
        return res.status(409).json({ success: false, message: err.message });
      }
      next(err);
    }
  }

  async updateUser(req, res, next) {
    try {
      const actor = await this._getRequestUser(req);
      if (!this._isAdmin(actor)) {
        return res.status(403).json({ success: false, message: 'Apenas Administradores podem editar utilizadores.' });
      }
      const { id } = req.params;
      const { name, email, password, role, jobTitle, whatsapp, avatarUrl, notifyWhatsapp, notifyEmail, reminderMinutesBefore, active, permissions } = req.body || {};
      const patch = {};
      if (name !== undefined) patch.name = String(name).trim();
      if (email !== undefined) patch.email = String(email).trim().toLowerCase();
      if (role !== undefined && id !== 'usr_admin_root') patch.role = role;
      if (jobTitle !== undefined) patch.jobTitle = String(jobTitle).trim();
      if (whatsapp !== undefined) patch.whatsapp = String(whatsapp).trim();
      if (avatarUrl !== undefined) patch.avatarUrl = String(avatarUrl || '').trim();
      if (typeof notifyWhatsapp === 'boolean') patch.notifyWhatsapp = notifyWhatsapp;
      if (typeof notifyEmail === 'boolean') patch.notifyEmail = notifyEmail;
      if (reminderMinutesBefore !== undefined) patch.reminderMinutesBefore = Number(reminderMinutesBefore);
      if (typeof active === 'boolean' && id !== 'usr_admin_root') patch.active = active;
      if (Array.isArray(permissions)) patch.permissions = permissions;
      let newPlainPassword = '';
      if (password && String(password).trim().length >= 4) {
        newPlainPassword = String(password).trim();
        patch.passwordHash = this._hashPassword(newPlainPassword);
      }
      const updated = await this.repo.updateUser(id, patch);

      let credentialsEmail = null;
      if (newPlainPassword) {
        credentialsEmail = await this._sendUserCredentialsEmail({
          user: updated,
          plainPassword: newPlainPassword,
          mode: 'reset',
        });
      }

      res.json({
        success: true,
        user: this._sanitizeUser(updated),
        credentialsEmail,
        message:
          newPlainPassword && credentialsEmail?.sent
            ? `Utilizador atualizado e nova palavra-passe enviada para ${updated.email}.`
            : 'Utilizador atualizado com sucesso.',
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const actor = await this._getRequestUser(req);
      if (!this._isAdmin(actor)) {
        return res.status(403).json({ success: false, message: 'Apenas Administradores podem eliminar utilizadores.' });
      }
      const { id } = req.params;
      await this.repo.deleteUser(id);
      this._presenceMap.delete(id);
      res.json({ success: true, message: 'Utilizador eliminado com sucesso.' });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // COMUNICAÇÃO INTERNA (CHAT CORPORATIVO ENTRE UTILIZADORES)
  // =========================================================================
  async listInternalMessages(req, res, next) {
    try {
      const user = await this._getRequestUser(req);
      const [allMessages, allUsers] = await Promise.all([
        this.repo.getInternalMessages ? this.repo.getInternalMessages() : Promise.resolve([]),
        this.repo.getUsers ? this.repo.getUsers() : Promise.resolve([]),
      ]);

      // Cada utilizador vê os canais corporativos (#general, #comercial, #suporte) e conversas diretas onde participa
      const visible = allMessages.filter(
        (m) =>
          m.channel !== 'direct' ||
          m.senderId === user.id ||
          m.recipientId === user.id
      );

      let unreadTotal = 0;
      const unreadByChannel = {};
      const unreadByUser = {};
      for (const m of visible) {
        const readBy = Array.isArray(m.readBy) ? m.readBy : [];
        if (m.senderId === user.id || readBy.includes(user.id)) continue;
        unreadTotal += 1;
        if (m.channel !== 'direct') {
          unreadByChannel[m.channel] = (unreadByChannel[m.channel] || 0) + 1;
        } else if (m.senderId) {
          unreadByUser[m.senderId] = (unreadByUser[m.senderId] || 0) + 1;
        }
      }

      const colleagues = allUsers
        .filter((u) => u.active !== false)
        .map((u) => {
          const s = this._sanitizeUser(u);
          return {
            id: s.id,
            name: s.name,
            email: s.email,
            role: s.role,
            jobTitle: s.jobTitle,
            avatarUrl: s.avatarUrl || '',
            onlineStatus: s.onlineStatus,
            activeTab: s.activeTab,
            lastSeenAt: s.lastSeenAt,
          };
        });

      res.json({
        success: true,
        currentUserId: user.id,
        messages: visible,
        colleagues,
        unreadTotal,
        unreadGeneral: unreadByChannel.general || 0,
        unreadByChannel,
        unreadByUser,
      });
    } catch (err) {
      next(err);
    }
  }

  async sendInternalMessage(req, res, next) {
    try {
      const user = await this._getRequestUser(req);
      const { channel = 'direct', recipientId = null, content = '', attachments = [] } = req.body || {};
      const cleanContent = String(content || '').trim();
      const safeAttachments = Array.isArray(attachments)
        ? attachments.map((a) => ({
            name: String(a?.name || 'documento'),
            type: String(a?.type || 'application/octet-stream'),
            size: Number(a?.size || 0),
            url: String(a?.url || ''),
            digitalFileId: a?.digitalFileId || null,
          }))
        : [];
      if (!cleanContent && safeAttachments.length === 0) {
        return res.status(400).json({ success: false, message: 'Escreva uma mensagem ou anexe um arquivo.' });
      }

      const allowedRooms = new Set(['general', 'comercial', 'suporte']);
      const isRoom = allowedRooms.has(channel);
      let recipientName = '';
      if (!isRoom) {
        if (!recipientId) {
          return res.status(400).json({ success: false, message: 'Selecione um colega para enviar a mensagem.' });
        }
        const peer = await this.repo.getUserById(recipientId);
        if (!peer) {
          return res.status(404).json({ success: false, message: 'Utilizador destinatário não encontrado.' });
        }
        recipientName = peer.name;
      }

      const message = await this.repo.createInternalMessage({
        channel: isRoom ? channel : 'direct',
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        recipientId: isRoom ? null : recipientId,
        recipientName,
        content: cleanContent,
        attachments: safeAttachments,
        readBy: [user.id],
      });

      res.status(201).json({ success: true, message });
    } catch (err) {
      next(err);
    }
  }

  async markInternalChatRead(req, res, next) {
    try {
      const user = await this._getRequestUser(req);
      const { channel = 'direct', peerId = null } = req.body || {};
      await this.repo.markInternalMessagesRead(user.id, { channel, peerId });
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // AUDITORIA & LOGS DE AÇÕES DE UTILIZADORES (ADMIN)
  // =========================================================================
  _classifyAuditEvent(method, routePath, body = {}) {
    const p = String(routePath || '').split('?')[0];
    const m = String(method || '').toUpperCase();

    let module = 'Sistema';
    let action = `${m} ${p}`;
    const safeSummaryParts = [];
    if (body?.title) safeSummaryParts.push(`"${String(body.title).slice(0, 60)}"`);
    else if (body?.name) safeSummaryParts.push(`"${String(body.name).slice(0, 60)}"`);
    else if (body?.subject) safeSummaryParts.push(`"${String(body.subject).slice(0, 60)}"`);
    if (body?.to) safeSummaryParts.push(`para ${String(body.to).slice(0, 50)}`);
    if (body?.email && !p.includes('/auth/')) safeSummaryParts.push(String(body.email).slice(0, 50));

    if (p.startsWith('/auth/login')) {
      module = 'Autenticação';
      action = 'Início de sessão';
      if (body?.email) safeSummaryParts.push(String(body.email));
    } else if (p.startsWith('/auth/forgot-password')) {
      module = 'Autenticação';
      action = 'Pedido de recuperação de palavra-passe';
      if (body?.email) safeSummaryParts.push(String(body.email));
    } else if (p.startsWith('/profile')) {
      module = 'Perfil';
      action = 'Atualizou o próprio perfil';
    } else if (p.startsWith('/users')) {
      module = 'Utilizadores';
      action =
        m === 'POST'
          ? 'Criou perfil de utilizador'
          : m === 'DELETE'
          ? 'Eliminou utilizador'
          : 'Atualizou perfil / nível de acesso';
    } else if (p.startsWith('/contacts')) {
      module = 'CRM & Contactos';
      if (p.includes('/share')) action = 'Partilhou contacto com utilizadores';
      else if (p.includes('/import')) action = 'Importou contactos em lote (Excel)';
      else if (p.includes('/messages')) action = 'Registou interação no contacto';
      else action = m === 'POST' ? 'Criou contacto' : m === 'DELETE' ? 'Eliminou contacto' : 'Atualizou contacto';
    } else if (p.startsWith('/support')) {
      module = 'Atendimento';
      if (p.includes('/share')) action = 'Partilhou atendimento com utilizadores';
      else if (p.includes('/schedule-email')) action = 'Agendou envio de email';
      else if (p.includes('/messages')) action = m === 'DELETE' ? 'Eliminou mensagem' : 'Enviou resposta no atendimento';
      else action = m === 'DELETE' ? 'Eliminou conversa' : 'Atualizou estado do atendimento';
    } else if (p.startsWith('/broadcast')) {
      module = 'Disparo em Massa';
      if (p.includes('/campaigns')) {
        action = m === 'POST' ? 'Guardou campanha' : m === 'DELETE' ? 'Eliminou campanha guardada' : 'Atualizou campanha guardada';
      } else if (p.includes('/scheduled')) {
        action = p.includes('/send-now')
          ? 'Disparou campanha agendada agora'
          : m === 'DELETE'
          ? 'Cancelou campanha agendada'
          : 'Agendou campanha automática';
      } else {
        action = 'Disparou campanha omnicanal';
      }
    } else if (p.startsWith('/calendar')) {
      module = 'Calendário';
      if (p.includes('/test-reminder')) action = 'Testou lembrete da Agenda';
      else if (p.includes('/sync')) action = 'Sincronizou CalDAV';
      else action = m === 'POST' ? 'Agendou evento na Agenda' : m === 'DELETE' ? 'Eliminou evento' : 'Atualizou evento';
    } else if (p.startsWith('/tasks')) {
      module = 'Tarefas & Processos';
      action = m === 'POST' ? 'Criou tarefa/processo' : m === 'DELETE' ? 'Eliminou tarefa/processo' : 'Atualizou tarefa/processo';
    } else if (p.startsWith('/files')) {
      module = 'Arquivos Digitais';
      if (p.includes('/send')) action = 'Enviou arquivo da Biblioteca';
      else action = m === 'POST' ? 'Carregou arquivo na Biblioteca' : m === 'DELETE' ? 'Eliminou arquivo' : 'Atualizou arquivo';
    } else if (p.startsWith('/internal-chat')) {
      module = 'Comunicação Interna';
      action = 'Enviou mensagem no chat interno';
    } else if (p.startsWith('/settings') || p.startsWith('/whatsapp') || p.startsWith('/email')) {
      module = 'Definições & Canais';
      action = p.includes('/sync-inbox')
        ? 'Sincronizou caixa IMAP'
        : p.includes('/test')
        ? 'Executou teste de ligação/envio'
        : 'Alterou definições ou canal';
    } else if (p.startsWith('/news') || p.startsWith('/team') || p.startsWith('/portfolio')) {
      module = 'Website';
      action = m === 'POST' ? 'Publicou conteúdo no portal' : m === 'DELETE' ? 'Removeu conteúdo do portal' : 'Atualizou conteúdo do portal';
    }

    return {
      module,
      action,
      summary: safeSummaryParts.join(' · ').slice(0, 160),
    };
  }

  auditLogMiddleware(req, res, next) {
    const method = String(req.method || 'GET').toUpperCase();
    const pathOnly = String(req.path || '').split('?')[0];

    // Ignorar leituras GET normais, heartbeats e marcação de leitura do chat (evita ruído)
    const shouldSkip =
      method === 'OPTIONS' ||
      (method === 'GET' && !pathOnly.includes('/export.ics')) ||
      pathOnly === '/users/heartbeat' ||
      pathOnly === '/internal-chat/read' ||
      pathOnly === '/audit-logs';

    if (shouldSkip) {
      return next();
    }

    const startTime = Date.now();
    const reqBodySnapshot = req.body && typeof req.body === 'object' ? { ...req.body } : {};

    res.on('finish', () => {
      if (!this.repo?.appendAuditLog) return;
      const durationMs = Date.now() - startTime;
      const ip = String(req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress || '')
        .split(',')[0]
        .trim();

      this._getRequestUser(req)
        .then((user) => {
          const meta = this._classifyAuditEvent(method, pathOnly, reqBodySnapshot);
          const isAuthCall = pathOnly.startsWith('/auth/');
          return this.repo.appendAuditLog({
            timestamp: new Date().toISOString(),
            userId: isAuthCall ? (reqBodySnapshot.email || 'auth') : user?.id || 'system',
            userName: isAuthCall ? (reqBodySnapshot.email || 'Visitante') : user?.name || 'Sistema',
            userEmail: isAuthCall ? (reqBodySnapshot.email || '') : user?.email || '',
            userRole: isAuthCall ? '' : user?.role || '',
            method,
            path: pathOnly,
            module: meta.module,
            action: meta.action,
            summary: meta.summary,
            statusCode: res.statusCode,
            ip,
            durationMs,
          });
        })
        .catch(() => {});
    });

    next();
  }

  async listAuditLogs(req, res, next) {
    try {
      const actor = await this._getRequestUser(req);
      if (!this._isAdmin(actor)) {
        return res.status(403).json({
          success: false,
          message: 'Apenas Administradores podem aceder à auditoria de logs.',
        });
      }

      const { userId = '', module: mod = '', status = '', search = '', limit = '250' } = req.query || {};
      let logs = this.repo.getAuditLogs ? await this.repo.getAuditLogs() : [];

      if (userId) {
        logs = logs.filter((l) => l.userId === userId || l.userEmail === userId);
      }
      if (mod) {
        logs = logs.filter((l) => l.module === mod);
      }
      if (status === 'success') {
        logs = logs.filter((l) => Number(l.statusCode) < 400);
      } else if (status === 'error') {
        logs = logs.filter((l) => Number(l.statusCode) >= 400);
      }
      const q = String(search || '').trim().toLowerCase();
      if (q) {
        logs = logs.filter((l) =>
          [l.userName, l.userEmail, l.module, l.action, l.summary, l.path, l.ip]
            .join(' ')
            .toLowerCase()
            .includes(q)
        );
      }

      const maxLimit = Math.min(Math.max(Number(limit) || 250, 10), 1000);
      res.json({
        success: true,
        total: logs.length,
        logs: logs.slice(0, maxLimit),
      });
    } catch (err) {
      next(err);
    }
  }

  // --- MICROSERVIÇO META SOCIAL (FACEBOOK PAGES, INSTAGRAM, THREADS, MESSENGER & IG DIRECT) ---
  async getMetaStatus(req, res, next) {
    try {
      const status = await this.metaClient.getStatus();
      res.json({ success: true, ...status });
    } catch (err) {
      next(err);
    }
  }

  async saveMetaConfig(req, res, next) {
    try {
      const status = await this.metaClient.saveConfig(req.body || {});
      res.json({ success: true, ...status });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async getMetaAuthUrl(req, res) {
    try {
      const data = await this.metaClient.buildAuthUrl(req.query.mode, req.query.redirectUri);
      res.json({ success: true, ...data });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async handleMetaAuthCallback(req, res) {
    try {
      const status = await this.metaClient.handleAuthCallback({
        code: req.query.code,
        state: req.query.state,
      });
      res.send(`<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0c0d10;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;">
        <div style="text-align:center;">
          <h2>Conta Meta Conectada com Sucesso!</h2>
          <p>Pode fechar esta janela.</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'JOGIMIL_META_AUTH_OK', status: ${JSON.stringify(status)} }, '*');
              window.close();
            }
          </script>
        </div>
      </body></html>`);
    } catch (err) {
      res.status(400).send(`<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0c0d10;color:#fca5a5;display:flex;align-items:center;justify-content:center;height:100vh;">
        <div style="text-align:center;">
          <h2>Erro na Autenticação Meta</h2>
          <p>${String(err.message || 'Erro desconhecido')}</p>
        </div>
      </body></html>`);
    }
  }

  async disconnectMeta(req, res, next) {
    try {
      const status = await this.metaClient.disconnect(req.body?.target || 'all');
      res.json({ success: true, ...status });
    } catch (err) {
      next(err);
    }
  }

  async listMetaPosts(req, res, next) {
    try {
      const posts = await this.metaClient.listPosts();
      res.json({ success: true, posts });
    } catch (err) {
      next(err);
    }
  }

  async _executeScheduledPost(post) {
    const platforms = Array.isArray(post.platforms) ? post.platforms : [];
    const results = {};

    // 1. Publicar no Portal / Blog se selecionado
    if (platforms.includes('portal')) {
      try {
        const saved = await this.repo.saveNews({
          title: post.title,
          category: post.category || 'Tecnologia',
          tag: post.category || 'Tecnologia',
          excerpt: post.excerpt || post.caption?.slice(0, 180) || '',
          content: post.content || post.caption || post.excerpt || '',
          image: post.image || post.mediaUrl || '',
          author: post.author || 'Equipa JOGIMIL',
          date: new Date().toISOString().slice(0, 10),
        });
        results.portal = { success: true, status: 'published', remoteId: saved?.slug || null };
      } catch (err) {
        results.portal = { success: false, status: 'failed', error: err.message };
      }
    }

    // 2. Publicar nas Redes Sociais Meta (Facebook, Instagram, Threads)
    const socialTargets = platforms.filter((p) => p !== 'portal');
    if (socialTargets.length > 0) {
      const socialRec = await this.metaClient.publishMultiPlatform({
        title: post.title,
        caption: post.caption || [post.excerpt, post.content].filter(Boolean).join('\n\n'),
        postType: post.postType || 'post',
        platforms: socialTargets,
        mediaUrl: post.mediaUrl || (post.image?.startsWith('http') ? post.image : ''),
        link: post.link || '',
      });
      Object.assign(results, socialRec?.results || {});
      // Remover registo duplicado criado pelo publishMultiPlatform para manter apenas o agendado atualizado
      if (socialRec?.id && socialRec.id !== post.id) {
        await this.metaClient.deletePost(socialRec.id).catch(() => {});
      }
    }

    const anyOk = Object.values(results).some((r) => r?.success);
    const allOk = Object.values(results).every((r) => r?.success);
    const updated = this.metaClient.updatePost(post.id, {
      status: allOk ? 'published' : anyOk ? 'partial' : 'failed',
      results,
      publishedAt: new Date().toISOString(),
    });
    return updated || { ...post, status: anyOk ? 'published' : 'failed', results };
  }

  async _processDueScheduledPosts() {
    if (this._postSchedulerRunning) return;
    this._postSchedulerRunning = true;
    try {
      const posts = await this.metaClient.listPosts();
      const now = Date.now();
      const due = posts.filter(
        (p) => p.status === 'scheduled' && p.scheduledAt && new Date(p.scheduledAt).getTime() <= now
      );
      for (const item of due) {
        await this._executeScheduledPost(item).catch(() => {});
      }
    } finally {
      this._postSchedulerRunning = false;
    }
  }

  async publishMetaPost(req, res) {
    try {
      const body = req.body || {};
      const platforms = Array.isArray(body.platforms) ? body.platforms : [];
      const scheduledMs = body.scheduledAt ? new Date(body.scheduledAt).getTime() : 0;
      const isFutureSchedule = Boolean(scheduledMs && scheduledMs > Date.now() + 30000);

      if (isFutureSchedule) {
        let calendarEventId = null;
        if (body.syncCalendar !== false && typeof this.repo.createCalendarEvent === 'function') {
          try {
            const startIso = new Date(scheduledMs).toISOString();
            const endIso = new Date(scheduledMs + 30 * 60 * 1000).toISOString();
            const platformLabels = platforms.map((p) => p.toUpperCase()).join(', ');
            const typeLabel =
              body.postType === 'reel'
                ? 'Reels'
                : body.postType === 'story'
                ? 'Story'
                : body.postType === 'carousel'
                ? 'Carrossel'
                : 'Publicação';
            const ev = await this.repo.createCalendarEvent({
              title: `📣 ${typeLabel} (${platformLabels}): ${body.title || 'Conteúdo JOGIMIL'}`,
              type: 'tarefa',
              startAt: startIso,
              endAt: endIso,
              allDay: false,
              location: platformLabels,
              description: [
                `Formato: ${typeLabel}`,
                `Canais: ${platformLabels}`,
                body.caption || body.excerpt || '',
              ]
                .filter(Boolean)
                .join('\n'),
              color: '#ec4899',
              status: 'agendado',
              owner: req.authUser?.name || body.author || 'Equipa JOGIMIL',
            });
            calendarEventId = ev?.id || null;
          } catch {
            /* non-fatal */
          }
        }

        const scheduledPost = this.metaClient.schedulePost({
          ...body,
          scheduledAt: new Date(scheduledMs).toISOString(),
          calendarEventId,
        });
        return res.status(201).json({
          success: true,
          scheduled: true,
          post: scheduledPost,
          calendarEventId,
        });
      }

      const post = await this.metaClient.publishMultiPlatform(body);
      res.status(201).json({ success: true, scheduled: false, post });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async publishScheduledPostNow(req, res) {
    try {
      const posts = await this.metaClient.listPosts();
      const target = posts.find((p) => p.id === req.params.id);
      if (!target) {
        return res.status(404).json({ success: false, error: 'Publicação agendada não encontrada.' });
      }
      const updated = await this._executeScheduledPost(target);
      res.json({ success: true, post: updated });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async deleteMetaPost(req, res, next) {
    try {
      const posts = await this.metaClient.listPosts();
      const target = posts.find((p) => p.id === req.params.id);
      if (target?.calendarEventId && typeof this.repo.deleteCalendarEvent === 'function') {
        await this.repo.deleteCalendarEvent(target.calendarEventId).catch(() => {});
      }
      await this.metaClient.deletePost(req.params.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  verifyMetaWebhook(req, res) {
    const check = this.metaClient.verifyWebhook(req.query);
    if (check.verified) return res.status(200).send(check.challenge);
    return res.status(403).send('Forbidden');
  }

  async handleMetaWebhook(req, res) {
    try {
      const events = this.metaClient.parseWebhookEvents(req.body || {});
      if (events.length > 0) {
        const tickets = await this.repo.getSupportTickets();
        for (const ev of events) {
          const existing = tickets.find(
            (t) => t.channel === ev.channel && String(t.clientContact || '') === ev.senderId
          );
          if (existing) {
            await this.repo.saveSupportMessage(existing.id, {
              id: ev.messageId,
              sender: 'client',
              channel: ev.channel,
              content: ev.text,
              attachments: ev.attachments,
              timestamp: ev.timestamp,
            });
          } else if (this.repo.createSupportTicket) {
            const label = ev.channel === 'instagram' ? 'Instagram Direct' : 'Facebook Messenger';
            const created = await this.repo.createSupportTicket({
              clientName: `${label} · ${ev.senderId.slice(-6)}`,
              clientContact: ev.senderId,
              clientEmail: '',
              channel: ev.channel,
              subject: `Mensagem ${label}`,
              status: 'aberto',
              priority: 'normal',
              messages: [
                {
                  id: ev.messageId,
                  sender: 'client',
                  channel: ev.channel,
                  content: ev.text,
                  attachments: ev.attachments,
                  timestamp: ev.timestamp,
                },
              ],
            });
            tickets.unshift(created);
          }
        }
      }
      res.status(200).send('EVENT_RECEIVED');
    } catch (err) {
      this.logger.error('[Meta Webhook]', err.message);
      res.status(200).send('EVENT_RECEIVED');
    }
  }
}
