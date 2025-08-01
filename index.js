const express = require("express");
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai"); // NOVO IMPORT
require("dotenv").config();

const app = express();
app.use(express.json());

// Configuração moderna do OpenAI com versão 5.x
const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
  organization: process.env.OPENAI_ORG_ID
});

const categorias = {
  bate_papo: ["bom dia", "tudo bem", "oi", "olá", "boa noite"],
  geek: ["anime", "naruto", "one piece", "luffy", "goku", "marvel", "herói"],
  culinaria: ["receita", "bolo", "cozinhar", "frango", "doce", "salada"],
  esporte: ["futebol", "jogo", "gol", "basquete"],
  mundo: ["planeta", "história", "país", "geografia"],
  noticias: ["notícia", "aconteceu", "últimas"],
  pedidos_criacoes: ["crie", "invente", "escreva", "imagine"]
};

function detectarCategoria(pergunta) {
  const texto = pergunta.toLowerCase();
  for (const [categoria, palavras] of Object.entries(categorias)) {
    if (palavras.some(p => texto.includes(p))) return categoria;
  }
  return "bate_papo";
}

function calcularChanceNovaResposta(total) {
  if (total === 0) return 100;
  if (total === 1) return 80;
  if (total === 2) return 60;
  if (total === 3) return 40;
  return 20;
}

function caminhoArquivo(pergunta, categoria) {
  const nome = pergunta.replace(/[^\w\s]/gi, "").replace(/\s+/g, "_").toLowerCase();
  return path.join(__dirname, "respostas", categoria, `${nome}.txt`);
}

app.post("/api/genesis", async (req, res) => {
  const pergunta = req.body.pergunta?.toLowerCase().trim();
  if (!pergunta) return res.status(400).json({ erro: "Pergunta inválida" });

  const categoria = detectarCategoria(pergunta);
  const caminho = caminhoArquivo(pergunta, categoria);

  fs.mkdirSync(path.dirname(caminho), { recursive: true });

  let respostas = [];
  if (fs.existsSync(caminho)) {
    const conteudo = fs.readFileSync(caminho, "utf8");
    respostas = conteudo.split("\n").filter(l => l.includes(" - "));
  }

  const chance = calcularChanceNovaResposta(respostas.length);
  const usarNova = Math.random() * 100 < chance;

  if (usarNova) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "Você é um assistente simpático, direto e útil." },
          { role: "user", content: pergunta }
        ]
      });

      const respostaNova = completion.choices[0].message.content.trim();
      const entrada = `${respostas.length + 1} - ${pergunta}\n${respostaNova}\n\n`;
      fs.appendFileSync(caminho, entrada);
      return res.json({ resposta: respostaNova });

    } catch (err) {
      console.error("❌ Erro ao chamar o GPT:", err.message);
      return res.status(500).json({ erro: "Erro na chamada do GPT" });
    }
  } else {
    const conteudo = fs.readFileSync(caminho, "utf8").split("\n");
    const linhas = [];
    for (let i = 0; i < conteudo.length; i++) {
      if (conteudo[i].includes(" - ") && i + 1 < conteudo.length) {
        linhas.push(conteudo[i + 1]);
      }
    }
    const respostaReaproveitada = linhas[Math.floor(Math.random() * linhas.length)];
    return res.json({ resposta: respostaReaproveitada });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor Gênesis ativo em http://localhost:${PORT}`);
});

