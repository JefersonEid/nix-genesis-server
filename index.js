const express = require("express");
const OpenAI = require("openai");
require("dotenv").config();

const { buscarResposta, salvarResposta } = require("./memoria");

const app = express();
app.use(express.json());

// 🔐 Configuração da OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
  organization: process.env.OPENAI_ORG_ID,
});

// 🔤 Categorias por palavra-chave
const categorias = {
  bate_papo: ["bom dia", "tudo bem", "oi", "olá", "boa noite"],
  geek: ["anime", "naruto", "one piece", "luffy", "goku", "marvel", "herói"],
  culinaria: ["receita", "bolo", "cozinhar", "frango", "doce", "salada"],
  esporte: ["futebol", "jogo", "gol", "basquete"],
  mundo: ["planeta", "história", "país", "geografia"],
  noticias: ["notícia", "aconteceu", "últimas"],
  pedidos_criacoes: ["crie", "invente", "escreva", "imagine"]
};

// 🔎 Detecta categoria por palavra-chave
function detectarCategoria(pergunta) {
  const texto = pergunta.toLowerCase();
  for (const [categoria, palavras] of Object.entries(categorias)) {
    if (palavras.some(p => texto.includes(p))) return categoria;
  }
  return "bate_papo";
}

// 🚀 Endpoint principal
app.post("/api/genesis", async (req, res) => {
  const perguntaOriginal = req.body.pergunta?.trim();
  if (!perguntaOriginal) {
    return res.status(400).json({ erro: "Pergunta inválida" });
  }

  const categoria = detectarCategoria(perguntaOriginal);

  // 🔍 Tenta buscar resposta na planilha
  try {
    const respostaMemoria = await buscarResposta(perguntaOriginal);
    if (respostaMemoria) {
      console.log("📂 Resposta localizada na memória");
      return res.json({ resposta: respostaMemoria });
    }
  } catch (err) {
    console.error("⚠️ Erro ao consultar memória:", err.message);
  }

  // 🧠 Chamada à OpenAI para gerar nova resposta
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Você é um assistente simpático, direto e útil." },
        { role: "user", content: perguntaOriginal }
      ]
    });

    const respostaNova = completion.choices[0].message.content.trim();

    // 💾 Salva nova resposta na planilha
    try {
      await salvarResposta(perguntaOriginal, respostaNova, categoria);
      console.log("✅ Nova resposta salva na planilha");
    } catch (erroPlanilha) {
      console.error("⚠️ Falha ao salvar na planilha:", erroPlanilha.message);
    }

    return res.json({ resposta: respostaNova });

  } catch (err) {
    console.error("❌ Erro ao chamar OpenAI:", err.message);
    return res.status(500).json({ erro: "Erro ao gerar resposta com IA" });
  }
});

// 🟢 Inicialização
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Gênesis online em http://localhost:${PORT}`);
});

