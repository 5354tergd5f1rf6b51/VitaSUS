# VitaSUS - Frontend

React + Vite + React Router. Projeto acadêmico em ambiente demonstrativo (dados fictícios, sem vínculo com o SUS oficial).

## Telas
- Início (escolha Paciente / Profissional SUS), login, cadastro de paciente, recuperação de senha (informativa).
- Área do paciente (`/paciente`): painel, agendar consulta, minhas consultas, histórico médico, exames e resultados, notificações, perfil.
- Área do profissional (`/profissional`): painel, agenda (lista e calendário), atendimentos, pacientes autorizados, registros de atendimento, notificações, perfil.

## Como rodar
1. Backend: veja `backend/backend/README` abaixo (banco, `.env`, `npx prisma db push`, `npm run seed`, `npm start`).
2. Aqui: `npm install` e `npm run dev`, depois abra http://localhost:5173
3. Se o backend estiver em outra porta, copie `.env.example` para `.env` e ajuste `VITE_API_URL`.

## Segurança
O botão escolhido na página inicial só leva ao login correto. O papel (paciente ou profissional) vem do token assinado pelo servidor, e o backend confere em cada rota. As guardas de rota do frontend servem apenas para organizar a navegação.
