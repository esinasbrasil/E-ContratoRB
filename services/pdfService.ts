
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
  
  const companyName = settings?.companyName || "EcoContract Manager";
  const documentTitle = settings?.documentTitle || "Solicitação de Contrato / Minuta";
  
  let currentY = 0;

  const drawHeader = () => {
    if (settings?.logoBase64) {
      try {
        doc.addImage(settings.logoBase64, 'PNG', margin, 10, 20, 20);
      } catch (e) {}
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(companyName.toUpperCase(), pageWidth - margin, 15, { align: "right" });
    doc.setFontSize(8);
    doc.text(documentTitle, pageWidth - margin, 20, { align: "right" });
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin, 24, { align: "right" });
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(margin, 32, contentWidth, 1.5, 'F');
    currentY = 40;
  };

  const printSection = (title: string) => {
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

  printSection("1. Dados do Fornecedor e Pedido");
  printField("Razão Social", supplier?.name);
  printField("CNPJ", supplier?.cnpj);
  printField("Número do Pedido", data.orderNumber || "Não Informado");
  printField("Local de Prestação", data.serviceLocation);
  printField("Tipo de Serviço", data.serviceType);

  printSection("2. Objeto e Escopo");
  printField("Objeto", data.objectDescription);
  doc.setFontSize(8);
  doc.text("ESCOPO DETALHADO:", margin, currentY);
  currentY += 5;
  doc.setFontSize(9);
  const scopeLines = doc.splitTextToSize(data.scopeDescription, contentWidth);
  doc.text(scopeLines, margin, currentY);
  currentY += (scopeLines.length * 4.5) + 8;

  printSection("3. Condições Comerciais");
  printField("Valor Total", `R$ ${data.value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
  printField("Vigência", `${data.startDate} até ${data.endDate}`);
  printField("Pagamento", data.paymentTerms);

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
           } catch (err) {}
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
