
import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Plus, History, Clock, Search, Filter, Loader2, ChevronDown, ChevronUp, Save, MessageSquare, AlertCircle, FileText, ArrowRight, Edit2 } from 'lucide-react';
import { FollowUpProject, FollowUpHistory } from '../types';
import { generateId } from '../utils';
import { motion, AnimatePresence } from 'motion/react';

interface ProjectFollowUpProps {
  projects: FollowUpProject[];
  history: FollowUpHistory[];
  onAddProjects: (projects: FollowUpProject[]) => void;
  onAddHistory: (history: FollowUpHistory) => void;
  onUpdateHistory: (history: FollowUpHistory) => void;
  onBack: () => void;
  userRole?: string;
  mode?: 'admin' | 'consult';
}

const ProjectFollowUp: React.FC<ProjectFollowUpProps> = ({ 
  projects, 
  history, 
  onAddProjects, 
  onAddHistory, 
  onUpdateHistory,
  onBack, 
  userRole, 
  mode = 'admin' 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdminMode = mode === 'admin';

  const processRows = (rows: any[]) => {
    console.log("Processando linhas:", rows);

    const newProjects: FollowUpProject[] = rows.map((row: any) => {
      // Busca flexível pelas colunas
      const findValue = (possibleNames: string[]) => {
        const key = Object.keys(row).find(k => 
          possibleNames.some(name => k.trim().toUpperCase() === name.toUpperCase())
        );
        return key ? row[key] : null;
      };

      const unit = findValue(['UNIDADE (C.C.)', 'UNIDADE', 'C.C.', 'CENTRO DE CUSTO']);
      const projectNumber = findValue(['Nº PROJETO', 'PROJETO', 'INVESTIMENTO', 'N PROJETO', 'INVEST']);

      if (!unit || !projectNumber) {
        return null;
      }

      const existing = projects.find(p => p.projectNumber.toString() === projectNumber.toString());
      
      return {
        id: existing?.id || generateId(),
        unit: unit.toString(),
        projectNumber: projectNumber.toString(),
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }).filter(p => p !== null) as FollowUpProject[];

    if (newProjects.length > 0) {
      onAddProjects(newProjects);
      alert(`${newProjects.length} projetos processados com sucesso!`);
      setShowPasteArea(false);
      setPasteContent('');
    } else {
      alert("Nenhum projeto válido encontrado. Verifique se as colunas 'UNIDADE' e 'Nº PROJETO' estão presentes.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result as ArrayBuffer;
        const workbook = XLSX.read(data, { type: 'array' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const rows = XLSX.utils.sheet_to_json(ws) as any[];
        processRows(rows);
      } catch (err) {
        console.error("Erro ao processar planilha:", err);
        alert("Erro técnico ao ler o arquivo. Certifique-se de que é um arquivo .xlsx ou .xls válido.");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handlePasteProcess = () => {
    if (!pasteContent.trim()) return;

    try {
      // Divide por linhas
      const lines = pasteContent.trim().split('\n');
      if (lines.length < 2) {
        alert("Conteúdo insuficiente para processar. Certifique-se de incluir o cabeçalho e os dados.");
        return;
      }

      // Detecta separador (tab para excel, vírgula ou ponto e vírgula para CSV)
      const firstLine = lines[0];
      let separator = '\t';
      if (!firstLine.includes('\t')) {
        if (firstLine.includes(';')) separator = ';';
        else if (firstLine.includes(',')) separator = ',';
      }

      const headers = lines[0].split(separator).map(h => h.trim());
      const rows = lines.slice(1).map(line => {
        const values = line.split(separator);
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index]?.trim();
        });
        return obj;
      });

      processRows(rows);
    } catch (err) {
      console.error("Erro ao processar colagem:", err);
      alert("Erro ao processar os dados colados. Certifique-se de copiar as colunas com cabeçalho.");
    }
  };

  const handleAddComment = (projectNumber: string) => {
    const comment = newComments[projectNumber];
    if (!comment || !comment.trim()) return;

    const newHistory: FollowUpHistory = {
      id: generateId(),
      projectNumber,
      date: new Date().toISOString(),
      comment: comment.trim()
    };

    onAddHistory(newHistory);
    setNewComments(prev => ({ ...prev, [projectNumber]: '' }));
  };

  const handleUpdateHistory = (item: FollowUpHistory) => {
    if (!editingContent.trim()) return;

    onUpdateHistory({
      ...item,
      comment: editingContent.trim()
    });
    setEditingHistoryId(null);
    setEditingContent('');
  };

  const filteredProjects = useMemo(() => {
    const filtered = projects.filter(p => 
      p.unit.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.projectNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Auto-expand if only one result
    if (filtered.length === 1 && expandedProject !== filtered[0].id && searchTerm.length > 2) {
      setExpandedProject(filtered[0].id);
    }

    return filtered;
  }, [projects, searchTerm, expandedProject]);

  // Consult Mode Specific View
  if (mode === 'consult') {
    const selectedProject = projects.find(p => p.id === expandedProject);
    const projectHistory = history
      .filter(h => h.projectNumber === selectedProject?.projectNumber)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
      <div className="flex flex-col h-full bg-slate-50 animate-in fade-in duration-500">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-8 py-6">
          <div className="flex items-center gap-6">
            <button onClick={onBack} className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-100">
              <ArrowRight className="rotate-180" size={20} />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-slate-900 rounded-xl">
                  <Search className="text-white" size={24} />
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Consulta de Investimentos</h1>
              </div>
              <p className="text-slate-500 text-sm font-medium tracking-tight">Selecione um projeto para visualizar o histórico completo</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Project Selection */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Escolha o Investimento</label>
              <select 
                value={expandedProject || ''} 
                onChange={(e) => setExpandedProject(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none appearance-none cursor-pointer"
              >
                <option value="">Selecione um projeto na lista...</option>
                {projects.sort((a, b) => a.projectNumber.localeCompare(b.projectNumber)).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.projectNumber} - {p.unit}
                  </option>
                ))}
              </select>
            </div>

            {selectedProject ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Project Brief */}
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Unidade</span>
                      <span className="text-lg font-bold">{selectedProject.unit}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nº Investimento</span>
                      <span className="text-lg font-bold text-emerald-400 font-mono italic">{selectedProject.projectNumber}</span>
                    </div>
                  </div>
                </div>

                {/* History List */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8">
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                    <History size={14} className="text-emerald-600" />
                    Linha do Tempo de Atualizações
                  </h3>

                  {projectHistory.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
                      <p className="text-slate-400 font-bold italic">Nenhum histórico registrado para este investimento.</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {projectHistory.map((h) => (
                        <div key={h.id} className="relative pl-8 border-l-2 border-slate-100 last:border-0 pb-2">
                          <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-emerald-500" />
                          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                             <div className="flex items-center gap-2 mb-3">
                               <Clock size={12} className="text-slate-400" />
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                 {new Date(h.date).toLocaleString('pt-BR')}
                               </span>
                             </div>
                             <p className="text-sm text-slate-700 font-medium leading-relaxed">
                               {h.comment}
                             </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="text-slate-300" />
                </div>
                <p className="text-slate-400 font-medium italic">Selecione um item acima para ver os dados</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button 
              onClick={onBack}
              className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-100"
            >
              <ArrowRight className="rotate-180" size={20} />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-emerald-50 rounded-xl">
                  <FileText className="text-emerald-600" size={24} />
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                  {isAdminMode ? 'Gestão de Projetos' : 'Consulta de Investimentos'}
                </h1>
              </div>
              <p className="text-slate-500 text-sm font-medium tracking-tight">
                {isAdminMode 
                  ? 'Painel administrativo para importação e atualização de status' 
                  : 'Pesquise e visualize o histórico completo de atualizações por projeto'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAdminMode && (
              <>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".xlsx, .xls, .csv" 
                  className="hidden" 
                />
                <button 
                  onClick={() => setShowPasteArea(!showPasteArea)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${showPasteArea ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  <Plus size={16} />
                  Colar Dados
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-200 transition-all disabled:opacity-50"
                >
                  {isImporting ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                  Importar Planilha
                </button>
              </>
            )}
          </div>
        </div>

        {/* Paste Area Section */}
        <AnimatePresence>
          {showPasteArea && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-8 p-6 bg-slate-900 rounded-[2rem] border border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Plus className="text-emerald-500" size={16} />
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Colar de Planilha</h3>
                </div>
                <p className="text-slate-400 text-xs mb-4 leading-relaxed">
                  Copie suas colunas (<span className="text-emerald-400 font-bold">UNIDADE</span> e <span className="text-emerald-400 font-bold">INVESTIMENTO</span>) incluindo o cabeçalho e cole abaixo:
                </p>
                <textarea
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  placeholder="Cole aqui (ex: Unidade [tab] Investimento)..."
                  className="w-full h-40 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-emerald-500/80 focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                />
                <div className="flex justify-end gap-3 mt-4">
                  <button 
                    onClick={() => setShowPasteArea(false)}
                    className="px-6 py-3 text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handlePasteProcess}
                    disabled={!pasteContent.trim()}
                    className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 shadow-lg shadow-emerald-900/20"
                  >
                    Processar Colagem
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div className="mt-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por Unidade ou Investimento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
            />
          </div>
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          {filteredProjects.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 border-dashed p-20 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6">
                <FileText className="text-slate-300" size={32} />
              </div>
              <p className="text-slate-900 font-bold mb-2">Nenhum projeto encontrado</p>
              <p className="text-slate-500 text-sm max-w-xs">Importe uma planilha para iniciar o acompanhamento dos investimentos.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredProjects.map((project) => {
                const projectHistory = history
                  .filter(h => h.projectNumber === project.projectNumber)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                
                const isExpanded = expandedProject === project.id;
                const lastComment = projectHistory[0];

                return (
                  <div 
                    key={project.id}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden transition-all hover:shadow-xl hover:shadow-slate-200/50"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1">
                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Unidade</span>
                            <span className="text-sm font-bold text-slate-900 uppercase">{project.unit}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Investimento</span>
                            <span className="text-sm font-bold text-emerald-700 font-mono tracking-tighter">{project.projectNumber}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Observações</span>
                            <div className="flex items-center gap-2">
                              {lastComment ? (
                                <p className="text-xs text-slate-600 line-clamp-1 font-medium italic">
                                  "{lastComment.comment}"
                                </p>
                              ) : (
                                <span className="text-xs text-slate-300 font-bold italic">Sem histórico</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                            className={`p-3 rounded-2xl transition-all ${isExpanded ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}
                          >
                            <History size={20} />
                          </button>
                        </div>
                      </div>

                      {/* Add Comment Section Inline - ONLY IN ADMIN MODE */}
                      {isAdminMode && (
                        <div className="mt-6 flex flex-col md:flex-row gap-3">
                          <div className="flex-1 relative">
                            <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                              type="text"
                              placeholder="Adicionar comentário de status..."
                              value={newComments[project.projectNumber] || ''}
                              onChange={(e) => setNewComments(prev => ({ ...prev, [project.projectNumber]: e.target.value }))}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddComment(project.projectNumber)}
                              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                            />
                          </div>
                          <button 
                            onClick={() => handleAddComment(project.projectNumber)}
                            disabled={!newComments[project.projectNumber]?.trim()}
                            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 flex items-center gap-2"
                          >
                            <Save size={14} />
                            Atualizar
                          </button>
                        </div>
                      )}
                    </div>

                    {/* History Section */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="bg-slate-50 border-t border-slate-100"
                        >
                          <div className="p-8">
                            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                              <History size={12} className="text-emerald-600" />
                              Histórico de Atualizações
                            </h3>

                            {projectHistory.length === 0 ? (
                              <div className="text-center py-8">
                                <p className="text-xs text-slate-400 font-bold italic">Nenhum comentário registrado ainda.</p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {projectHistory.map((h, idx) => (
                                  <div key={h.id} className="relative pl-6 pb-6 border-l-2 border-slate-200 last:pb-0">
                                    <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-emerald-500" />
                                    <div className="flex items-center gap-3 mb-2">
                                      <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                                        <Clock size={10} />
                                        {new Date(h.date).toLocaleString('pt-BR')}
                                      </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm inline-block min-w-[200px] w-full">
                                      {editingHistoryId === h.id ? (
                                        <div className="space-y-3">
                                          <textarea 
                                            value={editingContent}
                                            onChange={(e) => setEditingContent(e.target.value)}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                                            rows={3}
                                          />
                                          <div className="flex justify-end gap-2">
                                            <button 
                                              onClick={() => setEditingHistoryId(null)}
                                              className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"
                                            >
                                              Cancelar
                                            </button>
                                            <button 
                                              onClick={() => handleUpdateHistory(h)}
                                              className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest"
                                            >
                                              Salvar
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="group relative pr-8">
                                          <p className="text-xs text-slate-700 font-medium leading-relaxed">
                                            {h.comment}
                                          </p>
                                          {isAdminMode && (
                                            <button 
                                              onClick={() => {
                                                setEditingHistoryId(h.id);
                                                setEditingContent(h.comment);
                                              }}
                                              className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-emerald-600 transition-all flex items-center"
                                            >
                                              <Edit2 size={12} />
                                              <span className="text-[8px] font-bold uppercase ml-1">Editar</span>
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectFollowUp;
