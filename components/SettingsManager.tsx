import React, { useState, useRef } from 'react';
import { CompanySettings } from '../types';
import { 
  Save, 
  Upload, 
  Trash2, 
  LayoutTemplate, 
  FileText, 
  AlertTriangle, 
  Database, 
  Wand2, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  UploadCloud 
} from 'lucide-react';

interface SettingsManagerProps {
  settings: CompanySettings;
  onSave: (settings: CompanySettings) => void;
  onDataImported?: () => void;
  onForceSync?: () => Promise<boolean>;
  session?: any;
}

const SettingsManager: React.FC<SettingsManagerProps> = ({ settings, onSave, onDataImported, onForceSync, session }) => {
  const [formData, setFormData] = useState<CompanySettings>(settings);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupImportRef = useRef<HTMLInputElement>(null);
  const [syncingCloud, setSyncingCloud] = useState(false);

  const handleInputChange = (field: keyof CompanySettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logoBase64: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setFormData(prev => ({ ...prev, logoBase64: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    alert('Configurações salvas com sucesso!');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex items-center justify-between">
         <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <LayoutTemplate className="mr-3 text-primary-600" />
            Configurações e Personalização
         </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Form */}
        <div className="md:col-span-2 space-y-8">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Identidade Visual do Documento</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa (Cabeçalho)</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="w-full rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ex: Minha Construtora Ltda"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título do Documento (Cabeçalho)</label>
                <input
                  type="text"
                  value={formData.documentTitle || ''}
                  onChange={(e) => handleInputChange('documentTitle', e.target.value)}
                  className="w-full rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ex: Solicitação de Contrato / Minuta"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Texto de Rodapé (Footer)</label>
                <input
                  type="text"
                  value={formData.footerText}
                  onChange={(e) => handleInputChange('footerText', e.target.value)}
                  className="w-full rounded-md border-gray-300 border p-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ex: Documento confidencial - Uso interno"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logotipo da Empresa</label>
                <div className="flex items-center space-x-4">
                   <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                   />
                   <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                   >
                      <Upload size={16} className="mr-2" />
                      Carregar Logo
                   </button>
                   {formData.logoBase64 && (
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="text-red-500 hover:text-red-700 text-sm flex items-center"
                      >
                        <Trash2 size={16} className="mr-1" /> Remover
                      </button>
                   )}
                </div>
                <p className="text-xs text-gray-500 mt-2">Recomendado: Imagem PNG ou JPG com fundo transparente.</p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end">
               <button
                 type="submit"
                 className="flex items-center px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 shadow-sm transition-all"
               >
                 <Save size={18} className="mr-2" />
                 Salvar Configurações
               </button>
            </div>
          </form>

          {/* Banco de Dados & Sincronização */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
              <Database className="text-emerald-600" size={20} />
              Central de Dados & Sincronização
            </h2>

            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Os dados deste sistema são armazenados prioritariamente no seu navegador local (Modo Offline) para segurança e rapidez. Quando conectado à internet, você pode sincronizar os seus dados locais com a nuvem do Google Firebase ou exportar backups em arquivos.
            </p>

            {/* Counts Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Fornecedores', count: (() => { try { return JSON.parse(localStorage.getItem('rb_suppliers_v1') || '[]').length } catch(e) { return 0 } })(), color: 'border-emerald-100 bg-emerald-50/10 text-emerald-800' },
                { label: 'Contratos', count: (() => { try { return JSON.parse(localStorage.getItem('rb_contracts_v1') || '[]').length } catch(e) { return 0 } })(), color: 'border-blue-100 bg-blue-50/10 text-blue-800' },
                { label: 'Projetos', count: (() => { try { return JSON.parse(localStorage.getItem('rb_projects_v1') || '[]').length } catch(e) { return 0 } })(), color: 'border-purple-100 bg-purple-50/10 text-purple-800' },
                { label: 'Unidades', count: (() => { try { return JSON.parse(localStorage.getItem('rb_units_v1') || '[]').length } catch(e) { return 0 } })(), color: 'border-indigo-100 bg-indigo-50/10 text-indigo-800' },
                { label: 'Processos', count: (() => { try { return JSON.parse(localStorage.getItem('rb_processos_v1') || '[]').length } catch(e) { return 0 } })(), color: 'border-amber-100 bg-amber-50/10 text-amber-800' },
                { label: 'Projetos F.Up', count: (() => { try { return JSON.parse(localStorage.getItem('rb_followup_projects_v1') || '[]').length } catch(e) { return 0 } })(), color: 'border-rose-100 bg-rose-50/10 text-rose-800' },
              ].map((item, i) => (
                <div key={i} className={`p-4 border rounded-xl flex flex-col justify-between ${item.color}`}>
                  <span className="text-[10px] font-bold tracking-wider uppercase opacity-80">{item.label}</span>
                  <span className="text-xl font-extrabold mt-1">{item.count} <span className="text-xs font-normal opacity-75">itens</span></span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  try {
                    const keys = [
                      'rb_suppliers_v1',
                      'rb_projects_v1',
                      'rb_units_v1',
                      'rb_service_categories_v1',
                      'rb_contracts_v1',
                      'rb_processos_v1',
                      'rb_followup_projects_v1',
                      'rb_followup_history_v1',
                      'rb_settings_v1'
                    ];
                    const backupData: Record<string, any> = {};
                    keys.forEach(key => {
                      const value = localStorage.getItem(key);
                      if (value) {
                        try {
                          backupData[key] = JSON.parse(value);
                        } catch (e) {
                          backupData[key] = value;
                        }
                      }
                    });

                    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `backup_sistema_rb_${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  } catch (err: any) {
                    alert("Falha ao exportar backup: " + err.message);
                  }
                }}
                className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:border-emerald-300 hover:bg-emerald-50/20 hover:text-emerald-800 transition-all uppercase tracking-widest flex-1 cursor-pointer"
              >
                <Download size={14} className="mr-2 text-emerald-600" />
                Baixar Backup JSON
              </button>

              <button
                type="button"
                onClick={() => backupImportRef.current?.click()}
                className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:border-blue-300 hover:bg-blue-50/20 hover:text-blue-800 transition-all uppercase tracking-widest flex-1 cursor-pointer"
              >
                <UploadCloud size={14} className="mr-2 text-blue-600" />
                Importar Backup JSON
              </button>

              <input
                type="file"
                ref={backupImportRef}
                accept=".json"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      try {
                        const backupData = JSON.parse(e.target?.result as string);
                        if (backupData && typeof backupData === 'object') {
                          Object.entries(backupData).forEach(([key, value]) => {
                            if (key.startsWith('rb_')) {
                              localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
                            }
                          });
                          alert("Backup importado com sucesso no navegador! A página será reiniciada para atualizar todos os módulos.");
                          if (onDataImported) onDataImported();
                          window.location.reload();
                        } else {
                          alert("Formato de arquivo de backup inválido.");
                        }
                      } catch (err: any) {
                        alert("Falha ao ler arquivo de backup: " + err.message);
                      }
                    };
                    reader.readAsText(file);
                  }
                }}
                className="hidden"
              />
            </div>

            {/* Cloud Sync section */}
            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-left">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 uppercase tracking-widest">
                  Nuvem Ativa
                </span>
                <p className="text-xs font-semibold text-gray-750 mt-1.5">Sincronização Online com Firebase</p>
                <p className="text-[10px] text-gray-400 mt-0.5">ID da Sessão: <span className="font-bold text-gray-600">{session?.user?.email || 'Nenhum usuário ativo'}</span></p>
              </div>

              <button
                type="button"
                disabled={syncingCloud || session?.isOffline}
                onClick={async () => {
                  if (!onForceSync) return;
                  setSyncingCloud(true);
                  try {
                    const success = await onForceSync();
                    if (success) {
                      alert("Excelente! Todos os seus dados locais e novos registros foram sincronizados com sucesso e salvos na nuvem do Google Firebase!");
                    } else {
                      alert("Ocorreu uma falha ao sincronizar. Certifique-se de que sua conta de internet está ativa e que possui permissão de escrita.");
                    }
                  } catch (err: any) {
                    alert("Erro ao realizar sincronização: " + err.message);
                  } finally {
                    setSyncingCloud(false);
                  }
                }}
                className="w-full md:w-auto flex items-center justify-center px-6 py-3 bg-slate-900 border border-transparent text-xs font-black uppercase tracking-widest text-white rounded-xl hover:bg-slate-800 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncingCloud ? (
                  <>
                    <RefreshCw className="animate-spin mr-2" size={14} />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2" size={14} />
                    Enviar dados para o Firebase
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Live Preview */}
        <div className="md:col-span-1">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit sticky top-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                 <FileText size={16} className="mr-2" /> Pré-visualização PDF
              </h3>
              
              <div className="border border-gray-200 rounded shadow-sm p-4 bg-white min-h-[300px] flex flex-col relative overflow-hidden">
                 {/* Mock Header */}
                 <div className="flex items-start justify-between mb-4 border-b pb-2 border-gray-100">
                    <div className="flex items-center">
                       {formData.logoBase64 ? (
                          <img src={formData.logoBase64} alt="Logo" className="h-10 w-auto object-contain mr-3" />
                       ) : (
                          <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400 mr-3">Logo</div>
                       )}
                       <div>
                          <div className="text-[10px] font-bold text-primary-900">{(formData.documentTitle || 'Solicitação de Contrato').toUpperCase()}</div>
                          <div className="text-[8px] text-gray-500">{formData.companyName || 'Nome da Empresa'}</div>
                       </div>
                    </div>
                 </div>

                 {/* Mock Content */}
                 <div className="space-y-2 opacity-50 select-none">
                    <div className="h-2 bg-gray-100 w-3/4 rounded"></div>
                    <div className="h-2 bg-gray-100 w-full rounded"></div>
                    <div className="h-2 bg-gray-100 w-5/6 rounded"></div>
                    <div className="mt-4 h-4 bg-primary-50 w-full rounded"></div>
                    <div className="h-2 bg-gray-100 w-full rounded"></div>
                 </div>

                 {/* Mock Footer */}
                 <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-end">
                    <span className="text-[7px] text-gray-400 max-w-[120px] truncate">{formData.footerText || 'Rodapé...'}</span>
                    <span className="text-[7px] text-gray-400">Pág 1/1</span>
                 </div>
              </div>
              <p className="text-center text-xs text-gray-400 mt-3">Representação ilustrativa do layout.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsManager;