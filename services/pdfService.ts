
import { jsPDF } from "jspdf";
import { PDFDocument, PageSizes } from "pdf-lib";
import { ContractRequestData, Supplier, CompanySettings, Unit } from "../types";

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

const homolCompanyDocs = [
  { id: 'homolCompanyPGR', label: 'PGR – Programa de Gerenciamento de Riscos' },
  { id: 'homolCompanyPCMSO', label: 'PCMSO – Programa de Controle Médico de Saúde Ocupacional' },
  { id: 'homolCompanyAlvara', label: 'ALVARÁ DE FUNCIONAMENTO' },
  { id: 'homolCompanyCNPJ', label: 'CARTÃO CNPJ' },
  { id: 'homolCompanyCNDFed', label: 'CND - Certidão negativa de débitos federais' },
  { id: 'homolCompanyCNDT', label: 'CNDT - Certidão negativa de débitos trabalhistas' },
  { id: 'homolCompanyCRF', label: 'CRF - Certificado de Regularidade do FGTS' },
  { id: 'homolCompanyEmployeeList', label: 'Lista de funcionários prestadores de serviços para o Grupo RB' }
];

const homolEmployeeDocs = [
  { id: 'homolEmployeeASO', label: 'ASO – Atestado de Saúde Ocupacional' },
  { id: 'homolEmployeeEPI', label: 'Ficha de EPI – Equipamento de Proteção Individual' },
  { id: 'homolEmployeeRegistration', label: 'Registro dos colaboradores' },
  { id: 'homolEmployeeOS', label: 'OS – Ordem de Serviço de Segurança do Trabalho' },
  { id: 'homolEmployeeQualif', label: 'Documentação de qualificação (Treinamentos: NR10, NR33, NR35, etc.)' }
];

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

