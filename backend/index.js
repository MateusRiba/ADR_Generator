import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import 'dotenv/config';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testarAPI() {
  // 1. Aqui definimos o Schema (o gabarito) do JSON de forma limpa
  const adrSchema = {
    type: SchemaType.OBJECT,
    properties: {
      Titulo: { type: SchemaType.STRING },
      contexto: { type: SchemaType.STRING },
      problema: { type: SchemaType.STRING },
      alternativas: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      decisao: { type: SchemaType.STRING },
      consequencias: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      incertezas: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
    },
    required: ["Titulo", "contexto", "problema", "alternativas", "decisao", "consequencias", "incertezas"]
  };

  // 2. Configuramos o modelo
  const model = genAI.getGenerativeModel({ 
    model: "gemini-3-flash-preview", // Mantendo o modelo super estável para garantir que funcione
    systemInstruction: "Você é um arquiteto de software sênior. Sua missão é extrair um Registro de Decisão Arquitetural (ADR) no padrão Michael Nygard a partir de discussões técnicas fornecidas. Seja fiel ao texto, não invente dados. Se não houver decisão, escreva 'AUSÊNCIA DE DECISÃO'.",
    generationConfig: {
      temperature: 0, // Zero criatividade, foco total em precisão
      responseMimeType: "application/json",
      responseSchema: adrSchema, // Forçando a saída no nosso gabarito
    }
  });

  // 3. O nosso teste "Hello World"
  const prompt = "Gere um ADR simplificado sobre a decisão da equipe do Sebrae PE de migrar do Azure Cache for Redis para o Microsoft Garnet por conta de custos.";

  try {
    console.log("⏳ Chamando a API do Google... aguarde.");
    const result = await model.generateContent(prompt);
    
    console.log("\n--- ✅ RESULTADO DO SEU PRIMEIRO ADR VIA API ---");
    console.log(result.response.text());
    
  } catch (error) {
    console.error("❌ Erro ao chamar a API:", error);
  }
}

testarAPI();