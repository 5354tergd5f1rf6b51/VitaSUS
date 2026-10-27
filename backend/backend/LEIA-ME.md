# VitaSUS - Backend (Express + Prisma + MySQL)

## Primeira execução
1. `npm install`
2. Copie `.env.example` para `.env` e preencha `DATABASE_URL` e `JWT_SECRET`.
3. `npx prisma generate`
4. `npx prisma db push`   (aplica o schema, incluindo as colunas/tabela novas)
5. `npm run seed`         (dados FICTÍCIOS de demonstração; imprime os logins de teste)
6. `npm start`            (porta 3000)

## O que mudou no schema (apenas adições opcionais)
- Agenda: `profissionalId`, `unidadeId` (dono do horário e unidade).
- Atendimento: `agendamentoId` (único), `profissionalId`.
- Notificacao: `pacienteId`, `profissionalId`.
- Nova tabela `Exame`.
Nada existente foi removido ou renomeado no banco (as relações Agenda/ProfissionalSus ganharam nomes no Prisma, sem efeito no MySQL).

## Rotas
Públicas: `POST /pacientes` (cadastro), `POST /pacientes/login`, `POST /profissionais/login` (CPF ou e-mail + senha).
Paciente (`Authorization: Bearer ...`): `/pacientes/me`, `/me/opcoes-agendamento`, `/me/agendamentos` (GET/POST), `/me/agendamentos/:id/cancelar`, `/me/historico`, `/me/exames`, `/me/notificacoes`.
Profissional: `/profissionais/me`, `/me/agendamentos`, `/me/agendamentos/:id` (+ `/status`, `/registro`), `/me/registros`, `/me/pacientes`, `/me/notificacoes`.
Profissionais não se cadastram sozinhos: contas são criadas pela administração (hoje, pelo seed).
