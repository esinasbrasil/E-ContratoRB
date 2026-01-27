
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
  doc.text(`${cnpjText}`, margin, currentY);
  currentY += 10;

  printSection("2. DADOS DO FORNECEDOR");
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(0, 0, 0);
  doc.text(`RAZÃO: ${safeText(supplier?.name)}`, margin, currentY); 
  currentY += 5;
  doc.text(`CNPJ: ${safeText(supplier?.cnpj)}`, margin, currentY);
  currentY += 8;
  
  printMultiLineText("ENDEREÇO", supplier?.address || "-");

  printSection("3. ESCOPO E OBJETO");
  printMultiLineText("OBJETO DO FORNECIMENTO", data.objectDescription || "-");
  printMultiLineText("ESCOPO DETALHADO", data.scopeDescription || "-");

  printSection("4. EQUIPE E RESPONSABILIDADE");
  
  // Responsável Técnico com Destaque
  checkPageOverflow(20);
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.rect(margin, currentY, contentWidth, 15, 'F');
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(6, 78, 59);
  doc.text("RESPONSÁVEL TÉCNICO (TITULAR)", margin + 5, currentY + 6);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(0, 0, 0);
  doc.text(`${safeText(data.technicalResponsible)} - CPF: ${safeText(data.technicalResponsibleCpf)}`, margin + 5, currentY + 11);
  currentY += 20;

  // Testemunhas / Prepostos
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(100, 100, 100);
  doc.text("ASSINANTES (TESTEMUNHAS):", margin, currentY);
  currentY += 6;
  if (data.prepostos && data.prepostos.length > 0) {
    data.prepostos.forEach((p, idx) => {
      checkPageOverflow(10);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(0, 0, 0);
      doc.text(`${idx + 1}. ${safeText(p.name)} - CPF: ${safeText(p.cpf)} | E-mail: ${safeText(p.email)}`, margin + 3, currentY);
      currentY += 5;
    });
  } else {
    doc.text("Nenhum assinante adicional informado.", margin + 3, currentY);
    currentY += 5;
  }
  currentY += 5;

  printSection("5. CONDIÇÕES COMERCIAIS");
  checkPageOverflow(25);
  doc.setFillColor(240, 253, 244);
  doc.rect(margin, currentY, contentWidth, 15, 'F');
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(6, 78, 59);
  doc.text(`VALOR TOTAL: R$ ${data.value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, margin + 5, currentY + 10);
  currentY += 20;

  printSection("6. DOCUMENTOS OBRIGATÓRIOS");
  doc.setFontSize(8.5);
  const checks = [
    { label: "Acordo Comercial", val: data.docCheckCommercial },
    { label: "Pedido de Compra (PO)", val: data.docCheckPO },
    { label: "Termo de Compliance", val: data.docCheckCompliance },
    { label: "Aceite do Fornecedor", val: data.docCheckSupplierAcceptance },
    { label: "Registro no Sistema", val: data.docCheckSystemRegistration },
    { label: "Relatório Fornecedor", val: data.docCheckSupplierReport },
  ];
  checks.forEach(c => {
    checkPageOverflow(5);
    doc.text(`[ ${c.val ? 'X' : ' '} ] ${c.label}`, margin, currentY);
    currentY += 5;
  });
  currentY += 5;

  printSection("7. ANÁLISE JURÍDICA E DE RISCO");
  doc.setFontSize(8.5);
  const legalAspects = [
    { label: 'Minuta padrão', val: data.aspectStandardDraft },
    { label: 'Minuta NÃO padrão', val: data.aspectNonStandardDraft },
    { label: 'Cláusulas de confidencialidade', val: data.aspectConfidentiality },
    { label: 'Cláusulas de rescisão e penalidades', val: data.aspectTermination },
    { label: 'Garantias exigidas (performance, etc.)', val: data.aspectWarranties },
    { label: 'Contagem da garantia (entrega/execução)', val: data.aspectWarrantyStart },
    { label: 'Obrigações pós-encerramento (sigilo)', val: data.aspectPostTermination },
    { label: 'Interação com órgãos públicos', val: data.aspectPublicAgencies },
    { label: 'Cláusula de antecipação de pagamento', val: data.aspectAdvancePayment },
    { label: 'Ou não padrão', val: data.aspectNonStandard }
  ];

  legalAspects.forEach(a => {
    checkPageOverflow(5);
    doc.text(`[ ${a.val ? 'X' : ' '} ] ${a.label}`, margin, currentY);
    currentY += 5;
  });
  currentY += 5;
  printMultiLineText("OBSERVAÇÕES DE RISCO", data.urgenciesRisks || "-");

  printSection("9. DOCUMENTOS ANEXOS");
  currentY += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Documentos Contratuais e Cadastrais:", margin, currentY);
  currentY += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  
  const attachmentTypes = [
    'Pedido de Compra',
    'Contrato Social (Alteração Contratual Assinada)',
    'CND Federal (Certidão Federal)',
    'CND Estadual (Certidão Estadual)',
    'CND Municipal (Certidão Municipal)',
    'CND Trabalhista (Certidão Trabalhista)',
    'Certidão FGTS (Certidão FGTS)',
    'Ata ou Procuração (Certidão Simplificada)',
    'Orçamento (Proposta Detalhada)',
    'Relatório Serasa'
  ];

  attachmentTypes.forEach(type => {
    const att = data.attachments.find(a => a.type === type);
    checkPageOverflow(6);
    doc.text(`  - ${type}: ${att ? safeText(att.name) : 'Não anexado'}`, margin, currentY);
    currentY += 5.5;
  });

  currentY = Math.max(currentY + 15, pageHeight - 50);
  doc.line(margin, currentY, margin + 70, currentY);
  doc.setFontSize(8);
  doc.text("Assinatura Solicitante / Gestor", margin + 35, currentY + 5, { align: "center" });
  
  doc.line(pageWidth - margin - 70, currentY, pageWidth - margin, currentY);
  doc.text("Responsável Técnico", pageWidth - margin - 35, currentY + 5, { align: "center" });

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
           } catch (err) { console.warn(`Falha ao anexar PDF: ${attachment.name}`); }
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
    console.error(error);
    return false;
  }
};
