
import { jsPDF } from "jspdf";
import { PDFDocument, PageSizes } from "pdf-lib";
import { ContractRequestData, Supplier, CompanySettings, Unit } from "../types";

const base64ToUint8Array = (base64: string): Uint8Array => {
  try {
    const pureBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
    const binaryString = atob(pureBase64);
    const length = binaryString.length;
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error("Erro na conversão Base64:", e);
    return new Uint8Array(0);
  }
};

const safeText = (val: any): string => {
  if (val === null || val === undefined) return "-";
  const s = String(val).trim();
  return s === "" ? "-" : s;
};

const isPDF = (bytes: Uint8Array): boolean => {
  if (bytes.length < 5) return false;
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d;
};

const createChecklistPDFBlob = async (data: ContractRequestData, supplier?: Supplier, settings?: CompanySettings, unit?: Unit): Promise<Blob> => {
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
    const headerInfo = `Pedido: ${safeText(data.orderNumber)}`;
    doc.text(headerInfo, pageWidth - margin, 20, { align: "right" });
    
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`${documentTitle} • Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin, 24, { align: "right" });
    
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
    checkPageOverflow(5);
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

  // 1. UNIDADE CONTRATANTE
  printSection("1. UNIDADE CONTRATANTE");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42); 
  doc.text(safeText(unit?.name || data.serviceLocation).toUpperCase(), margin, currentY);
  currentY += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  
  const cnpjText = unit?.cnpj ? `CNPJ: ${unit.cnpj}` : "CNPJ: -";
  const ieText = unit?.ie ? ` | IE: ${unit.ie}` : "";
  doc.text(`${cnpjText}${ieText}`, margin, currentY);
  currentY += 5;
  
  const unitAddr = safeText(unit?.address);
  const addrLines = doc.splitTextToSize(unitAddr, contentWidth);
  for (const line of addrLines) {
    checkPageOverflow(5);
    doc.text(line, margin, currentY);
    currentY += 4.5;
  }
  currentY += 5;

  // 2. DADOS DO FORNECEDOR
  printSection("2. DADOS DO FORNECEDOR");
  const halfWidth = contentWidth / 2;
  const col2 = margin + halfWidth;

  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(100, 100, 100);
  doc.text("RAZÃO SOCIAL", margin, currentY); 
  doc.text("CNPJ", col2, currentY);
  currentY += 4.5;
  
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(0, 0, 0);
  doc.text(safeText(supplier?.name), margin, currentY); 
  doc.text(safeText(supplier?.cnpj), col2, currentY);
  currentY += 8;
  
  printMultiLineText("ENDEREÇO DO FORNECEDOR", supplier?.address || "-");
  
  printMultiLineText("TIPO DE SERVIÇO", data.serviceType || supplier?.serviceType || "-");
  printMultiLineText("FILIAIS DO FORNECEDOR ENVOLVIDAS", data.supplierBranches || "Não aplicável");

  // 3. DOCUMENTAÇÃO E COMPLIANCE
  printSection("3. DOCUMENTAÇÃO E COMPLIANCE");
  doc.setFontSize(9);
  doc.text(`[ ${data.docSocialContract ? 'X' : ' '} ] Contrato Social`, margin, currentY);
  doc.text(`[ ${data.docSerasa ? 'X' : ' '} ] Pesquisas Serasa/Certidões`, margin + 60, currentY);
  currentY += 12;

  // 4. ESCOPO TÉCNICO
  printSection("4. ESCOPO TÉCNICO");
  printMultiLineText("OBJETO DO FORNECIMENTO", data.objectDescription || "-");
  printMultiLineText("DESCRIÇÃO DETALHADA DO ESCOPO", data.scopeDescription || "-");

  // 5. EQUIPE E RESPONSÁVEIS
  printSection("5. EQUIPE E RESPONSÁVEIS");
  const techRespName = safeText(data.technicalResponsible);
  const techRespCpf = safeText(data.technicalResponsibleCpf);
  const techRespFull = techRespCpf !== "-" ? `${techRespName} (CPF: ${techRespCpf})` : techRespName;
  printMultiLineText("RESPONSÁVEL TÉCNICO (ART/RRT)", techRespFull);
  
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(100, 100, 100);
  doc.text("ASSINANTES DO CONTRATO (PREPOSTOS)", margin, currentY);
  currentY += 5;
  
  (data.prepostos || []).forEach(p => {
    checkPageOverflow(20);
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, currentY, contentWidth, 16, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, currentY, contentWidth, 16, 'S');
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(30, 41, 59);
    doc.text(safeText(p.name).toUpperCase(), margin + 3, currentY + 5);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(100, 100, 100);
    doc.text(`${safeText(p.role)} • CPF: ${safeText(p.cpf)}`, margin + 3, currentY + 9);
    doc.text(`${safeText(p.email)}`, margin + 3, currentY + 13);
    currentY += 20;
  });

  // 6. RECURSOS E MATERIAIS
  printSection("6. RECURSOS E MATERIAIS");
  const rListItems = [];
  if (data.hasMaterials) rListItems.push(`MATERIAIS: ${safeText(data.materialsList)}`);
  if (data.hasRental) rListItems.push(`LOCAÇÃO/EQUIPAMENTOS: ${safeText(data.rentalList)}`);
  if (data.hasComodato) rListItems.push(`COMODATO: ${safeText(data.comodatoList)}`);
  printMultiLineText("RECURSOS ENVOLVIDOS", rListItems.length > 0 ? rListItems.join("\n\n") : "Não aplicável");

  // 7. CONDIÇÕES COMERCIAIS
  printSection("7. CONDIÇÕES COMERCIAIS");
  checkPageOverflow(25);
  doc.setDrawColor(6, 78, 59);
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(margin, currentY, contentWidth, 20, 2, 2, 'FD');
  
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(6, 78, 59);
  doc.text("VALOR TOTAL ESTIMADO", margin + 5, currentY + 6);
  doc.setFontSize(14);
  const fValue = typeof data.value === 'number' ? data.value.toLocaleString('pt-BR', {minimumFractionDigits: 2}) : "0,00";
  doc.text(`R$ ${fValue}`, margin + 5, currentY + 14);
  
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
  doc.text("ÍNDICE DE REAJUSTE", margin + (contentWidth / 2), currentY);
  currentY += 5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(0, 0, 0);
  doc.text(safeText(data.capLimit), margin, currentY); 
  doc.text(safeText(data.correctionIndex), margin + (contentWidth / 2), currentY);
  currentY += 10;
  
  printMultiLineText("GARANTIAS", data.warranties || "-");

  // 8. ANÁLISE DE RISCOS
  printSection("8. ANÁLISE DE RISCOS");
  printMultiLineText("Pontos de Atenção / Riscos", data.urgenciesRisks || "Nenhum risco crítico identificado.", 9, true);

  printSection("8.1. ASPECTOS JURÍDICOS E DE RISCO");
  const legalAspects = [
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
  legalAspects.forEach(it => { 
    checkPageOverflow(6); 
    const isSet = (data as any)[it.id] ? 'X' : ' ';
    doc.text(`[ ${isSet} ] ${safeText(it.label)}`, margin, currentY); 
    currentY += 6; 
  });

  printSection("8.2. CHECKLIST DE DOCUMENTOS OBRIGATÓRIOS");
  const docChecklistItems = [
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
  docChecklistItems.forEach(it => { 
    checkPageOverflow(6); 
    const isSet = (data as any)[it.id] ? 'X' : ' ';
    doc.text(`[ ${isSet} ] ${safeText(it.label)}`, margin, currentY); 
    currentY += 6; 
  });

  printSection("9. DOCUMENTOS ANEXOS");
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

  currentY = Math.max(currentY, pageHeight - 45);
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, currentY, margin + 80, currentY); 
  doc.line(pageWidth - margin - 80, currentY, pageWidth - margin, currentY);
  doc.setFontSize(8); doc.setTextColor(100, 100, 100);
  doc.text("Solicitante / Gestor do Contrato", margin + 40, currentY + 4, { align: "center" });
  doc.text("Aprovação Diretoria / Jurídico", pageWidth - margin - 40, currentY + 4, { align: "center" });

  drawFooter();
  return doc.output('blob');
};

export const mergeAndSavePDF = async (data: ContractRequestData, supplier?: Supplier, settings?: CompanySettings, unit?: Unit) => {
  try {
    console.group("Iniciando geração de PDF Mesclado");
    
    const mainPdfBlob = await createChecklistPDFBlob(data, supplier, settings, unit);
    const mainPdfArrayBuffer = await mainPdfBlob.arrayBuffer();
    
    const mergedPdf = await PDFDocument.create();
    const mainPdfDoc = await PDFDocument.load(mainPdfArrayBuffer);
    const mainPages = await mergedPdf.copyPages(mainPdfDoc, mainPdfDoc.getPageIndices());
    mainPages.forEach((page) => mergedPdf.addPage(page));
    
    console.log(`Checklist gerado com ${mainPages.length} páginas.`);

    if (data.attachments && data.attachments.length > 0) {
       for (const attachment of data.attachments) {
           try {
               const attachmentBytes = base64ToUint8Array(attachment.fileData);
               
               if (attachmentBytes.length > 0 && isPDF(attachmentBytes)) {
                 const attachmentPdf = await PDFDocument.load(attachmentBytes, { ignoreEncryption: true });
                 const copiedPages = await mergedPdf.copyPages(attachmentPdf, attachmentPdf.getPageIndices());
                 
                 for (const page of copiedPages) {
                   // Ajuste automático de escala para A4 se as dimensões forem muito diferentes
                   const { width, height } = page.getSize();
                   const [a4Width, a4Height] = PageSizes.A4;
                   
                   // Se a página for maior ou menor que A4 em mais de 10%, redimensionamos para padronizar
                   if (Math.abs(width - a4Width) > 50 || Math.abs(height - a4Height) > 50) {
                     page.scale(Math.min(a4Width / width, a4Height / height));
                   }
                   
                   mergedPdf.addPage(page);
                 }
                 console.log(`- Anexo "${attachment.name}" mesclado com sucesso.`);
               }
           } catch (err) {
               console.warn(`- Erro ao processar anexo "${attachment.name}":`, err);
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
    console.groupEnd();
    return true;
  } catch (error: any) {
    console.error("Erro crítico na geração do PDF:", error);
    console.groupEnd();
    alert(`Erro ao gerar PDF consolidado. Verifique os arquivos e tente novamente.`);
    return false;
  }
};
