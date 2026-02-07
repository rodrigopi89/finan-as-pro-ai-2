import { GoogleGenAI } from "@google/genai";
import { Transaction, Goal } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize client only if key exists to avoid immediate errors, handle gracefully in functions
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const analyzeFinances = async (
  transactions: Transaction[], 
  goals: Goal[]
): Promise<string> => {
  if (!ai) {
    return "API Key não configurada. Por favor, adicione sua chave de API do Gemini para receber insights.";
  }

  const transactionSummary = transactions.map(t => 
    `${t.date}: ${t.description} (${t.category}) - R$ ${t.amount} [${t.type}]`
  ).join('\n');

  const goalsSummary = goals.map(g => 
    `Meta: ${g.category} - Alvo: R$ ${g.targetAmount}, Atual: R$ ${g.currentAmount}`
  ).join('\n');

  const prompt = `
    Atue como um consultor financeiro pessoal experiente.
    Analise os seguintes dados financeiros do mês atual:

    TRANSAÇÕES:
    ${transactionSummary}

    METAS:
    ${goalsSummary}

    Por favor, forneça:
    1. Um breve resumo da saúde financeira (máx 2 frases).
    2. Identifique 3 tendências ou problemas nos gastos.
    3. Dê 3 dicas práticas para economizar dinheiro ou atingir as metas mais rápido baseadas especificamente nestes dados.

    Use formatação Markdown simples. Seja direto, encorajador e prático. Fale em Português do Brasil.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar uma análise no momento.";
  } catch (error) {
    console.error("Error generating financial insights:", error);
    return "Erro ao conectar com a IA. Tente novamente mais tarde.";
  }
};

export const generateCategoryIcon = async (category: string): Promise<string | null> => {
  if (!ai) return null;

  const prompt = `
    Generate a simple, flat, minimalist vector icon representing the financial category: "${category}". 
    The icon should be colorful, suitable for a mobile app UI, on a solid white background. 
    Do not add text. High contrast.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating icon:", error);
    return null;
  }
};