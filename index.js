const express = require("express");
const OpenAI = require("openai");
require("dotenv").config();

const { buscarRespostasAvancado, salvarRespostaAvancado } = require("./memoria");

const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
  organization: process.env.OPENAI_ORG_ID,
});

// chances decrescentes conforme mais respostas
function chanceNovaResposta(qtd) {
  switch (qtd) {
    case 0: return 100;
    case 1: return 80;
    case 2: return 60;
    case 3: return 40;
    case 4: return 20;
    default: return 0;
  }
}

function sortear(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

// 🚀 Endpoint principal
app.post("/api/genesis", async (req, res) => {
  const perguntaOriginal = req.body.pergunta?.trim();
  if (!perguntaOriginal) {
    return res.status(400).json({ erro: "Pergunta inválida" });
  }

  let categoria = "geral";
  let respostas = [];

  try {
    const memoria = await buscarRespostasAvancado(perguntaOriginal);
    if (memoria) {
      respostas = memoria.respostas;
      categoria = memoria.categoria;
    }
  } catch (err) {
    console.error("⚠️ Erro ao consultar memória:", err.message);
  }

  const qtd = respostas.length;
  const usarGPT = Math.random() * 100 < chanceNovaResposta(qtd);

  // ❓ Se não usar GPT, sorteia uma das respostas existentes
  if (!usarGPT && respostas.length > 0) {
    const sorteada = sortear(respostas);
    console.log("♻️ Reutilizando resposta salva");
    return res.json({ resposta: sorteada });
  }

  // 🤖 Gerar nova resposta
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Você é um assistente simpático, direto e útil." },
        { role: "user", content: perguntaOriginal }
      ]
    });

    const respostaNova = completion.choices[0].message.content.trim();
    await salvarRespostaAvancado(perguntaOriginal, respostaNova, categoria);
    console.log("🧠 Nova resposta gerada e salva");
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

