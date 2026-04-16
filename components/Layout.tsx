import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Building2, 
  FileText, 
  Menu, 
  X, 
  Settings,
  CheckSquare,
  LogOut,
  UserCircle,
  History
} from 'lucide-react';
import { auth } from '../firebase';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onNavigate: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('Usuário');

  useEffect(() => {
    const user = auth.currentUser;
    if (user?.email) {
      setUserEmail(user.email);
    }
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Painel', icon: <LayoutDashboard size={20} /> },
    { id: 'suppliers', label: 'Fornecedores', icon: <Users size={20} /> },
    { id: 'projects', label: 'Projetos', icon: <Briefcase size={20} /> },
    { id: 'units', label: 'Unidades', icon: <Building2 size={20} /> },
    { id: 'contracts', label: 'Contratos', icon: <FileText size={20} /> },
    { id: 'procedures', label: 'Procedimentos', icon: <History size={20} /> },
    { id: 'types', label: 'Tipos de serviço', icon: <CheckSquare size={20} /> },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans select-none" data-version="2.2">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-[#064e3b] text-white transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between p-6 border-b border-emerald-800/30">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-950/20">
              <FileText className="text-white" size={20} />
            </div>
            <span className="text-xl font-black tracking-tight">EcoContrato</span>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden text-emerald-200">
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 mt-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setIsSidebarOpen(false);
              }}
              className={`
                flex items-center w-full px-4 py-3.5 text-sm font-bold rounded-2xl transition-all duration-200
                ${activeTab === item.id 
                  ? 'bg-emerald-600/50 text-white shadow-xl shadow-emerald-950/20' 
                  : 'text-emerald-100/70 hover:bg-emerald-800/50 hover:text-white'}
              `}
            >
              <span className={`mr-4 transition-transform duration-200 ${activeTab === item.id ? 'scale-110 text-emerald-400' : ''}`}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-emerald-800/30 bg-[#064e3b]">
           <button 
            onClick={() => {
              onNavigate('settings');
              setIsSidebarOpen(false);
            }}
            className={`
              flex items-center w-full px-4 py-3 text-sm font-bold rounded-xl transition-all mb-2
              ${activeTab === 'settings' ? 'bg-emerald-600/30 text-white' : 'text-emerald-100/60 hover:text-white hover:bg-emerald-800/50'}
            `}
          >
            <Settings size={20} className="mr-4" />
            configurações
          </button>
          
          <button 
            onClick={() => {
              onNavigate('home');
              setIsSidebarOpen(false);
            }}
            className="flex items-center w-full px-4 py-3 text-sm font-bold text-emerald-100/40 hover:text-white hover:bg-emerald-800/50 rounded-xl transition-all"
          >
            <LogOut size={20} className="mr-4" />
            Voltar ao Portal
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-8 py-4 bg-white shadow-sm z-10 border-b border-gray-100">
          <button onClick={toggleSidebar} className="lg:hidden text-gray-400">
            <Menu size={24} />
          </button>
          <div className="flex items-center space-x-6 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-700 max-w-[200px] truncate">{userEmail}</p>
              <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest flex justify-end items-center gap-1.5">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> On-line
              </span>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm">
              <UserCircle size={26}/>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-slate-50/50">
          <div className="p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
