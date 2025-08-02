const { google } = require('googleapis');
const credentials = {
  type: "service_account",
  project_id: "projeto-genesis-467809",
  private_key_id: "7ae9a9976a129becac1c96bcc1323a4fa8a10af3",
  private_key: "-----BEGIN PRIVATE KEY-----\n...SEU VALOR...\n-----END PRIVATE KEY-----\n",
  client_email: "genesis-bot@projeto-genesis-467809.iam.gserviceaccount.com",
  client_id: "102574204707352756016",
  token_uri: "https://oauth2.googleapis.com/token"
};

const SHEET_ID = '1UpHbfRT6qtk5Gk7gdXMIsB5dk9An_x9p4Zk6ibCd14U';
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

async function acessarPlanilha() {
  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client });
}

async function buscarRespostasAvancado(pergunta) {
  const sheets = await acessarPlanilha();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'A2:G'
  });

  const linhas = res.data.values || [];
  const linha = linhas.find(l => l[0]?.toLowerCase().trim() === pergunta.toLowerCase().trim());

  if (!linha) return null;

  const respostas = linha.slice(1, 6).filter(r => r?.trim() !== '');
  const categoria = linha[6] || 'geral';

  return { respostas, categoria, linhaCompleta: linha };
}

async function salvarRespostaAvancado(pergunta, novaResposta, categoria) {
  const sheets = await acessarPlanilha();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'A2:G'
  });

  const linhas = res.data.values || [];
  const idx = linhas.findIndex(l => l[0]?.toLowerCase().trim() === pergunta.toLowerCase().trim());

  if (idx === -1) {
    // pergunta nova
    const novaLinha = [[pergunta, novaResposta, '', '', '', '', categoria]];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'A2',
      valueInputOption: 'RAW',
      resource: { values: novaLinha }
    });
  } else {
    // pergunta existente
    const linha = linhas[idx];
    const primeiraVazia = linha.findIndex((c, i) => i >= 1 && i <= 5 && (!c || c.trim() === ''));

    if (primeiraVazia !== -1) {
      linha[primeiraVazia] = novaResposta;
      const range = `A${idx + 2}:G${idx + 2}`;
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range,
        valueInputOption: 'RAW',
        resource: { values: [linha] }
      });
    }
  }
}

module.exports = {
  buscarRespostasAvancado,
  salvarRespostaAvancado
};

