import { GoogleGenAI, Type } from "@google/genai";
import { Product, Sale } from "../types";

const getAIClient = () => {
  if (!process.env.API_KEY) {
    console.warn("API Key is missing. AI features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const GeminiService = {
  analyzeBusiness: async (sales: Sale[], products: Product[]) => {
    const ai = getAIClient();
    if (!ai) return "Erro: API Key não configurada.";

    // Summarize data to avoid token limits
    const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
    const lowStock = products.filter(p => p.stock < 10).map(p => p.name);
    
    // Create a simplified sales summary for the prompt
    const salesSummary = sales.slice(-20).map(s => ({
      time: new Date(s.timestamp).toLocaleTimeString(),
      total: s.total,
      items: s.items.map(i => i.productName).join(", ")
    }));

    const prompt = `
      Você é um gerente especialista de Bar e Restaurante. Analise os dados abaixo e forneça 3 insights curtos e acionáveis para melhorar o lucro ou eficiência.
      
      Dados atuais:
      - Faturamento Total Recente: R$ ${totalRevenue.toFixed(2)}
      - Produtos com Baixo Estoque: ${lowStock.join(", ") || "Nenhum"}
      - Últimas Vendas: ${JSON.stringify(salesSummary)}

      Responda em formato JSON com uma lista de strings.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      
      const text = response.text;
      if (!text) return ["Não foi possível gerar análise."];
      return JSON.parse(text) as string[];
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      return ["Erro ao conectar com a IA para análise."];
    }
  },

  generateMarketingCopy: async (productName: string) => {
    const ai = getAIClient();
    if (!ai) return "Delicioso e refrescante!";

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Crie uma descrição curta, atraente e vendedora para o menu de um bar para o item: "${productName}". Máximo 150 caracteres.`,
      });
      return response.text || "Descrição indisponível.";
    } catch (e) {
      return "Ótima escolha para hoje!";
    }
  }
};
