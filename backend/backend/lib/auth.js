// Autenticação e autorização: senhas com bcrypt, sessão com JWT e controle por papel.
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

let segredo = process.env.JWT_SECRET;
if (!segredo) {
  // Sem JWT_SECRET definido, usa um segredo aleatório só deste processo
  // (as sessões caem a cada reinício). Defina JWT_SECRET no .env.
  segredo = crypto.randomBytes(32).toString('hex');
  console.warn('[auth] JWT_SECRET ausente no .env: usando segredo temporário.');
}
const EXPIRACAO = process.env.JWT_EXPIRES_IN || '8h';

class HttpErro extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

const gerarHash = (senha) => bcrypt.hash(senha, 10);
const conferirSenha = (senha, hash) => bcrypt.compare(senha, hash);
// Hash fixo para gastar o mesmo tempo quando o usuário não existe.
const HASH_FALSO = bcrypt.hashSync('vitasus-senha-inexistente', 10);

function emitirToken(papel, id) {
  return jwt.sign({ papel, id }, segredo, { expiresIn: EXPIRACAO });
}

// Exige um token válido. Preenche req.auth = { papel, id }.
function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization || '';
  const [tipo, token] = cabecalho.split(' ');
  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Faça login para continuar.' });
  }
  try {
    const dados = jwt.verify(token, segredo);
    req.auth = { papel: dados.papel, id: dados.id };
    return next();
  } catch {
    return res.status(401).json({ error: 'Sessão expirada. Entre novamente.' });
  }
}

// O papel vem do token assinado pelo servidor, nunca do que o usuário escolheu na tela.
function exigirPapel(papel) {
  return (req, res, next) => {
    if (req.auth?.papel !== papel) {
      return res.status(403).json({ error: 'Você não tem permissão para acessar este recurso.' });
    }
    return next();
  };
}

// Encapsula handlers async e traduz HttpErro / erros do Prisma em respostas JSON.
const rota = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (e) {
    if (e instanceof HttpErro) return res.status(e.status).json({ error: e.message });
    if (e?.code === 'P2002') return res.status(409).json({ error: 'Registro duplicado.' });
    if (e?.code === 'P2025') return res.status(404).json({ error: 'Registro não encontrado.' });
    console.error(`[${req.method} ${req.originalUrl}]`, e?.message || e);
    return res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  }
};

module.exports = {
  HttpErro, gerarHash, conferirSenha, HASH_FALSO, emitirToken, autenticar, exigirPapel, rota,
};
