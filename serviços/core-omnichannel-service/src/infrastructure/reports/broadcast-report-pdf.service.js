import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGO_CANDIDATES = [
  path.resolve(__dirname, '../../../../../admin/public/logo-mark.png'),
  path.resolve(__dirname, '../../../../../public/logo-original.png'),
  path.resolve(__dirname, '../../../../../logo1-removebg-preview.png'),
];

function findLogoPath() {
  for (const p of LOGO_CANDIDATES) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {
      /* ignore */
    }
  }
  return null;
}

function fmtDate(iso) {
  try {
    const d = iso ? new Date(iso) : new Date();
    return d.toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(iso || '');
  }
}

function fmtBytes(bytes) {
  const n = Number(bytes || 0);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function truncate(str, max = 60) {
  const s = String(str || '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

/**
 * Gera um PDF executivo profissional (A4) no backend com PDFKit
 * para o Relatório de Entregas de Disparo em Massa.
 */
export function generateBroadcastReportPdf(campaign, { statusFilter = 'all', channelFilter = 'all' } = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 42,
      bufferPages: true,
      info: {
        Title: `Relatório de Disparo - ${campaign.title || 'Campanha'}`,
        Author: 'JOGIMIL - Tecnologias, Lda.',
        Subject: 'Relatório Executivo de Entregas Omnicanal',
      },
    });

    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const margin = 42;
    const contentWidth = pageWidth - margin * 2;

    const allDeliveries = Array.isArray(campaign.deliveries) ? campaign.deliveries : [];
    const filteredDeliveries = allDeliveries.filter((d) => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (channelFilter !== 'all' && d.channel !== channelFilter) return false;
      return true;
    });

    const total = allDeliveries.length || Number(campaign.sentCount || campaign.totalRecipients || 0);
    const delivered = Number(campaign.deliveredCount ?? allDeliveries.filter((d) => d.status === 'delivered').length);
    const failed = Number(campaign.failedCount ?? allDeliveries.filter((d) => d.status === 'failed').length);
    const skipped = Number(campaign.skippedCount ?? allDeliveries.filter((d) => d.status === 'skipped').length);
    const pct = (n) => (total > 0 ? `${Math.round((n / total) * 1000) / 10}%` : '0%');
    const rateNum = total > 0 ? Math.min(100, Math.round((delivered / total) * 1000) / 10) : 0;

    // =========================================================================
    // 1. CABEÇALHO CORPORATIVO (LOGO + IDENTIDADE + METADADOS)
    // =========================================================================
    const logoPath = findLogoPath();
    const headerTop = margin;

    // Barra superior azul institucional
    doc.rect(0, 0, pageWidth, 6).fill('#1D4ED8');

    let brandTextX = margin;
    if (logoPath) {
      try {
        doc.image(logoPath, margin, headerTop, { fit: [44, 38] });
        brandTextX = margin + 52;
      } catch {
        brandTextX = margin;
      }
    }

    doc
      .fillColor('#0F172A')
      .font('Helvetica-Bold')
      .fontSize(14)
      .text('JOGIMIL - Tecnologias, Lda.', brandTextX, headerTop + 2);
    doc
      .fillColor('#64748B')
      .font('Helvetica')
      .fontSize(8.5)
      .text('RELATÓRIO OFICIAL DE DISPARO EM MASSA · PAINEL OMNICANAL', brandTextX, headerTop + 20);

    // Metadados à direita
    const channelsLabel = Array.isArray(campaign.channels) && campaign.channels.length
      ? campaign.channels.map((c) => String(c).toUpperCase()).join(' · ')
      : 'OMNICANAL';

    doc
      .fillColor('#0F172A')
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('Relatório de Entregas', margin, headerTop + 2, { width: contentWidth, align: 'right' });
    doc
      .fillColor('#475569')
      .font('Helvetica')
      .fontSize(8.5)
      .text(`Emitido em: ${fmtDate(new Date().toISOString())}`, margin, headerTop + 16, {
        width: contentWidth,
        align: 'right',
      })
      .text(`Canais: ${channelsLabel}`, margin, headerTop + 27, {
        width: contentWidth,
        align: 'right',
      });

    // Linha divisória do cabeçalho
    let y = headerTop + 48;
    doc.moveTo(margin, y).lineTo(pageWidth - margin, y).lineWidth(1.5).strokeColor('#0F172A').stroke();
    y += 14;

    // =========================================================================
    // 2. TÍTULO E RESUMO DA CAMPANHA
    // =========================================================================
    doc
      .fillColor('#0F172A')
      .font('Helvetica-Bold')
      .fontSize(15)
      .text(campaign.title || 'Campanha de Disparo em Massa', margin, y, { width: contentWidth });
    y = doc.y + 4;

    doc
      .fillColor('#475569')
      .font('Helvetica')
      .fontSize(9)
      .text(
        `Audiência: ${campaign.audience || 'Contactos Selecionados'}   |   Executado em: ${fmtDate(
          campaign.createdAt
        )}   |   Ref: ${campaign.id || 'N/A'}`,
        margin,
        y,
        { width: contentWidth }
      );
    y = doc.y + 14;

    // =========================================================================
    // 3. 4 CARDS EXECUTIVOS DE KPI (FUNDO BRANCO LIMPO + FAIXA SUPERIOR DE DESTAQUE)
    // =========================================================================
    const gap = 10;
    const cardW = (contentWidth - gap * 3) / 4;
    const cardH = 62;
    const kpis = [
      { label: 'TOTAL PROCESSADO', val: String(total), sub: '100% da lista', accent: '#2563EB', valColor: '#0F172A' },
      { label: 'ENVIADOS COM SUCESSO', val: String(delivered), sub: `${pct(delivered)} entregues`, accent: '#10B981', valColor: '#047857' },
      { label: 'FALHARAM', val: String(failed), sub: `${pct(failed)} com erro`, accent: '#E11D48', valColor: '#BE123C' },
      { label: 'NÃO ENVIADOS', val: String(skipped), sub: `${pct(skipped)} ignorados`, accent: '#F59E0B', valColor: '#B45309' },
    ];

    kpis.forEach((k, i) => {
      const x = margin + i * (cardW + gap);
      doc.rect(x, y, cardW, cardH).fillAndStroke('#FFFFFF', '#CBD5E1');
      doc.rect(x, y, cardW, 3).fill(k.accent);

      doc
        .fillColor('#64748B')
        .font('Helvetica-Bold')
        .fontSize(7.2)
        .text(k.label, x + 9, y + 10, { width: cardW - 18 });
      doc
        .fillColor(k.valColor)
        .font('Helvetica-Bold')
        .fontSize(18)
        .text(k.val, x + 9, y + 23, { width: cardW - 18 });
      doc
        .fillColor('#64748B')
        .font('Helvetica')
        .fontSize(8)
        .text(k.sub, x + 9, y + 45, { width: cardW - 18 });
    });

    y += cardH + 12;

    // Barra de Taxa Global de Entrega
    doc
      .fillColor('#334155')
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .text('Taxa Global de Sucesso de Entrega', margin, y);
    doc
      .fillColor('#047857')
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .text(`${rateNum}% (${delivered} de ${total})`, margin, y, { width: contentWidth, align: 'right' });
    y += 13;

    doc.rect(margin, y, contentWidth, 6).fill('#E2E8F0');
    if (rateNum > 0) {
      doc.rect(margin, y, Math.max(4, (contentWidth * rateNum) / 100), 6).fill('#10B981');
    }
    y += 16;

    // =========================================================================
    // 4. CONTEÚDO DA MENSAGEM & ANEXOS
    // =========================================================================
    if (campaign.subject || campaign.message || (campaign.attachments && campaign.attachments.length > 0)) {
      const msgSnippet = truncate(campaign.message || '', 340);
      const attText =
        Array.isArray(campaign.attachments) && campaign.attachments.length > 0
          ? campaign.attachments.map((a) => `${a.name} (${fmtBytes(a.size)})`).join(' · ')
          : '';

      const boxStart = y;
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(8.5);
      let innerY = boxStart + 8;

      // Calcular altura aproximada do bloco
      let estH = 16;
      if (campaign.subject) estH += 14;
      if (msgSnippet) estH += doc.heightOfString(msgSnippet, { width: contentWidth - 20, fontSize: 8.5 }) + 8;
      if (attText) estH += 16;

      doc.rect(margin, boxStart, contentWidth, Math.max(36, estH)).fillAndStroke('#F8FAFC', '#E2E8F0');

      if (campaign.subject) {
        doc
          .fillColor('#0F172A')
          .font('Helvetica-Bold')
          .fontSize(8.5)
          .text(`Assunto: ${campaign.subject}`, margin + 10, innerY, { width: contentWidth - 20 });
        innerY = doc.y + 4;
      }
      if (msgSnippet) {
        doc
          .fillColor('#334155')
          .font('Helvetica')
          .fontSize(8.5)
          .text(`Mensagem: ${msgSnippet}`, margin + 10, innerY, { width: contentWidth - 20 });
        innerY = doc.y + 4;
      }
      if (attText) {
        doc
          .fillColor('#1D4ED8')
          .font('Helvetica-Bold')
          .fontSize(8)
          .text(`Anexos: ${attText}`, margin + 10, innerY, { width: contentWidth - 20 });
      }

      y = boxStart + Math.max(36, estH) + 14;
    }

    // =========================================================================
    // 5. DIAGNÓSTICO RÁPIDO DE FALHAS (se existirem falhas ou ignorados)
    // =========================================================================
    const failedItems = allDeliveries.filter((d) => d.status === 'failed' || d.status === 'skipped');
    if (failedItems.length > 0 && statusFilter === 'all') {
      const reasonMap = new Map();
      for (const item of failedItems) {
        const key = item.error || (item.status === 'skipped' ? 'Contacto sem destino válido' : 'Falha de entrega');
        reasonMap.set(key, (reasonMap.get(key) || 0) + 1);
      }
      const topReasons = Array.from(reasonMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);

      const boxH = 26 + topReasons.length * 13;
      if (y + boxH > doc.page.height - 70) {
        doc.addPage();
        y = margin;
      }
      doc.rect(margin, y, contentWidth, boxH).fillAndStroke('#FFF1F2', '#FECDD3');
      doc.rect(margin, y, 3, boxH).fill('#E11D48');
      doc
        .fillColor('#9F1239')
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .text(`Resumo de Falhas / Não Enviados (${failedItems.length})`, margin + 10, y + 7);

      let ry = y + 21;
      for (const [reason, count] of topReasons) {
        doc
          .fillColor('#475569')
          .font('Helvetica')
          .fontSize(8)
          .text(`• ${count}x — ${truncate(reason, 95)}`, margin + 12, ry, { width: contentWidth - 22 });
        ry += 13;
      }
      y += boxH + 14;
    }

    // =========================================================================
    // 6. TABELA DETALHADA POR DESTINATÁRIO (MULTI-PÁGINA COM CABEÇALHO REPETIDO)
    // =========================================================================
    const col = {
      num: { x: margin, w: 24 },
      name: { x: margin + 24, w: 122 },
      channel: { x: margin + 146, w: 56 },
      target: { x: margin + 202, w: 118 },
      status: { x: margin + 320, w: 66 },
      detail: { x: margin + 386, w: contentWidth - 386 },
    };

    const drawTableHeader = (topY) => {
      doc.rect(margin, topY, contentWidth, 20).fill('#0F172A');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7.5);
      doc.text('#', col.num.x + 4, topY + 6, { width: col.num.w - 4 });
      doc.text('DESTINATÁRIO', col.name.x + 4, topY + 6, { width: col.name.w - 6 });
      doc.text('CANAL', col.channel.x + 4, topY + 6, { width: col.channel.w - 6 });
      doc.text('DESTINO', col.target.x + 4, topY + 6, { width: col.target.w - 6 });
      doc.text('ESTADO', col.status.x + 4, topY + 6, { width: col.status.w - 6 });
      doc.text('DETALHE / MOTIVO', col.detail.x + 4, topY + 6, { width: col.detail.w - 6 });
      return topY + 20;
    };

    const filterSuffix =
      statusFilter !== 'all' || channelFilter !== 'all'
        ? ` (Filtro: ${statusFilter.toUpperCase()} / ${channelFilter.toUpperCase()})`
        : '';

    if (y + 50 > doc.page.height - 60) {
      doc.addPage();
      y = margin;
    }

    doc
      .fillColor('#0F172A')
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(`Detalhamento por Destinatário (${filteredDeliveries.length})${filterSuffix}`, margin, y);
    y += 16;
    y = drawTableHeader(y);

    if (filteredDeliveries.length === 0) {
      doc
        .fillColor('#64748B')
        .font('Helvetica')
        .fontSize(9)
        .text('Nenhum registo individual encontrado para os filtros aplicados.', margin, y + 14, {
          width: contentWidth,
          align: 'center',
        });
    } else {
      filteredDeliveries.forEach((item, idx) => {
        const rowH = 24;
        if (y + rowH > doc.page.height - 54) {
          doc.addPage();
          y = margin;
          y = drawTableHeader(y);
        }

        // Fundo alternado subtil
        if (idx % 2 === 1) {
          doc.rect(margin, y, contentWidth, rowH).fill('#F8FAFC');
        }
        doc
          .moveTo(margin, y + rowH)
          .lineTo(pageWidth - margin, y + rowH)
          .lineWidth(0.5)
          .strokeColor('#E2E8F0')
          .stroke();

        const isOk = item.status === 'delivered';
        const isFail = item.status === 'failed';
        const stText = isOk ? 'ENVIADO' : isFail ? 'FALHOU' : 'NÃO ENV.';
        const stColor = isOk ? '#047857' : isFail ? '#BE123C' : '#B45309';

        doc.fillColor('#64748B').font('Helvetica').fontSize(7.8).text(String(idx + 1), col.num.x + 4, y + 7, {
          width: col.num.w - 4,
        });
        doc
          .fillColor('#0F172A')
          .font('Helvetica-Bold')
          .fontSize(8)
          .text(truncate(item.name || 'Contacto', 24), col.name.x + 4, y + 4, { width: col.name.w - 6 });
        if (item.company) {
          doc
            .fillColor('#64748B')
            .font('Helvetica')
            .fontSize(7)
            .text(truncate(item.company, 24), col.name.x + 4, y + 14, { width: col.name.w - 6 });
        }

        doc
          .fillColor('#334155')
          .font('Helvetica-Bold')
          .fontSize(7.5)
          .text(String(item.channel || '').toUpperCase(), col.channel.x + 4, y + 7, { width: col.channel.w - 6 });

        doc
          .fillColor('#475569')
          .font('Helvetica')
          .fontSize(7.5)
          .text(truncate(item.target || '—', 24), col.target.x + 4, y + 7, { width: col.target.w - 6 });

        doc
          .fillColor(stColor)
          .font('Helvetica-Bold')
          .fontSize(7.5)
          .text(stText, col.status.x + 4, y + 7, { width: col.status.w - 6 });

        const detailText = item.error || (isOk ? 'Entregue com sucesso' : 'Sem destino válido');
        doc
          .fillColor(isFail ? '#9F1239' : '#475569')
          .font('Helvetica')
          .fontSize(7.5)
          .text(truncate(detailText, 38), col.detail.x + 4, y + 7, { width: col.detail.w - 6 });

        y += rowH;
      });
    }

    // =========================================================================
    // 7. RODAPÉ COM NUMERAÇÃO DE PÁGINAS EM TODAS AS PÁGINAS
    // =========================================================================
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      const footerY = doc.page.height - 32;
      doc
        .moveTo(margin, footerY - 6)
        .lineTo(pageWidth - margin, footerY - 6)
        .lineWidth(0.6)
        .strokeColor('#CBD5E1')
        .stroke();
      doc
        .fillColor('#64748B')
        .font('Helvetica')
        .fontSize(7.5)
        .text('JOGIMIL - Tecnologias, Lda. · Urbanização Nova Vida, Kilamba Kiaxi, Luanda, Angola', margin, footerY, {
          width: contentWidth - 90,
        });
      doc
        .fillColor('#475569')
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .text(`Página ${i + 1} de ${range.count}`, margin, footerY, {
          width: contentWidth,
          align: 'right',
        });
    }

    doc.end();
  });
}
