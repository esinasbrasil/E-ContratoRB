
import React, { useState, useEffect } from 'react';
import { Search, ShieldCheck, ShieldAlert, ArrowLeft, User, Building, MapPin, Calendar, CheckCircle2, XCircle, AlertCircle, Car, Clock, FileText } from 'lucide-react';
import { Supplier, Contract, SupplierStatus, VisitRecord } from '../types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

interface PortariaPanelProps {
  suppliers: Supplier[];
  contracts: Contract[];
  onBack: () => void;
}

const PortariaPanel: React.FC<PortariaPanelProps> = ({ suppliers, contracts, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    type: 'supplier' | 'employee' | 'visit';
    status: 'authorized' | 'blocked' | 'pending' | 'visit_authorized';
    name: string;
    description: string;
    details: any;
  } | null>(null);

  const handleSearch = async () => {
    if (!searchTerm) return;
    setLoading(true);

    try {
      const cleanSearch = searchTerm.replace(/[^\w]/g, '').toLowerCase();
      
      // 1. Check in visits (Pre-authorized)
      const visitQuery = query(collection(db, 'visits'), where('status', '==', 'Authorized'));
      const visitSnapshot = await getDocs(visitQuery);
      let foundVisit: VisitRecord | null = null;
      
      visitSnapshot.forEach(doc => {
        const data = doc.data() as VisitRecord;
        if (data.cpf.replace(/[^\d]/g, '') === cleanSearch || 
            (data.cnpj && data.cnpj.replace(/[^\d]/g, '') === cleanSearch) ||
            data.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          foundVisit = data;
        }
      });

      if (foundVisit) {
        const v = foundVisit as VisitRecord;
        setSearchResult({
          type: 'visit',
          status: 'authorized',
          name: v.name,
          description: `VISITA AUTORIZADA: ${v.reason}`,
          details: v
        });
        setLoading(false);
        return;
      }

      // 2. Search in suppliers
      const supplier = suppliers.find(s => 
        s.cnpj.replace(/[^\d]/g, '') === cleanSearch || 
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (supplier) {
        const isAuthorized = supplier.status === SupplierStatus.HOMOLOGATED;
        setSearchResult({
          type: 'supplier',
          status: isAuthorized ? 'authorized' : (supplier.status === SupplierStatus.BLOCKED ? 'blocked' : 'pending'),
          name: supplier.name,
          description: `Fornecedor: ${supplier.serviceType}`,
          details: supplier
        });
        setLoading(false);
        return;
      }

      // 3. Search in Contract Prepostos (matching CPF or Name)
      for (const contract of contracts) {
        const preposto = contract.details.prepostos.find(p => 
          p.cpf.replace(/[^\d]/g, '') === cleanSearch || 
          p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (preposto) {
          const sup = suppliers.find(s => s.id === contract.supplierId);
          const isAuthorized = sup?.status === SupplierStatus.HOMOLOGATED;
          
          setSearchResult({
            type: 'employee',
            status: isAuthorized ? 'authorized' : 'pending',
            name: preposto.name,
            description: `Funcionário da empresa ${sup?.name || 'Não encontrada'}`,
            details: { ...preposto, supplier: sup, contract }
          });
          setLoading(false);
          return;
        }
      }

      setSearchResult(null);
      alert('Nenhum registro encontrado para este CPF/CNPJ ou Nome.');
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-mono p-6">
      <header className="max-w-4xl mx-auto flex items-center justify-between mb-12">
        <button onClick={onBack} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors text-xs font-bold uppercase tracking-widest">
          <ArrowLeft size={16} /> Voltar ao Portal
        </button>
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-indigo-500" size={32} />
          <h1 className="text-2xl font-black tracking-tighter text-white">PORTARIA CLOUD v1.0</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl mb-8">
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.3em] mb-4">Consulta de Acesso Identificado</p>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input 
                type="text" 
                placeholder="Digite CPF, CNPJ ou Nome Completo..." 
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-5 pl-14 pr-6 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono placeholder:text-slate-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button 
              onClick={handleSearch}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-indigo-600/20"
            >
              Consultar
            </button>
          </div>
        </div>

        {searchResult ? (
          <div className={`animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-3xl overflow-hidden border ${
            searchResult.status === 'authorized' ? 'border-emerald-500/30' : 
            searchResult.status === 'blocked' ? 'border-red-500/30' : 'border-orange-500/30'
          }`}>
            <div className={`p-10 flex items-center justify-between ${
              searchResult.status === 'authorized' ? 'bg-emerald-500/10' : 
              searchResult.status === 'blocked' ? 'bg-red-500/10' : 'bg-orange-500/10'
            }`}>
              <div className="flex items-center gap-6">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
                  searchResult.status === 'authorized' ? 'bg-emerald-500 text-white' : 
                  searchResult.status === 'blocked' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'
                }`}>
                  {searchResult.type === 'employee' ? <User size={40} /> : searchResult.type === 'visit' ? <Car size={40} /> : <Building size={40} />}
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tighter">{searchResult.name.toUpperCase()}</h2>
                  <p className={`text-sm font-bold mt-1 ${
                    searchResult.status === 'authorized' ? 'text-emerald-400' : 
                    searchResult.status === 'blocked' ? 'text-red-400' : 'text-orange-400'
                  }`}>{searchResult.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-black text-xs uppercase tracking-[0.2em] ${
                  searchResult.status === 'authorized' ? 'bg-emerald-500 text-white' : 
                  searchResult.status === 'blocked' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white shadow-lg'
                }`}>
                  {searchResult.status === 'authorized' && <CheckCircle2 size={16} />}
                  {searchResult.status === 'blocked' && <XCircle size={16} />}
                  {searchResult.status === 'pending' && <AlertCircle size={16} />}
                  {searchResult.status === 'authorized' ? 'ACESSO LIBERADO' : searchResult.status === 'blocked' ? 'ACESSO BLOQUEADO' : 'AGUARDANDO DOCS'}
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 p-10 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-800">
              <div className="space-y-6">
                <h3 className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.3em]">Informações Detalhadas</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-slate-500" />
                    <span className="text-sm">{searchResult.details.address || "Unidade Corporativa Grupo RB"}</span>
                  </div>
                  {searchResult.type === 'visit' && (
                    <>
                      <div className="flex items-center gap-3">
                        <Building size={16} className="text-slate-500" />
                        <span className="text-sm">Empresa: <span className="font-bold text-white">{searchResult.details.companyName || "Não informada"}</span></span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Car size={16} className="text-slate-500" />
                        <span className="text-sm">Veículo (Placa): <span className="font-bold text-white">{searchResult.details.carPlate || "Não informado"}</span></span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock size={16} className="text-slate-500" />
                        <span className="text-sm">Período: <span className="text-emerald-400">{new Date(searchResult.details.startDate).toLocaleDateString('pt-BR')}</span> - <span className="text-red-400">{new Date(searchResult.details.endDate).toLocaleDateString('pt-BR')}</span></span>
                      </div>
                      <div className="flex items-center gap-3 pt-2">
                        <FileText size={16} className="text-slate-500" />
                        <span className="text-sm text-slate-300 italic">Motivo: {searchResult.details.reason}</span>
                      </div>
                    </>
                  )}
                  {searchResult.type === 'employee' && (
                    <>
                      <div className="flex items-center gap-3">
                        <ShieldAlert size={16} className="text-slate-500" />
                        <span className="text-sm">Cargo: {searchResult.details.role}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar size={16} className="text-slate-500" />
                        <span className="text-sm">Vínculo: Contracto #{searchResult.details.contract.id.slice(0,8)}</span>
                      </div>
                    </>
                  )}
                  {searchResult.type === 'supplier' && (
                    <div className="flex items-center gap-3">
                      <ShieldAlert size={16} className="text-slate-500" />
                      <span className="text-sm">Rating: {searchResult.details.rating}/5 estrelas</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.3em]">Status Documental</h3>
                <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800">
                  {searchResult.status === 'authorized' ? (
                    <div className="flex items-center gap-4 text-emerald-500">
                      <CheckCircle2 size={32} />
                      <div>
                        <p className="font-black text-sm uppercase">CONFORMIDADE TOTAL</p>
                        <p className="text-[10px] text-slate-500">Todos os documentos de Segurança e RH estão válidos.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 text-orange-500">
                      <ShieldAlert size={32} />
                      <div>
                        <p className="font-black text-sm uppercase">PENDÊNCIA DETECTADA</p>
                        <p className="text-[10px] text-slate-500">Existem documentos expirados ou não homologados.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl">
            <ShieldAlert size={48} className="mx-auto text-slate-700 mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Aguardando consulta...</p>
          </div>
        )}
      </main>

      <footer className="max-w-4xl mx-auto mt-12 text-center text-slate-700 text-[10px] font-bold uppercase tracking-[0.2em]">
        Painel Restrito • Equipe de Segurança e Monitoramento Grupo RB
      </footer>
    </div>
  );
};

export default PortariaPanel;
