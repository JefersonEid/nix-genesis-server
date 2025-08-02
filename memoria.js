const { google } = require('googleapis');

// 🔐 NOVA CHAVE COM FORMATAÇÃO CORRETA
const credentials = {
  type: "service_account",
  project_id: "projeto-genesis-467809",
  private_key_id: "8a713549d8c728f2937b6d63557cec94ef7f6775",
  private_key: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDhx7o+2gmKxzVt
pE4U+MULP8Z8tSt8f8xdifjBDebt36KVj+E6G1yPpU1sg4JT+FKRb96/Licg3Kf8
UJQ/7BtMlhph1pqbRi/Of9Vnz19WdLukHHxfAfOs8RfIaeKV6tFmoes1NMHfxVnF
PQ+Ov1Re7SrpCrWPHC5OdyugMUpHDDoJKyKxiTrzc3+4nSZQJN9PXLw6sZllOIQI
qJiwYK4iyoTwEfbShVAX3PBNjfDy8F3Vo6yJRsd+yBcEGLetxXTAc6Dzcxw/NYj6
wK3AgTzszrOhBfhZKgwA9McGp/mLyVQ5H5qmbezv2LncZAOd9ZiZkdWJaUTdyLuZ
oUBYToBlAgMBAAECggEAAJXuC7+xCqUdpF0qvq8ug6r0rtohdL84Hn3/ITESCkfs
OgsXgHkVsmGxY7irm+AnBq2NnF1YSKOJ5AOpfsj0ASzagKp32DNEaHq4aP6Gtsiy
u+g/AlgU87vkXea4ab8kL+n3nDm4zwXKB9LyuWIRq/VdiSE3+1kNXbK9cDrwgGKs
fETInUnXpkjBX+g5t2myiRLRtYbeyg4M8LRwGup5YWQQSLCkXMVhRRy0f1biQSbZ
6CTT7wiHNsmtZThz28oGQCdROmAMM/W0+LHs5UIW4AwdFOuRBnCHFNZfxfC469+Q
HS0E70RpgeowNGuHt7mwPsYjQga1v33W0T+dpDumeQKBgQD6+JO9vcn0E5NEg3Gy
iwe0S4h7QmBI7qoV+TyRzJmi1EXI8YPaNTKFJY91PE/U/md6803Svdh44xtNWsn2
uuMCqiSIoc2rG18E0mHRDG+jTxom+UsEj8a4LKv0uPQ+/VawZbA3TfutOgl4lzXm
4w2ZbqrCY2g1jYq4RI8aX8quXwKBgQDmTe1n2vcWfuPBvU0mAjtdDdYWSMNJC+FC
wg1xRksdlKBUdaGb/hZ+6U4RlrEq9eGlJn/mDP5/045k68ufdJERcVAGtiANvZLa
5MLd7tIm9pG4RmCugcdv5CnIy3MvHkh+kntEy+CEfQtPabhyLj9h3AUk+OBFOMUT
w9qYpUB/uwKBgG2bTnrZfm/YdMLBXVCKo6y8KDkcvgxcH3BFT4ylfJu+dVPTFrCf
9xZrVwHuezccfHkX9W8KdpYlKXFZK0dUS3yIbjg14irOY2sproqsEb2S+Gr5CShO
2ozpBZh1hkZUQh376z/cEQSQij5eW64gj3no+S64V3S8Ak+DsbPlDhGlAoGBAOHA
B3PjJottjHIPznzweSJI+s9TOeHzfDbFIwojPmRbmSHRQL45PfHfXgBNt5MF/M63
Q23M1PeV96GjpTDDwaPYb/p0Mk1lw3s//GgxvtwknEiG7CSC4G0kuXSzQVAxnhw8
GAsi0gzsydZpKjz6anTRiFVqg+Q2trAeLrusWOIbAoGATsUp/eWl6Dnk2CD56ZPW
pGiEWHUFOy5cqGqzet7Ky7m5D6gBWTFODGWzv6YqXF+ijZIoW4dp+lA1OUcchzor
CrobpiwDkpYbt4+jcJo2yphg/Ib/wVsEWwgZlnJaJ1tdZ96HUBqErKI7k3F0ao/r
/3n1YFXnW0OJ485SI+251ZE=
-----END PRIVATE KEY-----`,
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
    // primeira vez: cria nova linha com resposta 1
    const novaLinha = [[pergunta, novaResposta, '', '', '', '', categoria]];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'A2',
      valueInputOption: 'RAW',
      resource: { values: novaLinha }
    });
  } else {
    // já existe: salvar na próxima coluna de resposta livre
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

