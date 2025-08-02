const { google } = require('googleapis');
const path = require('path');
const { readFileSync } = require('fs');

// Credenciais diretamente do JSON
const credentials = {
  type: "service_account",
  project_id: "projeto-genesis-467809",
  private_key_id: "7ae9a9976a129becac1c96bcc1323a4fa8a10af3",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDNQGplDqGO5PWk\nK60XltjjDyFB4OBSgynVot3yyoX4gwWetTgHvPw7zW/cFV3t253chKVvxd43NIO8\nj4Z932xHOs39/+QmPwM49DFG7OwSGMpA8/CendEaV07uYkaDNUL2d8FdG4eTmwa6\naTCzEw9/13w8i/IVGMyY8uLQle9bK8Ff4QK6cTAoJpoqdPVUHY6ONEe7aVPtkjTM\nl0Xzi34FFMSc4W2JHjcuesfjAPaPYLCDHqNMTFOinGb7XGm22+CJFwE30GYLsGsS\nKg0ZaC5PiIzAZtAQtJ1xkN+a7z97v9za3YIXfZ3yT79/OI6B9DwqbuwicwaQo20u\nK+I5SBXVAgMBAAECggEADEN1x/F6mjLYcXVxm2f2MATiqBDDXnK7UGoxiDTtEcbk\nUlICFcZHLNyOuy/ko5ZcZYVgbB/+sb43w8+wibtMeSoMjklYjKd1rhS7EAGObltg\nVEavAQ8tY/1E+E3TaDoJtPe9TC6dqGZaHc+0qvJv2ePaZrS242dOrDHQ9wUKXuBQ\nQU9JdO698wN1Er3IAGbtiy0r9S+tqsNPtgVkji25b79oLFG2Q8/qoztyv6J2AcIm\nmrRTytjHY2KtV7pILhfSSQixUuOn4SquOzvMbKd2mvA6BxnKiXFANAy70l+YQuzy\nIGx+tSLmt04f+FY+KNjJQoatKTlMkbofpq+mYCLwoQKBgQDpNE4//P8h+f3YsSrV\nP4nN4IHGhOSGSb6o/P/HBC5A1fuYP2JS9Mo+pSpv4yU0XIkGBNcTuWJrKHhW9h0A\nRaNJcQZnsg3WP7N31TE2QOtA1fIhg5gMVTA9tPSNmnJDP8M/MItAwfFKt5wIk2pt\nnmWtdemtMKqb1HNcaUm3NveQ4QKBgQDhUJ95t0VQA7xShBpFEmATX6OwJYc3KYpC\nna+dbcCawbM9SHgN0B6owBgavFv8gCP0HgQwpsRuhZw6GMmLDeFvLKj4WLNDIzai\nu2SR+V0Wot4n8XTHzaPxCKofjnnnXIO/Kcg8W2A87Bi4aTNhn2N3jsDKxqtaomJI\nczU5t2u/dQKBgQCwWUx/GPt6Hwi2D6u7XPQBiq+4hpAleKjEM6XcQq4Te31psSzS\nXKh/3PiNabCduwgnVAusr7jcHdt6r1xY81A6Xk0gp0XNaZh2mvI++7Kq8d7LNy8I\nzHbRgwCYAF49un8UTspPKxojjVtiJNALmwd6t7sAq9eoRW0DSd9jvB5UIQKBgEGw\ngr42u4OHg0k/cHVA1Tfww0Vgu5pOhxvC42dvjx7PaFVuomnMipPCZYSt89ea+GB8\nu9X/WPesBo89mMzswBPsnlrBaYoiYxRws/KHFCe8Vi6pC9YQ00I7t3W50Tqt009R\nfCp0rYs1fkONkEhe8t3xha3Y3C5xd1wOEq+AFW7dAoGAJ49tACq6MQdPgpqZPaid\ni1aJA+x/pHw1aPj6nPGNlZpbTF1Swsz/GxlFLw0P+R+I3BqvioksXRI6Qrepoc0w\nE7SVF72Ed48Cd1jULR9PCWVM/zB6SJTzWWQlsjwIu0fAG2D86EJoKoYHpuyper4W\ntRlvJ72px/flVfr/hiATG5M=\n-----END PRIVATE KEY-----\n",
  client_email: "genesis-bot@projeto-genesis-467809.iam.gserviceaccount.com",
  client_id: "102574204707352756016",
  token_uri: "https://oauth2.googleapis.com/token"
};

// ID da planilha
const SHEET_ID = '1UpHbfRT6qtk5Gk7gdXMIsB5dk9An_x9p4Zk6ibCd14U';

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

async function acessarPlanilha() {
  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client });
}

async function buscarResposta(pergunta) {
  const sheets = await acessarPlanilha();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'A2:C'
  });

  const linhas = res.data.values || [];
  const entrada = linhas.find(l => l[0]?.toLowerCase().trim() === pergunta.toLowerCase().trim());

  return entrada ? entrada[1] : null;
}

async function salvarResposta(pergunta, resposta, categoria = 'geral') {
  const sheets = await acessarPlanilha();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'A2',
    valueInputOption: 'RAW',
    resource: {
      values: [[pergunta, resposta, categoria]]
    }
  });
}

module.exports = {
  buscarResposta,
  salvarResposta
};

