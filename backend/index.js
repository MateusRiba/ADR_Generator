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

  // Instrução base para o modelo, garantindo que ele entenda exatamente o que queremos e não invente informações.
  const systemInstruction = `Você é um arquiteto de software sênior. Sua missão é extrair um Registro de Decisão Arquitetural (ADR) no padrão Michael Nygard a partir de discussões técnicas fornecidas.

  REGRAS RÍGIDAS:
  1. Fidelidade: Baseie-se ESTRITAMENTE no texto fornecido. Não invente detalhes técnicos, nomes de ferramentas ou prazos que não foram citados.
  2. Decisões Ausentes: Se não houver uma decisão clara na conversa, escreva explicitamente 'AUSÊNCIA DE DECISÃO' no campo 'decisao'.
  3. Incertezas: Crie uma seção para listar pontos que ficaram em aberto ou dúvidas que o time não resolveu.
  4. Tom de Voz: Use linguagem técnica, impessoal e profissional. Remova todo o ruído (saudações, piadas, conversas sobre o clima).

  FORMATO DE SAÍDA (JSON):
  Responda APENAS com um objeto JSON puro, sem blocos de código markdown ou explicações adicionais, contendo exatamente estas chaves:
  {
    "titulo": "Título direto da decisão",
    "contexto": "Histórico e motivação",
    "problema": "O desafio principal identificado",
    "alternativas": ["Opção A (prós/contras)", "Opção B (prós/contras)"],
    "decisao": "A escolha final e sua justificativa técnica",
    "consequencias": ["Impacto positivo X", "Impacto negativo Y"],
    "incertezas": ["Ponto pendente A", "Ponto pendente B"]
  }`;

  // 2. Configuramos o modelo
  const model = genAI.getGenerativeModel({ 
    model: "gemini-3-flash-preview", // Mantendo o modelo super estável para garantir que funcione
    systemInstruction: systemInstruction,
    generationConfig: {
      temperature: 0, // Zero criatividade, foco total em precisão
      responseMimeType: "application/json",
      responseSchema: adrSchema, // Forçando a saída no nosso gabarito
    }
  });

  // 3. O nosso teste "Hello World" (Provisorialmente está assim, falta puxar de fato a transcrição da reunião)
  const prompt = `Gere um ADR estruturado baseado nesta transcrição: ${transcriptionFromMeet}`;

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