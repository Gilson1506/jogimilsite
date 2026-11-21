import { Router } from 'express';

export function createAdminRouter(adminController) {
  const router = Router();

  // Middleware automático de Auditoria & Rastreio de Ações de Utilizadores
  router.use(adminController.auditLogMiddleware);

  // Autenticação, Perfil & Multi-Utilizadores (RBAC + Presença Online em Tempo Real)
  router.post('/auth/login', adminController.loginUser);
  router.post('/auth/forgot-password', adminController.forgotPassword);
  router.get('/profile', adminController.getMyProfile);
  router.put('/profile', adminController.updateMyProfile);
  router.post('/users/heartbeat', adminController.userHeartbeat);
  router.get('/users/online', adminController.getOnlineUsers);
  router.get('/audit-logs', adminController.listAuditLogs);
  router.get('/users', adminController.listUsers);
  router.post('/users', adminController.createUser);
  router.put('/users/:id', adminController.updateUser);
  router.delete('/users/:id', adminController.deleteUser);

  // Comunicação Interna (Chat Corporativo entre Utilizadores)
  router.get('/internal-chat/messages', adminController.listInternalMessages);
  router.post('/internal-chat/messages', adminController.sendInternalMessage);
  router.post('/internal-chat/read', adminController.markInternalChatRead);

  // Dashboard Omnicanal
  router.get('/dashboard', adminController.getDashboard);

  // Gestão de Contactos & Leads
  router.get('/contacts', adminController.listContacts);
  router.post('/contacts', adminController.createContact);
  router.post('/contacts/import', adminController.importContacts);
  router.post('/contacts/deduplicate', adminController.deduplicateContacts);
  router.put('/contacts/:id/share', adminController.shareContact);
  router.put('/contacts/:id', adminController.updateContact);
  router.patch('/contacts/:id', adminController.updateContact);
  router.delete('/contacts/:id', adminController.deleteContact);
  router.put('/contacts/:id/status', adminController.updateContactStatus);
  router.post('/contacts/:id/messages', adminController.addMessage);

  // Lembretes & Notificações WhatsApp
  router.get('/reminders', adminController.listReminders);
  router.post('/reminders', adminController.createReminder);
  router.put('/reminders/:id/status', adminController.updateReminderStatus);
  router.delete('/reminders/:id', adminController.deleteReminder);
  router.post('/reminders/:id/notify-whatsapp', adminController.notifyReminderWhatsApp);

  // WhatsApp / Evolution API
  router.get('/whatsapp/status', adminController.getWhatsappStatus);
  router.post('/whatsapp/instance', adminController.createWhatsappInstance);
  router.get('/whatsapp/qrcode', adminController.getWhatsappQrCode);
  router.post('/whatsapp/send', adminController.sendWhatsappMessage);
  router.post('/whatsapp/logout', adminController.logoutWhatsapp);

  // Email (SMTP & IMAP)
  router.get('/email/status', adminController.getEmailStatus);
  router.post('/email/test-send', adminController.sendTestEmail);
  router.post('/email/sync-inbox', adminController.syncInboxEmails);

  // Gestão de Notícias
  router.get('/news', adminController.listNews);
  router.post('/news', adminController.createNews);
  router.delete('/news/:slug', adminController.deleteNews);

  // Gestão de Equipa
  router.get('/team', adminController.listTeam);
  router.post('/team', adminController.createTeamMember);
  router.delete('/team/:id', adminController.deleteTeamMember);

  // Gestão de Portfólio
  router.get('/portfolio', adminController.listPortfolio);
  router.post('/portfolio', adminController.createPortfolioItem);
  router.delete('/portfolio/:slug', adminController.deletePortfolioItem);

  // Gestão de Produtos do Portal Público
  router.get('/products', adminController.listProducts);
  router.post('/products', adminController.createProduct);
  router.delete('/products/:slug', adminController.deleteProduct);

  // Definições do Sistema (Evolution API & Email SMTP/IMAP)
  router.get('/settings', adminController.getSettings);
  router.post('/settings', adminController.updateSettings);
  router.post('/settings/test-evolution', adminController.testEvolutionSettings);
  router.post('/settings/test-email', adminController.testEmailSettings);
  router.post('/whatsapp/webhook', adminController.handleEvolutionWebhook);

  // Analytics & Monitoramento de Visitas
  router.get('/analytics/visits', adminController.getVisitAnalytics);

  // Formulários recebidos do Portal & Notificações
  router.get('/submissions', adminController.listFormSubmissions);
  router.get('/notifications', adminController.getNotifications);

  // Atendimento Multicanal / Central de Suporte
  router.get('/support', adminController.listSupportTickets);
  router.get('/support/scheduled-emails', adminController.listScheduledEmails);
  router.post('/support/:id/schedule-email', adminController.scheduleSupportEmail);
  router.post('/support/scheduled-emails/:scheduleId/send-now', adminController.sendScheduledEmailNow);
  router.delete('/support/scheduled-emails/:scheduleId', adminController.deleteScheduledEmail);
  router.post('/support/:id/messages', adminController.addSupportMessage);
  router.put('/support/:id/status', adminController.updateSupportStatus);
  router.put('/support/:id/share', adminController.shareSupportTicket);
  router.delete('/support/:id', adminController.deleteSupportTicket);
  router.delete('/support/:id/messages/:messageId', adminController.deleteSupportMessage);

  // Disparo em Massa, Campanhas Guardadas & Agendamento Automático (WhatsApp, Email, SMS)
  router.get('/broadcast', adminController.listBroadcasts);
  router.post('/broadcast', adminController.sendBroadcast);
  router.get('/broadcast/:id/report.pdf', adminController.downloadBroadcastReportPdf);
  router.get('/broadcast/campaigns', adminController.listSavedCampaigns);
  router.post('/broadcast/campaigns', adminController.createSavedCampaign);
  router.put('/broadcast/campaigns/:id', adminController.updateSavedCampaign);
  router.delete('/broadcast/campaigns/:id', adminController.deleteSavedCampaign);
  router.get('/broadcast/scheduled', adminController.listScheduledBroadcasts);
  router.post('/broadcast/scheduled', adminController.scheduleBroadcast);
  router.post('/broadcast/scheduled/:id/send-now', adminController.sendScheduledBroadcastNow);
  router.delete('/broadcast/scheduled/:id', adminController.deleteScheduledBroadcast);

  // CRM & Funil de Vendas com Análises
  router.get('/crm/deals', adminController.listCrmDeals);
  router.post('/crm/deals', adminController.createCrmDeal);
  router.put('/crm/deals/:id/stage', adminController.updateDealStage);
  router.post('/crm/deals/:id/interactions', adminController.addDealInteraction);
  router.delete('/crm/deals/:id', adminController.deleteCrmDeal);

  // Calendário Corporativo & CalDAV / CardDAV (cPanel)
  router.get('/calendar/events', adminController.listCalendarEvents);
  router.post('/calendar/events', adminController.createCalendarEvent);
  router.put('/calendar/events/:id', adminController.updateCalendarEvent);
  router.delete('/calendar/events/:id', adminController.deleteCalendarEvent);
  router.get('/calendar/caldav/status', adminController.getCalDavStatus);
  router.post('/calendar/caldav/sync', adminController.syncCalDavEvents);
  router.get('/calendar/export.ics', adminController.exportCalendarIcs);
  router.post('/calendar/test-reminder', adminController.testCalendarReminder);

  // Gestão de Tarefas & Processos (Integrado com Calendário e CRM)
  router.get('/tasks', adminController.listTasks);
  router.post('/tasks', adminController.createTask);
  router.put('/tasks/:id', adminController.updateTask);
  router.delete('/tasks/:id', adminController.deleteTask);

  // Arquivos Digitais (PDF, Excel, Imagens) + Envio Direto Email / WhatsApp
  router.get('/files', adminController.listDigitalFiles);
  router.post('/files', adminController.createDigitalFile);
  router.put('/files/:id', adminController.updateDigitalFile);
  router.delete('/files/:id', adminController.deleteDigitalFile);
  router.post('/files/:id/send', adminController.sendDigitalFile);

  // Microserviço Meta Social (Facebook Pages, Instagram Business, Threads, Messenger & IG Direct)
  router.get('/meta/status', adminController.getMetaStatus);
  router.post('/meta/config', adminController.saveMetaConfig);
  router.get('/meta/auth/url', adminController.getMetaAuthUrl);
  router.post('/meta/disconnect', adminController.disconnectMeta);
  router.get('/meta/posts', adminController.listMetaPosts);
  router.post('/meta/publish', adminController.publishMetaPost);
  router.post('/meta/posts/:id/publish-now', adminController.publishScheduledPostNow);
  router.delete('/meta/posts/:id', adminController.deleteMetaPost);

  return router;
}
