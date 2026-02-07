import React, { useState } from 'react';
import { User } from '../types';
import { StoreService } from '../services/store';
import { ChevronRight, UserCircle2, Lock, User as UserIcon, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const user = StoreService.validateLogin(username, password);
    if (user) {
      onLogin(user);
    } else {
      setError('Credenciais inválidas. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[500px]">
        
        {/* Banner Side */}
        <div className="bg-blue-600 p-12 flex flex-col justify-center items-center text-white md:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 z-0" />
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-white/20 p-6 rounded-full mb-6 backdrop-blur-sm shadow-xl">
                <UserCircle2 size={64} />
            </div>
            <h1 className="text-4xl font-bold mb-2">BarControl</h1>
            <p className="text-blue-100 text-lg text-center max-w-xs">
                Gestão inteligente para seu estabelecimento.
            </p>
          </div>
        </div>

        {/* Form Side */}
        <div className="p-8 md:p-12 flex-1 flex flex-col justify-center bg-slate-50">
          <div className="max-w-xs w-full mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Bem-vindo</h2>
            <p className="text-slate-500 mb-8 text-sm">Faça login para acessar o sistema.</p>
            
            <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Usuário</label>
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                            type="text" 
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 font-medium"
                            placeholder="Seu usuário"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Senha</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                            type={showPassword ? "text" : "password"} 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-10 pr-10 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 font-medium"
                            placeholder="Sua senha"
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2 animate-shake">
                        <span className="font-bold">Erro:</span> {error}
                    </div>
                )}

                <button
                    type="submit"
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-blue-900/10 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                >
                    Entrar <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </form>
            
            <div className="mt-8 text-center text-xs text-slate-400">
               <p>Acesso Admin Padrão:</p>
               <p className="font-mono mt-1 bg-slate-200 inline-block px-2 py-1 rounded text-slate-600">admin / 123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};