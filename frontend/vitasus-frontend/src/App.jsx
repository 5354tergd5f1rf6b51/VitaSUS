import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout, { ITENS_PACIENTE, ITENS_PROFISSIONAL } from './components/AppLayout.jsx'
import Protegida from './components/Protegida.jsx'
import Inicio from './pages/Inicio.jsx'
import Login from './pages/Login.jsx'
import Cadastro from './pages/Cadastro.jsx'
import RecuperarSenha from './pages/RecuperarSenha.jsx'
import Notificacoes from './pages/Notificacoes.jsx'
import PainelPaciente from './pages/paciente/PainelPaciente.jsx'
import AgendarConsulta from './pages/paciente/AgendarConsulta.jsx'
import MinhasConsultas from './pages/paciente/MinhasConsultas.jsx'
import HistoricoMedico from './pages/paciente/HistoricoMedico.jsx'
import Exames from './pages/paciente/Exames.jsx'
import PerfilPaciente from './pages/paciente/PerfilPaciente.jsx'
import PainelProfissional from './pages/profissional/PainelProfissional.jsx'
import Agenda from './pages/profissional/Agenda.jsx'
import Atendimentos from './pages/profissional/Atendimentos.jsx'
import PacientesAutorizados from './pages/profissional/PacientesAutorizados.jsx'
import DetalhePaciente from './pages/profissional/DetalhePaciente.jsx'
import Registros from './pages/profissional/Registros.jsx'
import PerfilProfissional from './pages/profissional/PerfilProfissional.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/login" element={<Login papel="paciente" />} />
      <Route path="/profissional/login" element={<Login papel="profissional" />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/recuperar-senha" element={<RecuperarSenha />} />

      <Route
        path="/paciente"
        element={
          <Protegida papel="paciente">
            <AppLayout itens={ITENS_PACIENTE} area="Paciente" rotaLogin="/login" />
          </Protegida>
        }
      >
        <Route index element={<PainelPaciente />} />
        <Route path="agendar" element={<AgendarConsulta />} />
        <Route path="consultas" element={<MinhasConsultas />} />
        <Route path="historico" element={<HistoricoMedico />} />
        <Route path="exames" element={<Exames />} />
        <Route path="notificacoes" element={<Notificacoes papel="paciente" />} />
        <Route path="perfil" element={<PerfilPaciente />} />
      </Route>

      <Route
        path="/profissional"
        element={
          <Protegida papel="profissional">
            <AppLayout itens={ITENS_PROFISSIONAL} area="Profissional SUS" rotaLogin="/profissional/login" />
          </Protegida>
        }
      >
        <Route index element={<PainelProfissional />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="atendimentos" element={<Atendimentos />} />
        <Route path="pacientes" element={<PacientesAutorizados />} />
        <Route path="pacientes/:id" element={<DetalhePaciente />} />
        <Route path="registros" element={<Registros />} />
        <Route path="notificacoes" element={<Notificacoes papel="profissional" />} />
        <Route path="perfil" element={<PerfilProfissional />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
