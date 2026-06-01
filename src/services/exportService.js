import { jsPDF } from 'jspdf';
import { formatDate, formatFileSize } from '../utils/misc.js';

function addText(doc, text, x, y, width, options = {}) {
  const lines = doc.splitTextToSize(text, width);
  doc.text(lines, x, y, options);
  return y + lines.length * 6 + 5;
}

export function generateReportPdf(request, { resolveUser }) {
  if (!request?.report) {
    return { success: false, reason: 'missing_report', message: 'Relatório não encontrado.' };
  }
  if (typeof jsPDF === 'undefined') {
    return { success: false, reason: 'missing_jsPDF', message: 'A biblioteca PDF não está disponível.' };
  }

  const client = resolveUser(request.clientId);
  const operator = resolveUser(request.report.operatorId || request.assignedOperatorId);
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = 20;
  const contentWidth = pageWidth - 2 * margin;

  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  yPosition = addText(doc, `Relatório K9 Fiscalização - ${request.title}`, margin, yPosition, contentWidth);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  yPosition = addText(doc, `Código: ${request.id.toUpperCase()} • ${formatDate(request.report.generatedAt)}`, margin, yPosition, contentWidth);
  yPosition += 10;
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  yPosition = addText(doc, 'Resumo Executivo', margin, yPosition, contentWidth);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  yPosition = addText(doc, request.report.summary, margin, yPosition, contentWidth);
  yPosition += 10;

  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  yPosition = addText(doc, 'Achados / Ocorrências', margin, yPosition, contentWidth);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  yPosition = addText(doc, request.report.findings, margin, yPosition, contentWidth);
  yPosition += 10;

  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  yPosition = addText(doc, 'Recomendações', margin, yPosition, contentWidth);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  yPosition = addText(doc, request.report.recommendations, margin, yPosition, contentWidth);
  yPosition += 10;

  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  yPosition = addText(doc, 'Dados da Operação', margin, yPosition, contentWidth);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  yPosition = addText(doc, `Cliente: ${client.name}`, margin, yPosition, contentWidth);
  yPosition = addText(doc, `Operador: ${operator.name}`, margin, yPosition, contentWidth);
  yPosition = addText(doc, `Porto: ${request.port}`, margin, yPosition, contentWidth);
  yPosition = addText(doc, `Embarcação: ${request.vessel}`, margin, yPosition, contentWidth);
  yPosition = addText(doc, `Data: ${formatDate(request.scheduledFor)}`, margin, yPosition, contentWidth);
  yPosition += 10;

  if (request.evidence && request.evidence.length > 0) {
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    yPosition = addText(doc, 'Evidências Anexadas', margin, yPosition, contentWidth);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    request.evidence.forEach((evidence) => {
      yPosition = addText(doc, `• ${evidence.name} (${formatFileSize(evidence.size)})`, margin, yPosition, contentWidth);
    });
    yPosition += 10;
  }

  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  yPosition = addText(doc, 'Linha do Tempo', margin, yPosition, contentWidth);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  [...request.timeline]
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .forEach((event) => {
      yPosition = addText(doc, `${formatDate(event.timestamp)} - ${event.title}`, margin, yPosition, contentWidth);
      yPosition = addText(doc, `Por: ${event.actor?.name || 'Usuário'}`, margin + 10, yPosition, contentWidth - 10);
      yPosition = addText(doc, event.description, margin + 10, yPosition, contentWidth - 10);
      yPosition += 5;
    });

  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setFont(undefined, 'italic');
  doc.text('K9 Fiscalização • Fiscalização marítima com cães', pageWidth / 2, pageHeight - 10, { align: 'center' });

  doc.save(`relatorio_${request.id}_${new Date().toISOString().split('T')[0]}.pdf`);
  return { success: true };
}
