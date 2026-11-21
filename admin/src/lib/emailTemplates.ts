export interface EmailTemplatePreset {
  id: string;
  label: string;
  category: string;
  subject: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
}

export interface SmsTemplatePreset {
  id: string;
  label: string;
  category: string;
  text: string;
}

export const JOGIMIL_LOGO_PUBLIC = 'https://jogimiltecnologias.it.ao/logo-white.png';

export const EMAIL_TEMPLATES: EmailTemplatePreset[] = [
  {
    id: 'boas_vindas',
    label: 'Boas-Vindas',
    category: 'Apresentação',
    subject: 'Bem-vindo à JOGIMIL - Tecnologias, Lda.',
    headline: 'Obrigado pelo seu contacto',
    body: 'Exmo(a). {nome},\n\nAgradecemos o interesse nas soluções da JOGIMIL - Tecnologias, Lda. A nossa equipa em Luanda está disponível para apoiar a transformação digital da sua organização com software de faturação certificado AGT, plataformas web/mobile e consultoria especializada.\n\nFicamos ao dispor para agendar uma conversa inicial.',
    ctaLabel: 'Conhecer Soluções JOGIMIL',
    ctaUrl: 'https://jogimiltecnologias.it.ao/#/servicos',
  },
  {
    id: 'proposta_demo',
    label: 'Proposta & Demo',
    category: 'Comercial',
    subject: 'Proposta e Agendamento de Demonstração · JOGIMIL',
    headline: 'Agendamento da sua Demonstração',
    body: 'Exmo(a). {nome},\n\nPreparamos uma apresentação personalizada das nossas soluções para a {empresa}. Durante a sessão iremos demonstrar o funcionamento completo em tempo real, esclarecer dúvidas técnicas e apresentar o plano de implementação.\n\nClique no botão abaixo para confirmar ou aceder aos detalhes no nosso portal.',
    ctaLabel: 'Agendar Demonstração',
    ctaUrl: 'https://jogimiltecnologias.it.ao/#/contacto',
  },
  {
    id: 'notificacao',
    label: 'Notificação Oficial',
    category: 'Comunicado',
    subject: 'Comunicado Oficial · JOGIMIL Tecnologias',
    headline: 'Atualização e Aviso Importante',
    body: 'Exmo(a). {nome},\n\nInformamos que foram disponibilizadas novas melhorias e atualizações de conformidade nos sistemas da JOGIMIL Tecnologias.\n\nRecomendamos que consulte os detalhes completos no link abaixo ou contacte a nossa equipa técnica caso necessite de apoio na atualização.',
    ctaLabel: 'Consultar Detalhes',
    ctaUrl: 'https://jogimiltecnologias.it.ao/#/noticias',
  },
  {
    id: 'suporte_followup',
    label: 'Suporte & Follow-Up',
    category: 'Atendimento',
    subject: 'Atualização do seu Pedido de Suporte · JOGIMIL',
    headline: 'Acompanhamento do seu Atendimento',
    body: 'Exmo(a). {nome},\n\nDamos seguimento ao seu pedido junto da nossa equipa de suporte técnico em Luanda. Caso precise enviar documentos adicionais ou esclarecer algum ponto, basta responder diretamente a este email ou contactar-nos pelo botão abaixo.\n\nContinuamos à sua inteira disposição.',
    ctaLabel: 'Falar no WhatsApp',
    ctaUrl: 'https://wa.me/244942775559',
  },
];

