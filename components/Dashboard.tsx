import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { DashboardStats, SupplierStatus, Project } from '../types';
import { Users, FileText, Briefcase, AlertTriangle, Calendar, ArrowRight } from 'lucide-react';

interface DashboardProps {
  stats: DashboardStats;
  suppliersData: any[];
  projectsData?: Project[];
}

const StatCard: React.FC<{ 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  color: string;
  trend?: string;
}> = ({ title, value, icon, color, trend }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition-all hover:shadow-md">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold mt-1 text-gray-900">{value}</p>
        {trend && <p className="text-xs text-green-600 mt-2 font-medium">{trend}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ stats, suppliersData, projectsData = [] }) => {
  const statusCounts = suppliersData.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = [
    { name: 'Homologado', value: statusCounts[SupplierStatus.HOMOLOGATED] || 0, color: '#10b981' },
    { name: 'Aguardando', value: statusCounts[SupplierStatus.PENDING] || 0, color: '#f59e0b' },
    { name: 'Bloqueado', value: statusCounts[SupplierStatus.BLOCKED] || 0, color: '#ef4444' },
  ];

  // Filtrar projetos programados (Planned)
  const scheduledProjects = projectsData.filter(p => p.status === 'Planned');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Visão Geral</h1>
        <div className="text-sm text-gray-500">Última atualização: Hoje, {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Fornecedores Totais" 
          value={stats.totalSuppliers} 
          icon={<Users className="text-primary-600" size={24} />} 
          color="bg-primary-50"
          trend="+12% este mês"
        />
        <StatCard 
          title="Projetos Ativos" 
          value={stats.activeProjects} 
          icon={<Briefcase className="text-blue-600" size={24} />} 
          color="bg-blue-50"
        />
        <StatCard 
          title="Contratos Gerados" 
          value={stats.contractsGenerated} 
          icon={<FileText className="text-purple-600" size={24} />} 
          color="bg-purple-50"
        />
        <StatCard 
          title="Homologações Pendentes" 
          value={stats.pendingHomologations} 
          icon={<AlertTriangle className="text-amber-600" size={24} />} 
          color="bg-amber-50"
          trend="Ação necessária"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Status */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Status dos Fornecedores</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center text-xs text-gray-600">
                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                {item.name} ({item.value})
              </div>
            ))}
          </div>
        </div>

        {/* Área de Projetos Programados */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <Calendar className="mr-2 text-blue-600" size={20} />
              Projetos Programados
            </h2>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">
              {scheduledProjects.length} Próximos
            </span>
          </div>
          
          {scheduledProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
              <Briefcase size={40} className="mb-2 opacity-20" />
              <p className="text-sm">Nenhum projeto planejado para início em breve.</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-64 pr-2">
              {scheduledProjects.map(project => (
                <div key={project.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-50 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all group">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-blue-600 shadow-sm border border-blue-50">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{project.name}</h4>
                      <p className="text-xs text-gray-500">Início: {new Date(project.startDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-700">R$ {project.estimatedValue.toLocaleString('pt-BR')}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-black">{project.costCenter}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button className="w-full mt-4 flex items-center justify-center py-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
            Ver cronograma completo <ArrowRight size={14} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
