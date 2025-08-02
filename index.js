const express = require("express");
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
require("dotenv").config();

const { buscarResposta, salvarResposta } = require("./memoria"); // integração sheets

const app = express();
app.use(express.json());

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
  organization: process.env.OPENAI_ORG_ID,
});

// 🗂️ Diretório base (com volume persistente no Render)
const BASE_RESPOSTAS = "/app/respostas";

const categorias = {
  bate_papo: ["bom dia", "tudo bem", "oi", "olá", "boa noite"],
  geek: ["anime", "naruto", "one piece", "luffy", "goku", "marvel", "herói"],
  culinaria: ["receita", "bolo", "cozinhar", "frango", "doce", "salada"],
  esporte: ["futebol", "jogo", "gol", "basquete"],
  mundo: ["planeta", "história", "país", "geografia"],
  noticias: ["notícia", "aconteceu", "últimas"],
  pedidos_criacoes: ["crie", "invente", "escreva", "imagine"],
};

// 🔎 Identifica categoria por palavra-chave
function detectarCategoria(pergunta) {
  const texto = pergunta.toLowerCase();
  for (const [categoria, palavras] of Object.entries(categorias)) {
    if (palavras.some(p => texto.includes(p))) return categoria;
  }
  return "bate_papo";
}

// 🧠 Define chance de gerar nova resposta
function calcularChanceNovaResposta(total) {
  if (total === 0) return 100;
  if (total === 1) return 80;
  if (total === 2) return 60;
  if (total === 3) return 40;
  return 20;
}

// 🧽 Normaliza a pergunta para nome de arquivo
function normalizarPergunta(pergunta) {
  return pergunta
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/gi, "")
    .replace(/\b(o|a|os|as|um|uma|é|e|de|do|da)\b/gi, "")
    .replace(/\s+/g, "_")
    .toLowerCase();
}

// 🚀 Rota principal: /api/genesis
app.post("/api/genesis", async (req, res) => {
  const perguntaOriginal = req.body.pergunta?.trim();
  if (!perguntaOriginal) return res.status(400).json({ erro: "Pergunta inválida" });

  const categoria = detectarCategoria(perguntaOriginal);
  const nome = normalizarPergunta(perguntaOriginal);
  const caminho = path.join(BASE_RESPOSTAS, categoria, `${nome}.txt`);

  fs.mkdirSync(path.dirname(caminho), { recursive: true });

  let respostas = [];
  if (fs.existsSync(caminho)) {
    const conteudo = fs.readFileSync(caminho, "utf8");
    respostas = conteudo.split("\n").filter(l => l.includes(" - "));
  }

  // 📄 Busca resposta na planilha
  try {
    const respostaMemoria = await buscarResposta(perguntaOriginal);
    if (respostaMemoria) {
      return res.json({ resposta: respostaMemoria });
    }
  } catch (err) {
    console.error("⚠️ Erro ao consultar memória:", err.message);
  }

  const chance = calcularChanceNovaResposta(respostas.length);
  const usarNova = Math.random() * 100 < chance;

  // 🧠 Gera nova resposta com OpenAI
  if (usarNova) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "Você é um assistente simpático, direto e útil." },
          { role: "user", content: perguntaOriginal }
        ]
      });

      const respostaNova = completion.choices[0].message.content.trim();
      const entrada = `${respostas.length + 1} - ${perguntaOriginal}\n${respostaNova}\n\n`;
      fs.appendFileSync(caminho, entrada);

      // 🧠 Salva nova resposta na planilha
      try {
        await salvarResposta(perguntaOriginal, respostaNova, categoria);
      } catch (erroPlanilha) {
        console.error("⚠️ Falha ao salvar na planilha:", erroPlanilha.message);
      }

      return res.json({ resposta: respostaNova });

    } catch (err) {
      console.error("❌ Erro ao chamar o GPT:", err.message);
      return res.status(500).json({ erro: "Erro na chamada do GPT" });
    }
  }

  // ♻️ Reutiliza resposta anterior local
  const conteudo = fs.readFileSync(caminho, "utf8").split("\n");
  const linhas = [];
  for (let i = 0; i < conteudo.length; i++) {
    if (conteudo[i].includes(" - ") && i + 1 < conteudo.length) {
      linhas.push(conteudo[i + 1]);
    }
  }

  const respostaReaproveitada = linhas[Math.floor(Math.random() * linhas.length)];
  return res.json({ resposta: respostaReaproveitada });
});

// 🔊 Porta padrão do Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Gênesis online em http://localhost:${PORT}`);
});

