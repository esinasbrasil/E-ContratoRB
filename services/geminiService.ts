
import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please check your environment variables.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

export const analyzeSupplierRisk = async (supplierName: string, serviceType: string): Promise<string> => {
  try {
    const ai = getAI();
    const prompt = `Analyze the potential risks for a supplier named "${supplierName}" providing "${serviceType}" services in a corporate environment. 
    Provide a concise risk assessment in 3 bullet points focusing on operational, financial, and compliance risks. 
    Keep it professional and generic based on the service type since this is a simulation.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating risk analysis. Please try again later.";
  }
};

export const generateContractClause = async (step: string, contextData: any): Promise<string> => {
  try {
    const ai = getAI();
    const prompt = `You are a legal contract assistant. 
    Context: We are drafting a service contract.
    Step: ${step}
    Data provided: ${JSON.stringify(contextData)}
    
    Write a professional contract clause (in Portuguese) based on this information. Keep it formal and legally sound.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "No clause generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating clause.";
  }
};