const createInvitationLetterPDFBlob = async (data: ContractRequestData, settings?: CompanySettings, unit?: Unit): Promise<Blob> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const margin = 20;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const contentWidth = pageWidth - (margin * 2);
  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
  
  const companyName = safeText(settings?.companyName || "GRUPO RESINAS BRASIL");
  let currentY = 45;

  const drawHeader = () => {
    if (settings?.logoBase64) {
      try {
        doc.addImage(settings.logoBase64, 'PNG', margin, 15, 25, 25, undefined, 'FAST');
      } catch (e) {
        console.warn("Logo error:", e);
      }
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(companyName.toUpperCase(), pageWidth - margin, 20, { align: "right" });
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`CARTA CONVITE - PROCESSO DE COTAÇÃO`, pageWidth - margin, 26, { align: "right" });
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin, 31, { align: "right" });
    
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 40, pageWidth - margin, 40);
  };

  const drawFooter = () => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(safeText(settings?.footerText || "https://gruporesinasbrasil.com.br/"), margin, pageHeight - 15);
    doc.text(`Este documento é um convite formal para participação em processo de cotação.`, pageWidth / 2, pageHeight - 10, { align: "center" });
  };

  drawHeader();

  // 1. Saudação
  doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(0, 0, 0);
  doc.text("À EMPRESA CONVIDADA,", margin, currentY);
  currentY += 10;

  doc.setFont("helvetica", "normal"); doc.setFontSize(11);
  const introText = `O ${companyName.toUpperCase()} tem o prazer de convidá-lo a participar do nosso processo de cotação para a execução do serviço/projeto detalhado abaixo.`;
  const introLines = doc.splitTextToSize(introText, contentWidth);
  doc.text(introLines, margin, currentY);
  currentY += (introLines.length * 6) + 10;

  // 2. Localização
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("1. LOCAL DA PRESTAÇÃO / UNIDADE", margin, currentY);
  currentY += 6;
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(0, 0, 0);
  doc.text(safeText(unit?.name || data.serviceLocation).toUpperCase(), margin, currentY);
  currentY += 5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(100, 100, 100);
  doc.text(`Endereço: ${safeText(unit?.address || "-")}`, margin, currentY);
  currentY += 12;

  // 3. Objeto
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("2. OBJETO DO CONVITE", margin, currentY);
  currentY += 6;
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(0, 0, 0);
  const objName = safeText(data.objectDescription).replace(/REQUISITOS TÉCNICOS: /g, '');
  doc.text(objName.toUpperCase(), margin, currentY);
  currentY += 8;

  // 4. Escopo/Resumo
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("3. RESUMO DO ESCOPO", margin, currentY);
  currentY += 6;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(50, 50, 50);
  const scopeLines = doc.splitTextToSize(safeText(data.scopeDescription), contentWidth);
  doc.text(scopeLines, margin, currentY);
  currentY += (scopeLines.length * 6) + 12;

  // 5. Requisitos de Segurança
  if (data.safetyClassification) {
    if (currentY + 60 > pageHeight - 30) { doc.addPage(); currentY = 25; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("4. REQUISITOS OBRIGATÓRIOS DE SEGURANÇA E MEIO AMBIENTE", margin, currentY);
    currentY += 8;

    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(190, 60, 0);
    doc.text(`GRAU DE COMPLEXIDADE ESTIMADO: ${data.safetyClassification.complexity.toUpperCase()}`, margin, currentY);
    currentY += 8;

    const drawInvList = (title: string, items: string[]) => {
      if (!items || items.length === 0) return;
      if (currentY + 20 > pageHeight - 30) { doc.addPage(); currentY = 25; }
      doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(0,0,0);
      doc.text(title.toUpperCase(), margin, currentY);
      currentY += 5;
      doc.setFont("helvetica", "normal"); doc.setFontSize(9);
      items.forEach(item => {
        if (currentY + 6 > pageHeight - 30) { doc.addPage(); currentY = 25; }
        doc.text(` • ${item}`, margin + 3, currentY);
        currentY += 5;
      });
      currentY += 4;
    };

    drawInvList("Normas Regulamentadoras (NRs)", data.safetyClassification.nr);
    drawInvList("Documentação de Segurança Exigida", data.safetyClassification.documentos);
    drawInvList("Equipamentos de Proteção (EPIs)", data.safetyClassification.epis);
    drawInvList("Controles Operacionais", data.safetyClassification.controles);
  }

  // 5.2 Documentação Exigida para Participação
  const requiredDocs: string[] = [];
  homolCompanyDocs.forEach(d => { if ((data as any)[d.id]) requiredDocs.push(d.label); });
  homolEmployeeDocs.forEach(d => { if ((data as any)[d.id]) requiredDocs.push(d.label); });

  if (requiredDocs.length > 0) {
    if (currentY + 40 > pageHeight - 30) { doc.addPage(); currentY = 25; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("5. DOCUMENTAÇÃO OBRIGATÓRIA PARA HABILITAÇÃO", margin, currentY);
    currentY += 8;

    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(0, 0, 0);
    requiredDocs.forEach(docName => {
      if (currentY + 6 > pageHeight - 30) { doc.addPage(); currentY = 25; }
      doc.text(` • ${docName}`, margin + 3, currentY);
      currentY += 5;
    });
    currentY += 6;
  }

  // 6. Encerramento
  if (currentY + 60 > pageHeight - 30) { doc.addPage(); currentY = 25; }
  currentY += 5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(0, 0, 0);
  const closingText = "As propostas comerciais devem ser enviadas respeitando integralmente os requisitos técnicos, de segurança e de documentação acima descritos. Ressaltamos que o atendimento a estes quesitos é condição mandatória para a homologação do fornecedor e prosseguimento no processo de contratação.";
  const closingLines = doc.splitTextToSize(closingText, contentWidth);
  doc.text(closingLines, margin, currentY);
  currentY += (closingLines.length * 5.5) + 12;

  doc.text("Para eventuais dúvidas técnicas, favor entrar em contato com o departamento solicitante.", margin, currentY);
  currentY += 15;

  doc.setFont("helvetica", "bold");
  doc.text("Atenciosamente,", margin, currentY);
  currentY += 15;
  
  doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text(companyName.toUpperCase(), margin, currentY);
  currentY += 5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(100, 100, 100);
  doc.text("Departamento de Suprimentos / Segurança do Trabalho", margin, currentY);
  
  drawFooter();
  return doc.output('blob');
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
  const colW = contentWidth / 2;
  const emeraldColor: [number, number, number] = [6, 78, 59]; // #064e3b
  const lightGray: [number, number, number] = [241, 245, 249]; // #f1f5f9
  
  const companyName = safeText(settings?.companyName || "GRUPO RESINAS BRASIL");
  let documentTitle = safeText(data.objectDescription?.includes('REQUISITOS TÉCNICOS') ? 'Ficha de Requisitos p/ Carta Convite' : (settings?.documentTitle || "Solicitação de Contrato / Minuta"));
  
  if (data.supplierId === 'convite-rfp') {
    documentTitle = 'Ficha de Requisitos p/ Carta Convite';
  }
  
  let currentY = 42;
  let pageNum = 1;

  const drawHeader = () => {
    if (settings?.logoBase64) {
      try {
        // Logo alinhado à esquerda
        doc.addImage(settings.logoBase64, 'PNG', margin, 10, 25, 25, undefined, 'FAST');
      } catch (e) {
        console.warn("Logo error:", e);
      }
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
    
    // Título e informações alinhados à direita
    const titleY = 18;
    doc.text(companyName.toUpperCase(), pageWidth - margin, titleY, { align: "right" });
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Pedido: ${safeText(data.orderNumber)}`, pageWidth - margin, titleY + 6, { align: "right" });
    
    const docDate = data.createdAt ? new Date(data.createdAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`${documentTitle} • Data: ${docDate}`, pageWidth - margin, titleY + 10, { align: "right" });
    
    doc.setFillColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
    doc.rect(margin, 38, contentWidth, 1.2, 'F');
    currentY = 48;
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

  // 2. DESTINAÇÃO OU FORNECEDOR
  if (data.supplierId === 'convite-rfp') {
    printSection("2. DESTINAÇÃO DO DOCUMENTO (RFP)");
    printLabelValue("FINALIDADE", "Carta Convite / Chamamento para Cotação");
    printLabelValue("UNIDADE / FÁBRICA", unit?.name || data.serviceLocation);
    printLabelValue("ENDEREÇO DE EXECUÇÃO", unit?.address || "-");
    printMultiLineText("OBSERVAÇÃO", "Este documento define os requisitos técnicos e de segurança mínimos que devem ser atendidos pelos licitantes para participação no processo de contratação. O escopo detalhado encontra-se na seção 4.");
  } else {
    printSection("2. DADOS DO FORNECEDOR");
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
  }

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

  // 8.3 Classificação de Segurança (RESTAURADO)
  if (data.safetyClassification) {
    printSection("8.3. CLASSIFICAÇÃO DE SEGURANÇA E SAÚDE");
    doc.setFont("helvetica", "bold"); doc.setFontSize(9);
    doc.text(`Complexidade: ${data.safetyClassification.complexity.toUpperCase()}`, margin, currentY);
    currentY += 8;
    
    const drawSafetyList = (title: string, items: string[]) => {
      if (!items || items.length === 0) return;
      if (checkPageOverflow(10)) currentY += 10;
      doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
      doc.text(title.toUpperCase(), margin, currentY);
      currentY += 5;
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(0, 0, 0);
      items.forEach(item => {
        if (checkPageOverflow(5)) currentY += 5;
        doc.text(` • ${item}`, margin + 3, currentY);
        currentY += 5;
      });
      currentY += 3;
    };

    drawSafetyList("Normas Aplicáveis", data.safetyClassification.nr);
    drawSafetyList("Documentos Adicionais", data.safetyClassification.documentos);
    drawSafetyList("EPIs Identificados", data.safetyClassification.epis);
    drawSafetyList("Controles de Engenharia/ADM", data.safetyClassification.controles);
  }

  // 8.4 FICHA DE HOMOLOGAÇÃO: SEGURANÇA E RH (RESTAURADO)
  printSection("8.4. FICHA DE HOMOLOGAÇÃO: SEGURANÇA E RH");
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
  doc.text("Checklist de documentos obrigatórios para prestação de serviços no Grupo RB.", margin, currentY);
  currentY += 6;

  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
  doc.text("DOCUMENTOS DA EMPRESA", margin, currentY);
  currentY += 5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(0, 0, 0);
  homolCompanyDocs.forEach(item => {
    if (checkPageOverflow(6)) currentY += 6;
    doc.text(`[ ${(data as any)[item.id] ? 'X' : ' '} ] ${item.label}`, margin + 3, currentY);
    currentY += 5;
  });
  currentY += 3;

  if (checkPageOverflow(15)) currentY += 15;
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
  doc.text("DOCUMENTOS DO COLABORADOR", margin, currentY);
  currentY += 4;
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(100, 100, 100);
  doc.text("Deve ser apresentada uma pasta para cada colaborador contendo as cópias dos documentos abaixo.", margin, currentY);
  currentY += 5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(0, 0, 0);
  homolEmployeeDocs.forEach(item => {
    if (checkPageOverflow(6)) currentY += 6;
    doc.text(`[ ${(data as any)[item.id] ? 'X' : ' '} ] ${item.label}`, margin + 3, currentY);
    currentY += 5;
  });
  currentY += 10;

  // 9. CRONOGRAMA (NOVO - FLUXO DE TEMPO)
  if (data.scheduleStepsStructured && data.scheduleStepsStructured.length > 0) {
    printSection("9. CRONOGRAMA / FLUXO DE TEMPO");
    doc.setFont("helvetica", "bold"); doc.setFontSize(8);
    doc.text("ETAPA DO PROCESSO", margin, currentY);
    doc.text("PRAZO ESTIMADO", pageWidth - margin - 30, currentY);
    currentY += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, currentY, contentWidth + margin, currentY);
    currentY += 5;

    data.scheduleStepsStructured.forEach((step, idx) => {
      if (checkPageOverflow(8)) {
        currentY += 8;
        doc.setFont("helvetica", "bold"); doc.setFontSize(8);
        doc.text("ETAPA DO PROCESSO", margin, currentY);
        doc.text("PRAZO ESTIMADO", pageWidth - margin - 30, currentY);
        currentY += 5;
      }
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
      doc.text(`${idx + 1}. ${safeText(step.name)}`, margin, currentY);
      doc.setFont("helvetica", "bold");
      doc.text(`${step.days} DIAS`, pageWidth - margin, currentY, { align: "right" });
      currentY += 6;
    });
    
    const totalDays = data.scheduleStepsStructured.reduce((acc, curr) => acc + curr.days, 0);
    currentY += 4;
    doc.setFont("helvetica", "bold"); doc.setFontSize(9);
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, currentY, contentWidth, 8, 'F');
    doc.text("TEMPO TOTAL ESTIMADO DO PROCESSO", margin + 5, currentY + 6);
    doc.text(`${totalDays} DIAS`, pageWidth - margin - 5, currentY + 6, { align: "right" });
    currentY += 15;
  } else if (data.scheduleSteps) {
    printSection("9. CRONOGRAMA / FLUXO DE TEMPO");
    printMultiLineText("CRONOGRAMA DETALHADO DO PROJETO", data.scheduleSteps);
  }

  // 10. ANEXOS
  printSection("10. DOCUMENTOS ANEXOS");
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
  checkPageOverflow(50);
  currentY += 20;
  doc.setDrawColor(150, 150, 150);
  
  // Signature Line 1: Fornecedor
  doc.line(margin, currentY, margin + 75, currentY);
  doc.setFont("helvetica", "bold"); doc.setFontSize(8);
  doc.text("Assinatura do Fornecedor", margin + 37.5, currentY + 5, { align: "center" });
  
  // Signature Line 2: Segurança do Trabalho / RH (Grupo RB)
  doc.line(pageWidth - margin - 75, currentY, pageWidth - margin, currentY);
  doc.text("Segurança do Trabalho / RH (Grupo RB)", pageWidth - margin - 37.5, currentY + 5, { align: "center" });

  currentY += 20;
  // Additional signature or manager
  doc.line(margin + (contentWidth / 2) - 37.5, currentY, margin + (contentWidth / 2) + 37.5, currentY);
  doc.text("Responsável Técnico / Gestor", pageWidth / 2, currentY + 5, { align: "center" });

  drawFooter();
  return doc.output('blob');
};

const isImage = (bytes: Uint8Array): boolean => {
  if (bytes.length < 4) return false;
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true;
  // JPG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true;
  return false;
};

export const mergeAndSavePDF = async (data: ContractRequestData, supplier?: Supplier, settings?: CompanySettings, unit?: Unit) => {
  try {
    const isInvitation = data.supplierId === 'convite-rfp';
    const mainPdfBlob = isInvitation 
      ? await createInvitationLetterPDFBlob(data, settings, unit)
      : await createChecklistPDFBlob(data, supplier, settings, unit);
    
    const mainPdfArrayBuffer = await mainPdfBlob.arrayBuffer();
    const mergedPdf = await PDFDocument.create();
    const mainPdfDoc = await PDFDocument.load(mainPdfArrayBuffer);
    const mainPages = await mergedPdf.copyPages(mainPdfDoc, mainPdfDoc.getPageIndices());
    mainPages.forEach((page) => mergedPdf.addPage(page));

    if (data.attachments && data.attachments.length > 0) {
       for (const attachment of data.attachments) {
           try {
               const attachmentBytes = base64ToUint8Array(attachment.fileData);
               if (attachmentBytes.length === 0) continue;

               if (isPDF(attachmentBytes)) {
                 const attachmentPdf = await PDFDocument.load(attachmentBytes, { ignoreEncryption: true });
                 const copiedPages = await mergedPdf.copyPages(attachmentPdf, attachmentPdf.getPageIndices());
                 for (const page of copiedPages) {
                   mergedPdf.addPage(page);
                 }
               } else if (isImage(attachmentBytes)) {
                 // Support images by embedding them in a new PDF page
                 let image;
                 if (attachmentBytes[0] === 0x89) {
                   image = await mergedPdf.embedPng(attachmentBytes);
                 } else {
                   image = await mergedPdf.embedJpg(attachmentBytes);
                 }
                 
                 const page = mergedPdf.addPage(PageSizes.A4);
                 const { width, height } = page.getSize();
                 
                 // Scale image to fit page while maintaining aspect ratio
                 const imgDims = image.scale(1);
                 const scale = Math.min(width / imgDims.width, height / imgDims.height);
                 const scaledWidth = imgDims.width * scale;
                 const scaledHeight = imgDims.height * scale;
                 
                 page.drawImage(image, {
                   x: (width - scaledWidth) / 2,
                   y: (height - scaledHeight) / 2,
                   width: scaledWidth,
                   height: scaledHeight,
                 });
               }
           } catch (err) { 
             console.warn(`Erro ao mesclar anexo: ${attachment.name}`, err); 
           }
       }
    }

    const mergedPdfBytes = await mergedPdf.save();
    const blob = new Blob([mergedPdfBytes as any], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = data.supplierId === 'convite-rfp' 
      ? `Requisitos_Seguranca_${safeText(data.objectDescription).replace(/REQUISITOS TÉCNICOS: /g, '').replace(/\s/g, '_')}.pdf`
      : `Checklist_Contrato_${safeText(supplier?.name).replace(/\s/g, '_')}.pdf`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (error) {
    console.error("Erro geral no PDF:", error);
    return false;
  }
};
