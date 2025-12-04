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
import { DashboardStats, SupplierStatus } from '../types';
import { Users, FileText, Briefcase, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  stats: DashboardStats;
  suppliersData: any[];
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

const Dashboard: React.FC<DashboardProps> = ({ stats, suppliersData }) => {
  // Derived data for charts
  const statusCounts = suppliersData.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = [
    { name: 'Homologado', value: statusCounts[SupplierStatus.HOMOLOGATED] || 0, color: '#10b981' },
    { name: 'Aguardando', value: statusCounts[SupplierStatus.PENDING] || 0, color: '#f59e0b' },
    { name: 'Bloqueado', value: statusCounts[SupplierStatus.BLOCKED] || 0, color: '#ef4444' },
  ];

  const activityData = [
    { name: 'Jan', contratos: 4 },
    { name: 'Fev', contratos: 3 },
    { name: 'Mar', contratos: 7 },
    { name: 'Abr', contratos: 5 },
    { name: 'Mai', contratos: 9 },
    { name: 'Jun', contratos: 6 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Visão Geral</h1>
        <div className="text-sm text-gray-500">Última atualização: Hoje, 09:00</div>
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
          trend="3 finalizando"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
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
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center text-sm text-gray-600">
                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                {item.name} ({item.value})
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Geração de Contratos (Semestral)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="contratos" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;