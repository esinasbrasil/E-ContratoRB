import React, { useState, useRef } from 'react';
import { CompanySettings } from '../types';
import { Save, Upload, Trash2, LayoutTemplate, FileText, AlertTriangle, Database, Wand2 } from 'lucide-react';

interface SettingsManagerProps {
  settings: CompanySettings;
  onSave: (settings: CompanySettings) => void;
  onReset: () => void;
  onSeed: () => void;
}

const SettingsManager: React.FC<SettingsManagerProps> = ({ settings, onSave, onReset, onSeed }) => {
  const [formData, setFormData] = useState<CompanySettings>(settings);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleResetClick = () => {
    if (window.confirm("ATENÇÃO: Esta ação apagará TODOS os registros armazenados neste navegador (Fornecedores, Unidades, Projetos, etc). \n\nDeseja realmente continuar?")) {
      onReset();
    }
  };

  const handleSeedClick = () => {
      onSeed();
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

          {/* Data Management Zone */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center">
              <Database size={20} className="mr-2 text-primary-600" />
              Gestão de Dados Locais
            </h2>
            
            <div className="space-y-4">
                {/* Seed Data */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-blue-100 bg-blue-50">
                   <div>
                      <h4 className="text-sm font-bold text-blue-900">Gerar Dados de Teste</h4>
                      <p className="text-xs text-blue-700 mt-1">Popula o armazenamento do navegador com dados fictícios para teste.</p>
                   </div>
                   <button
                     type="button"
                     onClick={handleSeedClick}
                     className="flex items-center px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-all shadow-sm"
                   >
                     <Wand2 size={16} className="mr-2" />
                     Gerar Dados
                   </button>
                </div>

                {/* Danger Zone */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-red-100 bg-red-50">
                   <div>
                      <h4 className="text-sm font-bold text-red-900 flex items-center"><AlertTriangle size={14} className="mr-1"/> Zona de Perigo</h4>
                      <p className="text-xs text-red-700 mt-1">Apaga permanentemente todos os cadastros deste navegador.</p>
                   </div>
                   <button
                     type="button"
                     onClick={handleResetClick}
                     className="flex items-center px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 hover:border-red-400 transition-all shadow-sm"
                   >
                     <Trash2 size={16} className="mr-2" />
                     Resetar Tudo
                   </button>
                </div>
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