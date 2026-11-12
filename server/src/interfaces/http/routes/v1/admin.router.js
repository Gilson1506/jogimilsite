import { Router } from 'express';

export function createAdminRouter(adminController) {
  const router = Router();

  // Dashboard Omnicanal
  router.get('/dashboard', adminController.getDashboard);

  // Gestão de Contactos & Leads
  router.get('/contacts', adminController.listContacts);
  router.post('/contacts', adminController.createContact);
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

  // Email (SMTP & IMAP)
  router.get('/email/status', adminController.getEmailStatus);
  router.post('/email/test-send', adminController.sendTestEmail);

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

  // Definições do Sistema (Evolution API & Email SMTP/IMAP)
  router.get('/settings', adminController.getSettings);
  router.post('/settings', adminController.updateSettings);

  // Atendimento Multicanal / Central de Suporte
  router.get('/support', adminController.listSupportTickets);
  router.post('/support/:id/messages', adminController.addSupportMessage);
  router.put('/support/:id/status', adminController.updateSupportStatus);

  // Disparo em Massa (WhatsApp, Email, SMS)
  router.get('/broadcast', adminController.listBroadcasts);
  router.post('/broadcast', adminController.sendBroadcast);

  // CRM & Funil de Vendas com Análises
  router.get('/crm/deals', adminController.listCrmDeals);
  router.post('/crm/deals', adminController.createCrmDeal);
  router.put('/crm/deals/:id/stage', adminController.updateDealStage);
  router.post('/crm/deals/:id/interactions', adminController.addDealInteraction);
  router.delete('/crm/deals/:id', adminController.deleteCrmDeal);

  return router;
}
