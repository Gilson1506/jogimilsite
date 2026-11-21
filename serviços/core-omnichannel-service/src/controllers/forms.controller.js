import { sendFormEmail } from '../services/mail.service.js';
import { saveSubmission, getRecentSubmissions } from '../services/storage.service.js';
import { formatLuandaTimestamp } from '../templates/email.template.js';
import { ENV } from '../config/env.js';

export async function submitForm(req, res) {
  try {
    const { formType = 'geral', formTitle = 'Novo Formulário', data = {}, source = '' } = req.body || {};

    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Dados do formulário vazios ou inválidos.',
      });
    }

    const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const receivedAt = formatLuandaTimestamp();

    const record = {
      id,
      receivedAt,
      formType,
      formTitle,
      clientEmail: data.email || null,
      clientName: data.nome || null,
      data,
      source,
      status: 'received',
    };

    // 1. Gravar em disco
    const saved = saveSubmission(record);

    // 2. Encaminhar para e-mail
    const emailResult = await sendFormEmail({
      formTitle,
      formType,
      data,
      source,
    });

    return res.status(200).json({
      success: true,
      id,
      message: 'Pedido recebido com sucesso pela equipa da JOGIMIL.',
      emailStatus: emailResult,
      localLogged: saved,
      destination: ENV.DESTINATION_EMAIL,
    });
  } catch (err) {
    console.error('[FormsController] Erro no processamento:', err);
    return res.status(500).json({
      success: false,
      error: 'Erro interno ao processar a submissão.',
    });
  }
}

export function listRecent(req, res) {
  const limit = Math.min(Number(req.query.limit || 20), 100);
  const submissions = getRecentSubmissions(limit);
  return res.json({
    success: true,
    count: submissions.length,
    submissions,
  });
}
