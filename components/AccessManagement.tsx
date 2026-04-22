
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Calendar, 
  Car, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MoreVertical,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { VisitRecord, Supplier } from '../types';
import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  updateDoc, 
  doc,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { fetchCNPJData } from '../services/cnpjService';

interface AccessManagementProps {
  suppliers: Supplier[];
}

const AccessManagement: React.FC<AccessManagementProps> = ({ suppliers }) => {
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);
  const [foundCompanyName, setFoundCompanyName] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    cnpj: '',
    companyName: '',
    carPlate: '',
    reason: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  });

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleCnpjChange = async (cnpjValue: string) => {
    const maskedCnpj = formatCNPJ(cnpjValue);
    const cleanCnpj = maskedCnpj.replace(/[^\d]/g, '');
    
    setFormData({ ...formData, cnpj: maskedCnpj });

    if (cleanCnpj.length === 14) {
      setIsSearchingCnpj(true);
      
      // 1. Check internal suppliers first
      const existingSupplier = suppliers.find(s => s.cnpj.replace(/[^\d]/g, '') === cleanCnpj);
      if (existingSupplier) {
        setFoundCompanyName(existingSupplier.name);
        setFormData(prev => ({ ...prev, companyName: existingSupplier.name }));
        if (!formData.reason) {
          setFormData(prev => ({ ...prev, reason: `Visita técnica: ${existingSupplier.name}`, companyName: existingSupplier.name }));
        }
        setIsSearchingCnpj(false);
        return;
      }

      // 2. If not found internally, fetch from API
      try {
        const apiData = await fetchCNPJData(cleanCnpj);
        if (apiData && apiData.name) {
          setFoundCompanyName(apiData.name);
          setFormData(prev => ({ ...prev, companyName: apiData.name }));
          if (!formData.reason) {
            setFormData(prev => ({ ...prev, reason: `Visita empresa: ${apiData.name}`, companyName: apiData.name }));
          }
        }
      } catch (error) {
        console.error("CNPJ Lookup error", error);
      } finally {
        setIsSearchingCnpj(false);
      }
    } else {
      setFoundCompanyName(null);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'visits'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const visitData: VisitRecord[] = [];
      snapshot.forEach((doc) => {
        visitData.push({ id: doc.id, ...doc.data() } as VisitRecord);
      });
      setVisits(visitData.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
      setLoading(false);
    }, (error) => {
      console.error("Error in snapshot listener:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'visits'), {
        ...formData,
        status: 'Authorized',
        authorizedBy: auth.currentUser?.email || 'Admin Sistema',
        user_id: auth.currentUser?.uid || 'anonymous',
        createdAt: new Date().toISOString()
      });
      setShowForm(false);
      setFormData({
        name: '',
        cpf: '',
        cnpj: '',
        companyName: '',
        carPlate: '',
        reason: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      });
    } catch (error) {
      console.error("Error adding visit:", error);
      alert("Erro ao cadastrar acesso.");
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'visits', id), { status: newStatus });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const filteredVisits = visits.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.cpf.includes(searchTerm) ||
    v.cnpj.includes(searchTerm) ||
    (v.companyName && v.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Gestão de Acesso - Portaria</h1>
          <p className="text-sm text-gray-500">Cadastre e gerencie autorizações de entrada para fornecedores e visitantes.</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <UserPlus size={18} /> Cadastrar Acesso
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Autorizados</p>
            <p className="text-2xl font-bold text-gray-900">{visits.filter(v => v.status === 'Authorized').length}</p>
          </div>
        </div>
        {/* Adicionar mais cards de estatísticas se necessário */}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por Nome, CPF ou CNPJ..." 
              className="w-full bg-gray-50 border-0 rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Visitante / Empresa</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Placa / Veículo</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Período Aut.</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status / Motivo</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredVisits.map((visit) => (
                <tr key={visit.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs uppercase">
                        {visit.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{visit.name}</p>
                        <p className="text-[10px] text-indigo-600 font-bold mb-0.5">{visit.companyName || 'Empresa não informada'}</p>
                        <p className="text-[10px] text-gray-400 font-medium">CPF: {visit.cpf} | CNPJ: {visit.cnpj}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                      <Car size={14} className="text-gray-400" />
                      {visit.carPlate || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-600 space-y-1">
                      <p className="flex items-center gap-1.5 font-bold"><Clock size={12} className="text-green-500" /> {new Date(visit.startDate).toLocaleDateString('pt-BR')}</p>
                      <p className="flex items-center gap-1.5 text-gray-400"><Clock size={12} /> {new Date(visit.endDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1.5">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                        visit.status === 'Authorized' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        visit.status === 'Completed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        {visit.status === 'Authorized' ? 'Autorizado' : visit.status === 'Completed' ? 'Concluído' : 'Cancelado'}
                      </span>
                      <p className="text-[10px] text-gray-500 line-clamp-1">{visit.reason}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                       <button 
                        onClick={() => handleStatusUpdate(visit.id, 'Completed')}
                        className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors" title="Marcar como Concluído">
                         <CheckCircle size={18} />
                       </button>
                       <button 
                        onClick={() => handleStatusUpdate(visit.id, 'Canceled')}
                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors" title="Cancelar Autorização">
                         <XCircle size={18} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && filteredVisits.length === 0 && (
            <div className="py-20 text-center">
              <Users size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-sm text-gray-400 font-medium">Nenhum registro de acesso encontrado.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Cadastro */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Novo Cadastro de Acesso Portaria</h2>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nome Completo do Visitante</label>
                <input 
                  required
                  type="text" 
                  className="w-full bg-gray-50 border-0 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-indigo-500"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">CPF</label>
                <input 
                  required
                  type="text" 
                  className="w-full bg-gray-50 border-0 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-indigo-500"
                  placeholder="000.000.000-00"
                  maxLength={14}
                  value={formData.cpf}
                  onChange={e => setFormData({...formData, cpf: formatCPF(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">CNPJ (Opcional)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border-0 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-indigo-500"
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    value={formData.cnpj}
                    onChange={e => handleCnpjChange(e.target.value)}
                  />
                  {isSearchingCnpj && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Empresa / Unidade</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border-0 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nome da empresa do visitante"
                  value={formData.companyName}
                  onChange={e => setFormData({...formData, companyName: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Placa do Carro</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border-0 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-indigo-500"
                  placeholder="ABC-1234"
                  value={formData.carPlate}
                  onChange={e => setFormData({...formData, carPlate: e.target.value.toUpperCase()})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Período de Autorização (Início)</label>
                <input 
                  type="date" 
                  className="w-full bg-gray-50 border-0 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-indigo-500"
                  value={formData.startDate}
                  onChange={e => setFormData({...formData, startDate: e.target.value})}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Motivo da Visita</label>
                <textarea 
                  className="w-full bg-gray-50 border-0 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  value={formData.reason}
                  onChange={e => setFormData({...formData, reason: e.target.value})}
                />
              </div>

              <div className="md:col-span-2 flex gap-4 mt-4">
                <button 
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessManagement;
