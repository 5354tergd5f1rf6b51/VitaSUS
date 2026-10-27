const { HttpErro } = require('./auth');

// Datas de agenda são gravadas como "horário de parede" em UTC (sem fuso).
// DESLOCAMENTO_HORAS converte o relógio do servidor para o horário de Brasília.
const DESLOCAMENTO_HORAS = Number(process.env.TZ_OFFSET_HORAS || 3);
const agoraLocal = () => new Date(Date.now() - DESLOCAMENTO_HORAS * 3600 * 1000);
const hojeLocal = () => {
  const d = agoraLocal();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

function combinarDataHora(data, horario) {
  const dia = data.toISOString().slice(0, 10);
  const hora = /^\d{2}:\d{2}$/.test(horario) ? horario : '00:00';
  return new Date(`${dia}T${hora}:00.000Z`);
}

const soDigitos = (v) => String(v ?? '').replace(/\D/g, '');

function formatarCpf(v) {
  const d = soDigitos(v);
  return d.length === 11 ? d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : String(v ?? '').trim();
}

function cpfValido(v) {
  const c = soDigitos(v);
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  const dig = (n) => {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(c[i]) * (n + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dig(9) === Number(c[9]) && dig(10) === Number(c[10]);
}

const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v ?? ''));

const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const cortar = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

function exigirTexto(valor, rotulo, { min = 1, max }) {
  const t = texto(valor);
  if (t.length < min) throw new HttpErro(400, `${rotulo} é obrigatório.`);
  if (max && t.length > max) throw new HttpErro(400, `${rotulo} deve ter no máximo ${max} caracteres.`);
  return t;
}

function idDaRota(valor) {
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) throw new HttpErro(400, 'Identificador inválido.');
  return n;
}

module.exports = {
  agoraLocal, hojeLocal, combinarDataHora, soDigitos, formatarCpf, cpfValido, emailValido,
  texto, cortar, exigirTexto, idDaRota,
};
