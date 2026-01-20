
import { jsPDF } from "jspdf";
import { PDFDocument } from "pdf-lib";
import { ContractRequestData, Supplier, CompanySettings } from "../types";

// Auxiliar para converter base64 em Uint8Array de forma segura
const base64ToUint8Array = (base64: string): Uint8Array => {
  try {
    const pureBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
    const binaryString = atob(pureBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error("Erro na conversão Base64:", e);
    return new Uint8Array(0);
  }
};

// Garante que o valor passado para o PDF seja sempre uma string válida
const safeText = (val: any): string => {
  if (val === null || val === undefined) return "-";
  const s = String(val).trim();
  return s === "" ? "-" : s;
};

// Verifica se os bytes representam um PDF
const isPDF = (bytes: Uint8Array): boolean => {
  if (bytes.length < 5) return false;
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
  
  const companyName = safeText(settings?.companyName || "GRUPO RESINAS BRASIL");
  const documentTitle = safeText(settings?.documentTitle || "Solicitação de Contrato / Minuta");
  
  let currentY = 42;
  let pageNum = 1;

  const drawHeader = () => {
    if (settings?.logoBase64) {
      try {
        doc.addImage(settings.logoBase64, 'PNG', margin, 10, 20, 20, undefined, 'FAST');
      } catch (e) {
        console.warn("Erro ao adicionar logo:", e);
      }
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(companyName.toUpperCase(), pageWidth - margin, 15, { align: "right" });
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(documentTitle, pageWidth - margin, 20, { align: "right" });
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin, 24, { align: "right" });
    
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(margin, 32, contentWidth, 1.2, 'F');
    currentY = 42;
  };

  const drawFooter = () => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(safeText(settings?.footerText || "https://gruporesinasbrasil.com.br/"), margin, pageHeight - 10);
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
    doc.text(safeText(title).toUpperCase(), margin + 3, currentY + 5.5);
    currentY += 12;
  };

  const printMultiLineText = (label: string, text: string, fontSize: number = 9, isBold: boolean = false) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(safeText(label).toUpperCase(), margin, currentY);
    currentY += 5;

    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(0, 0, 0);
    
    const lines = doc.splitTextToSize(safeText(text), contentWidth);
    for (const line of lines) {
      if (checkPageOverflow(5)) {
        currentY += 5;
      }
      doc.text(safeText(line), margin, currentY);
      currentY += 4.5;
    }
    currentY += 4;
  };

  drawHeader();

  // 1. DADOS DO FORNECEDOR
  printSection("1. DADOS DO FORNECEDOR");
  const halfWidth = contentWidth / 2;
  const col2 = margin + halfWidth;
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(100, 100, 100);
  doc.text("RAZÃO SOCIAL", margin, currentY); 
  doc.text("CNPJ", col2, currentY);
  currentY += 4.5;
  
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(0, 0, 0);
  doc.text(safeText(supplier?.name), margin, currentY); 
  doc.text(safeText(supplier?.cnpj), col2, currentY);
  currentY += 8;
  
  printMultiLineText("ENDEREÇO", supplier?.address || "-");
  
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(100, 100, 100);
  doc.text("LOCAL DE PRESTAÇÃO", margin, currentY); 
  doc.text("TIPO DE SERVIÇO", col2, currentY);
  currentY += 4.5;
  
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(0, 0, 0);
  doc.text(safeText(data.serviceLocation), margin, currentY); 
  doc.text(safeText(data.serviceType || supplier?.serviceType), col2, currentY);
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
  
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(100, 100, 100);
  doc.text("ASSINANTES DO CONTRATO (PREPOSTOS)", margin, currentY);
  currentY += 5;
  
  (data.prepostos || []).forEach(p => {
    checkPageOverflow(15);
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, currentY, contentWidth, 12, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, currentY, contentWidth, 12, 'S');
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(30, 41, 59);
    doc.text(safeText(p.name), margin + 3, currentY + 5);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(100, 100, 100);
    doc.text(`${safeText(p.role)} • ${safeText(p.email)}`, margin + 3, currentY + 9);
    currentY += 15;
  });

  // 5. RECURSOS E MATERIAIS
  printSection("5. RECURSOS E MATERIAIS");
  const rList = [];
  if (data.hasMaterials) rList.push(`MATERIAIS:\n${safeText(data.materialsList)}`);
  if (data.hasRental) rList.push(`LOCAÇÃO/EQUIP:\n${safeText(data.rentalList)}`);
  if (data.hasComodato) rList.push(`COMODATO:\n${safeText(data.comodatoList)}`);
  printMultiLineText("LISTA DE MATERIAIS / RECURSOS", rList.length > 0 ? rList.join("\n\n") : "Não aplicável");

  // 6. CONDIÇÕES COMERCIAIS
  printSection("6. CONDIÇÕES COMERCIAIS");
  checkPageOverflow(25);
  doc.setDrawColor(6, 78, 59);
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(margin, currentY, contentWidth, 20, 2, 2, 'FD');
  
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(6, 78, 59);
  doc.text("VALOR TOTAL ESTIMADO", margin + 5, currentY + 6);
  doc.setFontSize(14);
  const formattedVal = typeof data.value === 'number' ? data.value.toLocaleString('pt-BR', {minimumFractionDigits: 2}) : "0,00";
  doc.text(`R$ ${formattedVal}`, margin + 5, currentY + 14);
  
  doc.setFontSize(8);
  doc.text("Vigência:", margin + (contentWidth / 2), currentY + 6);
  doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
  doc.text(`${safeText(data.startDate)} até ${safeText(data.endDate)}`, margin + (contentWidth / 2), currentY + 14);
  currentY += 28;

  printMultiLineText("FORMA DE PAGAMENTO", data.paymentTerms || "-");
  printMultiLineText("CRONOGRAMA DE FATURAMENTO", data.scheduleSteps || "-");
  
  checkPageOverflow(15);
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(100, 100, 100);
  doc.text("CAP / LIMITE", margin, currentY); 
  doc.text("ÍNDICE DE REAJUSTE", margin + halfWidth, currentY);
  currentY += 5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(0, 0, 0);
  doc.text(safeText(data.capLimit), margin, currentY); 
  doc.text(safeText(data.correctionIndex), margin + halfWidth, currentY);
  currentY += 10;
  
  printMultiLineText("GARANTIAS", data.warranties || "-");

  // 7. ANÁLISE DE RISCOS
  printSection("7. ANÁLISE DE RISCOS");
  printMultiLineText("Pontos de Atenção / Riscos", data.urgenciesRisks || "Nenhum risco crítico identificado.", 9, true);

  printSection("7.1. ASPECTOS JURÍDICOS E DE RISCO");
  const legalItems = [
    { id: 'aspectStandardDraft', label: 'Minuta padrão' }, 
    { id: 'aspectNonStandardDraft', label: 'Minuta NÃO padrão' },
    { id: 'aspectConfidentiality', label: 'Cláusulas de confidencialidade' }, 
    { id: 'aspectTermination', label: 'Cláusulas de rescisão e penalidades' },
    { id: 'aspectWarranties', label: 'Garantias exigidas (performance, entrega)' }, 
    { id: 'aspectWarrantyStart', label: 'Contagem da garantia (entrega/execução)' },
    { id: 'aspectPostTermination', label: 'Obrigações pós-encerramento (sigilo)' }, 
    { id: 'aspectPublicAgencies', label: 'Interação com órgãos públicos' },
    { id: 'aspectAdvancePayment', label: 'Cláusula de antecipação de pagamento' }, 
    { id: 'aspectNonStandard', label: 'Condições não padrão (Outros)' }
  ];
  doc.setFontSize(9);
  legalItems.forEach(it => { 
    checkPageOverflow(6); 
    const val = (data as any)[it.id] ? 'X' : ' ';
    doc.text(`[ ${val} ] ${safeText(it.label)}`, margin, currentY); 
    currentY += 6; 
  });

  printSection("7.2. CHECKLIST DE DOCUMENTOS OBRIGATÓRIOS");
  const cList = [
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
  cList.forEach(it => { 
    checkPageOverflow(6); 
    const val = (data as any)[it.id] ? 'X' : ' ';
    doc.text(`[ ${val} ] ${safeText(it.label)}`, margin, currentY); 
    currentY += 6; 
  });

  printSection("8. DOCUMENTOS ANEXOS");
  checkPageOverflow(20);
  doc.setFont("helvetica", "bold"); doc.setFontSize(9);
  doc.text("Documentos Contratuais e Cadastrais:", margin, currentY);
  currentY += 6;
  doc.setFont("helvetica", "normal"); doc.setFontSize(8);
  if (!data.attachments || data.attachments.length === 0) {
    doc.text("• Nenhum anexo fornecido.", margin + 5, currentY);
  } else {
    data.attachments.forEach(att => { 
      checkPageOverflow(5); 
      doc.text(`• ${safeText(att.type)}: ${safeText(att.name)}`, margin + 5, currentY); 
      currentY += 5; 
    });
  }

  currentY = pageHeight - 45;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, currentY, margin + 80, currentY); 
  doc.line(pageWidth - margin - 80, currentY, pageWidth - margin, currentY);
  doc.setFontSize(8); doc.setTextColor(100, 100, 100);
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
               if (attachmentBytes.length > 0 && isPDF(attachmentBytes)) {
                 const attachmentPdf = await PDFDocument.load(attachmentBytes);
                 const copiedPages = await mergedPdf.copyPages(attachmentPdf, attachmentPdf.getPageIndices());
                 copiedPages.forEach((page) => mergedPdf.addPage(page));
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
    link.download = `Checklist_${safeText(supplier?.name).replace(/[^a-zA-Z0-9]/g, '') || 'Contrato'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    return true;
  } catch (error: any) {
    console.error("Erro crítico na geração do PDF:", error);
    alert(`Ocorreu um erro ao gerar o PDF. Verifique os dados e tente novamente.`);
    return false;
  }
};
