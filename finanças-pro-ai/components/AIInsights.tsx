import React, { useState } from 'react';
import { Transaction, Goal } from '../types';
import { analyzeFinances } from '../services/geminiService';
import ReactMarkdown from 'react-markdown'; // Assuming standard handling, but will render simple text if lib not present in env.
// Note: Since we cannot guarantee 'react-markdown' is installed in the user's environment, we will render plain text with whitespace handling.

interface AIInsightsProps {
  transactions: Transaction[];
  goals: Goal[];
}

export const AIInsights: React.FC<AIInsightsProps> = ({ transactions, goals }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await analyzeFinances(transactions, goals);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Consultor Financeiro AI</h2>
        <p className="opacity-90 mb-6">
          Use a inteligência artificial do Gemini para analisar seus gastos, identificar padrões e descobrir como atingir suas metas mais rápido.
        </p>
        
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="bg-white text-indigo-600 font-semibold py-3 px-6 rounded-lg shadow hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analisando dados...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Gerar Análise
            </>
          )}
        </button>
      </div>

      {analysis && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 animate-fade-in">
          <div className="prose prose-indigo max-w-none">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="text-2xl mr-2">🤖</span> Insights
            </h3>
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed font-normal">
                {analysis}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};