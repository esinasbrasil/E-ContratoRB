
import { jsPDF } from "jspdf";
import { PDFDocument } from "pdf-lib";
import { ContractRequestData, Supplier, CompanySettings } from "../types";

// Auxiliar para converter base64 em Uint8Array de forma segura e limpa
const base64ToUint8Array = (base64: string): Uint8Array => {
  const pureBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
  const binaryString = atob(pureBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Verifica se os bytes realmente representam um PDF válido
const isPDF = (bytes: Uint8Array): boolean => {
  if (bytes.length < 5) return false;
  // Verifica o cabeçalho %PDF-
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d;
};

const createChecklistPDFBlob = async (data: ContractRequestData, supplier?: Supplier, settings?: CompanySettings): Promise<Blob> => {
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
        doc.addImage(settings.logoBase64, 'PNG', margin, 10, 20, 20, undefined, 'FAST');
      } catch (e) {
        console.warn("Logo error:", e);
      }
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
    doc.text(settings?.footerText || "https://gruporesinasbrasil.com.br/", margin, pageHeight - 10);
    doc.text(`Página ${pageNum}`, pageWidth - margin, pageHeight - 10, { align: "right" });
  };

  const checkPageOverflow = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 20) {
      drawFooter();
      doc.addPage();
      pageNum++;
      drawHeader();
      return true;
    }
    return false;
  };

  const printSection = (title: string) => {
    checkPageOverflow(15);
    doc.setFillColor(241, 245, 249); 
    doc.rect(margin, currentY, contentWidth, 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(title.toUpperCase(), margin + 3, currentY + 5.5);
    currentY += 12;
  };

  const printMultiLineText = (label: string, text: string, fontSize: number = 9, isBold: boolean = false) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(label.toUpperCase(), margin, currentY);
    currentY += 5;

    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(0);
    
    const lines = doc.splitTextToSize(text || "-", contentWidth);
    for (const line of lines) {
      if (checkPageOverflow(5)) {
        currentY += 5;
      }
      doc.text(line, margin, currentY);
      currentY += 4.5;
    }
    currentY += 4;
  };

  drawHeader();

  // 1. DADOS DO FORNECEDOR
  printSection("1. DADOS DO FORNECEDOR");
  const halfWidth = contentWidth / 2;
  const col2 = margin + halfWidth;
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(100);
  doc.text("RAZÃO SOCIAL", margin, currentY); doc.text("CNPJ", col2, currentY);
  currentY += 4.5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(0);
  doc.text(supplier?.name || "-", margin); doc.text(supplier?.cnpj || "-", col2);
  currentY += 8;
  printMultiLineText("ENDEREÇO", supplier?.address || "-");
  currentY += 2;
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(100);
  doc.text("LOCAL DE PRESTAÇÃO", margin, currentY); doc.text("TIPO DE SERVIÇO", col2, currentY);
  currentY += 4.5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(0);
  doc.text(data.serviceLocation || "-", margin); doc.text(data.serviceType || supplier?.serviceType || "-", col2);
  currentY += 8;
  printMultiLineText("FILIAIS ENVOLVIDAS", data.supplierBranches || "Não aplicável");

  // 2. DOCUMENTAÇÃO E COMPLIANCE
  printSection("2. DOCUMENTAÇÃO E COMPLIANCE");
  doc.setFontSize(9);
  doc.text(`[ ${data.docSocialContract ? 'X' : ' '} ] Contrato Social`, margin, currentY);
  doc.text(`[ ${data.docSerasa ? 'X' : ' '} ] Pesquisas Serasa/Certidões`, margin + 60, currentY);
  currentY += 12;

  // 3. ESCOPO TÉCNICO
  printSection("3. ESCOPO TÉCNICO");
  printMultiLineText("OBJETO DO FORNECIMENTO", data.objectDescription || "-");
  printMultiLineText("DESCRIÇÃO DETALHADA DO ESCOPO", data.scopeDescription || "-");

  // 4. EQUIPE E RESPONSÁVEIS
  printSection("4. EQUIPE E RESPONSÁVEIS");
  printMultiLineText("RESPONSÁVEL TÉCNICO (ART/RRT)", data.technicalResponsible || "-");
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(100);
  doc.text("ASSINANTES DO CONTRATO (PREPOSTOS)", margin, currentY);
  currentY += 5;
  data.prepostos.forEach(p => {
    checkPageOverflow(15);
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

  // 5. RECURSOS E MATERIAIS
  printSection("5. RECURSOS E MATERIAIS");
  const rList = [];
  if (data.hasMaterials) rList.push(`MATERIAIS:\n${data.materialsList}`);
  if (data.hasRental) rList.push(`LOCAÇÃO/EQUIP:\n${data.rentalList}`);
  if (data.hasComodato) rList.push(`COMODATO:\n${data.comodatoList}`);
  printMultiLineText("LISTA DE MATERIAIS / RECURSOS", rList.join("\n\n") || "Não aplicável");

  // 6. CONDIÇÕES COMERCIAIS
  printSection("6. CONDIÇÕES COMERCIAIS");
  checkPageOverflow(25);
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
  doc.text(`${data.startDate || '?'} até ${data.endDate || '?'}`, margin + (contentWidth / 2), currentY + 14);
  currentY += 28;
  printMultiLineText("FORMA DE PAGAMENTO", data.paymentTerms || "-");
  printMultiLineText("CRONOGRAMA DE FATURAMENTO", data.scheduleSteps || "-");
  checkPageOverflow(15);
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(100);
  doc.text("CAP / LIMITE", margin, currentY); doc.text("ÍNDICE DE REAJUSTE", margin + halfWidth, currentY);
  currentY += 5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(0);
  doc.text(data.capLimit || "Não aplicável", margin); doc.text(data.correctionIndex || "Não aplicável", margin + halfWidth);
  currentY += 10;
  printMultiLineText("GARANTIAS", data.warranties || "-");

  // 7. ANÁLISE DE RISCOS
  printSection("7. ANÁLISE DE RISCOS");
  printMultiLineText("Pontos de Atenção / Riscos", data.urgenciesRisks || "Nenhum risco crítico identificado.", 9, true);

  printSection("7.1. ASPECTOS JURÍDICOS E DE RISCO");
  const legalItems = [
    { id: 'aspectStandardDraft', label: 'Minuta padrão' }, { id: 'aspectNonStandardDraft', label: 'Minuta NÃO padrão' },
    { id: 'aspectConfidentiality', label: 'Cláusulas de confidencialidade' }, { id: 'aspectTermination', label: 'Cláusulas de rescisão e penalidades' },
    { id: 'aspectWarranties', label: 'Garantias exigidas (performance, entrega)' }, { id: 'aspectWarrantyStart', label: 'Contagem da garantia (entrega/execução)' },
    { id: 'aspectPostTermination', label: 'Obrigações pós-encerramento (sigilo)' }, { id: 'aspectPublicAgencies', label: 'Interação com órgãos públicos' },
    { id: 'aspectAdvancePayment', label: 'Cláusula de antecipação de pagamento' }, { id: 'aspectNonStandard', label: 'Condições não padrão (Outros)' }
  ];
  doc.setFontSize(9);
  legalItems.forEach(it => { checkPageOverflow(6); doc.text(`[ ${(data as any)[it.id] ? 'X' : ' '} ] ${it.label}`, margin, currentY); currentY += 6; });

  printSection("7.2. CHECKLIST DE DOCUMENTOS OBRIGATÓRIOS");
  const cList = [
    { id: 'docCheckCommercial', label: 'Acordo Comercial' }, { id: 'docCheckPO', label: 'Pedido de Compra (PO)' },
    { id: 'docCheckCompliance', label: 'Termo de Conformidade' }, { id: 'docCheckSupplierAcceptance', label: 'Confirmação de aceite do fornecedor' },
    { id: 'docCheckSystemRegistration', label: 'Registro no sistema de gestão' }, { id: 'docCheckSupplierReport', label: 'Relatório de avaliação' },
    { id: 'docCheckFiscalValidation', label: 'Documentos fiscais validados' }, { id: 'docCheckSafetyDocs', label: 'Documentos de segurança do trabalho' },
    { id: 'docCheckTrainingCertificates', label: 'Certificados de treinamentos' }
  ];
  cList.forEach(it => { checkPageOverflow(6); doc.text(`[ ${(data as any)[it.id] ? 'X' : ' '} ] ${it.label}`, margin, currentY); currentY += 6; });

  printSection("8. DOCUMENTOS ANEXOS");
  checkPageOverflow(20);
  doc.setFont("helvetica", "bold"); doc.setFontSize(9);
  doc.text("Documentos Contratuais e Cadastrais:", margin, currentY);
  currentY += 6;
  doc.setFont("helvetica", "normal"); doc.setFontSize(8);
  if (data.attachments.length === 0) {
    doc.text("• Nenhum anexo fornecido.", margin + 5, currentY);
  } else {
    data.attachments.forEach(att => { checkPageOverflow(5); doc.text(`• ${att.type}: ${att.name}`, margin + 5, currentY); currentY += 5; });
  }

  currentY = pageHeight - 45;
  doc.setDrawColor(200);
  doc.line(margin, currentY, margin + 80, currentY); doc.line(pageWidth - margin - 80, currentY, pageWidth - margin, currentY);
  doc.setFontSize(8); doc.setTextColor(100);
  doc.text("Solicitante / Gestor do Contrato", margin + 40, currentY + 4, { align: "center" });
  doc.text("Aprovação Diretoria / Jurídico", pageWidth - margin - 40, currentY + 4, { align: "center" });

  drawFooter();
  return doc.output('blob');
};

export const mergeAndSavePDF = async (data: ContractRequestData, supplier?: Supplier, settings?: CompanySettings) => {
  try {
    const mainPdfBlob = await createChecklistPDFBlob(data, supplier, settings);
    const mainPdfArrayBuffer = await mainPdfBlob.arrayBuffer();
    
    const mergedPdf = await PDFDocument.create();
    
    const mainPdfDoc = await PDFDocument.load(mainPdfArrayBuffer);
    const mainPages = await mergedPdf.copyPages(mainPdfDoc, mainPdfDoc.getPageIndices());
    mainPages.forEach((page) => mergedPdf.addPage(page));

    if (data.attachments && data.attachments.length > 0) {
       for (const attachment of data.attachments) {
           try {
               const attachmentBytes = base64ToUint8Array(attachment.fileData);
               
               if (isPDF(attachmentBytes)) {
                 const attachmentPdf = await PDFDocument.load(attachmentBytes);
                 const copiedPages = await mergedPdf.copyPages(attachmentPdf, attachmentPdf.getPageIndices());
                 copiedPages.forEach((page) => mergedPdf.addPage(page));
               } else {
                 console.warn(`Anexo "${attachment.name}" não é um PDF válido e foi ignorado.`);
               }
           } catch (err) {
               console.warn(`Erro ao carregar anexo "${attachment.name}":`, err);
           }
       }
    }

    const mergedPdfBytes = await mergedPdf.save();
    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `Checklist_${supplier?.name.replace(/[^a-zA-Z0-9]/g, '') || 'Contrato'}.pdf`;
    link.click();
    
    // Pequeno delay para garantir o download antes de revogar a URL
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    return true;
  } catch (error: any) {
    console.error("Erro crítico na geração do PDF:", error);
    alert(`Erro ao gerar o PDF: ${error.message}. Tente remover anexos corrompidos.`);
    return false;
  }
};
