import React, { useState } from 'react';
import { Goal } from '../types';
import { CATEGORIES } from '../constants';
import { generateCategoryIcon } from '../services/geminiService';

interface GoalsProps {
  goals: Goal[];
  onUpdateGoal: (goal: Goal) => void;
  onAddGoal: (goal: Omit<Goal, 'id'>) => void;
  onDeleteGoal: (id: string) => void;
}

const PRESET_COLORS = [
  '#4F46E5', // Indigo
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#6366F1', // Indigo Light
];

const CircularProgress = ({ percentage, color, size = 90, strokeWidth = 8 }: { percentage: number, color: string, size?: number, strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // Limita o preenchimento visual a 100% para não quebrar o loop do SVG, mas o texto mostra o real
  const visualPercentage = Math.min(percentage, 100);
  const offset = circumference - (visualPercentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Círculo de Fundo */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#f3f4f6" // gray-100/200
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Círculo de Progresso */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-gray-700">
        <span className="text-sm font-bold">
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
};

export const Goals: React.FC<GoalsProps> = ({ goals, onAddGoal, onDeleteGoal, onUpdateGoal }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isGeneratingIcon, setIsGeneratingIcon] = useState(false);
  
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const [newTarget, setNewTarget] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [currentIconUrl, setCurrentIconUrl] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string>(''); // Erro para o formulário de categorias

  // Estados para o Orçamento Global
  const totalBudgetGoal = goals.find(g => g.category === 'ORÇAMENTO_TOTAL');
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [totalBudgetInput, setTotalBudgetInput] = useState(totalBudgetGoal ? totalBudgetGoal.targetAmount.toString() : '');
  const [totalBudgetError, setTotalBudgetError] = useState<string>(''); // Erro para o orçamento total

  const validateAmount = (value: string): string | null => {
    if (!value || value.trim() === '') return 'O valor é obrigatório.';
    const num = parseFloat(value);
    if (isNaN(num)) return 'Por favor, insira um número válido.';
    if (num <= 0) return 'O valor deve ser maior que zero.';
    return null;
  };

  const resetForm = () => {
    setEditingId(null);
    setNewCategory(CATEGORIES[0]);
    setNewTarget('');
    setNewColor(PRESET_COLORS[0]);
    setCurrentIconUrl(undefined);
    setError('');
    setIsAdding(false);
    setIsGeneratingIcon(false);
  };

  const startEditing = (goal: Goal) => {
    setEditingId(goal.id);
    setNewCategory(goal.category);
    setNewTarget(goal.targetAmount.toString());
    setNewColor(goal.color || PRESET_COLORS[0]);
    setCurrentIconUrl(goal.iconUrl);
    setError('');
    setIsAdding(true);
  };

  const handleSaveTotalBudget = () => {
    const validationError = validateAmount(totalBudgetInput);
    if (validationError) {
      setTotalBudgetError(validationError);
      return;
    }

    onAddGoal({
      category: 'ORÇAMENTO_TOTAL',
      targetAmount: parseFloat(totalBudgetInput),
      currentAmount: 0 // Will be recalculated by App
    });
    setTotalBudgetError('');
    setIsEditingTotal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateAmount(newTarget);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsGeneratingIcon(true);

    // Tenta gerar o ícone se não houver um ou se a categoria mudou (em um cenário mais complexo comparariamos old vs new)
    // Aqui, simplificamos: se o usuário está criando, gera. Se está editando e mudou a categoria, gera novo?
    // Vamos gerar sempre se não houver iconUrl definido manualmente ou se for novo.
    let iconToSave = currentIconUrl;
    
    // Se não tem ícone ou estamos criando, gera um novo baseado na categoria
    if (!iconToSave) {
        try {
            const generatedIcon = await generateCategoryIcon(newCategory);
            if (generatedIcon) {
                iconToSave = generatedIcon;
            }
        } catch (err) {
            console.error("Failed to generate icon", err);
        }
    }

    if (editingId) {
      onUpdateGoal({
        id: editingId,
        category: newCategory,
        targetAmount: parseFloat(newTarget),
        currentAmount: 0, // App recalculates
        color: newColor,
        iconUrl: iconToSave
      });
    } else {
      onAddGoal({
        category: newCategory,
        targetAmount: parseFloat(newTarget),
        currentAmount: 0,
        color: newColor,
        iconUrl: iconToSave
      });
    }
    
    resetForm();
  };

  const getPercentage = (current: number, target: number) => {
    if (target === 0) return 0;
    return (current / target) * 100;
  };

  // Filtrar o orçamento total da lista de categorias
  const categoryGoals = goals.filter(g => g.category !== 'ORÇAMENTO_TOTAL');

  return (
    <div className="space-y-8">
      
      {/* Seção de Orçamento Global */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-md">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold">Orçamento Mensal Total</h2>
            <p className="text-blue-100 text-sm mt-1">Defina um limite global para todos os seus gastos no mês.</p>
          </div>
          <button 
            onClick={() => {
              setTotalBudgetInput(totalBudgetGoal ? totalBudgetGoal.targetAmount.toString() : '');
              setTotalBudgetError('');
              setIsEditingTotal(!isEditingTotal);
            }}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
        </div>

        {isEditingTotal ? (
          <div className="animate-fade-in bg-white/10 p-4 rounded-lg">
             <div className="flex items-start gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Limite Total (R$)</label>
                  <input 
                      type="number" 
                      step="0.01"
                      value={totalBudgetInput}
                      onChange={(e) => {
                        setTotalBudgetInput(e.target.value);
                        if(totalBudgetError) setTotalBudgetError('');
                      }}
                      className={`w-full bg-white text-gray-800 px-3 py-2 rounded font-bold outline-none ${totalBudgetError ? 'ring-2 ring-red-400' : ''}`}
                      placeholder="Ex: 5000"
                  />
                  {totalBudgetError && (
                    <p className="text-red-200 text-sm mt-1 font-medium bg-red-900/30 px-2 py-1 rounded inline-block">
                      {totalBudgetError}
                    </p>
                  )}
                </div>
                <button 
                  onClick={handleSaveTotalBudget}
                  className="bg-white text-indigo-600 px-4 py-2 rounded font-bold mt-5 hover:bg-gray-100 h-[42px]"
                >
                  Salvar
                </button>
             </div>
          </div>
        ) : (
          <div className="mt-4">
             {totalBudgetGoal ? (
               <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-2xl font-bold">R$ {totalBudgetGoal.currentAmount.toFixed(2)}</span>
                    <span className="opacity-80">de R$ {totalBudgetGoal.targetAmount.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-blue-900/40 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        totalBudgetGoal.currentAmount > totalBudgetGoal.targetAmount ? 'bg-red-400' : 'bg-green-400'
                      }`}
                      style={{ width: `${Math.min(getPercentage(totalBudgetGoal.currentAmount, totalBudgetGoal.targetAmount), 100)}%` }}
                    ></div>
                  </div>
                  {totalBudgetGoal.currentAmount > totalBudgetGoal.targetAmount && (
                    <p className="text-red-300 text-sm mt-2 font-bold flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Orçamento estourado em R$ {(totalBudgetGoal.currentAmount - totalBudgetGoal.targetAmount).toFixed(2)}
                    </p>
                  )}
               </div>
             ) : (
               <div className="text-center py-4 bg-white/10 rounded-lg border border-dashed border-white/20">
                 <p className="text-sm">Nenhum orçamento total definido.</p>
                 <button onClick={() => setIsEditingTotal(true)} className="text-sm font-bold underline mt-1">Definir agora</button>
               </div>
             )}
          </div>
        )}
      </div>

      {/* Seção de Limites por Categoria */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Limites por Categoria</h2>
          <button
            onClick={() => {
              if (isAdding) resetForm();
              else setIsAdding(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm"
          >
            {isAdding ? 'Cancelar' : 'Novo Limite'}
          </button>
        </div>

        {isAdding && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-fade-in mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                  {editingId ? 'Editar Limite' : 'Definir Novo Limite'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select
                    value={newCategory}
                    onChange={(e) => {
                         setNewCategory(e.target.value);
                         // Limpa ícone atual se mudar categoria para forçar nova geração (opcional)
                         if (e.target.value !== newCategory) setCurrentIconUrl(undefined);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Limite Máximo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTarget}
                    onChange={(e) => {
                      setNewTarget(e.target.value);
                      if(error) setError('');
                    }}
                    className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 ${error ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}`}
                    placeholder="1000.00"
                  />
                  {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                </div>
              </div>
              
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">Cor da Meta</label>
                <div className="flex flex-wrap items-center gap-3">
                   <div className="relative">
                      <input 
                        type="color" 
                        value={newColor} 
                        onChange={(e) => setNewColor(e.target.value)}
                        className="w-10 h-10 p-1 rounded-full overflow-hidden cursor-pointer border border-gray-200"
                      />
                   </div>
                   <div className="w-px h-8 bg-gray-200 mx-2 hidden sm:block"></div>
                   <div className="flex gap-2 flex-wrap">
                      {PRESET_COLORS.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewColor(color)}
                          className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${newColor === color ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''}`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                   </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-2">
                 <button
                    type="submit"
                    disabled={isGeneratingIcon}
                    className={`flex items-center justify-center gap-2 w-full md:w-auto px-6 py-2 text-white rounded-lg font-medium transition ${
                    isGeneratingIcon ? 'bg-indigo-400 cursor-not-allowed' : (editingId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-green-600 hover:bg-green-700')
                    }`}
                >
                    {isGeneratingIcon && (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    {isGeneratingIcon 
                        ? (editingId ? 'Atualizando ícone...' : 'Gerando ícone...') 
                        : (editingId ? 'Atualizar' : 'Salvar com Ícone AI')
                    }
                </button>
                {isGeneratingIcon && <p className="text-xs text-gray-500 animate-pulse">A inteligência artificial está criando um ícone exclusivo para sua meta...</p>}
              </div>

            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryGoals.map(goal => {
            const percentage = getPercentage(goal.currentAmount, goal.targetAmount);
            const isOverBudget = goal.currentAmount > goal.targetAmount;
            // Se estiver estourado, usa vermelho para alerta. Se não, usa a cor customizada ou o padrão.
            const baseColor = goal.color || '#4F46E5';
            const circleColor = isOverBudget ? '#EF4444' : baseColor; 
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

            return (
              <div 
                key={goal.id} 
                onDoubleClick={() => startEditing(goal)}
                className={`bg-white p-6 rounded-xl shadow-sm border transition-colors cursor-pointer relative group flex items-center justify-between overflow-hidden ${
                  editingId === goal.id ? 'border-indigo-500 ring-2 ring-indigo-50' : isOverBudget ? 'border-red-200 bg-red-50/30' : 'border-gray-100 hover:border-gray-300'
                }`}
                style={!isOverBudget && editingId !== goal.id ? { borderLeft: `4px solid ${baseColor}` } : {}}
              >
                <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-all z-10 bg-white/80 rounded p-1">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(goal);
                    }}
                    className="p-1 text-indigo-400 hover:text-indigo-600 transition-colors"
                    title="Editar limite"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteGoal(goal.id);
                    }}
                    className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                    title="Remover limite"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 pr-4 z-0 relative">
                   {/* Background Icon (Optional watermark effect) or Side Icon */}
                   {goal.iconUrl && (
                        <div className="absolute -top-3 -right-6 opacity-10 pointer-events-none">
                            <img src={goal.iconUrl} alt="" className="w-24 h-24 object-contain" />
                        </div>
                   )}

                  <div className="flex items-center space-x-3 mb-2">
                    {goal.iconUrl ? (
                        <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 p-1 flex-shrink-0 shadow-sm overflow-hidden">
                            <img src={goal.iconUrl} alt={goal.category} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold flex-shrink-0">
                            {goal.category.substring(0, 2).toUpperCase()}
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-800" style={{ color: !isOverBudget ? baseColor : undefined }}>
                        {goal.category}
                        </h3>
                        {goal.currentAmount >= goal.targetAmount && !isOverBudget && (
                        <div className="bg-green-100 text-green-600 rounded-full p-0.5" title="Meta atingida">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                        )}
                    </div>
                  </div>
                  
                  <div className="space-y-1 relative z-10">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Limite:</span>
                      <span className="font-semibold text-gray-700">R$ {goal.targetAmount.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Gasto:</span>
                      <span className={`font-semibold ${isOverBudget ? 'text-red-600' : ''}`} style={{ color: !isOverBudget ? baseColor : undefined }}>
                        R$ {goal.currentAmount.toFixed(0)}
                      </span>
                    </div>
                  </div>
                  {isOverBudget && (
                    <div className="mt-2 text-xs font-bold text-red-600 bg-red-100 inline-block px-2 py-1 rounded relative z-10">
                      ⚠️ Limite Excedido
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0 flex flex-col items-center gap-1 relative z-10 bg-white/50 backdrop-blur-[2px] rounded-lg p-1">
                  <CircularProgress percentage={percentage} color={circleColor} />
                  <span className="text-[10px] font-semibold text-gray-400">
                    Restam R$ {remaining.toFixed(0)}
                  </span>
                </div>
              </div>
            );
          })}

          {categoryGoals.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-gray-400 bg-white rounded-xl border-2 border-dashed border-gray-200">
              <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>Nenhum limite por categoria definido.</p>
              <button onClick={() => setIsAdding(true)} className="mt-2 text-indigo-600 font-medium hover:underline">
                Criar primeiro limite
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};