
import React, { useState } from 'react';
import { Globe, Building2, FileCheck, AlertCircle, Clock, CheckCircle, ArrowLeft, Download, Upload, Info, UserPen, Save } from 'lucide-react';
import { Supplier, SupplierStatus, ComplianceDocument } from '../types';

interface SupplierPortalProps {
  suppliers: Supplier[];
  onBack: () => void;
  onUpdateSupplier: (supplier: Supplier) => void;
}

const DEFAULT_DOC_TYPES = [
  'PGR (Programa de Gerenciamento de Riscos)',
  'PCMSO (Saúde Ocupacional)',
  'Alvará de Funcionamento',
  'Cartão CNPJ',
  'CND (Certidão Negativa de Débitos Federais)',
  'Lista de Funcionários'
];

const SupplierPortal: React.FC<SupplierPortalProps> = ({ suppliers, onBack, onUpdateSupplier }) => {
  const [cnpjSearch, setCnpjSearch] = useState('');
  const [loggedSupplier, setLoggedSupplier] = useState<Supplier | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState({
    contactEmail: '',
    contactPhone: '',
    address: ''
  });

  const handleLogin = () => {
    const cleanCnpj = cnpjSearch.replace(/[^\d]/g, '');
    const supplier = suppliers.find(s => s.cnpj.replace(/[^\d]/g, '') === cleanCnpj);
    
    if (supplier) {
      setLoggedSupplier(supplier);
      setTempProfile({
        contactEmail: supplier.contactEmail || '',
        contactPhone: supplier.contactPhone || '',
        address: supplier.address || ''
      });
    } else {
      alert('CNPJ não encontrado em nossa base de fornecedores cadastrados.');
    }
  };

  const calculateExpiryStatus = (date?: string) => {
    if (!date) return 'missing';
    const expiry = new Date(date);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'expired';
    if (diffDays < 30) return 'warning';
    return 'valid';
  };

  const handleUpdateDocument = (docName: string) => {
    const expiryDate = prompt(`Informe a nova data de validade para ${docName} (YYYY-MM-DD):`, new Date(Date.now() + 365*86400000).toISOString().split('T')[0]);
    if (!expiryDate) return;

    if (loggedSupplier) {
      const currentDocs = loggedSupplier.complianceDocuments || [];
      const docIndex = currentDocs.findIndex(d => d.name === docName);
      
      let newDocs = [...currentDocs];
      if (docIndex > -1) {
        newDocs[docIndex] = { ...newDocs[docIndex], expiryDate };
      } else {
        newDocs.push({
          id: Math.random().toString(36).substr(2, 9),
          name: docName,
          expiryDate,
          type: 'Empresa'
        });
      }

      const updatedSupplier = { ...loggedSupplier, complianceDocuments: newDocs };
      setLoggedSupplier(updatedSupplier);
      onUpdateSupplier(updatedSupplier);
      alert('Documento enviado para análise com sucesso!');
    }
  };

  const handleSaveProfile = () => {
    if (loggedSupplier) {
      const updatedSupplier = { ...loggedSupplier, ...tempProfile };
      setLoggedSupplier(updatedSupplier);
      onUpdateSupplier(updatedSupplier);
      setIsEditingProfile(false);
      alert('Dados cadastrais atualizados!');
    }
  };

  if (!loggedSupplier) {
    return (
      <div className="min-h-screen bg-emerald-950 flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="max-w-md w-full bg-white rounded-[3rem] p-12 text-slate-900 shadow-2xl">
          <div className="mb-10 text-center">
             <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Globe size={40} />
             </div>
             <h1 className="text-3xl font-black tracking-tighter mb-2">Portal do Fornecedor</h1>
             <p className="text-slate-500 font-medium">Acesse com seu CNPJ para gerenciar sua conformidade.</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">CNPJ da Empresa</label>
              <input 
                type="text" 
                placeholder="00.000.000/0000-00" 
                className="w-full p-5 bg-slate-50 border-0 rounded-2xl text-lg font-bold focus:ring-4 focus:ring-emerald-500/20 transition-all"
                value={cnpjSearch}
                onChange={(e) => setCnpjSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <button 
              onClick={handleLogin}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-emerald-900/20"
            >
              Entrar no Painel
            </button>
            <button onClick={onBack} className="w-full text-slate-400 py-2 font-bold text-xs uppercase tracking-widest hover:text-emerald-600 transition-colors">
              Voltar ao Início
            </button>
          </div>
        </div>
        <p className="mt-12 text-emerald-200/40 text-[10px] font-bold uppercase tracking-[0.2em]">EcoContract Security Framework • Grupo Resinas Brasil</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-12 font-sans">
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white rounded-3xl shadow-xl flex items-center justify-center text-emerald-600 border border-emerald-50">
            <Building2 size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">{loggedSupplier.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">CNPJ: {loggedSupplier.cnpj}</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                loggedSupplier.status === SupplierStatus.HOMOLOGATED ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {loggedSupplier.status}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setLoggedSupplier(null)}
            className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            Sair do Portal
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Status Card & Profile */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white rounded-[2.5rem] shadow-xl p-10 border border-slate-100 overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-10 ${
              loggedSupplier.status === SupplierStatus.HOMOLOGATED ? 'bg-emerald-500' : 'bg-orange-500'
            }`}></div>
            
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Status de Compliance</h3>
            
            <div className="flex items-center gap-6 mb-10">
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${
                 loggedSupplier.status === SupplierStatus.HOMOLOGATED ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
              }`}>
                {loggedSupplier.status === SupplierStatus.HOMOLOGATED ? <CheckCircle size={36} /> : <AlertCircle size={36} />}
              </div>
              <div>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">
                  {loggedSupplier.status === SupplierStatus.HOMOLOGATED ? 'Homologado' : 'Pendência'}
                </p>
                <p className="text-xs font-bold text-slate-500">{loggedSupplier.status === SupplierStatus.HOMOLOGATED ? 'Acesso liberado às unidades.' : 'Regularize seus documentos.'}</p>
              </div>
            </div>

            {isEditingProfile ? (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">E-mail de Contato</label>
                  <input type="email" value={tempProfile.contactEmail} onChange={e => setTempProfile({...tempProfile, contactEmail: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-sm border-0 focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Telefone</label>
                  <input type="text" value={tempProfile.contactPhone} onChange={e => setTempProfile({...tempProfile, contactPhone: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-sm border-0 focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Endereço Fiscal</label>
                  <textarea value={tempProfile.address} onChange={e => setTempProfile({...tempProfile, address: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-sm border-0 focus:ring-2 focus:ring-emerald-500" rows={2} />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={handleSaveProfile} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex justify-center items-center gap-2">
                    <Save size={14} /> Salvar
                  </button>
                  <button onClick={() => setIsEditingProfile(false)} className="flex-1 bg-slate-100 text-slate-400 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 group">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dados Cadastrais</p>
                    <button onClick={() => setIsEditingProfile(true)} className="text-emerald-600 opacity-40 group-hover:opacity-100 transition-opacity">
                      <UserPen size={14} />
                    </button>
                  </div>
                  <p className="text-xs font-bold text-slate-800 truncate">{loggedSupplier.contactEmail || 'E-mail não informado'}</p>
                  <p className="text-xs text-slate-500 mt-1">{loggedSupplier.contactPhone || 'Telefone não informado'}</p>
                </div>
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Qualificação Média</p>
                  <div className="flex text-orange-400 gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < Math.floor(loggedSupplier.rating) ? 'fill-current' : 'opacity-20 text-slate-400'}>★</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-indigo-600 text-white rounded-[2.5rem] shadow-xl p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-10 -mt-20 group-hover:scale-110 transition-transform"></div>
            <Info className="mb-6 opacity-60" size={32} />
            <h4 className="text-xl font-black mb-4 tracking-tight">Precisa de Ajuda?</h4>
            <p className="text-emerald-100/70 text-sm font-medium mb-8 leading-relaxed">
              Dúvidas sobre o processo de homologação ou documentos rejeitados? Entre em contato com nosso time de Segurança do Trabalho.
            </p>
            <a href="mailto:suporte@gruporesinasbrasil.com.br" className="inline-flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
              Falar com Suporte
            </a>
          </div>
        </div>

        {/* Documents Grid */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] shadow-xl p-10 md:p-14 border border-slate-100">
             <div className="flex items-center justify-between mb-12">
               <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Documentação de Compliance</h2>
                  <p className="text-slate-500 font-medium">Anexe os arquivos para validação pela nossa equipe.</p>
               </div>
               <button className="flex items-center gap-2 bg-slate-100 text-slate-600 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">
                  <Download size={14} /> Requisitos Gerais
               </button>
             </div>

             <div className="space-y-4">
               {DEFAULT_DOC_TYPES.map(docType => {
                 const docData = loggedSupplier.complianceDocuments?.find(d => d.name === docType);
                 const status = docData ? calculateExpiryStatus(docData.expiryDate) : 'missing';
                 
                 return (
                   <div key={docType} className="group flex flex-col md:flex-row md:items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-lg transition-all gap-4">
                     <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          status === 'valid' ? 'bg-emerald-50 text-emerald-600' :
                          status === 'warning' ? 'bg-orange-50 text-orange-600' :
                          status === 'expired' ? 'bg-red-50 text-red-600' : 'bg-slate-200 text-slate-400'
                        }`}>
                          <FileCheck size={24} />
                        </div>
                        <div>
                           <p className="text-sm font-black text-slate-900 leading-tight mb-1">{docType}</p>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                             Status: 
                             <span className={
                               status === 'valid' ? 'text-emerald-500' :
                               status === 'warning' ? 'text-orange-500' :
                               status === 'expired' ? 'text-red-500' : 'text-slate-500'
                             }>
                               {status === 'missing' ? 'NÃO ENVIADO' : 
                                status === 'expired' ? `EXPIRADO EM ${new Date(docData!.expiryDate).toLocaleDateString()}` :
                                `VÁLIDO ATÉ ${new Date(docData!.expiryDate).toLocaleDateString()}`}
                             </span>
                           </p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                       <button 
                        onClick={() => handleUpdateDocument(docType)}
                        className="flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-3 bg-white border border-emerald-100 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-sm">
                         <Upload size={14} /> {status === 'missing' ? 'Enviar Arquivo' : 'Atualizar'}
                       </button>
                     </div>
                   </div>
                 );
               })}
             </div>

             <div className="mt-12 p-8 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-center">
                <p className="text-slate-400 text-xs font-medium italic">O upload de múltiplos funcionários pode ser feito via arquivo ZIP na seção "Lista de Funcionários".</p>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SupplierPortal;
