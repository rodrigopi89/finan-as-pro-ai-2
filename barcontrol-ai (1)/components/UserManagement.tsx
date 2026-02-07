import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { StoreService } from '../services/store';
import { Plus, Trash2, Edit2, Save, X, Shield, ShieldCheck, UserCog, Layout, KeyRound, User as UserIcon, CheckSquare, Square } from 'lucide-react';

interface UserManagementProps {
  currentUser: User;
}

const AVAILABLE_VIEWS = [
  { id: 'dashboard', label: 'Painel Gerencial', description: 'Visão completa de faturamento e IA.' },
  { id: 'pos', label: 'PDV (Caixa & Mesas)', description: 'Lançar pedidos e fechar contas.' },
  { id: 'kitchen', label: 'Cozinha (KDS)', description: 'Visualizar pedidos em preparo.' },
  { id: 'inventory', label: 'Estoque', description: 'Cadastrar e gerenciar produtos.' },
  { id: 'kiosk', label: 'Modo Quiosque', description: 'Interface de autoatendimento.' },
  { id: 'users', label: 'Gestão de Usuários', description: 'Criar e editar acessos.' },
];

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'PERMISSIONS'>('DETAILS');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Form State
  const [editingUser, setEditingUser] = useState<Partial<User>>({
    name: '',
    username: '',
    password: '',
    role: UserRole.WAITER,
    allowedViews: []
  });

  useEffect(() => {
    setUsers(StoreService.getUsers());
  }, []);

  const handleCreateNew = () => {
      setEditingUser({
          id: '', // Empty ID signals new user
          name: '',
          username: '',
          password: '',
          role: UserRole.WAITER,
          allowedViews: ['pos'] // Default safe view
      });
      setActiveTab('DETAILS');
      setErrorMsg('');
      setIsEditing(true);
  }

  const handleEditExisting = (user: User) => {
      setEditingUser({ ...user });
      setActiveTab('DETAILS');
      setErrorMsg('');
      setIsEditing(true);
  }

  const handleSave = () => {
    // Validation
    if (!editingUser.name || !editingUser.username || !editingUser.password) {
        setErrorMsg("Preencha todos os campos obrigatórios.");
        return;
    }

    try {
        const newUser: User = {
            id: editingUser.id || Date.now().toString(),
            name: editingUser.name,
            username: editingUser.username,
            password: editingUser.password,
            role: editingUser.role as UserRole,
            // Admin gets all views automatically, others use selected
            allowedViews: editingUser.role === UserRole.ADMIN 
                ? AVAILABLE_VIEWS.map(v => v.id) 
                : editingUser.allowedViews || []
        };

        const updatedUsers = StoreService.saveUser(newUser);
        setUsers(updatedUsers);
        setIsEditing(false);
    } catch (err: any) {
        setErrorMsg(err.message || "Erro ao salvar usuário.");
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este usuário?')) {
      try {
          const updatedUsers = StoreService.deleteUser(id);
          setUsers(updatedUsers);
      } catch (err: any) {
          alert(err.message);
      }
    }
  };

  const togglePermission = (viewId: string) => {
    const currentPermissions = editingUser.allowedViews || [];
    if (currentPermissions.includes(viewId)) {
      setEditingUser({ ...editingUser, allowedViews: currentPermissions.filter(id => id !== viewId) });
    } else {
      setEditingUser({ ...editingUser, allowedViews: [...currentPermissions, viewId] });
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const styles = {
      [UserRole.ADMIN]: 'bg-purple-100 text-purple-700 border-purple-200',
      [UserRole.COOK]: 'bg-orange-100 text-orange-700 border-orange-200',
      [UserRole.BARTENDER]: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      [UserRole.WAITER]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    };
    return styles[role] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-6">
      {/* User List Panel */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Equipe</h2>
            <p className="text-slate-500">Gerencie usuários e permissões de acesso.</p>
          </div>
          <button 
            onClick={handleCreateNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-blue-900/10"
          >
            <Plus size={20} /> Novo Usuário
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {users.map(user => (
              <div key={user.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all group relative">
                 <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xl border border-slate-200">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">{user.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded border font-bold uppercase tracking-wider ${getRoleBadge(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                        onClick={() => handleEditExisting(user)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                        >
                        <Edit2 size={18} />
                        </button>
                        <button 
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                        >
                        <Trash2 size={18} />
                        </button>
                    </div>
                 </div>
                 
                 <div className="space-y-2 text-sm text-slate-500">
                     <div className="flex items-center gap-2">
                         <UserIcon size={14} />
                         <span>{user.username}</span>
                     </div>
                 </div>

                 <div className="mt-4 pt-3 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Acesso às Telas</p>
                    {user.role === UserRole.ADMIN ? (
                        <div className="flex items-center gap-1.5 text-xs text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded inline-block">
                            <ShieldCheck size={14} /> Acesso Total
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-1.5">
                            {user.allowedViews.length === 0 && <span className="text-xs italic text-slate-400">Nenhum acesso</span>}
                            {user.allowedViews.map(view => (
                                <span key={view} className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                                {AVAILABLE_VIEWS.find(v => v.id === view)?.label || view}
                                </span>
                            ))}
                        </div>
                    )}
                 </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Editor Modal/Panel */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in max-h-[90vh]">
                
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">
                            {editingUser.id ? 'Editar Usuário' : 'Novo Usuário'}
                        </h3>
                        <p className="text-sm text-slate-500">Preencha os dados e defina permissões.</p>
                    </div>
                    <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-800 p-1 bg-white hover:bg-slate-200 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200">
                    <button 
                        onClick={() => setActiveTab('DETAILS')}
                        className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                            activeTab === 'DETAILS' 
                            ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                            : 'border-transparent text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        <UserCog size={18} /> Dados & Acesso
                    </button>
                    <button 
                        onClick={() => setActiveTab('PERMISSIONS')}
                        disabled={editingUser.role === UserRole.ADMIN}
                        className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                            activeTab === 'PERMISSIONS' 
                            ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                            : 'border-transparent text-slate-500 hover:bg-slate-50'
                        } ${editingUser.role === UserRole.ADMIN ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Layout size={18} /> Permissões
                    </button>
                </div>
                
                {/* Content */}
                <div className="p-6 flex-1 overflow-y-auto">
                    {errorMsg && (
                        <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 flex items-center gap-2">
                            <span className="font-bold">Atenção:</span> {errorMsg}
                        </div>
                    )}

                    {activeTab === 'DETAILS' ? (
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
                                <input 
                                    type="text" 
                                    value={editingUser.name}
                                    onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ex: João Silva"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1">
                                        <UserIcon size={14} /> Usuário (Login)
                                    </label>
                                    <input 
                                        type="text" 
                                        value={editingUser.username}
                                        onChange={e => setEditingUser({ ...editingUser, username: e.target.value })}
                                        className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Ex: joao.silva"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1">
                                        <KeyRound size={14} /> Senha
                                    </label>
                                    <input 
                                        type="text" 
                                        value={editingUser.password}
                                        onChange={e => setEditingUser({ ...editingUser, password: e.target.value })}
                                        className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                        placeholder="********"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Função / Cargo</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.values(UserRole).map(role => (
                                        <label 
                                            key={role}
                                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                                editingUser.role === role 
                                                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                                : 'border-slate-100 bg-white hover:border-slate-200 text-slate-600'
                                            }`}
                                        >
                                            <input 
                                                type="radio" 
                                                name="role"
                                                className="hidden"
                                                checked={editingUser.role === role}
                                                onChange={() => setEditingUser({ ...editingUser, role: role })}
                                            />
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                                editingUser.role === role ? 'border-blue-600' : 'border-slate-300'
                                            }`}>
                                                {editingUser.role === role && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                                            </div>
                                            <span className="font-bold text-sm">{role}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-xl text-blue-800 text-sm mb-4 flex items-start gap-3">
                                <Shield className="shrink-0 mt-1" size={18} />
                                <div>
                                    <p className="font-bold">Controle de Acesso</p>
                                    <p className="opacity-80">Selecione quais módulos do sistema o usuário <strong>{editingUser.name}</strong> poderá acessar.</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {AVAILABLE_VIEWS.map(view => {
                                    const isSelected = (editingUser.allowedViews || []).includes(view.id);
                                    return (
                                        <label 
                                            key={view.id} 
                                            className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                isSelected
                                                ? 'border-blue-500 bg-white shadow-sm' 
                                                : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100'
                                            }`}
                                        >
                                            <div className={`mt-1 transition-colors ${isSelected ? 'text-blue-600' : 'text-slate-300'}`}>
                                                {isSelected ? <CheckSquare size={24} /> : <Square size={24} />}
                                            </div>
                                            <input 
                                                type="checkbox" 
                                                className="hidden"
                                                checked={isSelected}
                                                onChange={() => togglePermission(view.id)}
                                            />
                                            <div>
                                                <div className={`font-bold ${isSelected ? 'text-slate-800' : 'text-slate-500'}`}>{view.label}</div>
                                                <div className="text-xs text-slate-400">{view.description}</div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button 
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-900/10 active:scale-95 transition-all"
                    >
                        <Save size={20} /> Salvar Usuário
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
