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
  LogOut
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onNavigate: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('Usuário');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setUserEmail(data.user.email);
      }
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload(); // Force reload to trigger auth guard in App.tsx
  };

  const menuItems = [
    { id: 'dashboard', label: 'Painel', icon: <LayoutDashboard size={20} /> },
    { id: 'suppliers', label: 'Fornecedores', icon: <Users size={20} /> },
    { id: 'projects', label: 'Projetos (Simples)', icon: <Briefcase size={20} /> },
    { id: 'units', label: 'Unidades', icon: <Building2 size={20} /> },
    { id: 'contracts', label: 'Contratos', icon: <FileText size={20} /> },
    { id: 'types', label: 'Tipos de Serviço', icon: <CheckSquare size={20} /> },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
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
          fixed inset-y-0 left-0 z-30 w-64 bg-primary-900 text-white transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-primary-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <FileText className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">EcoContract</span>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden text-primary-200">
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setIsSidebarOpen(false);
              }}
              className={`
                flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors
                ${activeTab === item.id 
                  ? 'bg-primary-800 text-white border-l-4 border-primary-500' 
                  : 'text-primary-100 hover:bg-primary-800 hover:text-white'}
              `}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-primary-800 space-y-1">
           <button 
            onClick={() => {
              onNavigate('settings');
              setIsSidebarOpen(false);
            }}
            className={`
              flex items-center w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors mb-2
              ${activeTab === 'settings' ? 'bg-primary-800 text-white' : 'text-primary-200 hover:text-white hover:bg-primary-800'}
            `}
          >
            <Settings size={20} className="mr-3" />
            Configurações
          </button>
          
          <button 
            onClick={() => {
              onNavigate('home');
              setIsSidebarOpen(false);
            }}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-primary-300 hover:text-white hover:bg-primary-800 rounded-lg transition-colors"
          >
            <LogOut size={20} className="mr-3" />
            Voltar ao Portal
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm z-10">
          <button onClick={toggleSidebar} className="lg:hidden text-gray-500">
            <Menu size={24} />
          </button>
          <div className="flex items-center space-x-4 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900 max-w-[150px] truncate">{userEmail}</p>
              <button 
                onClick={handleLogout}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Sair do sistema
              </button>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border-2 border-primary-200 uppercase">
              {userEmail.substring(0, 2)}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;