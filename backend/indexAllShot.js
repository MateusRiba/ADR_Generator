import { GoogleGenerativeAI } from "@google/generative-ai"; // Removido o import problemático
import fs from 'fs/promises';
import 'dotenv/config';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testarAPI() {

  try {
    // Lendo o arquivo local
    const transcriptionFromMeet = await fs.readFile('C:\\Users\\mateu\\Arquivos de Programas Faculdade\\Repositorios\\ADR_Generator\\backend\\archives\\trancriptionTest.txt', 'utf8');
    
    console.log("📂 Arquivo lido com sucesso! Tamanho:", transcriptionFromMeet.length, "caracteres.");

    // 1. Schema BLINDADO usando strings puras (funciona em qualquer versão do SDK)
    const adrSchema = {
      type: "object",
      properties: {
        analise_passo_a_passo: { 
          type: "string", 
          description: "Raciocínio interno identificando o tema, opções e decisões da transcrição antes de formatar o ADR final." 
        },
        titulo: { type: "string" },
        contexto: { type: "string" },
        problema: { type: "string" },
        alternativas: { type: "array", items: { type: "string" } },
        decisao: { type: "string" },
        consequencias: { type: "array", items: { type: "string" } },
        incertezas: { type: "array", items: { type: "string" } }
      },
      required: ["analise_passo_a_passo", "titulo", "contexto", "problema", "alternativas", "decisao", "consequencias", "incertezas"]
    };

    // 2. Instrução base com ROLE PROMPTING + CHAIN-OF-THOUGHT + FEW-SHOT
    const systemInstruction = `Você é um arquiteto de software sênior especializado em documentação técnica. Sua missão é extrair um Registro de Decisão Arquitetural (ADR) no padrão Michael Nygard a partir de discussões técnicas fornecidas.

    ESTRATÉGIA DE PENSAMENTO (Chain-of-Thought):
    Para cada transcrição recebida, você deve primeiro preencher o campo 'analise_passo_a_passo' seguindo estes passos:
    1. Identifique o tema central da discussão.
    2. Liste as opções técnicas mencionadas pelos participantes.
    3. Verifique se houve um consenso ou decisão final clara.
    4. Identifique o que ficou sem resposta (incertezas).

    EXEMPLO DE REFERÊNCIA (Few-shot):
    Input: "A gente tá com problema de gargalo no banco atual. O Rafael sugeriu ir pro Postgres. A Camila achou legal, mas o Bruno prefere continuar no SQL Server e só criar uns índices novos. No fim, decidimos migrar pro Postgres mesmo por causa do suporte nativo a JSONB que vamos precisar no próximo mês."
    Output: {
      "analise_passo_a_passo": "Tema: Gargalo no banco de dados. Opções: Migrar para Postgres ou otimizar SQL Server. Decisão: Migrar para Postgres. Justificativa: Suporte nativo a JSONB.",
      "titulo": "Migração para PostgreSQL visando suporte a JSONB",
      "contexto": "O sistema atual apresenta gargalos de performance no banco de dados, e há uma necessidade iminente de suporte a dados semiestruturados.",
      "problema": "Performance insatisfatória do banco atual e falta de suporte nativo ideal para JSON.",
      "alternativas": ["Otimizar índices no SQL Server atual", "Migrar para PostgreSQL (Decisão escolhida)"],
      "decisao": "Migrar para o banco de dados PostgreSQL devido ao seu suporte robusto e nativo a dados no formato JSONB.",
      "consequencias": ["Curva de aprendizado para a equipe", "Refatoração das consultas atuais"],
      "incertezas": ["Tempo exato de indisponibilidade durante a migração"]
    }

    REGRAS RÍGIDAS:
    1. Fidelidade: Baseie-se ESTRITAMENTE no texto fornecido. Não invente detalhes técnicos, nomes de ferramentas ou prazos que não foram citados.
    2. Decisões Ausentes: Se não houver uma decisão clara na conversa, escreva explicitamente 'AUSÊNCIA DE DECISÃO' no campo 'decisao'.
    3. Tom de Voz: Use linguagem técnica, impessoal e profissional. Remova todo o ruído (saudações, piadas, conversas sobre o clima).

    FORMATO DE SAÍDA (JSON):
    Responda APENAS com um objeto JSON puro, sem blocos de código markdown ou explicações adicionais, seguindo rigorosamente as chaves do schema.`;

    // 3. Configuramos o modelo
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview", // Modelo rápido e estável
      systemInstruction: systemInstruction,
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: adrSchema,
      }
    });

    // 4. Injeção do conteúdo do arquivo no prompt
    const prompt = `Gere um ADR estruturado baseado nesta transcrição: ${transcriptionFromMeet}`;

    try {
      console.log("⏳ Chamando a API do Google com estratégia CoT + Few-Shot...");
      const result = await model.generateContent(prompt);
      
      console.log("\n--- ✅ RESULTADO DO ADR VIA API ---");
      console.log(result.response.text());
      
    } catch (error) {
      console.error("❌ Erro ao chamar a API:", error);
    }
  } catch (error) {
    console.error("❌ Erro ao ler arquivo. Verifique se o caminho e o nome do arquivo estão corretos:", error);
  }
}

testarAPI();