export const SMS_TEMPLATES: SmsTemplatePreset[] = [
  {
    id: 'sms_boas_vindas',
    label: 'Boas-Vindas',
    category: 'Apresentação',
    text: 'Olá {nome}! Obrigado por contactar a JOGIMIL Tecnologias. A nossa equipa em Luanda já recebeu o seu pedido e responderá em breve. Portal: https://jogimiltecnologias.it.ao',
  },
  {
    id: 'sms_demo',
    label: 'Agendar Demo',
    category: 'Comercial',
    text: 'Olá {nome}, podemos agendar uma demonstração das soluções JOGIMIL para a {empresa} esta semana (online ou presencial em Luanda). Qual o melhor dia e horário?',
  },
  {
    id: 'sms_notificacao',
    label: 'Notificação / Aviso',
    category: 'Comunicado',
    text: 'Comunicado JOGIMIL: Olá {nome}, já está disponível uma nova atualização nos nossos sistemas. Consulte os detalhes em https://jogimiltecnologias.it.ao/#/noticias',
  },
  {
    id: 'sms_suporte',
    label: 'Follow-Up Suporte',
    category: 'Atendimento',
    text: 'Olá {nome}, estamos a acompanhar o seu pedido de suporte na JOGIMIL Tecnologias. Confirme se já está tudo operacional ou se precisa de apoio adicional.',
  },
];

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatBodyToHtml(body: string): string {
  // Permite links no formato [Texto](https://url) ou URLs diretas
  const escaped = escapeHtml(body);
  const withMdLinks = escaped.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" style="color:#0066FF;text-decoration:underline;font-weight:600;" target="_blank" rel="noreferrer">$1</a>'
  );
  const withAutoLinks = withMdLinks.replace(
    /(^|[\s>])(https?:\/\/[^\s<]+)/g,
    '$1<a href="$2" style="color:#0066FF;text-decoration:underline;" target="_blank" rel="noreferrer">$2</a>'
  );
  return withAutoLinks
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px 0;line-height:1.65;color:#1e293b;font-size:14px;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

export function buildBrandedEmailHtml({
  category = 'JOGIMIL Tecnologias',
  headline = 'Comunicação Oficial',
  body = '',
  ctaLabel = '',
  ctaUrl = '',
  previewLocalLogo = false,
}: {
  category?: string;
  headline?: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  previewLocalLogo?: boolean;
}): string {
  const logoSrc = previewLocalLogo ? '/logo-white.png' : JOGIMIL_LOGO_PUBLIC;
  const formattedBody = formatBodyToHtml(body);
  const ctaBlock =
    ctaLabel && ctaUrl
      ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 8px 0;">
          <tr>
            <td style="background-color:#0066FF;padding:12px 24px;">
              <a href="${escapeHtml(ctaUrl)}" target="_blank" rel="noreferrer" style="color:#ffffff;font-family:Inter,Arial,sans-serif;font-size:13px;font-weight:600;text-decoration:none;display:inline-block;letter-spacing:0.02em;">
                ${escapeHtml(ctaLabel)} &rarr;
              </a>
            </td>
          </tr>
        </table>`
      : '';

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Inter,Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f5f9;padding:28px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #cbd5e1;">
          <!-- Header JOGIMIL com Logo -->
          <tr>
            <td style="background-color:#080b12;padding:24px 32px;border-bottom:3px solid #0066FF;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="left">
                    <img src="${logoSrc}" alt="JOGIMIL Tecnologias" height="32" style="height:32px;width:auto;display:block;border:0;" />
                  </td>
                  <td align="right" style="color:#94a3b8;font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:0.1em;">
                    ${escapeHtml(category)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Corpo -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 18px 0;font-size:20px;line-height:1.3;color:#0f172a;font-weight:700;">
                ${escapeHtml(headline)}
              </h1>
              ${formattedBody}
              ${ctaBlock}
            </td>
          </tr>

          <!-- Rodapé Institucional -->
          <tr>
            <td style="background-color:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;line-height:1.6;">
              <strong style="color:#0f172a;">JOGIMIL - Tecnologias, Lda.</strong><br/>
              Urbanização Nova Vida, Kilamba Kiaxi · Luanda, Angola<br/>
              Email: <a href="mailto:geral@jogimiltecnologias.it.ao" style="color:#0066FF;text-decoration:none;">geral@jogimiltecnologias.it.ao</a> · Tel: +244 942 775 559 ·
              <a href="https://jogimiltecnologias.it.ao" style="color:#0066FF;text-decoration:none;">jogimiltecnologias.it.ao</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
