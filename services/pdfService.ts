
import { jsPDF } from "jspdf";
import { PDFDocument } from "pdf-lib";
import { ContractRequestData, Supplier, CompanySettings } from "../types";

// Internal function to generate the Checklist PDF as ArrayBuffer
const createChecklistPDFBytes = (data: ContractRequestData, supplier?: Supplier, settings?: CompanySettings): ArrayBuffer => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // --- CONFIGURATION ---
  const margin = 15;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const contentWidth = pageWidth - (margin * 2);
  const primaryColor: [number, number, number] = [6, 78, 59]; // #064e3b (Emerald 900)
  const accentColor: [number, number, number] = [240, 253, 244]; // Light Emerald for backgrounds
  
  const companyName = settings?.companyName || "EcoContract Manager";
  const footerText = settings?.footerText || "Documento gerado eletronicamente. Válido sem assinatura física para fins de solicitação.";
  const documentTitle = settings?.documentTitle || "Solicitação de Contrato / Minuta";
  
  let currentY = 0; // Cursor position

  // --- HELPERS ---

  const checkPageBreak = (heightNeeded: number) => {
    if (currentY + heightNeeded > pageHeight - margin) {
      doc.addPage();
      drawHeader();
    }
  };

  const drawHeader = () => {
    // Logo
    if (settings?.logoBase64) {
      try {
        const imgProps = doc.getImageProperties(settings.logoBase64);
        const ratio = imgProps.width / imgProps.height;
        const logoHeight = 20;
        const logoWidth = logoHeight * ratio;
        doc.addImage(settings.logoBase64, 'PNG', margin, 10, logoWidth, logoHeight);
      } catch (e) {
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, 10, 20, 20, 'F');
      }
    }

    // Company Info
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(companyName.toUpperCase(), pageWidth - margin, 15, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(documentTitle, pageWidth - margin, 20, { align: "right" });
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin, 24, { align: "right" });
    
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(margin, 32, contentWidth, 1.5, 'F');

    currentY = 40;
  };

  const drawFooters = () => {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(200);
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      
      doc.setFontSize(7);
      doc.setTextColor(128);
      doc.text(footerText, margin, pageHeight - 10);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: "right" });
    }
  };

  const printSection = (title: string) => {
    checkPageBreak(15);
    doc.setFillColor(241, 245, 249); 
    doc.rect(margin, currentY, contentWidth, 8, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(title.toUpperCase(), margin + 3, currentY + 5.5);
    
    currentY += 12;
  };

  const printField = (label: string, value: string | undefined, widthPercentage = 100, sameLine = false) => {
    const valueStr = value || "-";
    const availableWidth = (contentWidth * (widthPercentage / 100)) - 4;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100);
    const labelHeight = 4;
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
    const valueLines = doc.splitTextToSize(valueStr, availableWidth);
    const valueHeight = valueLines.length * 4.5;
    
    const totalBlockHeight = labelHeight + valueHeight + 4;

    if (!sameLine) checkPageBreak(totalBlockHeight);

    const startX = margin + (sameLine ? (contentWidth * ((100 - widthPercentage) / 100)) : 0);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(label.toUpperCase(), startX, currentY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(valueLines, startX, currentY + 4.5);

    if (!sameLine) {
      currentY += totalBlockHeight;
    }
    
    return totalBlockHeight;
  };

  const drawCheckbox = (label: string, checked: boolean, x: number, y: number) => {
    doc.setDrawColor(100);
    doc.rect(x, y, 4, 4);
    if (checked) {
      doc.setFont("zapfdingbats");
      doc.setFontSize(10);
      doc.text("4", x + 0.5, y + 3.2);
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.text(label, x + 6, y + 3.5);
  };

  // --- CONTENT GENERATION ---

  drawHeader();

  printSection("1. Dados do Fornecedor");
  printField("Razão Social", supplier?.name, 60, false);
  currentY -= 12.5; 
  printField("CNPJ", supplier?.cnpj, 40, true);
  currentY += 14; 
  printField("Endereço", supplier?.address);
  printField("Local de Prestação", data.serviceLocation, 60, false);
  currentY -= 12.5;
  printField("Tipo de Serviço", data.serviceType, 40, true);
  currentY += 14;
  printField("Filiais Envolvidas", data.supplierBranches);

  printSection("2. Documentação e Compliance");
  const docY = currentY;
  drawCheckbox("Contrato Social", data.docSocialContract, margin, docY);
  drawCheckbox("Pesquisas Serasa/Certidões", data.docSerasa, margin + 60, docY);
  currentY += 10;

  printSection("3. Escopo Técnico");
  printField("Objeto do Fornecimento", data.objectDescription);
  checkPageBreak(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("DESCRIÇÃO DETALHADA DO ESCOPO", margin, currentY);
  currentY += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0);
  const scopeLines = doc.splitTextToSize(data.scopeDescription, contentWidth);
  doc.text(scopeLines, margin, currentY);
  currentY += (scopeLines.length * 4.5) + 8;

  printSection("4. Equipe e Responsáveis");
  printField("Responsável Técnico (ART/RRT)", data.technicalResponsible || "N/A");
  
  checkPageBreak(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("ASSINANTES DO CONTRATO (PREPOSTOS)", margin, currentY);
  currentY += 5;

  data.prepostos.forEach((p) => {
    checkPageBreak(15);
    doc.setDrawColor(220);
    doc.setFillColor(250);
    doc.rect(margin, currentY, contentWidth, 12, 'FD');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.text(p.name, margin + 3, currentY + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`${p.role} • ${p.email}`, margin + 3, currentY + 9);
    currentY += 15;
  });

  if (data.hasLabor) {
    if (data.laborDetails && data.laborDetails.length > 0) {
      checkPageBreak(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text("MÃO DE OBRA ALOCADA", margin, currentY);
      currentY += 5;
      
      data.laborDetails.forEach(l => {
          checkPageBreak(8);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(0);
          doc.text(`• ${l.quantity}x ${l.role}`, margin + 5, currentY);
          currentY += 5;
      });
      currentY += 2;
    } else {
        printField("Mão de Obra Alocada", "Sim, mas sem detalhamento informado.");
    }
  }

  printSection("5. Recursos e Materiais");
  if (data.hasMaterials) printField("Lista de Materiais", data.materialsList);
  if (data.hasEquipment) printField("Equipamentos Cedidos/Comodato", data.equipmentList);
  if (data.hasRental) printField("Locação (Equipamento/Espaço)", data.rentalList);
  if (!data.hasMaterials && !data.hasEquipment && !data.hasRental) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text("Não aplicável (apenas mão de obra ou serviços intelectuais).", margin, currentY);
    currentY += 8;
  }

  printSection("6. Condições Comerciais");
  checkPageBreak(25);
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.roundedRect(margin, currentY, contentWidth, 18, 2, 2, 'FD');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("VALOR TOTAL ESTIMADO", margin + 5, currentY + 6);
  doc.setFontSize(14);
  doc.text(`R$ ${data.value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, margin + 5, currentY + 13);
  doc.setTextColor(0);
  doc.setFontSize(9);
  doc.text("Vigência:", margin + 80, currentY + 6);
  doc.setFont("helvetica", "normal");
  const dates = `${data.startDate ? new Date(data.startDate).toLocaleDateString() : '?'} até ${data.endDate ? new Date(data.endDate).toLocaleDateString() : '?'}`;
  doc.text(dates, margin + 80, currentY + 13);
  currentY += 25;

  printField("Forma de Pagamento", data.paymentTerms);
  printField("Cronograma de Faturamento", data.scheduleSteps);
  printField("CAP / Limite", data.capLimit, 50, false);
  currentY -= 12.5;
  printField("Índice de Reajuste", data.correctionIndex, 50, true);
  currentY += 14;
  printField("Garantias", data.warranties);

  if (data.urgenciesRisks) {
    printSection("7. Análise de Riscos");
    doc.setTextColor(185, 28, 28);
    doc.setFont("helvetica", "bold");
    doc.text("Pontos de Atenção / Riscos:", margin, currentY);
    currentY += 5;
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    const riskLines = doc.splitTextToSize(data.urgenciesRisks, contentWidth);
    doc.text(riskLines, margin, currentY);
    currentY += (riskLines.length * 4.5) + 5;
  }

  // --- SECTION: Legal Aspects ---
  printSection("7.1. Aspectos Jurídicos e de Risco");
  
  const drawAspect = (label: string, checked: boolean) => {
      checkPageBreak(6);
      drawCheckbox(label, checked, margin, currentY);
      currentY += 6;
  };

  drawAspect("Minuta padrão", data.aspectStandardDraft);
  drawAspect("Minuta NÃO padrão", data.aspectNonStandardDraft);
  drawAspect("Cláusulas de confidencialidade", data.aspectConfidentiality);
  drawAspect("Cláusulas de rescisão e penalidades", data.aspectTermination);
  drawAspect("Garantias exigidas (performance, entrega)", data.aspectWarranties);
  drawAspect("Contagem da garantia (entrega/execução)", data.aspectWarrantyStart);
  drawAspect("Obrigações pós-encerramento (sigilo)", data.aspectPostTermination);
  drawAspect("Interação com órgãos públicos", data.aspectPublicAgencies);
  drawAspect("Cláusula de antecipação de pagamento", data.aspectAdvancePayment);
  drawAspect("Condições não padrão (Outros)", data.aspectNonStandard);
  
  currentY += 2;

  // --- SECTION: Mandatory Documents ---
  printSection("7.2. Checklist de Documentos Obrigatórios");
  
  drawAspect("Acordo Comercial", data.docCheckCommercial);
  drawAspect("Pedido de Compra (PO)", data.docCheckPO);
  drawAspect("Termo de Conformidade", data.docCheckCompliance);
  drawAspect("Confirmação de aceite do fornecedor", data.docCheckSupplierAcceptance);
  drawAspect("Registro no sistema de gestão", data.docCheckSystemRegistration);
  drawAspect("Relatório de avaliação", data.docCheckSupplierReport);
  drawAspect("Documentos fiscais validados", data.docCheckFiscalValidation);
  drawAspect("Documentos de segurança do trabalho", data.docCheckSafetyDocs);
  drawAspect("Certificados de treinamentos", data.docCheckTrainingCertificates);

  currentY += 2;

  // --- SECTION: Attachments (Split into Contractual and Safety/HR) ---
  if (data.attachments && data.attachments.length > 0) {
    checkPageBreak(30);
    printSection("8. Documentos Anexos");
    
    // Define standard types for filtering
    const standardTypes = ['Contrato Social', 'Serasa', 'Orçamento', 'Pedido'];
    
    const contractualDocs = data.attachments.filter(a => standardTypes.includes(a.type));
    const safetyHrDocs = data.attachments.filter(a => !standardTypes.includes(a.type));

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0);
    
    if (contractualDocs.length > 0) {
        doc.text("Documentos Contratuais:", margin, currentY);
        currentY += 5;
        doc.setFont("helvetica", "normal");
        contractualDocs.forEach(att => {
            doc.text(`• ${att.type}: ${att.name}`, margin + 5, currentY);
            currentY += 5;
        });
        currentY += 3;
    }

    if (safetyHrDocs.length > 0) {
        checkPageBreak(15 + (safetyHrDocs.length * 5));
        doc.setFont("helvetica", "bold");
        doc.text("Segurança do Trabalho e RH:", margin, currentY);
        currentY += 5;
        doc.setFont("helvetica", "normal");
        safetyHrDocs.forEach(att => {
            doc.text(`• ${att.type}: ${att.name}`, margin + 5, currentY);
            currentY += 5;
        });
    }
  }

  checkPageBreak(40);
  currentY += 10;
  doc.setDrawColor(200);
  doc.line(margin, currentY + 15, margin + 80, currentY + 15);
  doc.line(margin + 90, currentY + 15, contentWidth + margin, currentY + 15);
  doc.setFontSize(7);
  doc.text("Solicitante / Gestor do Contrato", margin, currentY + 20);
  doc.text("Aprovação Diretoria / Jurídico", margin + 90, currentY + 20);

  drawFooters();

  return doc.output('arraybuffer');
};

export const mergeAndSavePDF = async (data: ContractRequestData, supplier?: Supplier, settings?: CompanySettings) => {
  try {
    // 1. Generate the Checklist PDF
    const checklistBytes = createChecklistPDFBytes(data, supplier, settings);
    
    // 2. Initialize PDF Lib
    const mergedPdf = await PDFDocument.create();
    
    // 3. Load Checklist
    const checklistPdf = await PDFDocument.load(checklistBytes);
    const copiedChecklistPages = await mergedPdf.copyPages(checklistPdf, checklistPdf.getPageIndices());
    copiedChecklistPages.forEach((page) => mergedPdf.addPage(page));

    // 4. Merge Attachments
    if (data.attachments && data.attachments.length > 0) {
       for (const attachment of data.attachments) {
           try {
               // Base64 string might contain data:application/pdf;base64, prefix. Remove it.
               const base64Data = attachment.fileData.split(',')[1] || attachment.fileData;
               const attachmentBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
               
               const attachmentPdf = await PDFDocument.load(attachmentBytes);
               const copiedPages = await mergedPdf.copyPages(attachmentPdf, attachmentPdf.getPageIndices());
               
               // Optional: Add a separator page or just append
               copiedPages.forEach((page) => mergedPdf.addPage(page));
           } catch (err) {
               console.error(`Failed to merge attachment ${attachment.name}:`, err);
               // You might want to add a blank page with error text here
           }
       }
    }

    // 5. Save and Download
    const mergedPdfBytes = await mergedPdf.save();
    
    // Trigger Download
    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    const fileName = `Dossie_Contrato_${supplier?.name.replace(/[^a-zA-Z0-9]/g, '')}_${new Date().toISOString().split('T')[0]}.pdf`;
    link.download = fileName;
    link.click();

  } catch (error) {
    console.error("Error generating combined PDF:", error);
    alert("Erro ao gerar PDF combinado. Verifique se os anexos são PDFs válidos.");
  }
};

// Backwards compatibility wrapper (deprecated use, but kept for interface safety if needed)
export const generateContractPDF = (data: ContractRequestData, supplier?: Supplier, settings?: CompanySettings) => {
   mergeAndSavePDF(data, supplier, settings);
};
