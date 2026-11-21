function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatLuandaTimestamp() {
  return new Intl.DateTimeFormat('pt-AO', {
    dateStyle: 'full',
    timeStyle: 'medium',
    timeZone: 'Africa/Luanda',
  }).format(new Date());
}

export function generateEmailHtml({ formTitle, formType, data, timestamp, source }) {
  const fieldsRows = Object.entries(data)
    .filter(([_, val]) => val !== undefined && val !== null && String(val).trim() !== '')
    .map(([key, val]) => {
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      return `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-weight: 600; color: #475569; width: 35%; background-color: #F8FAFC;">
            ${escapeHtml(label)}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; color: #0F172A; line-height: 1.5;">
            ${escapeHtml(String(val)).replace(/\n/g, '<br/>')}
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="pt">
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(formTitle)} - JOGIMIL</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0A0F1D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A0F1D; padding: 32px 16px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #FFFFFF; border-radius: 0; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3); border: 1px solid #1E293B;">
                <!-- Header JOGIMIL -->
                <tr>
                  <td style="background-color: #000000; padding: 24px 32px; border-bottom: 3px solid #0066FF;">
                    <table width="100%">
                      <tr>
                        <td>
                          <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">
                            JOGIMIL <span style="color: #0066FF;">TECNOLOGIAS</span>
                          </h1>
                          <p style="margin: 4px 0 0; font-size: 11px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px;">
                            Luanda, Angola · Notificação Automática de Microserviço
                          </p>
                        </td>
                        <td align="right">
                          <span style="display: inline-block; padding: 4px 10px; background-color: #0066FF; color: #FFFFFF; font-size: 11px; font-weight: 700; text-transform: uppercase;">
                            ${escapeHtml(formType)}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Título do Pedido -->
                <tr>
                  <td style="padding: 24px 32px 12px; background-color: #FFFFFF;">
                    <h2 style="margin: 0; font-size: 18px; color: #0F172A; font-weight: 700;">
                      ${escapeHtml(formTitle)}
                    </h2>
                    <p style="margin: 6px 0 0; font-size: 13px; color: #64748B;">
                      Recebido a ${escapeHtml(timestamp)} (Fuso Horário Luanda / WAT)
                    </p>
                  </td>
                </tr>

                <!-- Tabela de Dados -->
                <tr>
                  <td style="padding: 12px 32px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #CBD5E1; border-collapse: collapse; font-size: 14px;">
                      ${fieldsRows}
                    </table>
                  </td>
                </tr>

                <!-- Rodapé -->
                <tr>
                  <td style="padding: 16px 32px; background-color: #F1F5F9; border-top: 1px solid #E2E8F0; font-size: 12px; color: #64748B;">
                    <p style="margin: 0;">
                      Origem: <a href="${escapeHtml(source || 'Website JOGIMIL')}" style="color: #0066FF; text-decoration: none;">${escapeHtml(source || 'Website JOGIMIL')}</a>
                    </p>
                    <p style="margin: 4px 0 0;">
                      JOGIMIL - Tecnologias, Lda. · Nova Vida, Kilamba Kiaxi, Luanda, Angola · +244 942 775 559
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export function generatePlainText({ formTitle, formType, data, timestamp, source }) {
  const fields = Object.entries(data)
    .filter(([_, val]) => val !== undefined && val !== null && String(val).trim() !== '')
    .map(([key, val]) => `${key.toUpperCase()}: ${val}`)
    .join('\n');

  return `
NOVA SUBMISSÃO DE FORMULÁRIO - JOGIMIL TECNOLOGIAS
Tipo: ${formType}
Assunto: ${formTitle}
Data (Luanda): ${timestamp}
Origem: ${source || 'Website'}

DADOS SUBMETIDOS:
----------------------------------------
${fields}
----------------------------------------

JOGIMIL - Tecnologias, Lda.
Nova Vida, Kilamba Kiaxi, Luanda, Angola
Tel: +244 942 775 559
`;
}
