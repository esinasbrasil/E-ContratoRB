
import { jsPDF } from "jspdf";
import { PDFDocument } from "pdf-lib";
import { ContractRequestData, Supplier, CompanySettings } from "../types";

const createChecklistPDFBytes = (data: ContractRequestData, supplier?: Supplier, settings?: CompanySettings): ArrayBuffer => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const margin = 15;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const contentWidth = pageWidth - (margin * 2);
  const primaryColor: [number, number, number] = [6, 78, 59];
  
  const companyName = settings?.companyName || "GRUPO RESINAS BRASIL";
  const documentTitle = settings?.documentTitle || "Solicitação de Contrato / Minuta";
  
  let currentY = 0;
  let pageNum = 1;

  const drawHeader = () => {
    if (settings?.logoBase64) {
      try {
        doc.addImage(settings.logoBase64, 'PNG', margin, 10, 20, 20);
      } catch (e) {}
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(companyName.toUpperCase(), pageWidth - margin, 15, { align: "right" });
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(documentTitle, pageWidth - margin, 20, { align: "right" });
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin, 24, { align: "right" });
    
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(margin, 32, contentWidth, 1.2, 'F');
    currentY = 42;
  };

  const drawFooter = () => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("https://gruporesinasbrasil.com.br/", margin, pageHeight - 10);
    doc.text(`Página ${pageNum} de 3`, pageWidth - margin, pageHeight - 10, { align: "right" });
  };

  const printSection = (title: string) => {
    if (currentY > 265) {
      drawFooter();
      doc.addPage();
      pageNum++;
      drawHeader();
    }
    doc.setFillColor(241, 245, 249); 
    doc.rect(margin, currentY, contentWidth, 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(title.toUpperCase(), margin + 3, currentY + 5.5);
    currentY += 12;
  };

  const printField = (label: string, value: string | undefined, widthPercentage = 100) => {
    const valueStr = value || "-";
    const availableWidth = (contentWidth * (widthPercentage / 100)) - 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(label.toUpperCase(), margin, currentY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0);
    const valueLines = doc.splitTextToSize(valueStr, availableWidth);
    doc.text(valueLines, margin, currentY + 4.5);
    currentY += (valueLines.length * 4.5) + 6;
  };

  drawHeader();

  // 1. DADOS DO FORNECEDOR
  printSection("1. DADOS DO FORNECEDOR");
  const halfWidth = contentWidth / 2;
  const col2 = margin + halfWidth;

  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(100);
  doc.text("RAZÃO SOCIAL", margin, currentY);
  doc.text("CNPJ", col2, currentY);
  currentY += 4.5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(0);
  doc.text(supplier?.name || "-", margin);
  doc.text(supplier?.cnpj || "-", col2);
  currentY += 8;

  printField("ENDEREÇO", supplier?.address);
  
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(100);
  doc.text("LOCAL DE PRESTAÇÃO", margin, currentY);
  doc.text("TIPO DE SERVIÇO", col2, currentY);
  currentY += 4.5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(0);
  doc.text(data.serviceLocation || "-", margin);
  doc.text(data.serviceType || supplier?.serviceType || "-", col2);
  currentY += 8;

  printField("FILIAIS ENVOLVIDAS", data.supplierBranches);

  // 2. DOCUMENTAÇÃO E COMPLIANCE
  printSection("2. DOCUMENTAÇÃO E COMPLIANCE");
  doc.setFontSize(9);
  doc.text(`[ ${data.docSocialContract ? 'X' : ' '} ] Contrato Social`, margin, currentY);
  doc.text(`[ ${data.docSerasa ? 'X' : ' '} ] Pesquisas Serasa/Certidões`, margin + 60, currentY);
  currentY += 12;

  // 3. ESCOPO TÉCNICO
  printSection("3. ESCOPO TÉCNICO");
  printField("OBJETO DO FORNECIMENTO", data.objectDescription);
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(100);
  doc.text("DESCRIÇÃO DETALHADA DO ESCOPO", margin, currentY);
  currentY += 5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(0);
  const scopeLines = doc.splitTextToSize(data.scopeDescription, contentWidth);
  doc.text(scopeLines, margin, currentY);
  currentY += (scopeLines.length * 4.2) + 10;

  // 4. EQUIPE E RESPONSÁVEIS
  printSection("4. EQUIPE E RESPONSÁVEIS");
  printField("RESPONSÁVEL TÉCNICO (ART/RRT)", data.technicalResponsible);
  
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(100);
  doc.text("ASSINANTES DO CONTRATO (PREPOSTOS)", margin, currentY);
  currentY += 4;
  
  data.prepostos.forEach(p => {
    if (currentY > 270) { drawFooter(); doc.addPage(); pageNum++; drawHeader(); currentY += 5; }
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, currentY, contentWidth, 12, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, currentY, contentWidth, 12, 'S');
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(30, 41, 59);
    doc.text(p.name || "-", margin + 3, currentY + 5);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(100);
    doc.text(`${p.role} • ${p.email}`, margin + 3, currentY + 9);
    currentY += 15;
  });

  drawFooter();
  doc.addPage(); pageNum++;
  drawHeader();

  // 5. RECURSOS E MATERIAIS
  printSection("5. RECURSOS E MATERIAIS");
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(100);
  doc.text("LISTA DE MATERIAIS / RECURSOS", margin, currentY);
  currentY += 5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(0);
  const resourcesList = [];
  if (data.hasMaterials) resourcesList.push(data.materialsList);
  if (data.hasRental) resourcesList.push(data.rentalList);
  if (data.hasComodato) resourcesList.push(data.comodatoList);
  
  const resourcesText = resourcesList.join("\n") || "Não aplicável";
  const resourcesLines = doc.splitTextToSize(resourcesText, contentWidth);
  doc.text(resourcesLines, margin, currentY);
  currentY += (resourcesLines.length * 4.2) + 10;

  // 6. CONDIÇÕES COMERCIAIS
  printSection("6. CONDIÇÕES COMERCIALS");
  doc.setDrawColor(6, 78, 59);
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(margin, currentY, contentWidth, 20, 2, 2, 'FD');
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(6, 78, 59);
  doc.text("VALOR TOTAL ESTIMADO", margin + 5, currentY + 6);
  doc.setFontSize(14);
  doc.text(`R$ ${data.value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, margin + 5, currentY + 14);
  doc.setFontSize(8);
  doc.text("Vigência:", margin + (contentWidth / 2), currentY + 6);
  doc.setFont("helvetica", "normal"); doc.setTextColor(0);
  doc.text(`${data.startDate} até ${data.endDate}`, margin + (contentWidth / 2), currentY + 14);
  currentY += 28;

  printField("FORMA DE PAGAMENTO", data.paymentTerms);
  
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(100);
  doc.text("CRONOGRAMA DE FATURAMENTO", margin, currentY);
  currentY += 5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  const schedLines = doc.splitTextToSize(data.scheduleSteps || "-", contentWidth);
  doc.text(schedLines, margin, currentY);
  currentY += (schedLines.length * 4.2) + 8;

  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(100);
  doc.text("CAP / LIMITE", margin, currentY);
  doc.text("ÍNDICE DE REAJUSTE", margin + halfWidth, currentY);
  currentY += 5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(0);
  doc.text(data.capLimit || "Não aplicável", margin);
  doc.text(data.correctionIndex || "Não aplicável", margin + halfWidth);
  currentY += 10;

  printField("GARANTIAS", data.warranties);

  // 7. ANÁLISE DE RISCOS
  printSection("7. ANÁLISE DE RISCOS");
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(220, 38, 38);
  doc.text("Pontos de Atenção / Riscos:", margin, currentY);
  currentY += 5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(0);
  const riskLines = doc.splitTextToSize(data.urgenciesRisks || "Nenhum risco crítico identificado.", contentWidth);
  doc.text(riskLines, margin, currentY);
  currentY += (riskLines.length * 4.2) + 10;

  // 7.1 ASPECTOS JURÍDICOS E DE RISCO
  printSection("7.1. ASPECTOS JURÍDICOS E DE RISCO");
  const legalItems = [
    { id: 'aspectStandardDraft', label: 'Minuta padrão' },
    { id: 'aspectNonStandardDraft', label: 'Minuta NÃO padrão' },
    { id: 'aspectConfidentiality', label: 'Cláusulas de confidencialidade' },
    { id: 'aspectTermination', label: 'Cláusulas de rescisão e penalidades' },
    { id: 'aspectWarranties', label: 'Garantias exigidas (performance, entrega)' }
  ];
  doc.setFontSize(9);
  legalItems.forEach(item => {
    doc.text(`[ ${(data as any)[item.id] ? 'X' : ' '} ] ${item.label}`, margin, currentY);
    currentY += 6;
  });

  drawFooter();
  doc.addPage(); pageNum++;
  drawHeader();

  const legalItems2 = [
    { id: 'aspectWarrantyStart', label: 'Contagem da garantia (entrega/execução)' },
    { id: 'aspectPostTermination', label: 'Obrigações pós-encerramento (sigilo)' },
    { id: 'aspectPublicAgencies', label: 'Interação com órgãos públicos' },
    { id: 'aspectAdvancePayment', label: 'Cláusula de antecipação de pagamento' },
    { id: 'aspectNonStandard', label: 'Condições não padrão (Outros)' }
  ];
  legalItems2.forEach(item => {
    doc.text(`[ ${(data as any)[item.id] ? 'X' : ' '} ] ${item.label}`, margin, currentY);
    currentY += 6;
  });
  currentY += 6;

  // 7.2 CHECKLIST DE DOCUMENTOS OBRIGATÓRIOS
  printSection("7.2. CHECKLIST DE DOCUMENTOS OBRIGATÓRIOS");
  const checklistItems = [
    { id: 'docCheckCommercial', label: 'Acordo Comercial' },
    { id: 'docCheckPO', label: 'Pedido de Compra (PO)' },
    { id: 'docCheckCompliance', label: 'Termo de Conformidade' },
    { id: 'docCheckSupplierAcceptance', label: 'Confirmação de aceite do fornecedor' },
    { id: 'docCheckSystemRegistration', label: 'Registro no sistema de gestão' },
    { id: 'docCheckSupplierReport', label: 'Relatório de avaliação' },
    { id: 'docCheckFiscalValidation', label: 'Documentos fiscais validados' },
    { id: 'docCheckSafetyDocs', label: 'Documentos de segurança do trabalho' },
    { id: 'docCheckTrainingCertificates', label: 'Certificados de treinamentos' }
  ];
  checklistItems.forEach(item => {
    doc.text(`[ ${(data as any)[item.id] ? 'X' : ' '} ] ${item.label}`, margin, currentY);
    currentY += 6;
  });
  currentY += 6;

  // 8. DOCUMENTOS ANEXOS
  printSection("8. DOCUMENTOS ANEXOS");
  doc.setFont("helvetica", "bold"); doc.setFontSize(9);
  doc.text("Documentos Contratuais:", margin, currentY);
  currentY += 5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(8);
  if (data.attachments.length === 0) {
    doc.text("• Nenhum anexo fornecido.", margin + 5, currentY);
    currentY += 6;
  } else {
    data.attachments.forEach(att => {
      doc.text(`• ${att.type}: ${att.name}`, margin + 5, currentY);
      currentY += 5;
    });
  }

  // ASSINATURAS
  currentY = 240;
  doc.setDrawColor(200);
  doc.line(margin, currentY, margin + 80, currentY);
  doc.line(pageWidth - margin - 80, currentY, pageWidth - margin, currentY);
  doc.setFontSize(8); doc.setTextColor(100);
  doc.text("Solicitante / Gestor do Contrato", margin + 40, currentY + 4, { align: "center" });
  doc.text("Aprovação Diretoria / Jurídico", pageWidth - margin - 40, currentY + 4, { align: "center" });

  drawFooter();
  return doc.output('arraybuffer');
};

export const mergeAndSavePDF = async (data: ContractRequestData, supplier?: Supplier, settings?: CompanySettings) => {
  try {
    const checklistBytes = createChecklistPDFBytes(data, supplier, settings);
    const mergedPdf = await PDFDocument.create();
    const checklistPdf = await PDFDocument.load(checklistBytes);
    const copiedChecklistPages = await mergedPdf.copyPages(checklistPdf, checklistPdf.getPageIndices());
    copiedChecklistPages.forEach((page) => mergedPdf.addPage(page));

    if (data.attachments && data.attachments.length > 0) {
       for (const attachment of data.attachments) {
           try {
               const base64Data = attachment.fileData.split(',')[1] || attachment.fileData;
               const attachmentBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
               const attachmentPdf = await PDFDocument.load(attachmentBytes);
               const copiedPages = await mergedPdf.copyPages(attachmentPdf, attachmentPdf.getPageIndices());
               copiedPages.forEach((page) => mergedPdf.addPage(page));
           } catch (err) {
               console.error(`Erro ao mesclar anexo ${attachment.type}:`, err);
           }
       }
    }

    const mergedPdfBytes = await mergedPdf.save();
    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `Checklist_Contrato_${supplier?.name.replace(/[^a-zA-Z0-9]/g, '')}.pdf`;
    link.click();
  } catch (error) {
    console.error("Error generating PDF:", error);
  }
};
