
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
  const emeraldColor: [number, number, number] = [6, 78, 59]; // #064e3b
  const lightGray: [number, number, number] = [241, 245, 249]; // #f1f5f9
  
  const companyName = safeText(settings?.companyName || "GRUPO RESINAS BRASIL");
  const documentTitle = safeText(settings?.documentTitle || "Solicitação de Contrato / Minuta");
  
  let currentY = 42;
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
    doc.setTextColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
    doc.text(companyName.toUpperCase(), pageWidth - margin, 15, { align: "right" });
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Pedido: ${safeText(data.orderNumber)}`, pageWidth - margin, 20, { align: "right" });
    
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`${documentTitle} • Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin, 24, { align: "right" });
    
    doc.setFillColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
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
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]); 
    doc.rect(margin, currentY, contentWidth, 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(safeText(title).toUpperCase(), margin + 3, currentY + 5.5);
    currentY += 12;
  };

  const printLabelValue = (label: string, value: string, fontSize: number = 9) => {
    checkPageOverflow(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text(safeText(label).toUpperCase(), margin, currentY);
    currentY += 4.5;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(0, 0, 0);
    doc.text(safeText(value), margin, currentY);
    currentY += 8;
  };

  const printMultiLineText = (label: string, text: string, fontSize: number = 9) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    checkPageOverflow(5);
    doc.text(safeText(label).toUpperCase(), margin, currentY);
    currentY += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(0, 0, 0);
    
    const lines = doc.splitTextToSize(safeText(text), contentWidth);
    for (const line of lines) {
      if (checkPageOverflow(6)) currentY += 6;
      doc.text(safeText(line), margin, currentY);
      currentY += 5;
    }
    currentY += 5;
  };

  drawHeader();

  // 1. UNIDADE
  printSection("1. UNIDADE CONTRATANTE");
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(15, 23, 42); 
  doc.text(safeText(unit?.name || data.serviceLocation).toUpperCase(), margin, currentY);
  currentY += 6;
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(100, 100, 100);
  doc.text(`CNPJ: ${unit?.cnpj || "-"} | IE: ${unit?.ie || "-"}`, margin, currentY);
  currentY += 4.5;
  doc.text(safeText(unit?.address || "-"), margin, currentY);
  currentY += 10;

  // 2. FORNECEDOR
  printSection("2. DADOS DO FORNECEDOR");
  const colW = contentWidth / 2;
  doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(100, 100, 100);
  doc.text("RAZÃO SOCIAL", margin, currentY);
  doc.text("CNPJ", margin + colW, currentY);
  currentY += 4.5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(0,0,0);
  doc.text(safeText(supplier?.name).toUpperCase(), margin, currentY);
  doc.text(safeText(supplier?.cnpj), margin + colW, currentY);
  currentY += 8;
  printMultiLineText("ENDEREÇO DO FORNECEDOR", supplier?.address || "-");
  printLabelValue("TIPO DE SERVIÇO", supplier?.serviceType || "-");
  printLabelValue("FILIAIS DO FORNECEDOR ENVOLVIDAS", data.supplierBranches || "Não aplicável");

  // 3. DOCUMENTAÇÃO E COMPLIANCE
  printSection("3. DOCUMENTAÇÃO E COMPLIANCE");
  doc.setFontSize(9);
  doc.text(`[ ${data.docSocialContract ? 'X' : ' '} ] Contrato Social`, margin, currentY);
  doc.text(`[ ${data.docSerasa ? 'X' : ' '} ] Pesquisas Serasa/Certidões`, margin + 60, currentY);
  currentY += 12;

  // 4. ESCOPO
  printSection("4. ESCOPO TÉCNICO");
  printMultiLineText("OBJETO DO FORNECIMENTO", data.objectDescription || "-");
  printMultiLineText("DESCRIÇÃO DETALHADA DO ESCOPO", data.scopeDescription || "-");

  // 5. EQUIPE
  printSection("5. EQUIPE E RESPONSÁVEIS");
  printLabelValue("RESPONSÁVEL TÉCNICO (ART/RRT)", data.technicalResponsible || "-");
  checkPageOverflow(10);
  doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(100, 100, 100);
  doc.text("ASSINANTES DO CONTRATO (PREPOSTOS)", margin, currentY);
  currentY += 6;

  if (data.prepostos && data.prepostos.length > 0) {
    data.prepostos.forEach((p) => {
      checkPageOverflow(26);
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, currentY, contentWidth, 22);
      doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(15, 23, 42);
      doc.text(safeText(p.name).toUpperCase(), margin + 5, currentY + 7);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(71, 85, 105);
      doc.text(`${safeText(p.role)} • CPF: ${safeText(p.cpf)}`, margin + 5, currentY + 12.5);
      doc.text(safeText(p.email), margin + 5, currentY + 17.5);
      currentY += 26;
    });
  }

  // 6. RECURSOS
  printSection("6. RECURSOS E MATERIAIS");
  const recursosLines: string[] = [];
  if (data.hasMaterials) recursosLines.push(`MATERIAIS: ${data.materialsList}`);
  if (data.hasEquipment) recursosLines.push(`EQUIPAMENTOS: ${data.equipmentList}`);
  if (data.hasRental) recursosLines.push(`LOCAÇÃO: ${data.rentalList}`);
  if (data.hasComodato) recursosLines.push(`COMODATO: ${data.comodatoList}`);
  if (data.hasLabor && data.laborDetails.length > 0) {
    recursosLines.push("MÃO DE OBRA:");
    data.laborDetails.forEach(l => recursosLines.push(` - ${l.role}: ${l.quantity} pessoa(s)`));
  }
  
  if (recursosLines.length === 0) {
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text("Não aplicável", margin, currentY);
    currentY += 7;
  } else {
    recursosLines.forEach(line => {
      const splitLines = doc.splitTextToSize(line, contentWidth);
      splitLines.forEach((l: any) => {
        if (checkPageOverflow(6)) currentY += 6;
        doc.setFont("helvetica", "normal"); doc.setFontSize(9);
        doc.text(l, margin, currentY);
        currentY += 5;
      });
    });
    currentY += 5;
  }

  // 7. CONDIÇÕES COMERCIAIS
  printSection("7. CONDIÇÕES COMERCIAIS");
  checkPageOverflow(30);
  doc.setDrawColor(6, 78, 59); doc.setFillColor(236, 253, 245);
  doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'FD');
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(6, 78, 59);
  doc.text("VALOR TOTAL ESTIMADO", margin + 7, currentY + 8);
  doc.setFont("helvetica", "bold"); doc.setFontSize(15);
  doc.text(`R$ ${data.value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, margin + 7, currentY + 16);
  doc.text("Vigência:", margin + colW + 10, currentY + 8);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(0, 0, 0);
  doc.text(`${safeText(data.startDate)} até ${safeText(data.endDate)}`, margin + colW + 10, currentY + 16);
  currentY += 30;

  printLabelValue("FORMA DE PAGAMENTO", data.paymentTerms || "-");
  printLabelValue("CRONOGRAMA DE FATURAMENTO", data.billingSchedule || "-");
  
  checkPageOverflow(15);
  doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(100, 100, 100);
  doc.text("CAP / LIMITE", margin, currentY);
  doc.text("ÍNDICE DE REAJUSTE", margin + colW, currentY);
  currentY += 4.5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(0, 0, 0);
  doc.text(safeText(data.capLimit), margin, currentY);
  doc.text(safeText(data.correctionIndex), margin + colW, currentY);
  currentY += 10;
  printLabelValue("GARANTIAS", data.warranties || "-");

  // 8. ANALISE DE RISCO
  printSection("8. ANÁLISE DE RISCOS");
  printMultiLineText("PONTOS DE ATENÇÃO / RISCOS", data.urgenciesRisks || "Nenhum risco crítico identificado.");
  
  printSection("8.1. ASPECTOS JURÍDICOS E DE RISCO");
  const legalItems = [
    { label: "Minuta padrão", val: data.aspectStandardDraft },
    { label: "Minuta NÃO padrão", val: data.aspectNonStandardDraft },
    { label: "Cláusulas de confidencialidade", val: data.aspectConfidentiality },
    { label: "Cláusulas de rescisão e penalidades", val: data.aspectTermination },
    { label: "Garantias exigidas (performance, entrega)", val: data.aspectWarranties },
    { label: "Contagem da garantia (entrega/execução)", val: data.aspectWarrantyStart },
    { label: "Obrigações pós-encerramento (sigilo)", val: data.aspectPostTermination },
    { label: "Interação com órgãos públicos", val: data.aspectPublicAgencies },
    { label: "Cláusula de antecipação de pagamento", val: data.aspectAdvancePayment },
    { label: "Condições não padrão (Outros)", val: data.aspectNonStandard }
  ];
  doc.setFontSize(8.5);
  legalItems.forEach(item => {
    if (checkPageOverflow(6)) currentY += 6;
    doc.text(`[ ${item.val ? 'X' : ' '} ] ${item.label}`, margin, currentY);
    currentY += 6;
  });
  currentY += 8;

  // 8.2 CHECKLIST
  printSection("8.2. CHECKLIST DE DOCUMENTOS OBRIGATÓRIOS");
  const mainChecks = [
    { label: "Acordo Comercial", val: data.docCheckCommercial },
    { label: "Pedido de Compra (PO)", val: data.docCheckPO },
    { label: "Termo de Conformidade", val: data.docCheckCompliance },
    { label: "Confirmação de aceite do fornecedor", val: data.docCheckSupplierAcceptance },
    { label: "Registro no sistema de gestão", val: data.docCheckSystemRegistration },
    { label: "Relatório de avaliação", val: data.docCheckSupplierReport },
    { label: "Documentos fiscais validados", val: data.docCheckFiscalValidation },
    { label: "Documentos de segurança do trabalho", val: data.docCheckSafetyDocs },
    { label: "Certificados de treinamentos", val: data.docCheckTrainingCertificates }
  ];
  mainChecks.forEach(c => {
    if (checkPageOverflow(6)) currentY += 6;
    doc.text(`[ ${c.val ? 'X' : ' '} ] ${c.label}`, margin, currentY);
    currentY += 6;
  });

  // 9. ANEXOS
  printSection("9. DOCUMENTOS ANEXOS");
  currentY += 4;
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.text("Documentos Contratuais e Cadastrais:", margin, currentY);
  currentY += 8;
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
  data.attachments.forEach(att => {
    if (checkPageOverflow(6)) currentY += 6;
    doc.text(`  • ${safeText(att.type)}: ${safeText(att.name)}`, margin, currentY);
    currentY += 6;
  });

  // Footer Signatures
  checkPageOverflow(40);
  currentY += 15;
  doc.setDrawColor(150, 150, 150);
  doc.line(margin, currentY, margin + 75, currentY);
  doc.text("Solicitante / Gestor do Contrato", margin + 37.5, currentY + 5, { align: "center" });
  doc.line(pageWidth - margin - 75, currentY, pageWidth - margin, currentY);
  doc.text("Aprovação Diretoria / Jurídico", pageWidth - margin - 37.5, currentY + 5, { align: "center" });

  drawFooter();
  return doc.output('blob');
};

export const mergeAndSavePDF = async (data: ContractRequestData, supplier?: Supplier, settings?: CompanySettings, unit?: Unit) => {
  try {
    const mainPdfBlob = await createChecklistPDFBlob(data, supplier, settings, unit);
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
                 const attachmentPdf = await PDFDocument.load(attachmentBytes, { ignoreEncryption: true });
                 const copiedPages = await mergedPdf.copyPages(attachmentPdf, attachmentPdf.getPageIndices());
                 for (const page of copiedPages) {
                   mergedPdf.addPage(page);
                 }
               }
           } catch (err) { console.warn(`Erro ao mesclar anexo: ${attachment.name}`); }
       }
    }

    const mergedPdfBytes = await mergedPdf.save();
    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Checklist_Contrato_${safeText(supplier?.name).replace(/\s/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (error) {
    console.error("Erro geral no PDF:", error);
    return false;
  }
};
