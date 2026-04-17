import React from 'react';
import { motion } from 'motion/react';
import { Settings, FileEdit, Paperclip, FileCheck, LayoutDashboard, ArrowRight } from 'lucide-react';

const steps = [
  {
    icon: Settings,
    title: 'Configuração',
    description: 'Defina os dados da sua empresa, fornecedores e unidades de negócio.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    icon: FileEdit,
    title: 'Checklist',
    description: 'Preencha os detalhes do contrato através do nosso assistente passo a passo.',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
  {
    icon: Paperclip,
    title: 'Anexos',
    description: 'Anexe PDFs obrigatórios. O sistema cuidará do armazenamento otimizado.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    icon: FileCheck,
    title: 'Geração',
    description: 'O sistema mescla seus dados e arquivos em um PDF profissional e unificado.',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    icon: LayoutDashboard,
    title: 'Gestão',
    description: 'Visualize, edite ou baixe novamente qualquer contrato através do painel central.',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
];

const ProcessInfographic: React.FC = () => {
  return (
    <div className="py-12 px-4 bg-gray-50 rounded-2xl border border-gray-100 mb-8" id="process-infographic">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900">Como funciona o EcoContract?</h2>
          <p className="mt-2 text-gray-600">Entenda o fluxo dinâmico desde a configuração até a entrega do PDF unificado.</p>
        </div>

        <div className="relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                className="flex flex-col items-center text-center"
              >
                <div className={`w-16 h-16 ${step.bgColor} rounded-full flex items-center justify-center mb-4 shadow-sm border-2 border-white relative`}>
                  <step.icon className={`w-8 h-8 ${step.color}`} />
                  {index < steps.length - 1 && (
                    <div className="md:hidden absolute -bottom-6 left-1/2 -translate-x-1/2 text-gray-300">
                                            <ArrowRight className="rotate-90" size={20} />
                                        </div>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed px-2">
                  {step.description}
                </p>
                {index < steps.length - 1 && (
                   <div className="hidden md:flex absolute right-[-15%] top-1/2 -translate-y-1/2 items-center justify-center text-gray-300">
                     <ArrowRight size={16} />
                   </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm text-xs font-medium text-gray-600 italic">
            <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
            Processamento em Nuvem Inteligente Habilitado
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProcessInfographic;
